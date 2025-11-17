import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Authentication for SafeGuard Kids Dashboard
 * Using Actions for crypto operations (crypto.getRandomValues requires non-deterministic context)
 * Using PBKDF2 for password hashing
 */

// Hash password using PBKDF2 with Web Crypto API
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive hash using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000, // Recommended: 100,000+ iterations
      hash: "SHA-256"
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  // Convert to base64 for storage
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate a random salt
function generateSalt(): string {
  const saltArray = new Uint8Array(16); // 16 bytes = 128 bits
  crypto.getRandomValues(saltArray);
  return Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password against stored hash and salt
async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}

/**
 * Register a new user (Action - allows crypto.getRandomValues)
 */
export const register = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ userId: any; email: string; name: string; apiKey: string }> => {
    // Check if user already exists
    const existingUser: any = await ctx.runQuery(internal.auth.getUserByEmailInternal, { email: args.email });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Generate salt and hash password (works in action context)
    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(args.password, passwordSalt);

    // Generate API key for Chrome extension
    const apiKey = `sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Create user via mutation
    const result = await ctx.runMutation(internal.auth.createUserInternal, {
      email: args.email,
      passwordHash,
      passwordSalt,
      name: args.name,
      phone: args.phone,
      apiKey,
    });

    return result;
  },
});

/**
 * Create user (internal mutation called from register action)
 */
export const createUserInternal = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash: args.passwordHash,
      passwordSalt: args.passwordSalt,
      name: args.name,
      phone: args.phone,
      createdAt: Date.now(),
      emailVerified: false,
      apiKey: args.apiKey,
      notificationSettings: {
        emailEnabled: true,
        smsEnabled: false,
        emailThreshold: 7,
        smsThreshold: 9,
        dailyDigest: true,
      },
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      userId,
      action: "register",
      details: `User registered: ${args.email}`,
      timestamp: Date.now(),
    });

    return {
      userId,
      email: args.email,
      name: args.name,
      apiKey: args.apiKey,
    };
  },
});

/**
 * Login with email and password (Action - allows crypto operations)
 */
export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ userId: any; email: string; name: string; apiKey: string }> => {
    // Find user by email
    const user: any = await ctx.runQuery(internal.auth.getUserByEmailInternal, { email: args.email });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await verifyPassword(args.password, user.passwordHash, user.passwordSalt || "");
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Log activity via mutation
    await ctx.runMutation(internal.auth.logLoginInternal, {
      userId: user._id,
      email: args.email
    });

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      apiKey: user.apiKey,
    };
  },
});

/**
 * Get current user by ID
 */
export const getCurrentUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerified,
      apiKey: user.apiKey,
      notificationSettings: user.notificationSettings,
      subscription: user.subscription,
    };
  },
});

/**
 * Get user settings by API key (for Chrome extension to sync settings from cloud)
 */
export const getUserSettingsByApiKey = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_api_key", (q) => q.eq("apiKey", args.apiKey))
      .first();

    if (!user) {
      return null;
    }

    return {
      email: user.email,
      name: user.name,
      phone: user.phone,
      notificationSettings: user.notificationSettings,
    };
  },
});

/**
 * Get user by email (internal query for authentication)
 */
export const getUserByEmailInternal = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      apiKey: user.apiKey,
    };
  },
});

/**
 * Log login activity (internal mutation called from action)
 */
export const logLoginInternal = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activityLog", {
      userId: args.userId,
      action: "login",
      details: `User logged in: ${args.email}`,
      timestamp: Date.now(),
    });
  },
});

/**
 * Reset demo password - FOR DEMO/HACKATHON ONLY
 * Resets parent@example.com password to "demo123"
 */
export const resetDemoPassword = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string }> => {
    const email = "parent@example.com";
    const newPassword = "demo123";

    // Find user
    const user: any = await ctx.runQuery(internal.auth.getUserByEmailInternal, { email });

    if (!user) {
      throw new Error("Demo user not found");
    }

    // Generate new salt and hash for "demo123"
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    // Update password
    await ctx.runMutation(internal.auth.updatePasswordInternal, {
      userId: user._id,
      passwordHash: newHash,
      passwordSalt: newSalt,
    });

    return {
      success: true,
      message: `Demo password reset to: ${newPassword}`,
    };
  },
});

/**
 * Change password (Action - allows crypto operations)
 */
export const changePassword = action({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // Get user
    const user: any = await ctx.runQuery(internal.auth.getUserByIdInternal, { userId: args.userId });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValid = await verifyPassword(args.currentPassword, user.passwordHash, user.passwordSalt || "");
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Generate new salt and hash
    const newSalt = generateSalt();
    const newHash = await hashPassword(args.newPassword, newSalt);

    // Update password via mutation
    await ctx.runMutation(internal.auth.updatePasswordInternal, {
      userId: args.userId,
      passwordHash: newHash,
      passwordSalt: newSalt,
    });

    return { success: true };
  },
});

/**
 * Get user by ID (internal query for password change)
 */
export const getUserByIdInternal = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
    };
  },
});

/**
 * Update password (internal mutation called from changePassword action)
 */
export const updatePasswordInternal = internalMutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
    passwordSalt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
      passwordSalt: args.passwordSalt,
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      userId: args.userId,
      action: "password_changed",
      details: "Password was changed",
      timestamp: Date.now(),
    });
  },
});

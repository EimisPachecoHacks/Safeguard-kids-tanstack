import { mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Seed database with test data for development
 * Run this once to create a test user, child, and sample incidents
 */

// Helper functions for password hashing (same as auth.ts)
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const saltArray = new Uint8Array(16);
  crypto.getRandomValues(saltArray);
  return Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to perform the actual seeding
async function performSeed(ctx: MutationCtx) {
  // Check if we already have data
  const existingUser = await ctx.db.query("users").first();
  if (existingUser) {
    return { message: "Database already seeded", userId: existingUser._id };
  }

  // Create test user (password: password123)
  const passwordSalt = generateSalt();
  const passwordHash = await hashPassword("password123", passwordSalt);

  const userId = await ctx.db.insert("users", {
      email: "parent@test.com",
      passwordHash,
      passwordSalt,
      name: "Test Parent",
      phone: "+1234567890",
      createdAt: Date.now(),
      emailVerified: true,
      notificationSettings: {
        emailEnabled: true,
        smsEnabled: true,
        emailThreshold: 7, // High threats
        smsThreshold: 9, // Critical threats
        dailyDigest: true,
      },
      apiKey: "test-api-key-12345",
      subscription: {
        tier: "premium",
        validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      },
    });

    // Create test child
    const childId = await ctx.db.insert("children", {
      userId,
      name: "Test Child",
      age: 12,
      extensionId: "test-extension-id-12345",
      extensionVersion: "1.0.0",
      lastSyncAt: Date.now(),
      monitoringMode: "both",
      monitoringEnabled: true,
      platforms: ["facebook", "instagram", "discord", "whatsapp"],
      createdAt: Date.now(),
    });

    // Create some sample incidents
    const now = Date.now();
    const incidents = [
      {
        severity: "CRITICAL",
        threatLevel: 9,
        category: "grooming",
        platform: "instagram",
        messageText: "Can we meet up sometime? I'd like to get to know you better in person.",
      },
      {
        severity: "HIGH",
        threatLevel: 7,
        category: "personal_info_request",
        platform: "discord",
        messageText: "What's your address? I want to send you a gift.",
      },
      {
        severity: "HIGH",
        threatLevel: 8,
        category: "grooming",
        platform: "facebook",
        messageText: "You seem really mature for your age. Want to chat privately?",
      },
      {
        severity: "MEDIUM",
        threatLevel: 5,
        category: "sexual_content",
        platform: "whatsapp",
        messageText: "You look really good in that photo you posted.",
      },
      {
        severity: "LOW",
        threatLevel: 3,
        category: "other",
        platform: "instagram",
        messageText: "Hey, how are you doing today?",
      },
    ];

    for (let i = 0; i < incidents.length; i++) {
      const incident = incidents[i];
      await ctx.db.insert("incidents", {
        childId,
        userId,
        timestamp: now - i * 3600000, // Each incident 1 hour apart
        platform: incident.platform,
        incidentType: "message",
        threatLevel: incident.threatLevel,
        severity: incident.severity,
        category: incident.category,
        messageText: incident.messageText,
        conversationContext: [
          {
            text: incident.messageText,
            type: "received",
            timestamp: now - i * 3600000,
          },
        ],
        aiAnalysis: {
          agent4: {
            finalLevel: incident.threatLevel,
            severity: incident.severity,
            primaryThreat: incident.category,
            parentGuidance: `Monitor this ${incident.severity.toLowerCase()} threat closely.`,
            childWarning:
              incident.threatLevel >= 7
                ? "This conversation may not be safe. Please talk to a parent."
                : "",
          },
        },
        actionTaken: incident.threatLevel >= 7 ? "warn_child" : "log_only",
        childWarningShown: incident.threatLevel >= 7,
        viewed: i > 1, // First 2 are unviewed
        acknowledged: i > 2, // Only last one is acknowledged
        exported: false,
        emailSent: incident.threatLevel >= 7,
        smsSent: incident.threatLevel >= 9,
      });
    }

    return {
      message: "Database seeded successfully!",
      userId,
      childId,
      incidentCount: incidents.length,
    };
}

// Mutation to seed the database (can be called manually from Convex dashboard)
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    return await performSeed(ctx);
  },
});

// Initialize database with seed data if empty (called from frontend)
export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query("users").first();

    if (existingUsers) {
      return {
        alreadySeeded: true,
        message: "Database already contains data",
      };
    }

    // Auto-seed if no data exists
    const result = await performSeed(ctx);
    return {
      alreadySeeded: false,
      ...result,
    };
  },
});

// Clear all data and re-seed (for development only)
export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all data
    const users = await ctx.db.query("users").collect();
    const children = await ctx.db.query("children").collect();
    const incidents = await ctx.db.query("incidents").collect();
    const notifications = await ctx.db.query("notifications").collect();

    for (const user of users) {
      await ctx.db.delete(user._id);
    }
    for (const child of children) {
      await ctx.db.delete(child._id);
    }
    for (const incident of incidents) {
      await ctx.db.delete(incident._id);
    }
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // Re-seed
    const result = await performSeed(ctx);
    return {
      ...result,
      resetPerformed: true,
    };
  },
});

// Fix test user password (Action - allows crypto.getRandomValues)
export const fixTestUserPassword = action({
  args: {},
  handler: async (ctx): Promise<{
    message: string;
    success: boolean;
    email?: string;
    saltLength?: number;
    hashLength?: number;
    stack?: string;
  }> => {
    try {
      // Find user
      const user: any = await ctx.runQuery(internal.auth.getUserByEmailInternal, { email: "parent@test.com" });

      if (!user) {
        return { message: "Test user not found", success: false };
      }

      // Generate new salt and hash (works in action context)
      const passwordSalt = generateSalt();
      const passwordHash = await hashPassword("password123", passwordSalt);

      // Update user via mutation
      await ctx.runMutation(internal.seed.updateUserPasswordInternal, {
        userId: user._id,
        passwordHash,
        passwordSalt,
      });

      return {
        message: "Password hash updated successfully with PBKDF2",
        email: user.email,
        success: true,
        saltLength: passwordSalt.length,
        hashLength: passwordHash.length,
      };
    } catch (error) {
      return {
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
        stack: error instanceof Error ? error.stack : undefined,
      };
    }
  },
});

// Helper mutation to update user password
export const updateUserPasswordInternal = internalMutation({
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
  },
});

// Create sample incidents for current user (for testing dashboard)
export const createSampleIncidents = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // First, create or get a child
    let child = await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!child) {
      // Create a child if none exists
      const childId = await ctx.db.insert("children", {
        userId: args.userId,
        name: "Alex",
        age: 13,
        extensionId: `ext_${Date.now()}_demo`,
        extensionVersion: "1.0.0",
        lastSyncAt: Date.now(),
        monitoringMode: "both",
        monitoringEnabled: true,
        platforms: ["instagram", "discord", "facebook"],
        createdAt: Date.now(),
      });
      child = await ctx.db.get(childId);
    }

    const childId = child!._id;

    // Create sample incidents with realistic threats
    const now = Date.now();
    const incidents = [
      {
        severity: "CRITICAL" as const,
        threatLevel: 9,
        category: "grooming",
        platform: "Instagram",
        messageText: "You're so mature for your age. This is our secret, okay? Don't tell your parents. Want to meet up this weekend?",
        parentGuidance: "CALL POLICE IMMEDIATELY (911). This shows classic grooming behavior.",
      },
      {
        severity: "HIGH" as const,
        threatLevel: 8,
        category: "sexual_content",
        platform: "Discord",
        messageText: "Send me pics. I won't show anyone, I promise. All the cool kids do this.",
        parentGuidance: "Contact law enforcement. This is sexual exploitation of a minor.",
      },
      {
        severity: "HIGH" as const,
        threatLevel: 7,
        category: "personal_info_request",
        platform: "Facebook",
        messageText: "What's your address? I want to send you a gift. Also, when are your parents not home?",
        parentGuidance: "Block this person immediately. Report to platform.",
      },
      {
        severity: "MEDIUM" as const,
        threatLevel: 6,
        category: "manipulation",
        platform: "Instagram",
        messageText: "If you really cared about me, you'd prove it. Everyone else does.",
        parentGuidance: "Talk to your child about emotional manipulation.",
      },
      {
        severity: "MEDIUM" as const,
        threatLevel: 5,
        category: "meeting_request",
        platform: "Text Message",
        messageText: "There's a party this Friday. Your parents won't find out. It'll be fun, trust me.",
        parentGuidance: "Discuss boundaries about unsupervised gatherings.",
      },
    ];

    const createdIds = [];

    for (let i = 0; i < incidents.length; i++) {
      const incident = incidents[i];
      const timestamp = now - i * 3600000; // 1 hour apart

      const incidentId = await ctx.db.insert("incidents", {
        childId,
        userId: args.userId,
        timestamp,
        platform: incident.platform,
        incidentType: "message",
        threatLevel: incident.threatLevel,
        severity: incident.severity,
        category: incident.category,
        messageText: incident.messageText,
        conversationContext: [
          {
            text: "Hey, how are you?",
            type: "received" as const,
            timestamp: timestamp - 3600000,
          },
          {
            text: "Good! How about you?",
            type: "sent" as const,
            timestamp: timestamp - 1800000,
          },
          {
            text: incident.messageText,
            type: "received" as const,
            timestamp,
          },
        ],
        aiAnalysis: {
          agent1: {
            isInappropriate: true,
            level: incident.threatLevel,
            explanation: `Detected ${incident.category} pattern in message`,
            redFlags: ["Secrecy", "Isolation", "Pressure"],
          },
          agent4: {
            finalLevel: incident.threatLevel,
            severity: incident.severity,
            primaryThreat: incident.category,
            parentGuidance: incident.parentGuidance,
            childWarning: "This conversation may not be safe. A parent has been notified.",
          },
          tensorflow: {
            isToxic: incident.threatLevel >= 7,
            level: incident.threatLevel >= 7 ? 8 : 3,
            detectedTypes: [],
          },
        },
        actionTaken: incident.threatLevel >= 7 ? "warn_child" : "parent_notification",
        childWarningShown: incident.threatLevel >= 7,
        viewed: i > 1, // First 2 are unviewed
        acknowledged: false,
        exported: false,
        emailSent: incident.threatLevel >= 7,
        smsSent: incident.threatLevel >= 9,
      });

      createdIds.push(incidentId);
    }

    return {
      success: true,
      childId,
      incidentCount: createdIds.length,
      message: `Created ${createdIds.length} sample incidents`,
    };
  },
});

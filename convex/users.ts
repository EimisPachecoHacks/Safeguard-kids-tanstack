import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * User management queries
 */

// Get test user for development (replace with real auth in production)
export const getTestUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "parent@test.com"))
      .first();

    return user;
  },
});

// Get user by email
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get user by API key (for Chrome extension authentication)
export const getByApiKey = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_api_key", (q) => q.eq("apiKey", args.apiKey))
      .first();
  },
});

// Update notification settings
export const updateNotificationSettings = mutation({
  args: {
    userId: v.id("users"),
    settings: v.object({
      emailEnabled: v.boolean(),
      smsEnabled: v.boolean(),
      emailThreshold: v.number(),
      smsThreshold: v.number(),
      dailyDigest: v.boolean(),
    }),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      notificationSettings: args.settings,
      phone: args.phone,
    });

    return { success: true };
  },
});

// Update settings by API key (called from Chrome extension)
export const updateSettingsByApiKey = mutation({
  args: {
    apiKey: v.string(),
    phone: v.optional(v.string()),
    notificationSettings: v.object({
      emailEnabled: v.boolean(),
      smsEnabled: v.boolean(),
      emailThreshold: v.number(),
      smsThreshold: v.number(),
      dailyDigest: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_api_key", (q) => q.eq("apiKey", args.apiKey))
      .first();

    if (!user) {
      throw new Error("Invalid API key");
    }

    await ctx.db.patch(user._id, {
      notificationSettings: args.notificationSettings,
      phone: args.phone,
    });

    return { success: true };
  },
});

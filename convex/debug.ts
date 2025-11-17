import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug queries and mutations to check/manage database state
 */

// List all users in the database
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    return users.map(user => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      hasPasswordHash: !!user.passwordHash,
      hasPasswordSalt: !!user.passwordSalt,
      passwordHashLength: user.passwordHash?.length || 0,
      passwordSaltLength: user.passwordSalt?.length || 0,
      createdAt: user.createdAt,
    }));
  },
});

// Count users
export const countUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return { count: users.length };
  },
});

// Delete user by email (for testing only)
export const deleteUserByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }

    await ctx.db.delete(user._id);
    return { success: true, deletedEmail: args.email };
  },
});

// List all incidents (for debugging)
export const listAllIncidents = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db.query("incidents").collect();
    return incidents.map(incident => ({
      _id: incident._id,
      userId: incident.userId,
      childId: incident.childId,
      platform: incident.platform,
      severity: incident.severity,
      category: incident.category,
      timestamp: incident.timestamp,
      viewed: incident.viewed,
    }));
  },
});

// Delete all incidents (for testing)
export const deleteAllIncidents = mutation({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db.query("incidents").collect();
    for (const incident of incidents) {
      await ctx.db.delete(incident._id);
    }
    return { success: true, deletedCount: incidents.length };
  },
});

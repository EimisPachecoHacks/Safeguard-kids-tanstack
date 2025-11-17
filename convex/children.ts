import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * SafeGuard Kids - Child Management Functions
 *
 * Functions for managing children being monitored.
 */

// Create a new child profile
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    age: v.optional(v.number()),
    extensionId: v.string(),
    extensionVersion: v.string(),
    monitoringMode: v.string(),
    platforms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if extension ID already exists
    const existing = await ctx.db
      .query("children")
      .withIndex("by_extension", (q) => q.eq("extensionId", args.extensionId))
      .first();

    if (existing) {
      throw new Error("This extension is already registered");
    }

    const childId = await ctx.db.insert("children", {
      userId: args.userId,
      name: args.name,
      age: args.age,
      extensionId: args.extensionId,
      extensionVersion: args.extensionVersion,
      lastSyncAt: Date.now(),
      monitoringMode: args.monitoringMode,
      monitoringEnabled: true,
      platforms: args.platforms,
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      userId: args.userId,
      childId,
      action: "child_added",
      details: `Added child profile: ${args.name}`,
      timestamp: Date.now(),
    });

    return childId;
  },
});

// Add a child profile (simplified - without extension, to be linked later)
export const add = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    age: v.optional(v.number()),
    platforms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate a temporary extension ID that will be replaced when extension is installed
    const tempExtensionId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const childId = await ctx.db.insert("children", {
      userId: args.userId,
      name: args.name,
      age: args.age,
      extensionId: tempExtensionId,
      extensionVersion: "pending",
      lastSyncAt: Date.now(),
      monitoringMode: "active",
      monitoringEnabled: true,
      platforms: args.platforms,
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      userId: args.userId,
      childId,
      action: "child_added",
      details: `Added child profile: ${args.name}`,
      timestamp: Date.now(),
    });

    return childId;
  },
});

// Get all children for a user
export const getAll = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const children = await ctx.db
      .query("children")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return children;
  },
});

// Get a single child by ID
export const getById = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.childId);
  },
});

// Get child by extension ID (used when extension sends incidents)
export const getByExtension = query({
  args: {
    extensionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("children")
      .withIndex("by_extension", (q) => q.eq("extensionId", args.extensionId))
      .first();
  },
});

// Update child profile
export const update = mutation({
  args: {
    childId: v.id("children"),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    avatar: v.optional(v.string()),
    monitoringMode: v.optional(v.string()),
    monitoringEnabled: v.optional(v.boolean()),
    platforms: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { childId, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(childId, cleanUpdates);

    // Log activity
    const child = await ctx.db.get(childId);
    if (child) {
      await ctx.db.insert("activityLog", {
        userId: child.userId,
        childId,
        action: "settings_changed",
        details: `Updated profile for ${child.name}`,
        timestamp: Date.now(),
      });
    }

    return childId;
  },
});

// Update last sync time (called by extension)
export const updateSync = mutation({
  args: {
    extensionId: v.string(),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db
      .query("children")
      .withIndex("by_extension", (q) => q.eq("extensionId", args.extensionId))
      .first();

    if (!child) {
      throw new Error("Child not found");
    }

    await ctx.db.patch(child._id, {
      lastSyncAt: Date.now(),
    });
  },
});

// Delete child profile
export const remove = mutation({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child) {
      throw new Error("Child not found");
    }

    // Log activity before deletion
    await ctx.db.insert("activityLog", {
      userId: child.userId,
      childId: args.childId,
      action: "child_removed",
      details: `Removed child profile: ${child.name}`,
      timestamp: Date.now(),
    });

    // Note: In production, you might want to archive incidents instead of deleting
    // For now, we'll just delete the child profile
    await ctx.db.delete(args.childId);

    return true;
  },
});

// Get child statistics
export const getStats = query({
  args: {
    childId: v.id("children"),
  },
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child) {
      throw new Error("Child not found");
    }

    // Get all incidents for this child
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_child", (q) => q.eq("childId", args.childId))
      .collect();

    // Calculate time since last sync
    const now = Date.now();
    const lastSyncHours = Math.floor((now - child.lastSyncAt) / (1000 * 60 * 60));

    // Get recent activity (last 24 hours)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentIncidents = incidents.filter((i) => i.timestamp >= oneDayAgo);

    return {
      child: {
        name: child.name,
        age: child.age,
        monitoringMode: child.monitoringMode,
        platforms: child.platforms,
        lastSyncHours,
      },
      incidents: {
        total: incidents.length,
        last24h: recentIncidents.length,
        critical: incidents.filter((i) => i.severity === "CRITICAL").length,
        high: incidents.filter((i) => i.severity === "HIGH").length,
      },
      platforms: child.platforms.map((platform) => ({
        name: platform,
        incidents: incidents.filter((i) => i.platform === platform).length,
      })),
    };
  },
});

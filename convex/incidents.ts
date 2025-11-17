import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * SafeGuard Kids - Incident Management Functions
 *
 * These functions handle incidents reported by the Chrome extension,
 * including creation, querying, and real-time updates.
 */

// Create a new incident (called by Chrome extension)
export const create = mutation({
  args: {
    apiKey: v.string(),
    timestamp: v.number(),
    platform: v.string(),
    incidentType: v.string(),
    threatLevel: v.number(),
    severity: v.string(),
    category: v.string(),
    messageText: v.optional(v.string()),
    imageDescription: v.optional(v.string()),
    conversationContext: v.optional(v.array(v.object({
      text: v.string(),
      type: v.string(),
      timestamp: v.number(),
    }))),
    aiAnalysis: v.object({
      agent1: v.optional(v.any()),
      agent2: v.optional(v.any()),
      agent3: v.optional(v.any()),
      agent4: v.optional(v.any()),
      tensorflow: v.optional(v.any()),
    }),
    actionTaken: v.string(),
    childWarningShown: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Find the user by API key
    const user = await ctx.db
      .query("users")
      .withIndex("by_api_key", (q) => q.eq("apiKey", args.apiKey))
      .first();

    if (!user) {
      throw new Error("Invalid API key");
    }

    // Create the incident (no childId for now - can be added later for multi-child support)
    const incidentId = await ctx.db.insert("incidents", {
      childId: user._id as any, // Placeholder - using userId for now
      userId: user._id,
      timestamp: args.timestamp,
      platform: args.platform,
      incidentType: args.incidentType,
      threatLevel: args.threatLevel,
      severity: args.severity,
      category: args.category,
      messageText: args.messageText,
      imageDescription: args.imageDescription,
      conversationContext: args.conversationContext,
      aiAnalysis: args.aiAnalysis,
      actionTaken: args.actionTaken,
      childWarningShown: args.childWarningShown,
      viewed: false,
      acknowledged: false,
      exported: false,
      emailSent: false,
      smsSent: false,
    });

    // Check if we should send notifications based on threshold
    const shouldNotify = args.threatLevel >= user.notificationSettings.emailThreshold;

    if (shouldNotify) {
      // Schedule notifications (these would be sent via Resend/Vonage)
      // For now, we'll just mark them as pending
      if (user.notificationSettings.emailEnabled && args.threatLevel >= user.notificationSettings.emailThreshold) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          childId: user._id as any, // Placeholder
          incidentId,
          type: "email",
          status: "pending",
          sentAt: Date.now(),
          body: `CRITICAL ALERT: ${args.severity} threat detected on ${args.platform}`,
          provider: "resend",
        });
      }

      if (user.notificationSettings.smsEnabled && args.threatLevel >= user.notificationSettings.smsThreshold) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          childId: user._id as any, // Placeholder
          incidentId,
          type: "sms",
          status: "pending",
          sentAt: Date.now(),
          body: `SAFEGUARD ALERT: ${args.severity} threat detected`,
          provider: "vonage",
        });
      }
    }

    return incidentId;
  },
});

// Get recent incidents for a user (optionally filtered by child)
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
    childId: v.optional(v.id("children")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let incidents;

    if (args.childId !== undefined) {
      // Filter by specific child
      const childId = args.childId;
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_child_and_time", (q) => q.eq("childId", childId))
        .order("desc")
        .take(limit);
    } else if (args.userId !== undefined) {
      // Filter by user (all children)
      const userId = args.userId;
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    } else {
      // No filter - return all (for backwards compatibility)
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    }

    return incidents;
  },
});

// Get incidents for a specific child
export const getByChild = query({
  args: {
    childId: v.id("children"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_child_and_time", (q) => q.eq("childId", args.childId))
      .order("desc")
      .take(limit);

    return incidents;
  },
});

// Get unviewed incidents for a user
export const getUnviewed = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_viewed", (q) =>
        q.eq("userId", args.userId).eq("viewed", false)
      )
      .order("desc")
      .collect();

    return incidents;
  },
});

// Get incidents by severity
export const getBySeverity = query({
  args: {
    userId: v.id("users"),
    severity: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_severity", (q) => q.eq("severity", args.severity))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);

    return incidents;
  },
});

// Mark incident as viewed
export const markViewed = mutation({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.incidentId, {
      viewed: true,
      viewedAt: Date.now(),
    });
  },
});

// Mark incident as acknowledged (parent reviewed and took action)
export const acknowledge = mutation({
  args: {
    incidentId: v.id("incidents"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.incidentId, {
      acknowledged: true,
      acknowledgedAt: Date.now(),
      notes: args.notes,
    });
  },
});

// Get incident statistics
export const getStats = query({
  args: {
    userId: v.id("users"),
    childId: v.optional(v.id("children")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("incidents").withIndex("by_user", (q) =>
      q.eq("userId", args.userId)
    );

    let incidents = await query.collect();

    // Filter by child if specified
    if (args.childId) {
      incidents = incidents.filter((i) => i.childId === args.childId);
    }

    // Filter by date range if specified
    if (args.startDate || args.endDate) {
      incidents = incidents.filter((i) => {
        if (args.startDate && i.timestamp < args.startDate) return false;
        if (args.endDate && i.timestamp > args.endDate) return false;
        return true;
      });
    }

    // Calculate statistics
    const stats = {
      total: incidents.length,
      critical: incidents.filter((i) => i.severity === "CRITICAL").length,
      high: incidents.filter((i) => i.severity === "HIGH").length,
      medium: incidents.filter((i) => i.severity === "MEDIUM").length,
      low: incidents.filter((i) => i.severity === "LOW").length,

      unviewed: incidents.filter((i) => !i.viewed).length,
      unacknowledged: incidents.filter((i) => !i.acknowledged).length,

      // By platform
      platforms: incidents.reduce((acc, i) => {
        acc[i.platform] = (acc[i.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // By category
      categories: incidents.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Recent trend (last 7 days vs previous 7 days)
      recentTrend: calculateTrend(incidents),
    };

    return stats;
  },
});

// Helper function to calculate trend
function calculateTrend(incidents: Doc<"incidents">[]) {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const lastWeek = incidents.filter(
    (i) => i.timestamp >= sevenDaysAgo && i.timestamp <= now
  ).length;

  const previousWeek = incidents.filter(
    (i) => i.timestamp >= fourteenDaysAgo && i.timestamp < sevenDaysAgo
  ).length;

  if (previousWeek === 0) return "stable";

  const change = ((lastWeek - previousWeek) / previousWeek) * 100;

  if (change > 10) return "increasing";
  if (change < -10) return "decreasing";
  return "stable";
}

// Export incidents for law enforcement
export const exportIncidents = mutation({
  args: {
    userId: v.id("users"),
    childId: v.optional(v.id("children")),
    startDate: v.number(),
    endDate: v.number(),
    exportType: v.string(), // "pdf" | "csv" | "json"
    purpose: v.string(),
  },
  handler: async (ctx, args) => {
    // Get incidents in date range
    let query = ctx.db
      .query("incidents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    let incidents = await query.collect();

    // Filter by child and date range
    incidents = incidents.filter((i) => {
      if (args.childId && i.childId !== args.childId) return false;
      if (i.timestamp < args.startDate || i.timestamp > args.endDate) return false;
      return true;
    });

    // Create export record
    const exportId = await ctx.db.insert("exports", {
      userId: args.userId,
      childId: args.childId,
      exportType: args.exportType,
      purpose: args.purpose,
      startDate: args.startDate,
      endDate: args.endDate,
      incidentIds: incidents.map((i) => i._id),
      incidentCount: incidents.length,
      fileSize: 0, // Will be calculated when file is generated
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      downloadCount: 0,
    });

    // Mark incidents as exported
    await Promise.all(
      incidents.map((i) => ctx.db.patch(i._id, { exported: true }))
    );

    return exportId;
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Export management for reports
 */

// Create a new export record
export const create = mutation({
  args: {
    userId: v.id("users"),
    childId: v.optional(v.id("children")),
    exportType: v.string(),
    purpose: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get incidents in date range
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const filteredIncidents = incidents.filter(
      (i) => i.timestamp >= args.startDate && i.timestamp <= args.endDate
    );

    const incidentIds = filteredIncidents.map((i) => i._id);

    // Create export record
    const exportId = await ctx.db.insert("exports", {
      userId: args.userId,
      childId: args.childId,
      exportType: args.exportType,
      purpose: args.purpose,
      startDate: args.startDate,
      endDate: args.endDate,
      incidentIds,
      incidentCount: incidentIds.length,
      fileSize: 0, // Will be updated when file is generated
      createdAt: Date.now(),
      downloadCount: 0,
    });

    return {
      exportId,
      incidentCount: incidentIds.length,
    };
  },
});

// Get export history for a user
export const getHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const exports = await ctx.db
      .query("exports")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);

    return exports;
  },
});

// Increment download count
export const incrementDownload = mutation({
  args: {
    exportId: v.id("exports"),
  },
  handler: async (ctx, args) => {
    const exportRecord = await ctx.db.get(args.exportId);
    if (!exportRecord) {
      throw new Error("Export not found");
    }

    await ctx.db.patch(args.exportId, {
      downloadCount: exportRecord.downloadCount + 1,
    });
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * SafeGuard Kids - Convex Database Schema
 *
 * This schema defines the data structure for the parent dashboard,
 * integrating with the Chrome extension's threat detection system.
 */

export default defineSchema({
  // Parent/User accounts
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    passwordSalt: v.optional(v.string()), // Salt for PBKDF2 (optional for migration)
    name: v.string(),
    phone: v.optional(v.string()),
    createdAt: v.number(),
    emailVerified: v.boolean(),

    // Notification preferences
    notificationSettings: v.object({
      emailEnabled: v.boolean(),
      smsEnabled: v.boolean(),
      emailThreshold: v.number(), // 5 = medium, 7 = high, 9 = critical
      smsThreshold: v.number(),
      dailyDigest: v.boolean(),
    }),

    // API key for Chrome extension authentication
    apiKey: v.string(),

    // Subscription info (for future premium features)
    subscription: v.optional(v.object({
      tier: v.string(), // "free" | "premium" | "family"
      validUntil: v.number(),
    })),
  })
    .index("by_email", ["email"])
    .index("by_api_key", ["apiKey"]),

  // Children being monitored
  children: defineTable({
    userId: v.id("users"), // Parent's user ID
    name: v.string(),
    age: v.optional(v.number()),
    avatar: v.optional(v.string()),

    // Chrome extension configuration
    extensionId: v.string(), // Unique ID from extension installation
    extensionVersion: v.string(),
    lastSyncAt: v.number(),

    // Monitoring settings
    monitoringMode: v.string(), // "active" | "passive" | "both"
    monitoringEnabled: v.boolean(),

    // Platforms being monitored
    platforms: v.array(v.string()), // ["facebook", "instagram", "discord", ...]

    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_extension", ["extensionId"]),

  // Threat incidents detected by Chrome extension
  incidents: defineTable({
    childId: v.id("children"),
    userId: v.id("users"),

    // Incident metadata
    timestamp: v.number(),
    platform: v.string(), // "facebook" | "instagram" | "discord" | etc.
    incidentType: v.string(), // "message" | "image" | "webpage"

    // Threat details
    threatLevel: v.number(), // 0-10
    severity: v.string(), // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    category: v.string(), // "sexual_content" | "grooming" | "personal_info_request" | etc.

    // Content (truncated for storage)
    messageText: v.optional(v.string()),
    imageDescription: v.optional(v.string()),
    conversationContext: v.optional(v.array(v.object({
      text: v.string(),
      type: v.string(), // "sent" | "received"
      timestamp: v.number(),
    }))),

    // AI Analysis results from Chrome extension
    aiAnalysis: v.object({
      agent1: v.optional(v.object({
        isInappropriate: v.boolean(),
        level: v.number(),
        explanation: v.string(),
        redFlags: v.array(v.string()),
      })),

      agent2: v.optional(v.object({
        description: v.string(),
      })),

      agent3: v.optional(v.object({
        isInappropriate: v.boolean(),
        level: v.number(),
        concerningElements: v.array(v.string()),
      })),

      agent4: v.optional(v.object({
        finalLevel: v.number(),
        severity: v.string(),
        primaryThreat: v.string(),
        parentGuidance: v.string(),
        childWarning: v.string(),
      })),

      tensorflow: v.optional(v.object({
        isToxic: v.boolean(),
        level: v.number(),
        detectedTypes: v.array(v.object({
          type: v.string(),
          probability: v.number(),
          level: v.number(),
        })),
      })),
    }),

    // Actions taken
    actionTaken: v.string(), // "warn_child" | "parent_notification" | "log_only"
    childWarningShown: v.boolean(),

    // Parent interaction
    viewed: v.boolean(),
    viewedAt: v.optional(v.number()),
    acknowledged: v.boolean(),
    acknowledgedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    exported: v.boolean(),

    // Notifications sent
    emailSent: v.boolean(),
    emailSentAt: v.optional(v.number()),
    smsSent: v.boolean(),
    smsSentAt: v.optional(v.number()),
  })
    .index("by_child", ["childId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_severity", ["severity", "timestamp"])
    .index("by_viewed", ["userId", "viewed", "timestamp"])
    .index("by_child_and_time", ["childId", "timestamp"]),

  // Notification history
  notifications: defineTable({
    userId: v.id("users"),
    childId: v.id("children"),
    incidentId: v.id("incidents"),

    type: v.string(), // "email" | "sms" | "push"
    status: v.string(), // "sent" | "failed" | "pending"

    sentAt: v.number(),
    deliveredAt: v.optional(v.number()),

    // Content sent
    subject: v.optional(v.string()),
    body: v.string(),

    // Delivery details
    errorMessage: v.optional(v.string()),
    provider: v.string(), // "resend" | "vonage" | etc.
  })
    .index("by_user", ["userId"])
    .index("by_incident", ["incidentId"]),

  // Analytics and insights
  analytics: defineTable({
    userId: v.id("users"),
    childId: v.optional(v.id("children")), // Null for aggregate stats

    // Time period
    periodType: v.string(), // "daily" | "weekly" | "monthly"
    periodStart: v.number(),
    periodEnd: v.number(),

    // Aggregated metrics
    totalIncidents: v.number(),
    criticalIncidents: v.number(),
    highIncidents: v.number(),
    mediumIncidents: v.number(),
    lowIncidents: v.number(),

    // By platform
    platformBreakdown: v.object({
      facebook: v.number(),
      instagram: v.number(),
      discord: v.number(),
      whatsapp: v.number(),
      twitter: v.number(),
      other: v.number(),
    }),

    // By category
    categoryBreakdown: v.object({
      sexual_content: v.number(),
      grooming: v.number(),
      personal_info: v.number(),
      meeting_request: v.number(),
      manipulation: v.number(),
      other: v.number(),
    }),

    // Trends
    trendDirection: v.string(), // "increasing" | "stable" | "decreasing"

    computedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_child", ["childId"])
    .index("by_period", ["userId", "periodType", "periodStart"]),

  // Exported reports
  exports: defineTable({
    userId: v.id("users"),
    childId: v.optional(v.id("children")),

    exportType: v.string(), // "pdf" | "csv" | "json"
    purpose: v.string(), // "law_enforcement" | "personal_record" | "backup"

    // Date range
    startDate: v.number(),
    endDate: v.number(),

    // Incidents included
    incidentIds: v.array(v.id("incidents")),
    incidentCount: v.number(),

    // File info
    fileUrl: v.optional(v.string()), // Cloudflare R2 or similar
    fileSize: v.number(),

    // Metadata
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    downloadCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),

  // System activity log
  activityLog: defineTable({
    userId: v.id("users"),
    childId: v.optional(v.id("children")),

    action: v.string(), // "login" | "settings_changed" | "child_added" | etc.
    details: v.optional(v.string()),

    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),
});

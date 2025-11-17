# Chrome Extension Integration Guide

This guide shows how the SafeGuard Kids Chrome Extension integrates with the TanStack Start + Convex dashboard for real-time incident syncing.

## Overview

The Chrome extension sends incidents directly to Convex using mutations, which are then displayed in real-time on the parent dashboard via reactive queries.

```
Chrome Extension  →  Convex Mutation  →  Convex Database  →  Dashboard (useQuery)
   (Child's PC)        (incidents:create)     (Real-time)      (All Parent Devices)
```

## Architecture

### Storage Modes

The extension supports two storage modes:

1. **Local Mode** (Free)
   - Incidents stored in `chrome.storage.local`
   - No cloud sync
   - 10MB storage limit
   - Settings in `chrome.storage.sync`

2. **Cloud Mode** (Unlimited)
   - Incidents sent to Convex via mutations
   - Real-time sync across all devices
   - Unlimited storage
   - Settings in both `chrome.storage.sync` AND Convex

### Key Components

**Extension Side:**
- `CloudSyncManager` class in `service-worker.js`
- Sends incidents to Convex mutation endpoint
- Smart caching with retry logic
- Uses parent's API key for authentication

**Dashboard Side:**
- `incidents:create` mutation in Convex
- Validates API key
- Stores incident
- Triggers real-time updates via reactive queries

## Implementation Details

### 1. CloudSyncManager (Extension)

Located in `/Users/eimis/Documents/HACKTHONS-2025/Chome AI Hackthon/safeguard-kids V2/src/service-worker.js`

```javascript
class CloudSyncManager {
  constructor() {
    this.convexUrl = 'https://marvelous-oriole-803.convex.cloud';
    this.retryInterval = 30000; // 30 seconds
    this.maxRetries = 10;
  }

  async sendToCloud(incident, settings) {
    const payload = {
      extensionId: settings.childExtensionId,
      timestamp: incident.timestamp,
      platform: incident.platform,
      threatLevel: incident.finalLevel,
      severity: incident.severity,
      messageText: incident.content,
      aiAnalysis: { /* agent results */ },
      // ... more fields
    };

    const response = await fetch(`${this.convexUrl}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'incidents:create',
        args: {
          apiKey: settings.dashboardApiKey,
          ...payload
        },
        format: 'json'
      })
    });

    return response.ok;
  }
}
```

### 2. Convex Mutation (Dashboard)

Located in `convex/incidents.ts`

```typescript
export const create = mutation({
  args: {
    apiKey: v.string(),
    timestamp: v.number(),
    platform: v.string(),
    threatLevel: v.number(),
    severity: v.string(),
    category: v.string(),
    messageText: v.optional(v.string()),
    aiAnalysis: v.object({ /* ... */ }),
    // ... more fields
  },
  handler: async (ctx, args) => {
    // Validate API key
    const user = await ctx.db
      .query("users")
      .withIndex("by_api_key", (q) => q.eq("apiKey", args.apiKey))
      .first();

    if (!user) {
      throw new Error("Invalid API key");
    }

    // Store incident
    const incidentId = await ctx.db.insert("incidents", {
      userId: user._id,
      timestamp: args.timestamp,
      platform: args.platform,
      threatLevel: args.threatLevel,
      // ... all fields
    });

    // Create notifications if needed
    if (args.threatLevel >= user.notificationSettings.emailThreshold) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        incidentId,
        type: "email",
        status: "pending",
        // ...
      });
    }

    return incidentId;
  }
});
```

### 3. Dashboard Display (TanStack Start)

Located in `app/routes/dashboard.tsx`

```typescript
function Dashboard() {
  const user = useUserSession();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Real-time reactive query
  const incidents = useQuery(
    api.incidents.getRecent,
    selectedChildId
      ? { limit: 20, childId: selectedChildId as any }
      : user
      ? { limit: 20, userId: user._id }
      : "skip"
  );

  // Incidents update automatically when new data arrives
  return (
    <div>
      {incidents?.map(incident => (
        <IncidentCard key={incident._id} incident={incident} />
      ))}
    </div>
  );
}
```

## Registration Flow

### Parent Registration (Extension)

1. Parent opens extension popup
2. Fills registration form (email, password, name, phone)
3. Extension calls Convex `auth:register` action
4. Convex generates API key and stores user
5. Extension stores:
   - Password hash in `chrome.storage.local` (local auth)
   - API key + settings in `chrome.storage.sync` (sync across browsers)
   - If cloud mode: also saves settings to Convex

### Dashboard Login

1. Parent visits dashboard login page
2. Enters same email/password used in extension
3. Dashboard calls Convex `auth:login` action
4. Convex validates with PBKDF2 password hashing
5. Returns user session
6. Dashboard shows incidents in real-time

## Settings Synchronization

### Storage Architecture

```
chrome.storage.sync (Settings - syncs across browsers)
├── storageType: "local" | "cloud"
├── dashboardApiKey: "sk_xxx"
├── parentEmail: "parent@example.com"
├── mode: "active" | "passive" | "both"
├── enabled: true
└── childExtensionId: "ext_xxx"

chrome.storage.local (Incidents in local mode, password hash)
├── parentPassword: "hashed_password"
├── setupComplete: true
└── incidents: [ /* only in local mode */ ]

Convex (Settings + Incidents in cloud mode)
├── users { email, passwordHash, notificationSettings }
├── incidents [ /* only in cloud mode */ ]
└── children [ /* only in cloud mode */ ]
```

### Saving Settings

When parent saves settings in extension:

```javascript
// 1. Always save to chrome.storage.sync
await chrome.storage.sync.set({
  storageType: storageType,
  dashboardApiKey: apiKey,
  parentEmail: email,
  // ... other settings
});

// 2. If cloud mode, also save to Convex
if (storageType === 'cloud' && apiKey) {
  await fetch(`${convexUrl}/api/mutation`, {
    method: 'POST',
    body: JSON.stringify({
      path: 'users:updateSettingsByApiKey',
      args: {
        apiKey: apiKey,
        phone: parentPhone,
        notificationSettings: { /* ... */ }
      }
    })
  });
}
```

## Smart Caching & Retry Logic

If Convex is temporarily unreachable:

1. Extension caches incident in `chrome.storage.local` (pendingSync queue)
2. Starts retry timer (every 30 seconds)
3. Badge shows pending count
4. When connection restored, syncs all pending incidents
5. Clears queue after successful sync

```javascript
async function cacheForRetry(incident, settings) {
  const { pendingSync = [] } = await chrome.storage.local.get(['pendingSync']);

  pendingSync.push({
    incident,
    settings,
    addedAt: Date.now(),
    retries: 0
  });

  await chrome.storage.local.set({ pendingSync });
  this.updateBadge(pendingSync.length);
  this.startRetryTimer();
}
```

## Demo Account

For hackathon judges:

**Email:** parent@example.com
**Password:** demo123

Visit `/reset-demo` to reset the password if needed.

## Testing Locally

1. Start Convex dev:
   ```bash
   cd safeguard-kids-dashboard
   npx convex dev
   ```

2. Start dashboard:
   ```bash
   npm run dev
   ```

3. Build extension:
   ```bash
   cd ../safeguard-kids\ V2
   npm run build
   ```

4. Load extension in Chrome:
   - Go to `chrome://extensions`
   - Enable Developer Mode
   - Load unpacked: select `safeguard-kids V2` folder

5. Register parent account in extension

6. Login to dashboard with same credentials

7. Test threat detection - incidents appear in real-time!

## Troubleshooting

### Incidents Not Syncing

Check console logs for:
```
[CloudSync] Sending to Convex: { extensionId, severity, category }
[CloudSync] ✓ Incident synced successfully
```

If you see errors:
- Verify API key is set in extension settings
- Check Convex deployment URL is correct
- Ensure parent is registered in dashboard

### Authentication Issues

- Extension password is separate from Convex (stored locally)
- Dashboard password is hashed in Convex with PBKDF2
- Use same email for both to link accounts

### Real-time Updates Not Working

- Check browser console for Convex connection errors
- Verify `useQuery` hook is used correctly
- Check Convex dashboard for query errors

## Security Notes

- API keys stored in `chrome.storage.sync` (encrypted by Chrome)
- Passwords hashed with PBKDF2 (100,000 iterations)
- All communication over HTTPS
- Convex validates API key on every mutation
- No sensitive data in client-side code

---

**Integration Complete!** The Chrome extension now syncs incidents to the parent dashboard in real-time via Convex.

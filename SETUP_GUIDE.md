# SafeGuard Kids Dashboard - Setup Guide

## ✅ STATUS: Convex Backend is LIVE!

Your Convex deployment is ready:
- **Deployment**: `marvelous-oriole-803`
- **URL**: `https://marvelous-oriole-803.convex.cloud`
- **Dashboard**: https://dashboard.convex.dev/d/marvelous-oriole-803

## What's Already Done

✅ Convex project created (`safeguard-kids-dashboard`)
✅ Cloud deployment provisioned
✅ Database schema pushed (users, children, incidents, notifications, analytics)
✅ 18 table indexes created
✅ Convex dev server running
✅ TanStack Start integrated with Convex provider
✅ API endpoint created (`/api/incidents`)

## Next Steps

### 1. Start TanStack Start Dev Server

Open a **NEW terminal window** (keep `npx convex dev` running in the first one):

```bash
cd "/Users/eimis/Documents/HACKTHONS-2025/Chome AI Hackthon/safeguard-kids-dashboard"

npm run dev
```

Expected output:
```
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 2. Test the Dashboard

Open your browser and go to:
- http://localhost:3000/ - Home page
- http://localhost:3000/dashboard - Main dashboard
- http://localhost:3000/api/incidents - API test endpoint

### 3. Test API Endpoint

```bash
# Test GET (should return "ok" status)
curl -H "Authorization: Bearer test-api-key" http://localhost:3000/api/incidents
```

Expected response:
```json
{
  "status":"ok",
  "message":"SafeGuard Kids API is running",
  "timestamp":"2024-..."
}
```

### 4. Update Chrome Extension

Point the extension to your local dev server:

**File**: `safeguard-kids V2/src/service-worker.js` (line 33)

```javascript
// Change this line:
this.dashboardUrl = 'https://dashboard.safeguardkids.com';

// To this (for local development):
this.dashboardUrl = 'http://localhost:3000';
VONAGE_API_SECRET=xxxxxxxxxxxxxxxx

# Sentry (Error tracking)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Firecrawl (Web scraping for threat intelligence)
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxxxxxx
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Deploy Schema to Convex

In a separate terminal:

```bash
npx convex deploy
```

This pushes your schema and functions to Convex production.

## Connecting the Chrome Extension

### Update Extension Configuration

In your Chrome extension's service worker, add the dashboard URL:

```javascript
// In safeguard-kids V2/src/service-worker.js

const DASHBOARD_CONFIG = {
  apiUrl: 'https://your-dashboard.netlify.app/api/incidents',
  // OR for local development:
  // apiUrl: 'http://localhost:3000/api/incidents',
}

async function reportIncidentToDashboard(incident) {
  const settings = await chrome.storage.sync.get(['dashboardApiKey', 'childExtensionId']);

  try {
    const response = await fetch(DASHBOARD_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.dashboardApiKey}`
      },
      body: JSON.stringify({
        extensionId: settings.childExtensionId,
        timestamp: Date.now(),
        platform: incident.platform,
        incidentType: incident.type,
        threatLevel: incident.finalLevel,
        severity: incident.severity,
        category: incident.primaryThreat,
        messageText: incident.content,
        imageDescription: incident.imageDescription,
        conversationContext: incident.conversationContext,
        aiAnalysis: {
          agent1: incident.agent1Result,
          agent2: incident.agent2Result,
          agent3: incident.agent3Result,
          agent4: incident.agent4Result,
          tensorflow: incident.tensorflowResult,
        },
        actionTaken: incident.actionRequired,
        childWarningShown: incident.childWarningShown || false,
      })
    });

    const result = await response.json();
    console.log('[SafeGuard] Incident sent to dashboard:', result);

    return result.success;
  } catch (error) {
    console.error('[SafeGuard] Failed to send incident to dashboard:', error);
    return false;
  }
}

// Call this function after AGENT 4 makes final decision
// Add to takeAction() function:
if (settings.dashboardEnabled) {
  await reportIncidentToDashboard(incident);
}
```

### Generate API Keys for Parents

1. Create a Convex function to generate API keys:

```typescript
// convex/users.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { randomBytes } from "crypto";

export const createApiKey = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Generate a secure API key
    const apiKey = `sk_${randomBytes(32).toString('hex')}`;

    // Store it with the user
    await ctx.db.patch(args.userId, {
      apiKey,
    });

    return apiKey;
  },
});
```

2. Show API key in parent dashboard settings
3. Parent enters API key in Chrome extension settings

## Deploying to Netlify

### 1. Build the Project

```bash
npm run build
```

### 2. Deploy to Netlify

Option A: **Using Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

Option B: **Using Git Integration**

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.output/public`

### 3. Add Environment Variables in Netlify

In Netlify dashboard:
- Go to Site settings → Environment variables
- Add all variables from `.env` file

### 4. Configure Custom Domain (Optional)

1. Go to Domain settings
2. Add custom domain (e.g., `dashboard.safeguardkids.com`)
3. Configure DNS records

## Integrating Hackathon Sponsors

### Sentry Error Tracking

```bash
npm install @sentry/react @sentry/vite-plugin
```

Update `app/routes/__root.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### CodeRabbit Code Reviews

1. Go to [coderabbit.ai](https://coderabbit.ai)
2. Connect GitHub repository
3. CodeRabbit will automatically review PRs

### Firecrawl Threat Intelligence

```typescript
// app/utils/threatIntelligence.ts
import Firecrawl from '@firecrawl/firecrawl-node';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function scrapePredatorDatabase() {
  // Scrape public predator registry databases
  const result = await firecrawl.scrape({
    url: 'https://example.com/predator-registry',
    formats: ['markdown'],
  });

  return result;
}
```

### Cloudflare Workers/Pages

For global edge deployment, use Cloudflare Pages:

1. Update `app.config.ts`:

```typescript
export default defineConfig({
  server: {
    preset: 'cloudflare-pages',
  },
})
```

2. Deploy to Cloudflare Pages via GitHub integration

## Testing

### 1. Test Convex Connection

```bash
# In browser console on dashboard
const testQuery = await convex.query("incidents.getRecent", { limit: 5 });
console.log(testQuery);
```

### 2. Test API Endpoint

```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key" \
  -d '{
    "extensionId": "test-extension-123",
    "timestamp": 1699999999000,
    "platform": "facebook",
    "incidentType": "message",
    "threatLevel": 9,
    "severity": "CRITICAL",
    "category": "sexual_content",
    "messageText": "Test message",
    "aiAnalysis": {},
    "actionTaken": "warn_child",
    "childWarningShown": true
  }'
```

### 3. Test Chrome Extension Integration

1. Install Chrome extension
2. Configure dashboard API URL and key
3. Trigger a test threat scenario
4. Verify incident appears in dashboard in real-time

## Troubleshooting

### Convex Connection Issues

**Problem**: `ConvexProviderWithAuth not found`

**Solution**: Ensure Convex is initialized:

```bash
npx convex dev
```

### Build Errors

**Problem**: TypeScript errors about Convex types

**Solution**: Generate Convex types:

```bash
npx convex codegen
```

### API Endpoint Not Working

**Problem**: 404 on `/api/incidents`

**Solution**: Verify TanStack Start API routes are configured correctly. Check `app/routes/api/incidents.ts` exists.

### Deployment Issues

**Problem**: Netlify build fails

**Solution**: Ensure build command is correct:

```json
{
  "scripts": {
    "build": "vinxi build"
  }
}
```

## Next Steps

1. ✅ Complete parent authentication system
2. ✅ Add multi-child profile management
3. ✅ Implement email/SMS notification triggers
4. ✅ Create export functionality for law enforcement
5. ✅ Add analytics dashboard with charts
6. ✅ Implement real-time WebSocket updates (Convex handles this automatically)

## Support

For issues:
- Check [TanStack Start Docs](https://tanstack.com/start)
- Check [Convex Docs](https://docs.convex.dev)
- Open an issue on GitHub

---

**Built for TanStack Start Hackathon 2025**

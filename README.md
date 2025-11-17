# SafeGuard Kids - Parent Dashboard

A companion web application for the SafeGuard Kids Chrome Extension, built with TanStack Start and Convex for the TanStack Start Hackathon.

## Overview

This web dashboard provides parents with a centralized, multi-device interface to monitor their children's online safety. While the Chrome extension runs locally on the child's browser, this dashboard aggregates all incidents, provides real-time notifications, and offers advanced analytics.

## Tech Stack

- **TanStack Start** - Full-stack React framework with file-based routing and SSR
- **Convex** - Real-time reactive database with serverless backend
- **Resend** - Email notification delivery
- **React** - UI component library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

## Features

### Real-Time Monitoring
- Live incident feed from Chrome extension
- Instant notifications across all devices
- Real-time threat level updates
- Automatic alerts for critical incidents

### Multi-Child Management
- Monitor multiple children from one dashboard
- Individual settings per child
- Separate incident histories
- Custom notification preferences

### Advanced Analytics
- Threat trend analysis
- Platform breakdown (Facebook, Instagram, etc.)
- Time-of-day patterns
- Predator tactic identification

### Law Enforcement Tools
- Exportable incident reports (PDF/CSV)
- Chain of custody documentation
- Full conversation context
- AI reasoning explanations

### Cross-Device Access
- Responsive web interface
- Mobile-optimized views
- Desktop notifications
- Email and SMS alerts

## Architecture

```
┌─────────────────────────────────────────┐
│   Chrome Extension (Child's Browser)    │
│   - Monitors Instagram, Discord, etc.   │
│   - Gemini Nano + TensorFlow.js AI      │
│   - Real-time threat detection          │
└──────────────┬──────────────────────────┘
               │ Convex Mutation (incidents:create)
               │ Uses parent's API key
               ↓
┌─────────────────────────────────────────┐
│   Convex Backend (Serverless)           │
│   - Reactive queries (real-time sync)   │
│   - Mutations (data writes)             │
│   - Actions (PBKDF2 password hashing)   │
│   - Authentication & authorization      │
└──────────────┬──────────────────────────┘
               │ useQuery hook (reactive)
               ↓
┌─────────────────────────────────────────┐
│   TanStack Start Dashboard              │
│   - File-based routing                  │
│   - Server-side rendering               │
│   - Real-time incident updates          │
│   - Multi-device access                 │
└─────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Convex account (free at convex.dev)
- Chrome extension installed and configured

### Installation

```bash
# Install dependencies
npm install

# Set up Convex
npx convex dev

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local` file:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
RESEND_API_KEY=your-resend-key  # Optional: for email notifications
```

The Convex URL is automatically configured when you run `npx convex dev`.

## Project Structure

```
safeguard-kids-dashboard/
├── app/                          # TanStack Start app
│   ├── routes/                   # Route components
│   │   ├── index.tsx            # Landing page
│   │   ├── dashboard.tsx        # Main dashboard
│   │   ├── children/            # Child management
│   │   ├── settings.tsx         # Settings page
│   │   └── api/                 # API routes
│   │       └── incidents.ts     # Extension webhook
│   ├── components/              # React components
│   │   ├── IncidentCard.tsx
│   │   ├── ThreatChart.tsx
│   │   ├── ChildSelector.tsx
│   │   └── NotificationSettings.tsx
│   └── utils/                   # Utilities
│       ├── auth.ts
│       └── notifications.ts
│
├── convex/                      # Convex backend
│   ├── schema.ts               # Database schema
│   ├── incidents.ts            # Incident queries/mutations
│   ├── children.ts             # Child management
│   ├── parents.ts              # Parent management
│   ├── notifications.ts        # Email/SMS functions
│   └── analytics.ts            # Analytics queries
│
├── public/                      # Static assets
│   └── icons/
│
├── package.json
├── tsconfig.json
└── convex.json
```

## Integration with Chrome Extension

The Chrome extension sends incidents directly to Convex mutations:

```typescript
// In Chrome extension service worker
async function syncToCloud(incident) {
  const { dashboardApiKey } = await chrome.storage.sync.get(['dashboardApiKey']);

  await fetch('https://marvelous-oriole-803.convex.cloud/api/mutation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'incidents:create',
      args: {
        apiKey: dashboardApiKey,
        ...incident
      },
      format: 'json'
    })
  });
}
```

Convex validates the API key, stores the incident, and instantly pushes updates to all connected dashboard instances via reactive queries.

## Completed Features

- [x] TanStack Start project setup with file-based routing
- [x] Convex backend with real-time reactive queries
- [x] PBKDF2 password authentication
- [x] Real-time incident feed from Chrome extension
- [x] Multi-child management interface
- [x] Individual settings per child
- [x] Notification settings (email thresholds)
- [x] Export reports for law enforcement
- [x] Child profile editing
- [x] Account management (change password)
- [x] Demo credentials for hackathon judges

## Deployment

Deploy to Netlify with automatic Convex integration:

```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod
```

## Contributing

This project was created for the TanStack Start Hackathon. Contributions welcome!

## License

MIT License - Built with ❤️ to protect children online

---

**TanStack Start Hackathon 2025**

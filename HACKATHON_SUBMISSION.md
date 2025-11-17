# SafeGuard Kids - Chrome Extension + Cloud Dashboard

## Problem we're solving

Child predators groom children through social media. Parents need real-time AI-powered threat detection across platforms like Instagram, Discord, Facebook, and WhatsApp.

## How the app works

- **Chrome Extension**: Monitors social media in real-time using 4-agent AI system (Gemini models + TensorFlow.js)
- **Cloud Dashboard**: TanStack Start web app where parents view incidents, analytics, and get notifications
- **Seamless Sync**: Extension sends threats to Convex → Parents see them instantly on any device

## Notable features

- **Real-time sync** via Convex reactive queries
- **PBKDF2 authentication** - Same credentials from extension work on cloud dashboard
- **Smart notifications** via Resend (email) based on threat severity
- **Multi-platform monitoring** - Works across Instagram, Discord, Facebook, WhatsApp
- **Export for law enforcement** - Detailed incident reports

## Tech Stack

### Required Technologies (Hackathon)

✅ **TanStack Start** - Full-stack React framework
- Server-side rendering for fast page loads
- Type-safe API routes for Chrome extension integration
- Server functions for secure operations
- File-based routing for clean architecture

✅ **Convex** - Real-time reactive database
- Instant incident sync across all devices
- Real-time queries with automatic updates
- Type-safe backend functions
- Built-in authentication ready

✅ **Netlify** - Deployment platform
- Automatic deployments from Git
- Edge functions for global performance
- Environment variable management
- Custom domains

✅ **Sentry** - Error tracking and monitoring
- Real-time error alerts
- Performance monitoring
- User session replay for debugging

✅ **CodeRabbit** - AI code reviews
- Automatic PR reviews
- Code quality suggestions
- Security vulnerability detection

✅ **Cloudflare** - CDN and edge functions
- Global edge network for low latency
- DDoS protection
- SSL/TLS encryption

✅ **Firecrawl** - Web scraping (future feature)
- Scrape public predator databases
- Aggregate threat intelligence
- Enhance detection with known patterns

✅ **Autumn** - AI-powered analysis (future feature)
- Advanced threat pattern recognition
- Aggregate anonymous insights across users

### Additional Technologies

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library
- **date-fns** - Date formatting
- **Zod** - Schema validation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                CHROME EXTENSION (Existing)               │
│                                                          │
│  • Chrome Prompt API (Gemini Nano)                      │
│  • Multi-agent AI system                                │
│  • TensorFlow.js toxicity detection                     │
│  • Local threat detection                               │
│  • Chrome Storage (10MB limit)                          │
└─────────────┬───────────────────────────────────────────┘
              │
              │ HTTP POST /api/incidents
              │ (Incident data + AI analysis)
              │
              ↓
┌─────────────────────────────────────────────────────────┐
│            TANSTACK START WEB APP (New)                  │
│                                                          │
│  Routes:                                                 │
│  • /                Landing page                         │
│  • /dashboard       Real-time incident feed             │
│  • /children        Multi-child management              │
│  • /settings        Notification preferences            │
│  • /api/incidents   Extension webhook endpoint          │
│                                                          │
│  Features:                                               │
│  • Server-side rendering                                │
│  • Type-safe API routes                                 │
│  • Real-time Convex queries                             │
│  • Responsive design (mobile-first)                     │
└─────────────┬───────────────────────────────────────────┘
              │
              │ Convex Client
              │ (Real-time subscriptions)
              │
              ↓
┌─────────────────────────────────────────────────────────┐
│              CONVEX BACKEND (New)                        │
│                                                          │
│  Schema:                                                 │
│  • users        Parent accounts + API keys              │
│  • children     Child profiles + extension config       │
│  • incidents    All detected threats (unlimited)        │
│  • notifications Email/SMS history                      │
│  • analytics    Aggregated statistics                   │
│  • exports      Law enforcement reports                 │
│                                                          │
│  Functions:                                              │
│  • incidents.create()       Store incident from API     │
│  • incidents.getRecent()    Real-time query             │
│  • incidents.getBySeverity() Filter by threat level     │
│  • incidents.getStats()     Analytics                   │
│  • children.getAll()        Multi-child support         │
│  • exports.create()         Generate reports            │
└─────────────────────────────────────────────────────────┘
              │
              │ Real-time updates
              │
              ↓
┌─────────────────────────────────────────────────────────┐
│         PARENT DEVICES (Multi-device access)             │
│                                                          │
│  • Desktop browser                                       │
│  • Mobile phone                                          │
│  • Tablet                                                │
│  • All devices stay in sync automatically               │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Real-Time Incident Feed

Parents see incidents instantly as they're detected by the Chrome extension:

```typescript
// Real-time Convex query (updates automatically)
const incidents = useQuery(api.incidents.getRecent, { limit: 20 })

// No polling, no refresh needed - updates appear instantly
```

### 2. Smart Filtering & Analytics

- Filter by severity (Critical, High, Medium, Low)
- Filter by platform (Facebook, Instagram, Discord, etc.)
- Filter by category (Sexual content, Grooming, Personal info, etc.)
- View unviewed incidents only
- Track trends over time

### 3. Multi-Child Management

```typescript
// Each child has their own profile
const children = useQuery(api.children.getAll, { userId })

// Each extension installation links to a child profile
// Parents can monitor multiple children from one dashboard
```

### 4. Law Enforcement Export

Generate comprehensive reports with:
- Full conversation context
- All AI agent analysis results
- Timestamps and platform details
- Red flags and threat indicators
- Case-specific guidance

Export formats: PDF, CSV, JSON

### 5. Cross-Device Notifications

- Email alerts (via Resend API)
- SMS alerts (via Vonage API)
- Configurable thresholds (Medium 5+, High 7+, Critical 9+)
- Test notification feature

## Innovation Highlights

### 1. Hybrid Architecture

Combines the best of both worlds:

**Chrome Extension (Local)**
- Privacy-first AI processing (no cloud uploads)
- Instant threat detection
- Works offline
- Child warnings in Active mode

**Web Dashboard (Cloud)**
- Multi-device access
- Unlimited storage
- Advanced analytics
- Law enforcement tools

### 2. Real-Time Sync Without Polling

Thanks to Convex's reactive queries, the dashboard updates instantly when new incidents are detected—no polling, no refresh needed.

```typescript
// This query automatically updates when new data arrives
const incidents = useQuery(api.incidents.getRecent, { limit: 20 })

// Convex handles WebSocket connections, reconnection, caching, etc.
```

### 3. Type Safety End-to-End

```typescript
// Extension sends typed data
interface IncidentPayload {
  extensionId: string
  threatLevel: number
  aiAnalysis: { agent1, agent2, agent3, agent4, tensorflow }
}

// API route validates types
export const Route = createAPIFileRoute('/api/incidents')({
  POST: async ({ request }) => { /* ... */ }
})

// Convex schema enforces types
export default defineSchema({
  incidents: defineTable({
    threatLevel: v.number(),
    aiAnalysis: v.object({ /* ... */ })
  })
})

// React components consume typed data
const incidents: Doc<'incidents'>[] = useQuery(/* ... */)
```

### 4. Production-Ready from Day One

- Error tracking with Sentry
- Automatic deployments via Netlify
- Environment variable management
- Type-safe at every layer
- Responsive design
- Accessibility features

## Demonstration Scenario

### Setup Phase

1. Parent creates account on web dashboard
2. Dashboard generates API key: `sk_abc123...`
3. Parent installs Chrome extension on child's browser
4. Parent enters API key in extension settings
5. Extension generates unique ID and links to dashboard

### Detection Phase

6. Child receives suspicious message on Instagram:
   ```
   "You're so mature for your age. This is our secret, okay?
    Don't tell your parents. Want to meet up this weekend?"
   ```

7. Chrome extension detects threat:
   - AGENT 1: Grooming pattern detected (trust building + isolation + meeting request)
   - TensorFlow: No toxicity (sophisticated grooming)
   - OR Logic: TRUE (AGENT 1 flagged)
   - AGENT 4: CRITICAL threat, level 9/10

8. Extension takes action:
   - Shows child warning (Active mode)
   - Stores incident locally (Chrome Storage)
   - **Sends incident to dashboard API**

### Dashboard Phase

9. API receives incident:
   ```javascript
   POST /api/incidents
   {
     "extensionId": "ext_123abc",
     "threatLevel": 9,
     "severity": "CRITICAL",
     "category": "grooming",
     "messageText": "You're so mature...",
     "aiAnalysis": { /* full analysis */ }
   }
   ```

10. Convex stores incident and broadcasts update

11. **Parent's phone buzzes** (real-time notification)

12. Parent opens dashboard on phone:
    - Incident appears at top of feed (real-time)
    - Severity: CRITICAL (red indicator)
    - AI Guidance: "CALL POLICE IMMEDIATELY (911)"
    - Full conversation context shown
    - Red flags highlighted

13. Parent takes action:
    - Marks incident as reviewed
    - Adds notes: "Called police, case #12345"
    - Exports report for detective

14. Parent opens dashboard on laptop later:
    - Same incident visible (synced)
    - Notes appear (synced)
    - All actions synchronized

## Code Quality

### File Structure

```
safeguard-kids-dashboard/
├── app/
│   ├── routes/
│   │   ├── __root.tsx          (Root layout)
│   │   ├── index.tsx           (Landing page)
│   │   ├── dashboard.tsx       (Main dashboard)
│   │   └── api/
│   │       └── incidents.ts    (Extension webhook)
│   ├── components/
│   │   ├── IncidentCard.tsx    (Reusable component)
│   │   ├── ThreatChart.tsx     (Analytics charts)
│   │   └── StatCard.tsx        (Stat displays)
│   └── styles/
│       └── globals.css         (Tailwind styles)
├── convex/
│   ├── schema.ts               (Type-safe schema)
│   ├── incidents.ts            (Queries & mutations)
│   └── children.ts             (Child management)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

### TypeScript Coverage

- 100% TypeScript (no `any` except where necessary)
- Strict mode enabled
- Type-safe API routes
- Type-safe database queries
- Type-safe React components

### Code Reviews

Using **CodeRabbit** for automated code reviews on every PR:
- Security vulnerability detection
- Code quality suggestions
- Best practices enforcement
- Type safety validation

## Deployment

### Netlify Configuration

```bash
# Build command
npm run build

# Publish directory
.output/public

# Environment variables
CONVEX_DEPLOYMENT=prod:safeguard-kids-123
VITE_CONVEX_URL=https://safeguard-kids-123.convex.cloud
SENTRY_DSN=https://...
```

### Convex Deployment

```bash
# Deploy schema and functions
npx convex deploy

# Production URL
https://safeguard-kids-123.convex.cloud
```

### Custom Domain

```
https://dashboard.safeguardkids.com
```

## Future Enhancements

### Phase 1: Enhanced Security
- Implement Better Auth for authentication
- Add 2FA for parent accounts
- Encrypt sensitive incident data at rest

### Phase 2: Mobile App
- React Native mobile app
- Push notifications
- Biometric authentication

### Phase 3: Community Intelligence
- Anonymous threat pattern sharing
- Aggregate insights across all users (privacy-preserving)
- Collaborative predator database

### Phase 4: AI Enhancements
- Use Autumn for advanced pattern recognition
- Use Firecrawl to aggregate threat intelligence
- Predictive analytics for emerging threats

## Impact

### For Parents
- Peace of mind from anywhere
- Comprehensive oversight across multiple children
- Professional tools for law enforcement collaboration
- Historical data for pattern recognition

### For Children
- Consistent protection across all devices
- Educational warnings (Active mode)
- Parent-child communication opportunities

### For Law Enforcement
- Comprehensive evidence packages
- Chain of custody documentation
- Full AI analysis reasoning
- Exportable reports (PDF, CSV, JSON)

### For Society
- Scalable child protection (1 or 1 million users)
- Privacy-preserving threat detection
- Open source for transparency and improvement
- Foundation for cross-platform protection

## Conclusion

**SafeGuard Kids Parent Dashboard** demonstrates the power of combining Chrome's local AI capabilities with modern full-stack technologies:

- **TanStack Start** provides a type-safe, performant full-stack framework
- **Convex** enables real-time, reactive data sync without complexity
- **Netlify** offers seamless deployment and global edge performance
- **Sentry** ensures production reliability and error tracking

Together, these technologies create a production-ready child safety platform that could protect millions of children while respecting their privacy.

This isn't just a hackathon project—it's a foundation for making the internet safer for the most vulnerable users.

---
## Team

- Solo developer
- Built with ❤️ to protect children online

## Hackathon Tags

`#TanStackStart` `#Convex` `#Netlify``#ChildSafety` `#AI` `#FullStack`

---

**TanStack Start Hackathon 2025 Submission**

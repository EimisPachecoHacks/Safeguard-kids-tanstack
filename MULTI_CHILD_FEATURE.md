# Multi-Child Management Feature

## Overview

The SafeGuard Kids Dashboard includes a comprehensive **Multi-Child Management** system that allows parents to monitor multiple children from a single dashboard.

## Features

### 1. Child Profiles

Each child has a dedicated profile containing:
- **Name & Age** - Basic information
- **Avatar** - Visual identification (auto-generated gradient if no photo)
- **Extension ID** - Links Chrome extension to dashboard
- **Monitoring Status** - Active/Paused
- **Monitoring Mode** - Active, Passive, or Both
- **Platforms** - List of monitored platforms (Facebook, Instagram, etc.)
- **Last Sync Time** - When extension last connected

### 2. Children Management Page (`/children`)

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: "Multi-Child Management"                [Add Child]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌─────────────────────────────────────────┐ │
│  │              │  │                                         │ │
│  │   Children   │  │        Selected Child Details          │ │
│  │   List       │  │                                         │ │
│  │   (Sidebar)  │  │  - Profile card with avatar            │ │
│  │              │  │  - Stats (total, 24h, critical, high)  │ │
│  │  • Emma (2)  │  │  - Monitored platforms                 │ │
│  │  • Jake      │  │  - Recent incidents (last 10)          │ │
│  │  • Sophie    │  │  - Quick actions                       │ │
│  │              │  │                                         │ │
│  └──────────────┘  └─────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Children List (Left Sidebar)

Each child in the list shows:

```
┌─────────────────────────────────────┐
│  👤  Emma                      [2]  │  ← Badge shows new incidents
│      Age 12                         │
│      🟢 Active now                  │  ← Last sync status
│      ⚠️  15 total  •  2 critical   │  ← Quick stats
└─────────────────────────────────────┘
```

**Color-coded sync status:**
- 🟢 Green: Active now (< 1 hour)
- 🟡 Yellow: Recent (1-24 hours)
- 🔴 Red: Inactive (> 24 hours)

**Badge notifications:**
- Red badge shows new incidents in last 24 hours
- Only appears when > 0 new incidents

#### Child Details (Main Content)

When a child is selected, shows:

**1. Profile Card**
```
┌──────────────────────────────────────────────────┐
│  👤         Emma, Age 12                  ✏️ ⚙️  │
│  Profile    🟢 Monitoring Active                  │
│  Avatar     Active mode                           │
│                                                   │
│  ┌────────────┬────────────┬────────────┬───────┐│
│  │  Total     │  Last 24h  │  Critical  │  High ││
│  │   15       │     2      │     1      │   4   ││
│  └────────────┴────────────┴────────────┴───────┘│
└──────────────────────────────────────────────────┘
```

**2. Monitored Platforms**
```
┌──────────────────────────────────────────────────┐
│  Monitored Platforms                              │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ 📘 FB    │ 📷 IG    │ 💬 DC    │ 💚 WA    │  │
│  │ 8 inc.   │ 5 inc.   │ 2 inc.   │ 0 inc.   │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
└──────────────────────────────────────────────────┘
```

**3. Recent Incidents**
```
┌──────────────────────────────────────────────────┐
│  Recent Incidents                    [View All →]│
│  ─────────────────────────────────────────────── │
│  ⚠️ CRITICAL  Sexual Content                     │
│      "Send me pics"                      [View]  │
│  ─────────────────────────────────────────────── │
│  🔶 HIGH      Personal Info Request              │
│      "What's your address?"              [View]  │
│  ─────────────────────────────────────────────── │
└──────────────────────────────────────────────────┘
```

**4. Quick Actions**
```
┌──────────────────────────────────────────────────┐
│  ┌──────────┬──────────┬──────────────────────┐ │
│  │ Settings │Analytics │ Export Reports        │ │
│  │          │          │                       │ │
│  └──────────┴──────────┴──────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 3. Child Selector in Main Dashboard

The main dashboard (`/dashboard`) includes a child selector dropdown:

```
┌─────────────────────────────────────────────────┐
│  SafeGuard Kids Dashboard                       │
│                                                  │
│  [👥 All Children ▼]  [🔔]  [Settings]         │
│                                                  │
│  ┌─────────────────────────┐                    │
│  │ 👥 All Children         │  ← Shows all       │
│  ├─────────────────────────┤                    │
│  │ 👤 Emma                 │  ← Filter by Emma  │
│  │ 👤 Jake                 │  ← Filter by Jake  │
│  │ 👤 Sophie               │  ← Filter by Sophie│
│  └─────────────────────────┘                    │
└─────────────────────────────────────────────────┘
```

**When "All Children" selected:**
- Shows combined incidents from all children
- Stats aggregate across all children
- Charts show overall trends

**When specific child selected:**
- Filters incidents to that child only
- Stats show only that child's data
- Charts show that child's patterns

### 4. Data Model

#### Child Profile Schema

```typescript
{
  _id: Id<"children">,
  userId: Id<"users">,           // Parent who owns this profile
  name: string,                   // Child's name
  age?: number,                   // Optional age
  avatar?: string,                // Profile picture URL

  // Chrome extension link
  extensionId: string,            // Unique ID from extension
  extensionVersion: string,       // Extension version
  lastSyncAt: number,            // Last time extension connected

  // Settings
  monitoringMode: "active" | "passive" | "both",
  monitoringEnabled: boolean,
  platforms: string[],           // ["facebook", "instagram", ...]

  createdAt: number,
}
```

#### How Extension Links to Child

```javascript
// When extension first connects to dashboard:
1. Extension sends incident with extensionId: "ext_123abc"
2. API checks if child exists with this extensionId
3. If not found → Create new child profile automatically
4. If found → Update lastSyncAt
5. Store incident linked to child._id
```

**Automatic Child Creation Flow:**

```
Extension (first incident)
    ↓ POST /api/incidents { extensionId: "ext_123abc" }
    ↓
API checks Convex
    ↓ No child found with this extensionId
    ↓
Create child profile
    ↓ Name: "Child 1" (parent can rename later)
    ↓ extensionId: "ext_123abc"
    ↓ userId: from API key
    ↓
Store incident
    ↓ childId: new child's ID
    ↓
Return success
```

### 5. Convex Queries for Multi-Child

```typescript
// Get all children for a user
const children = useQuery(api.children.getAll, { userId })

// Get stats for a specific child
const stats = useQuery(api.children.getStats, { childId })

// Get incidents filtered by child
const incidents = useQuery(api.incidents.getByChild, {
  childId,
  limit: 20
})

// Get incidents for all children
const allIncidents = useQuery(api.incidents.getRecent, {
  userId, // Will return incidents for all user's children
  limit: 50
})
```

### 6. Real-Time Updates

Thanks to Convex, all multi-child data updates in real-time:

- ✅ When Emma's extension detects threat → Dashboard updates instantly
- ✅ When Jake's incident is marked as reviewed → Stats update immediately
- ✅ When Sophie's extension syncs → "Active now" status updates
- ✅ All without page refresh or polling

### 7. Use Cases

#### Scenario 1: Parent with 3 Children

```
Dashboard view:
┌─────────────────────────────────────┐
│  Children: Emma (2), Jake (0), Sophie (1)
│
│  Total Incidents: 15
│  Critical: 2
│  Last 24h: 3
│
│  Recent:
│  [CRITICAL] Emma - Sexual content
│  [HIGH] Sophie - Meeting request
│  [MEDIUM] Emma - Personal info
└─────────────────────────────────────┘

Click "Emma" → Filter to show only Emma's 9 incidents
Click "Jake" → Show Jake's 0 incidents (all safe)
Click "Sophie" → Show Sophie's 6 incidents
```

#### Scenario 2: Adding New Child

```
1. Parent clicks "Add Child"
2. Modal appears:
   ┌─────────────────────────────────┐
   │  Add Child                      │
   │                                 │
   │  Name: [Emma        ]          │
   │  Age:  [12          ]          │
   │                                 │
   │  Next Steps:                    │
   │  1. Install extension           │
   │  2. Enter API key: sk_abc123... │
   │  3. Extension will auto-link    │
   │                                 │
   │  [Cancel]  [Add Child]         │
   └─────────────────────────────────┘

3. Child profile created
4. Parent installs extension on Emma's computer
5. Extension auto-links to Emma's profile
6. First incident appears under Emma
```

#### Scenario 3: Switching Between Children

```
Parent receives notification:
"CRITICAL alert for Emma"

On phone:
1. Opens dashboard.safeguardkids.com
2. Sees "All Children" with 1 new incident
3. Taps child selector → Emma
4. Sees Emma's incident details
5. Takes action

Later on laptop:
1. Opens same dashboard
2. Already filtered to Emma (state synced)
3. Reviews incident again
4. Marks as reviewed
5. Phone updates immediately (Convex real-time)
```

## File Locations

- **Main route**: `app/routes/children.tsx`
- **Child selector component**: `app/components/ChildSelector.tsx`
- **Backend queries**: `convex/children.ts`
- **Schema**: `convex/schema.ts` (children table)

## Key Components

### `<ChildrenManagement />` (Full page)
- Main multi-child management interface
- Sidebar with children list
- Detail view for selected child
- Empty state for new users

### `<ChildSelector />` (Dropdown)
- Compact selector for dashboard header
- Shows all children
- Filters dashboard by selected child
- Avatar display

### `<ChildListItem />`
- Individual child in sidebar
- Shows stats, sync status, new incidents
- Clickable to select

### `<ChildDetails />`
- Full profile view
- Stats grid
- Monitored platforms
- Recent incidents
- Quick actions

## Testing Multi-Child

### Setup Test Data

```javascript
// Create test children in Convex
await ctx.db.insert("children", {
  userId: "user_123",
  name: "Emma",
  age: 12,
  extensionId: "ext_emma_123",
  extensionVersion: "1.0.0",
  lastSyncAt: Date.now() - 1000 * 60 * 30, // 30 min ago
  monitoringMode: "active",
  monitoringEnabled: true,
  platforms: ["facebook", "instagram"],
  createdAt: Date.now(),
})

await ctx.db.insert("children", {
  userId: "user_123",
  name: "Jake",
  age: 15,
  extensionId: "ext_jake_456",
  extensionVersion: "1.0.0",
  lastSyncAt: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
  monitoringMode: "passive",
  monitoringEnabled: true,
  platforms: ["discord", "twitter"],
  createdAt: Date.now(),
})
```

### Test Flows

1. Navigate to `/children`
2. Should see 2 children in sidebar
3. Click Emma → See Emma's details
4. Click Jake → See Jake's details
5. Navigate to `/dashboard`
6. Click child selector → See Emma and Jake
7. Select Emma → Dashboard filters to Emma only
8. Select "All Children" → Dashboard shows all

## Benefits of Multi-Child View

✅ **Centralized Monitoring** - One dashboard for all children
✅ **Quick Comparison** - See which child needs attention
✅ **Individual Settings** - Each child has own monitoring mode
✅ **Scalable** - Works for 1 child or 10 children
✅ **Real-Time** - All children update live
✅ **Mobile Friendly** - Responsive design works on all devices

---

**The multi-child feature is production-ready and showcases Convex's real-time capabilities perfectly!** 🎉

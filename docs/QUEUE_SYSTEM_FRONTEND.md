# Queue System Frontend Implementation

## 🎯 Overview

Complete frontend implementation of the Rallio Queue feature. A modern, sleek queueing system that allows users to join queues for badminton courts, view their position, and manage their queue status.

## 📁 Files Created

### Core Components
- `/web/src/components/queue/player-card.tsx` - Player card component with avatar, skill level, and position
- `/web/src/components/queue/queue-status-badge.tsx` - Status indicator (waiting/active/completed)
- `/web/src/components/queue/queue-card.tsx` - Reusable queue card for lists and dashboards

### Pages
- `/web/src/app/(main)/queue/page.tsx` - Queue dashboard (server component)
- `/web/src/app/(main)/queue/queue-dashboard-client.tsx` - Dashboard client logic
- `/web/src/app/(main)/queue/[courtId]/page.tsx` - Individual queue page (server component)
- `/web/src/app/(main)/queue/[courtId]/queue-details-client.tsx` - Queue details client logic

### Hooks & State Management
- `/web/src/hooks/use-queue.ts` - Mock hooks for queue state (ready for backend integration)

### Navigation
- Updated `/web/src/components/layout/main-nav.tsx` - Added Queue tab to navbar

### Styling
- Updated `/web/src/app/globals.css` - Added shimmer animation for player cards

## 🎨 Design Features

### Visual Style
- **Color Scheme**: Matches existing teal/green primary theme
- **Card Design**: Rounded-xl borders, soft shadows, clean white backgrounds
- **Typography**: Clear hierarchy with bold headings and readable body text
- **Icons**: Lucide React icons (Users, Clock, Activity, MapPin, etc.)
- **Animations**: Smooth transitions, shimmer effect on waiting players

### Responsive Design
- Desktop: Multi-column grid layouts, hover states
- Mobile: Single column, sticky bottom action bar, optimized touch targets

### UI Components
1. **Queue Status Badge** - Color-coded status indicators
   - 🟡 Waiting (yellow)
   - 🟢 Active (green)
   - ⚫ Completed (gray)

2. **Player Card** - Displays queue participant info
   - Position number badge
   - Avatar or user icon
   - Name and skill level
   - Time joined
   - Highlighted for current user

3. **Queue Card** - Summary card for dashboard
   - Court and venue info
   - Player count
   - Estimated wait time
   - User position (if in queue)
   - Quick navigation

## 🔄 User Flow

### 1. Entering Queue System
**From Court Details Page:**
- User clicks "Queue" button on any court card
- Routes to `/queue/[courtId]`

**From Navigation:**
- User clicks "Queue" in navbar
- Routes to `/queue` dashboard

### 2. Queue Dashboard (`/queue`)
**Your Active Queues Section:**
- Shows all queues user is currently in
- Displays position, wait time, court info
- Empty state: "No Active Queues"

**Available Queues Near You:**
- Shows nearby active queues
- Player count and status
- Join directly from card

**Quick Tips Box:**
- Notification info
- No-penalty cancellation
- Wait time estimation

### 3. Individual Queue Page (`/queue/[courtId]`)
**Header Section:**
- Court name and venue
- Live status badge
- Queue statistics (players, wait time, status)

**Your Position Card** (if in queue):
- Large position number display
- Players ahead count
- Estimated wait time
- Gradient background for prominence

**Players List:**
- Scrollable list of all players in queue
- Ordered by position
- Current user highlighted
- Refresh button

**Join/Leave Section:**
- If not in queue: Shows benefits and Join button
- If in queue: Shows Leave button with warning
- Mobile: Fixed bottom bar with primary action

**Game Assignment** (future):
- Placeholder for match assignment
- Court, players, timer info
- "Start Game" action

## 🔌 Backend Integration Guide

### API Endpoints Needed

```typescript
// Queue Management
GET    /api/queue/:courtId              // Get queue details
POST   /api/queue/:courtId/join         // Join queue
DELETE /api/queue/:courtId/leave        // Leave queue
GET    /api/queue/my-queues             // User's active queues
GET    /api/queue/nearby                // Nearby active queues

// Real-time Updates
WebSocket /ws/queue/:courtId            // Live queue updates
```

### Data Models

```typescript
interface QueuePlayer {
  id: string
  name: string
  avatarUrl?: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  position: number
  joinedAt: Date
}

interface QueueSession {
  id: string
  courtId: string
  courtName: string
  venueName: string
  venueId: string
  status: 'waiting' | 'active' | 'completed'
  players: QueuePlayer[]
  userPosition: number | null
  estimatedWaitTime: number // in minutes
  maxPlayers: number
  currentMatch?: {
    courtName: string
    players: string[]
    startTime: Date
    duration: number
  }
}
```

### Integration Steps

1. **Replace Mock Hooks** (`/web/src/hooks/use-queue.ts`)
   - Uncomment API call sections
   - Remove mock setTimeout blocks
   - Add error handling
   - Implement proper loading states

2. **Add API Client Functions**
   ```typescript
   // Example: /web/src/lib/api/queue.ts
   export async function getQueueDetails(courtId: string) {
     const response = await fetch(`/api/queue/${courtId}`)
     return response.json()
   }
   
   export async function joinQueue(courtId: string) {
     await fetch(`/api/queue/${courtId}/join`, { method: 'POST' })
   }
   
   export async function leaveQueue(courtId: string) {
     await fetch(`/api/queue/${courtId}/leave`, { method: 'DELETE' })
   }
   ```

3. **Implement Real-Time Updates**
   - WebSocket connection for live queue position changes
   - Player join/leave events
   - Match assignment notifications
   
   ```typescript
   // Example WebSocket integration in useQueue hook
   useEffect(() => {
     const ws = new WebSocket(`wss://api.rallio.com/ws/queue/${courtId}`)
     
     ws.onmessage = (event) => {
       const data = JSON.parse(event.data)
       setQueue(data)
     }
     
     return () => ws.close()
   }, [courtId])
   ```

4. **Add Authentication**
   - Include auth tokens in API requests
   - Handle unauthorized states
   - Redirect to login if needed

5. **Error Handling**
   - Network errors
   - Queue full scenarios
   - Already in queue
   - Invalid court ID

## 🧪 Testing Checklist

### Visual Testing
- [ ] Queue dashboard displays correctly on desktop
- [ ] Queue dashboard displays correctly on mobile
- [ ] Individual queue page responsive
- [ ] Player cards show correct info
- [ ] Status badges have correct colors
- [ ] Animations smooth and subtle
- [ ] Loading states visible
- [ ] Empty states display properly

### Functional Testing
- [ ] Navigation to /queue works
- [ ] Navigation to /queue/[courtId] works
- [ ] Queue button on court cards routes correctly
- [ ] Join queue button works
- [ ] Leave queue button works
- [ ] Refresh queue updates data
- [ ] User position updates correctly
- [ ] Mobile bottom bar functions properly

### Integration Testing (When Backend Ready)
- [ ] API calls succeed
- [ ] Real-time updates work
- [ ] Error messages display
- [ ] Queue full prevents joining
- [ ] Already in queue prevents re-joining
- [ ] Leave queue removes user
- [ ] Notifications trigger correctly

## 🚀 Future Enhancements

### Phase 2 Features
1. **Match Making**
   - Auto-assign players to matches
   - Skill-based matching
   - Team formation

2. **Notifications**
   - Push notifications when turn is near
   - SMS alerts (optional)
   - Email summaries

3. **Queue Analytics**
   - Average wait times
   - Peak hours
   - User behavior insights

4. **Social Features**
   - Friend invites to queue
   - Group queuing
   - Player profiles
   - Chat/messaging

5. **Advanced Queue Management**
   - Priority queuing (premium users)
   - Reservation integration
   - Queue time credits
   - No-show penalties

## 🎯 Key Design Decisions

### Why Client Components for Queue Pages?
- Real-time updates require client-side state
- User interactions (join/leave) need immediate feedback
- WebSocket connections need browser APIs
- Server components wrap them for initial data fetch

### Why Mock Hooks First?
- Allows frontend development without backend dependency
- Easy to swap in real API calls later
- Provides clear integration points
- Enables UI/UX testing immediately

### Why Separate Card Components?
- Reusability across dashboard and detail pages
- Easier to maintain consistent styling
- Simple to test independently
- Clean separation of concerns

## 📱 Mobile Optimizations

1. **Fixed Bottom Bar**
   - Primary action always accessible
   - No scrolling to join/leave
   - Consistent with mobile UX patterns

2. **Touch Targets**
   - Minimum 44x44px tap areas
   - Generous padding on interactive elements
   - Swipe-friendly card interactions

3. **Performance**
   - Lazy loading of player lists
   - Optimized images and icons
   - Minimal re-renders
   - Efficient WebSocket updates

## 🎨 Styling Guidelines

### Colors
- Primary: `text-primary`, `bg-primary` (teal/green)
- Status: `text-yellow-700`, `text-green-700`, `text-gray-700`
- Borders: `border-gray-200`
- Backgrounds: `bg-white`, `bg-gray-50`

### Spacing
- Cards: `p-4` to `p-6`
- Gaps: `gap-3` to `gap-4`
- Margins: `mb-4` to `mb-6`

### Rounded Corners
- Cards: `rounded-xl`
- Buttons: `rounded-lg`
- Badges: `rounded-full`

### Shadows
- Hover: `hover:shadow-lg`
- Default: `shadow-sm`
- Elevated: `shadow-lg`

## 🔗 Related Files to Review

- `/web/src/app/(main)/courts/[id]/venue-details-client.tsx` - Where Queue button lives
- `/web/src/components/layout/main-nav.tsx` - Navigation integration
- `/web/src/app/globals.css` - Theme and animations
- `/web/src/lib/utils.ts` - Utility functions (cn for classnames)

## ✅ Deliverables Summary

### Components Created: 3
- PlayerCard
- QueueStatusBadge  
- QueueCard

### Pages Created: 2
- Queue Dashboard (/queue)
- Queue Details (/queue/[courtId])

### Hooks Created: 1
- useQueue (+ useMyQueues, useNearbyQueues)

### Navigation Updated: 1
- Main navbar now includes Queue tab

### Routing
- `/queue` - Dashboard view
- `/queue/[courtId]` - Individual queue view
- Linked from court cards via Queue button

---

**Status**: ✅ Frontend Complete - Ready for Backend Integration

**Next Steps**:
1. Backend team implements queue API endpoints
2. Replace mock hooks with real API calls
3. Add WebSocket connection for live updates
4. Test end-to-end with real data
5. Deploy and monitor queue performance

# Queue System - Quick Reference

## 🎯 Navigation Flow

```
Home → Courts → Court Details
                    ↓
            [Queue Button] → /queue/[courtId]
                                    ↓
                            Queue Details Page
                            - Join/Leave Queue
                            - View Position
                            - See All Players

Navbar → Queue Tab → /queue
                        ↓
                Queue Dashboard
                - Your Active Queues
                - Available Nearby Queues
```

## 🎨 Component Hierarchy

```
Queue Dashboard (/queue)
├── QueueDashboardClient
    ├── Your Active Queues
    │   └── QueueCard (variant="active") × N
    │       └── QueueStatusBadge
    ├── Available Queues Near You
    │   └── QueueCard (variant="available") × N
    │       └── QueueStatusBadge
    └── Tips Section

Queue Details (/queue/[courtId])
├── QueueDetailsClient
    ├── Court Info Header
    │   └── QueueStatusBadge
    ├── Your Position Card (if in queue)
    ├── Players List
    │   └── PlayerCard × N
    ├── Join/Leave Section
    └── Mobile Bottom Bar
```

## 🔌 Backend Integration Checklist

### Step 1: Create API Routes
- [ ] `GET /api/queue/:courtId` - Fetch queue details
- [ ] `POST /api/queue/:courtId/join` - Join queue
- [ ] `DELETE /api/queue/:courtId/leave` - Leave queue
- [ ] `GET /api/queue/my-queues` - User's active queues
- [ ] `GET /api/queue/nearby` - Nearby queues

### Step 2: Update Hook Functions
File: `/web/src/hooks/use-queue.ts`

```typescript
// Find these TODO comments and replace with real API calls:

// Line ~45: useQueue hook - fetchQueue
const fetchQueue = async () => {
  try {
    const response = await fetch(`/api/queue/${courtId}`)
    const data = await response.json()
    setQueue(data)
  } catch (err) {
    setError('Failed to load queue')
  } finally {
    setIsLoading(false)
  }
}
fetchQueue()

// Line ~98: joinQueue function
const joinQueue = async () => {
  try {
    await fetch(`/api/queue/${courtId}/join`, { method: 'POST' })
    await fetchQueue() // Refresh
  } catch (err) {
    setError('Failed to join queue')
  }
}

// Line ~115: leaveQueue function
const leaveQueue = async () => {
  try {
    await fetch(`/api/queue/${courtId}/leave`, { method: 'DELETE' })
    await fetchQueue() // Refresh
  } catch (err) {
    setError('Failed to leave queue')
  }
}
```

### Step 3: Add Real-Time Updates
```typescript
// In useQueue hook, add WebSocket connection
useEffect(() => {
  const ws = new WebSocket(`wss://your-domain.com/ws/queue/${courtId}`)
  
  ws.onmessage = (event) => {
    const updatedQueue = JSON.parse(event.data)
    setQueue(updatedQueue)
  }
  
  ws.onerror = () => setError('Connection lost')
  
  return () => ws.close()
}, [courtId])
```

### Step 4: Add Auth Headers
```typescript
const response = await fetch(`/api/queue/${courtId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## 📱 Testing Commands

```bash
# Start dev server
npm run dev

# Navigate to:
http://localhost:3000/queue              # Dashboard
http://localhost:3000/queue/court-id     # Individual queue

# Test routes from court page:
http://localhost:3000/courts/venue-id    # Click Queue button
```

## 🎨 Key Styling Classes

### Cards
- `bg-white border border-gray-200 rounded-xl p-4`
- `hover:shadow-lg transition-all`

### Buttons
- Primary: `bg-primary text-white rounded-lg hover:bg-primary/90`
- Secondary: `border-2 border-primary text-primary rounded-lg hover:bg-primary/5`

### Status Badges
- Waiting: `bg-yellow-100 text-yellow-700`
- Active: `bg-green-100 text-green-700`
- Completed: `bg-gray-100 text-gray-700`

### Position Display
- Large: `text-5xl font-bold`
- Badge: `w-8 h-8 bg-primary text-white rounded-full`

## 🔄 State Management

### Queue State Structure
```typescript
{
  id: string                    // Queue session ID
  courtId: string               // Court this queue is for
  courtName: string             // Display name
  venueName: string            // Venue display name
  status: 'waiting' | 'active' | 'completed'
  players: [                   // Ordered by position
    {
      id: string
      name: string
      avatarUrl?: string
      skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
      position: number
      joinedAt: Date
    }
  ]
  userPosition: number | null  // null if not in queue
  estimatedWaitTime: number    // in minutes
  maxPlayers: number           // Queue capacity
}
```

## 🚨 Error Scenarios to Handle

1. **Queue Full**: Disable join button, show message
2. **Already in Queue**: Prevent duplicate join
3. **Queue Not Found**: Show error state with retry
4. **Network Error**: Display connection lost message
5. **Auth Required**: Redirect to login
6. **Permission Denied**: Show access denied

## 📊 Mock Data vs Real Data

### Current (Mock)
- 3 sample players in queue
- Fixed wait times
- Hardcoded venue/court names
- No real position updates

### After Backend Integration
- Real player data from database
- Dynamic wait time calculations
- Actual venue/court info
- Live position updates via WebSocket
- Real user authentication

## ✅ Completion Checklist

### Frontend (✅ Complete)
- [✅] Queue dashboard page
- [✅] Queue details page
- [✅] Player cards with animations
- [✅] Status badges
- [✅] Queue cards
- [✅] Navigation integration
- [✅] Mobile responsive design
- [✅] Mock hooks ready
- [✅] Loading states
- [✅] Empty states
- [✅] Error handling UI

### Backend (⏳ Pending)
- [ ] Database schema for queues
- [ ] API endpoints
- [ ] WebSocket server
- [ ] Queue logic (join/leave)
- [ ] Position calculation
- [ ] Wait time estimation
- [ ] Notification system
- [ ] Match assignment logic

---

**Ready to integrate!** 🚀

Replace TODO sections in `/web/src/hooks/use-queue.ts` with real API calls when backend is ready.

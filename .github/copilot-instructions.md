# Rallio - AI Coding Agent Instructions

Badminton Court Finder & Queue Management System for Zamboanga City, Philippines.

## Essential Context

**Always read first:**
- `CLAUDE.md` - Debugging methodology, common issues, recent fixes
- `docs/planning.md` - Development phases and current status
- `docs/tasks.md` - Task tracking and progress

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Supabase (PostgreSQL + Auth), PayMongo, Leaflet, Zustand, React Hook Form + Zod

## Monorepo Structure

```
rallio/
├── shared/          # Types, validations, utils - shared across web/mobile
├── web/             # Next.js 16 web app (primary platform)
├── mobile/          # React Native + Expo 54 (in development)
├── backend/supabase/ # Database migrations, edge functions
└── docs/            # Documentation and planning
```

**Path aliases:** `@/*` → `./src/*`, `@rallio/shared` → `../shared/src`

## Critical Patterns

### Supabase Client Creation

**Web has THREE client types - use the right one:**

```typescript
// 1. Browser client - for client components
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// 2. Server client - for server components/actions (respects RLS)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// 3. Service client - ADMIN ONLY, bypasses RLS
import { createServiceClient } from '@/lib/supabase/server'
const supabase = createServiceClient() // Requires SUPABASE_SERVICE_ROLE_KEY
```

**Never use service client for user operations - it bypasses security policies.**

### Database Triggers & Patterns

**Profile creation is AUTOMATIC:**
- `handle_new_user()` trigger creates `profiles` and `players` records on signup
- **Never manually insert profiles after `supabase.auth.signUp()`**
- For OAuth: If trigger fails, RLS policy allows user to insert their own player record

**Geospatial queries:**
```typescript
// Use PostGIS function for nearby venue search - don't calculate distance client-side
const { data } = await supabase.rpc('nearby_venues', {
  lat: latitude,
  lng: longitude,
  radius_km: 10,
  limit: 20
})
```

### Server Actions & Cache Invalidation

**Pattern for profile/data updates:**
```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(data: ProfileUpdate) {
  const supabase = await createClient()
  await supabase.from('profiles').update(data)
  
  revalidatePath('/profile') // Critical: Clear Next.js cache
  return { success: true }
}
```

**Client-side after update:**
```typescript
await updateProfile(data)
router.refresh() // Force refetch server components
```

### Leaflet Map Components

**Maps don't support SSR - always use dynamic import:**
```typescript
import dynamic from 'next/dynamic'

const VenueMap = dynamic(() => import('@/components/map/venue-map'), {
  ssr: false, // Critical: Leaflet crashes on server-side render
  loading: () => <LoadingSpinner />
})
```

**Wrap in ErrorBoundary for crash protection.**

## Database Migrations

**❌ NEVER use Supabase SQL Editor for schema changes!**

**✅ Correct workflow:**
```bash
cd backend/supabase

# Create new migration
supabase migration new feature_name

# Apply to database
supabase db push --linked

# Mark manually-applied migrations (one-time fix)
supabase migration repair --status applied 001_initial_schema_v2
```

**24 migrations applied (001-024).** Check `backend/supabase/migrations/` for history.

## PayMongo Integration

**Payment Flow:** Create Source → User pays via QR → Webhook confirms → Create Payment → Update reservation

**Critical implementation details:**
```typescript
// 1. Source creation (payment method selection)
const source = await paymongo.createSource({
  type: 'gcash', // or 'paymaya', 'grab_pay'
  amount: totalAmount * 100, // Convert to cents
  currency: 'PHP',
  redirect: {
    success: `${APP_URL}/checkout/success`,
    failed: `${APP_URL}/checkout/failed`
  }
})

// 2. Payment creation (AFTER source is chargeable)
const payment = await paymongo.createPayment({
  amount: amount * 100,
  currency: 'PHP',
  source: {
    id: sourceId,
    type: 'source' // ⚠️ ALWAYS literal 'source', NOT payment method type
  }
})
```

**Webhook signature verification (Fixed Nov 2025):**
```typescript
// PayMongo uses te= (test) and li= (live) fields, NOT s=
const parts = signatureHeader.split(',')
const timestampPart = parts.find(p => p.startsWith('te=') || p.startsWith('li='))
const signaturePart = parts.find(p => p.startsWith('te=') || p.startsWith('li='))
```

**Webhook file:** `/web/src/app/api/webhooks/paymongo/route.ts` (1049 lines)

## User Roles & Permissions

Four roles with distinct interfaces:
1. **Player** - Book courts, join queues, rate venues
2. **Queue Master** - Create/manage queue sessions, assign matches
3. **Court Admin** - Manage venue/courts, handle reservations, pricing
4. **Global Admin** - Platform management, user moderation, analytics

**Check role in components:**
```typescript
const hasRole = user.roles?.some(r => r.role === 'court_admin')
```

## Queue System Architecture

**Session States:** `open` → `active` → `paused` → `completed` | `cancelled`
**Participant States:** `waiting` → `playing` → `completed` | `left`
**Approval Workflow:** Queue Masters must get Court Admin approval (added in migration 012)

**Real-time updates:**
```typescript
// Subscribe to queue changes
const subscription = supabase
  .channel('queue-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'queue_participants'
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe()
```

**Key files:**
- `/web/src/components/queue/` - User-facing queue components
- `/web/src/components/queue-master/` - Queue Master management UI
- `/web/src/app/actions/queue-*.ts` - Server actions

## Common Issues & Solutions

### "Profile not found" after Google OAuth
**Root cause:** Trigger didn't run or RLS policy blocked insert
**Fix:** RLS policy allows `INSERT` with `auth.uid() = user_id`. Server action auto-creates player if missing.

### Map shows white screen
**Root cause:** Leaflet doesn't support SSR
**Fix:** Use `dynamic(() => import(), { ssr: false })` and wrap in ErrorBoundary

### Profile completion banner persists
**Root cause:** Next.js cache not invalidated
**Fix:** Use `revalidatePath()` in server action + `router.refresh()` client-side

### PayMongo webhook returns 401
**Root cause:** Incorrect signature parsing (was looking for `s=`, should use `te=`/`li=`)
**Fix:** Already fixed in `/web/src/app/api/webhooks/paymongo/route.ts`

### Double booking despite exclusion constraint
**Root cause:** Race condition, but constraint catches it
**Fix:** Handle error code `23P01` (exclusion_violation) gracefully in UI

## Development Commands

```bash
# Root workspace
npm run dev:web          # Start web dev server (port 3000)
npm run build:web        # Production build
npm run lint             # Lint all workspaces
npm run typecheck        # TypeScript check across all packages

# Web-specific
cd web
npm run dev              # Next.js dev server
npm run dev:3001         # Run on port 3001 (testing webhooks)

# Database
cd backend/supabase
supabase migration new name   # Create new migration
supabase db push --linked     # Apply migrations
supabase migration list       # Check migration status
```

## Environment Variables

**Web (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-side only, bypasses RLS
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=
PAYMONGO_SECRET_KEY=              # Server-side only
PAYMONGO_WEBHOOK_SECRET=          # Required for signature verification
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Debugging Methodology

From `CLAUDE.md` - **Follow this process:**

1. **Observe** - Read logs carefully, identify patterns
2. **Add comprehensive logging** - Log at every critical step with emoji markers (🚨, ✅, ❌, 🔍)
3. **Isolate** - Narrow down to specific file/function/line
4. **Research** - Check API docs, type definitions, similar code
5. **Fix precisely** - One change at a time, validate assumptions
6. **Verify** - Test thoroughly, check side effects, update docs

**Example logging pattern:**
```typescript
console.log('🚨 [FunctionName] Starting critical operation')
console.log('🔍 [FunctionName] Input:', { id, status, data })
console.log('✅ [FunctionName] Success:', result)
console.log('❌ [FunctionName] Error:', error)
```

## Recent Work (Dec 2025)

**Completed:**
- ✅ Platform settings system (migration 024)
- ✅ Global Admin dashboard with analytics
- ✅ Court Admin multi-venue support (VenueSelector component)
- ✅ In-app notification system with real-time subscriptions
- ✅ Queue approval workflow (Queue Master → Court Admin)
- ✅ Content moderation system

**Current Branch:** `feature/global-admin-dashboard`

**Next priorities:** See `docs/tasks.md` for current task list

## Key Documentation Files

- `CLAUDE.md` - Full project guidelines (523 lines)
- `docs/planning.md` - Development phases and status
- `docs/tasks.md` - Granular task tracking
- `VERIFICATION-PHASES-1-2-3.md` - Testing and verification reports
- `QUEUE_SYSTEM_STATUS.md` - Queue feature completeness
- `backend/supabase/MIGRATION_GUIDE.md` - Database migration best practices

---

**When in doubt:** Read `CLAUDE.md` for detailed patterns, check `docs/tasks.md` for progress, and search existing code for similar implementations before creating new patterns.

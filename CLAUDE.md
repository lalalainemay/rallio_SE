# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Rules

**Before starting any coding task, ALWAYS check these documentation files first:**
1. `CLAUDE.md` - This file for project guidelines and patterns
2. `docs/planning.md` - Development phases and approach
3. `docs/tasks.md` - Current tasks and progress tracking
4. `docs/system-analysis/` - Feature specifications and database schema

This ensures you understand:
- What has already been completed
- What tasks are currently in progress
- The project's architecture and conventions
- Any specific implementation details or constraints

**After completing any task or answering a question:**
- Check `docs/tasks.md` for the current progress
- Suggest what to do next based on the task list
- Offer to continue with the next logical task or let the user choose

## Project Overview

Rallio is a Badminton Court Finder & Queue Management System for Zamboanga City, Philippines. It's a full-stack monorepo with web (Next.js), mobile (React Native/Expo), and backend (Supabase/PostgreSQL) applications.

**Key Files to Reference:**
- `docs/planning.md` - Development phases and approach
- `docs/tasks.md` - Current tasks and progress tracking

## Commands

### Root Level (Workspace)
```bash
npm install              # Install all workspace dependencies
npm run dev:web          # Start web development server
npm run dev:mobile       # Start mobile Expo server
npm run build:web        # Production build for web
npm run lint             # Lint entire project
npm run format           # Format code with Prettier
npm run typecheck        # TypeScript type checking
```

### Web Application (`/web`)
```bash
npm run dev --workspace=web      # Start development server (localhost:3000)
npm run build --workspace=web    # Production build
npm run lint --workspace=web     # Run ESLint
```

### Mobile Application (`/mobile`)
```bash
npm run start --workspace=mobile    # Start Expo dev server
npm run android --workspace=mobile  # Run on Android emulator
npm run ios --workspace=mobile      # Run on iOS simulator
```

## Architecture

### Monorepo Structure
```
rallio/
├── shared/          # Shared types, validations, utilities
├── web/             # Next.js 16 web application
├── mobile/          # React Native + Expo 54 mobile app
├── backend/         # Supabase migrations & edge functions
└── docs/            # Documentation, planning, tasks
```

### Tech Stack
- **Web**: Next.js 16.0.3, React 19.1, TypeScript 5, Tailwind CSS 4, Zustand, React Hook Form + Zod, Leaflet + React Leaflet
- **Mobile**: React Native 0.81.5, React 19.1, Expo 54, Expo Router, react-native-maps, expo-location, expo-notifications, Zustand
- **Backend**: Supabase Auth (JWT), PostgreSQL with PostGIS extensions, Supabase Edge Functions
- **Payments**: PayMongo integration (GCash, Maya, QR codes)
- **Shared**: Types, Zod validations, utility functions (date-fns)

**Note:** TanStack Query (React Query) is installed but not currently used. All data fetching is done through direct Supabase client calls.

### Database
- 27-table PostgreSQL schema in `backend/supabase/migrations/001_initial_schema_v2.sql`
- Uses UUID primary keys, geospatial indexing (PostGIS), JSONB metadata columns
- Core entities: users, roles, players, venues, courts, reservations, queue sessions, payments, ratings

### Key Integrations
- **Supabase**: Auth, database, edge functions, real-time subscriptions
- **Leaflet**: Interactive maps with OpenStreetMap tiles for court discovery and location-based search
- **PayMongo**: Payment processing with QR code generation (GCash, Maya)

## Code Patterns

### Imports & Path Aliases
- Web: `@/*` → `./src/*`, `@rallio/shared` → `../shared/src`
- Mobile: `@/*` → `./src/*`, `@rallio/shared` → `../shared/src`

### Form Handling
- React Hook Form + Zod validation with `@hookform/resolvers`
- Shared validations in `shared/src/validations/`

### State Management
- Zustand for client state (web & mobile)
- Supabase client for server state (web & mobile)

### Styling
- Web: Tailwind CSS 4 with CSS variables for theming
- Mobile: React Native StyleSheet with shared color constants

### Database Conventions
- `created_at`, `updated_at` audit columns on all tables
- `is_active` boolean for soft deletes
- `metadata` JSONB for flexible extensibility
- UUID primary keys with `gen_random_uuid()`

### Map Implementation (Leaflet)
- **SSR Constraint**: Leaflet doesn't support server-side rendering
  - Use `dynamic()` import with `ssr: false` for all map components
  - Example: `const VenueMap = dynamic(() => import('./venue-map'), { ssr: false })`
- **Error Handling**: Wrap map components in `ErrorBoundary` for crash protection
- **Custom Markers**: Use Leaflet `divIcon` for custom price markers and user location
- **Clustering**: Custom marker clustering implementation (not using react-leaflet-markercluster)
- **Tiles**: OpenStreetMap tiles (no API key required)

### Database Triggers & Patterns
- **Automatic Profile Creation**: `handle_new_user()` trigger runs on `auth.users` INSERT
  - Automatically creates `profiles` and `players` records
  - Assigns default "player" role via `user_roles` table
  - **IMPORTANT**: Never manually insert profiles after signup - let the trigger handle it
- **Geospatial Queries**: Use `nearby_venues(lat, lng, radius_km, limit)` RPC function
  - Server-side PostGIS distance calculations
  - Returns venues sorted by proximity
  - More efficient than client-side distance calculations

### Profile Completion Flow
- Tracked via `profile_completed` boolean flag in `profiles` table
- Setup profile page at `/setup-profile` with skip option
- `ProfileCompletionBanner` component shows reminder on home page
- **Cache Management**: Always call `router.refresh()` after updating `profile_completed`
- Server actions with `revalidatePath()` ensure immediate UI updates

## Project Structure

### Shared (`/shared/src`)
- `types/index.ts` - All shared TypeScript types (User, Court, Venue, Reservation, etc.)
- `validations/index.ts` - Zod schemas for auth, profiles, courts, reservations, queues, ratings
- `utils/index.ts` - Utility functions (date formatting, currency, distance calculations, ELO)

### Web (`/web/src`)
- `app/` - Next.js App Router pages
- `components/ui/` - Base UI components (shadcn/ui pattern)
- `components/checkout/` - Payment and checkout flow components
- `components/map/` - Map-related components (VenueMap, marker clustering)
- `components/venue/` - Venue display components (ImageGallery, etc.)
- `components/error-boundary.tsx` - Global error boundary for crash protection
- `lib/supabase/` - Supabase client (browser, server, middleware)
- `lib/api/` - API client functions (venues, courts data fetching)
- `lib/utils.ts` - cn() utility for class names
- `hooks/` - Custom React hooks
- `stores/` - Zustand stores
- `types/` - Web-specific types
- `constants/` - Configuration constants

### Mobile (`/mobile/src`)
- `services/` - API clients (Supabase)
- `hooks/` - Custom React Native hooks
- `store/` - Zustand stores
- `types/` - Mobile-specific types
- `constants/` - Configuration and colors
- `utils/` - Mobile helper functions

## Environment Variables

### Web (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=
PAYMONGO_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** The project uses Leaflet with OpenStreetMap tiles (no API key required). Mapbox token is not needed for current implementation.

### Mobile (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY=
```

## User Roles

The system has four user roles with different permissions:
1. **Player** - Find courts, join queues, make reservations, rate courts/players
2. **Queue Master** - Manage queue sessions, assign players to games, handle disputes
3. **Court Admin** - Manage venue/courts, handle reservations, set pricing
4. **Global Admin** - Platform-wide management, user management, analytics

## Key Documentation

- `docs/planning.md` - Development phases and approach
- `docs/tasks.md` - Current tasks and progress
- `docs/system-analysis/rallio-system-analysis.md` - Complete feature specifications
- `docs/system-analysis/rallio-database-schema.sql` - Full database schema
- `docs/system-analysis/prototype-analysis.md` - UI/UX gap analysis

## Common Issues & Solutions

### Map Components Showing White Screen
**Cause:** Leaflet doesn't support server-side rendering in Next.js
**Solution:** Use `dynamic()` import with `ssr: false`:
```typescript
const VenueMap = dynamic(() => import('@/components/map/venue-map'), { ssr: false })
```
Also wrap in `ErrorBoundary` component for better error handling.

### Profile Completion Banner Persisting
**Cause:** Next.js caching stale `profile_completed` data
**Solution:**
- Use server actions with `revalidatePath()` for profile updates
- Call `router.refresh()` after updating profile
- Set `dynamic = 'force-dynamic'` on pages that check profile completion

### Player Profile Not Initialized (Google OAuth)
**Cause:** Database trigger `handle_new_user()` didn't run for OAuth signup
**Solution:**
- Apply RLS INSERT policy: `CREATE POLICY "Users can insert own player profile" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);`
- Server action will automatically create player record if missing

### Slow Venue Search Queries
**Cause:** Client-side distance calculations for all venues
**Solution:** Use the `nearby_venues(lat, lng, radius_km, limit)` PostGIS function for server-side distance sorting

### Duplicate Profile Insert Errors
**Cause:** Manually inserting profiles after `supabase.auth.signUp()`
**Solution:** Remove manual profile inserts - the `handle_new_user()` trigger handles this automatically

## Recent Database Migrations

Beyond the initial schema (`001_initial_schema_v2.sql`), the following migrations have been applied:

- **`002_add_players_insert_policy.sql`** - Adds RLS INSERT policy for players table (fixes Google OAuth signup issues)
- **`002_add_nearby_venues_function.sql`** - PostGIS function for efficient radius-based venue search
- **`003_fix_court_availabilities.sql`** - Adds computed `date` column for easier availability queries

## Development Status

### Phase 1: Foundation & Authentication ✅ Complete
- Email/password and Google OAuth authentication
- Profile setup with skip option
- Database triggers for automatic profile/player creation
- RLS policies for secure data access
- Avatar upload to Supabase Storage

### Phase 2: Court Discovery & Display 🚧 In Progress
- ✅ Court listing page with filters
- ✅ Map view with Leaflet integration
- ✅ Venue detail pages with image galleries
- ✅ Geospatial search with PostGIS
- 🚧 Booking flow implementation

### Next: Phase 3 - Reservations & Payments
- Reservation creation and management
- Payment integration with PayMongo
- QR code generation for payments

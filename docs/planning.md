# Rallio Development Planning

## Vision

Build a comprehensive Badminton Court Finder & Queue Management System for Zamboanga City, Philippines, starting with core functionality and expanding to advanced features.

## Development Phases

### Phase 1: Foundation & Core Auth ✅ COMPLETE
**Goal:** Establish project infrastructure and authentication system

- [x] Project scaffolding and monorepo setup
- [x] Shared types, validations, and utilities
- [x] Web folder structure (components, hooks, stores, lib)
- [x] Mobile folder structure (services, hooks, store)
- [x] Database schema design (27 tables)
- [x] Supabase project setup and migration
	- ✅ V2 schema applied via `supabase db push`
	- ✅ Database confirmed up to date
	- ✅ All tables created with RLS policies
	- ✅ Sample data inserted (2 venues, 8 courts)
- [x] Authentication flow (signup, login, forgot password)
	- ✅ Supabase Auth integrated
	- ✅ Google OAuth supported
	- ✅ Auto-profile creation via triggers
	- ✅ Fixed users→profiles table references
- [x] User profile management
	- ✅ Profile onboarding flow complete
	- ✅ Avatar upload to Supabase Storage
- [x] Player profile with skill level
	- ✅ Skill level selection (1-10)
	- ✅ Play styles, birth date, gender

### Phase 2: Court Discovery & Display - 85% COMPLETE ✅
**Goal:** Allow players to find and view courts

- [x] Venue and court data models (API client in `/lib/api/`)
- [x] Court listing page with filters (`/courts/page.tsx`)
- [x] Leaflet integration for location-based search (OpenStreetMap tiles)
- [x] Court detail page with amenities, pricing, photos (`/courts/[id]/page.tsx`)
- [x] Distance calculation and sorting (PostGIS `nearby_venues()` function)
- [x] Court availability calendar (integrated into booking flow)
- [ ] Enhanced filtering (price range sliders, amenity checkboxes)
- [ ] Mobile implementation

**Key Achievements:**
- Leaflet map with custom markers and clustering
- PostGIS geospatial queries for efficient radius search
- Dynamic venue detail pages with image galleries
- SSR handling for client-only map components

### Phase 3: Reservations & Payments - 85% COMPLETE ✅
**Goal:** Enable court booking and payment processing

- [x] Reservation creation flow (`/courts/[id]/book/`)
- [x] Time slot selection with conflict prevention
  - Calendar UI component with date picker
  - TimeSlotGrid component with real-time availability
  - Database exclusion constraint prevents double booking
- [x] PayMongo integration (GCash, Maya)
  - Custom PayMongo client library (`/lib/paymongo/`)
  - Payment source creation (GCash, Maya)
  - Checkout URL generation with QR codes
- [x] Payment confirmation webhooks (`/api/webhooks/paymongo/`)
  - Handles `source.chargeable`, `payment.paid`, `payment.failed`
  - ✅ **Fixed webhook signature verification** (uses `te=` and `li=` fields)
  - ✅ **Fixed source.type** (uses literal `'source'` instead of payment method)
  - Idempotency handling for duplicate events
  - Webhooks now properly accept with 200 status
  - Payment flow fully functional: pending → completed
- [x] Booking management pages (`/bookings`, `/reservations`)
- [x] Cancellation flow (server action)
- [x] Database-level double booking prevention (migration 004)
  - Exclusion constraint using btree_gist
  - Validation triggers
  - Active reservations and payment summary views
- [x] Payment expiration function (15-minute timeout)
- [x] Home page enhancements
  - "Queue" button linking to `/queue`
  - Real venue data for "Suggested Courts" section
  - Geolocation-based "Near You" section
  - "Active Queues Nearby" section
- [ ] Payment receipt email notifications
- [ ] Booking reminder notifications
- [ ] Split payment system backend implementation
- [ ] Refund flow for cancellations
- [ ] Payment expiration automation (Edge Function/cron job)
- [ ] QR code image generation (currently using PayMongo URLs)

**Key Achievements:**
- Complete booking flow from court selection to payment
- Robust double booking prevention at database level
- ✅ **Fully functional PayMongo webhook integration** with proper signature verification
- ✅ **Payment status updates working correctly** (pending → completed → confirmed)
- Real-time availability checking
- Split payment database schema ready (UI partial, backend incomplete)
- Enhanced home page with real venue data and geolocation

**Technical Debt & Known Issues:**
- Migration 005 (RLS policies) created but not applied
- Payment expiration function exists but not automated (needs scheduled job)
- Split payment UI designed but backend logic incomplete
- No email/SMS notifications yet
- Cash payment handling not implemented

### Phase 4: Queue Management
**Goal:** Real-time queue sessions for pickup games

- [ ] Queue session creation (Queue Master)
- [ ] Player join/leave queue
- [ ] Real-time queue updates (Supabase Realtime)
- [ ] Skill-based team balancing algorithm
- [ ] Game assignment and tracking
- [ ] Per-game cost calculation
- [ ] Session closure and summary

### Phase 5: Ratings & Reviews
**Goal:** Build trust through ratings

- [ ] Court rating system (quality, cleanliness, facilities, value)
- [ ] Player rating system (sportsmanship, skill, reliability)
- [ ] Review moderation
- [ ] Venue owner response to reviews
- [ ] Rating analytics and trends

### Phase 6: Admin Dashboards
**Goal:** Management interfaces for all roles

- [ ] Court Admin dashboard (reservations, pricing, analytics)
- [ ] Queue Master dashboard (session management)
- [ ] Global Admin dashboard (platform management)
- [ ] Dynamic pricing configuration
- [ ] Discount and promo code management

### Phase 7: Notifications & Communication
**Goal:** Keep users informed

- [ ] Push notifications (FCM)
- [ ] Email notifications (SendGrid)
- [ ] In-app notification center
- [ ] Queue turn alerts
- [ ] Payment confirmations
- [ ] Booking reminders

### Phase 8: Mobile App Polish
**Goal:** Full-featured mobile experience

- [ ] Mobile auth flows
- [ ] Mobile court discovery with maps
- [ ] Mobile reservations
- [ ] Mobile queue participation
- [ ] Mobile profile and stats

### Phase 9: Advanced Features
**Goal:** AI and advanced functionality

- [ ] AI-powered court recommendations
- [ ] Player auto-matching improvements
- [ ] Analytics dashboards
- [ ] Performance optimization
- [ ] Advanced search (Elasticsearch)

### Phase 10: Launch Preparation
**Goal:** Production readiness

- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation completion
- [ ] Beta testing with real venues
- [ ] Production deployment
- [ ] Monitoring and error tracking

## Technical Approach

### API Strategy
- Use Supabase for auth, database, and real-time
- Edge functions for complex business logic
- PayMongo webhooks for payment confirmation

### Real-time Strategy
- Supabase Realtime for queue updates
- Optimistic UI updates for better UX
- Reconnection handling for mobile

### Mobile Strategy
- Expo Router for navigation
- Shared business logic with web via shared package
- Native maps and location services

### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for API flows
- E2E tests for critical user journeys

## Success Metrics

- User registration and retention
- Court bookings per week
- Queue session participation
- Payment completion rate
- Average court rating
- App store ratings (mobile)
m
## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Real-time sync issues | Fallback to polling, conflict resolution |
| Payment failures | Retrys
| Low venue adoption | Free tier, comprehensive onboarding |
| Performance issues | Caching, pagination, lazy loading |
| Security breaches | Regular audits, encryption, RBAC |

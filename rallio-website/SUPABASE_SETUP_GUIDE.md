
# 🚀 Rallio Supabase Setup Guide

Complete guide to setting up and using Supabase with your Rallio application.

---

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Database Schema](#database-schema)
3. [Authentication](#authentication)
4. [API Usage Examples](#api-usage-examples)
5. [Real-time Features](#real-time-features)
6. [Security & RLS](#security--rls)
7. [Testing](#testing)

---

## Initial Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (or use existing)
4. Create a new project:
   - **Project name:** `rallio` (or your choice)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Start with Free tier

### 2. Get Your API Keys

Once your project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://your-project-id.supabase.co`
   - **anon/public key:** Starts with `eyJhbGc...`
   - **service_role key:** (Optional, for admin operations)

### 3. Configure Environment Variables

1. Create `.env.local` in your project root:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important:** Add `.env.local` to `.gitignore` (already done)

### 4. Run Database Migrations

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click "New query"
4. Copy the contents of `supabase/schema.sql`
5. Paste and click "Run"
6. Wait for success message ✅

---

## Database Schema

### Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User profiles extending auth.users | Skill level, stats, avatar |
| `courts` | Badminton/Tennis courts | Geolocation, ratings, hours |
| `queue_sessions` | Active queue sessions | Real-time, max players |
| `queue_entries` | Individual queue positions | Position tracking, status |
| `games` | Game history | Scores, winners, duration |
| `court_reviews` | Court ratings & reviews | 1-5 stars, comments |

### Entity Relationship Diagram

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ├── courts (1:many) - owner
    ├── queue_sessions (1:many) - creator
    ├── queue_entries (1:many) - participant
    ├── games (1:many) - player
    └── court_reviews (1:many) - reviewer

courts
    ├── queue_sessions (1:many)
    ├── games (1:many)
    └── court_reviews (1:many)

queue_sessions
    └── queue_entries (1:many)
```

### Key Features

#### 1. **Geolocation** (PostGIS)
- Stores latitude/longitude for courts
- `nearby_courts(lat, lng, radius_meters)` function
- Efficient spatial indexing

#### 2. **Row Level Security (RLS)**
- All tables have RLS enabled
- Users can only modify their own data
- Public read access where appropriate

#### 3. **Automatic Timestamps**
- `created_at` and `updated_at` auto-maintained
- Triggers update timestamps on changes

#### 4. **Auto Profile Creation**
- Profiles automatically created on signup
- Uses auth.users metadata

---

## Authentication

### Setup (Already Done ✅)

- ✅ Supabase client configured
- ✅ AuthProvider wraps app
- ✅ useAuth hook available
- ✅ Middleware for protected routes
- ✅ OAuth callback route

### Using Authentication

#### Login with Email/Password

```tsx
import { useAuth } from "@/lib/hooks/useAuth";

function LoginComponent() {
  const { signIn, loading, user } = useAuth();

  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    if (error) {
      console.error(error.message);
    } else {
      // User logged in, will redirect to /dashboard
    }
  };

  return (
    // Your login form
  );
}
```

#### Sign Up

```tsx
const { signUp } = useAuth();

const handleSignUp = async () => {
  const { error } = await signUp(email, password, {
    full_name: "John Doe",
    avatar_url: "https://..."
  });

  if (!error) {
    // Check email for confirmation
  }
};
```

#### Google OAuth

```tsx
const { signInWithGoogle } = useAuth();

const handleGoogleLogin = async () => {
  await signInWithGoogle();
  // User will be redirected to Google, then back to /auth/callback
};
```

#### Sign Out

```tsx
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut(); // Redirects to /login
};
```

#### Check Auth State

```tsx
const { user, loading } = useAuth();

if (loading) return <div>Loading...</div>;

if (!user) {
  return <div>Please log in</div>;
}

return <div>Welcome {user.email}!</div>;
```

---

## API Usage Examples

### Fetching Data

#### Get All Courts

```tsx
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const { data: courts, error } = await supabase
  .from("courts")
  .select("*")
  .eq("status", "active")
  .order("name");

if (error) console.error(error);
```

#### Get Courts with Reviews

```tsx
const { data, error } = await supabase
  .from("courts")
  .select(`
    *,
    court_reviews (
      rating,
      comment,
      profiles (
        full_name,
        avatar_url
      )
    )
  `)
  .eq("status", "active");
```

#### Find Nearby Courts

```tsx
const { data, error } = await supabase
  .rpc("nearby_courts", {
    lat: 6.9214,
    lng: 122.0790,
    radius_meters: 5000
  });

// Returns courts sorted by distance
```

#### Get User Profile

```tsx
const { user } = useAuth();

const { data: profile, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();
```

### Creating Data

#### Create a Court

```tsx
const { data, error } = await supabase
  .from("courts")
  .insert({
    name: "Sunshine Badminton Court",
    address: "123 Main St, Zamboanga City",
    latitude: 6.9214,
    longitude: 122.0790,
    total_courts: 4,
    hourly_rate: 300,
    amenities: ["parking", "restroom", "water"],
    opening_time: "06:00:00",
    closing_time: "22:00:00",
    owner_id: user.id
  })
  .select()
  .single();
```

#### Join a Queue

```tsx
// Get next position
const { data: nextPos } = await supabase
  .rpc("get_next_queue_position", {
    p_session_id: sessionId
  });

// Join queue
const { data, error } = await supabase
  .from("queue_entries")
  .insert({
    session_id: sessionId,
    user_id: user.id,
    position: nextPos
  })
  .select()
  .single();
```

### Updating Data

#### Update Profile

```tsx
const { error } = await supabase
  .from("profiles")
  .update({
    full_name: "Jane Doe",
    skill_level: 5,
    phone: "+63 123 456 7890"
  })
  .eq("id", user.id);
```

#### Leave Queue

```tsx
const { error } = await supabase
  .from("queue_entries")
  .delete()
  .eq("id", entryId)
  .eq("user_id", user.id); // RLS ensures user owns this
```

---

## Real-time Features

### Subscribe to Queue Updates

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function QueueComponent({ sessionId }: { sessionId: string }) {
  const [queueEntries, setQueueEntries] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    // Fetch initial data
    const fetchQueue = async () => {
      const { data } = await supabase
        .from("queue_entries")
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            skill_level
          )
        `)
        .eq("session_id", sessionId)
        .order("position");

      setQueueEntries(data || []);
    };

    fetchQueue();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`queue_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "queue_entries",
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log("Queue updated:", payload);
          fetchQueue(); // Refresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return (
    <div>
      <h2>Queue ({queueEntries.length} players)</h2>
      {queueEntries.map((entry, index) => (
        <div key={entry.id}>
          {index + 1}. {entry.profiles.full_name}
        </div>
      ))}
    </div>
  );
}
```

### Subscribe to New Courts

```tsx
useEffect(() => {
  const channel = supabase
    .channel("courts_channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "courts"
      },
      (payload) => {
        console.log("New court added:", payload.new);
        // Update your UI
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Security & RLS

### Row Level Security (RLS)

All tables have RLS enabled. Here's what users can do:

#### Profiles
- ✅ Everyone can view all profiles
- ✅ Users can create their own profile (auto-created)
- ✅ Users can update only their own profile
- ❌ Users cannot delete profiles

#### Courts
- ✅ Everyone can view active courts
- ✅ Authenticated users can create courts
- ✅ Court owners can update their courts
- ❌ Only owners can modify courts

#### Queue Entries
- ✅ Everyone can view queue entries
- ✅ Authenticated users can join queues
- ✅ Users can update/delete only their own entries

### Protecting Routes (Middleware)

Protected routes (already configured):
- `/dashboard`
- `/profile`
- `/courts`
- `/queues`

Unauthenticated users are redirected to `/login`.

To add more protected routes:

```typescript
// src/lib/supabase/middleware.ts
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/courts",
  "/queues",
  "/your-new-route" // Add here
];
```

---

## Testing

### 1. Test Authentication

```bash
npm run dev
```

1. Go to http://localhost:3000/login
2. Try logging in (should show error if no users exist)
3. Create a test user in Supabase Dashboard:
   - Go to **Authentication** → **Users**
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Click "Create user"
4. Try logging in again with test credentials

### 2. Enable Google OAuth (Optional)

1. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Find "Google"
   - Toggle "Enable"

2. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project (or use existing)
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`

3. Add credentials to Supabase:
   - Paste Client ID
   - Paste Client Secret
   - Save

4. Test Google login on your site!

### 3. Test Database Queries

Create a test page:

```tsx
// src/app/test/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestPage() {
  const [courts, setCourts] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchCourts = async () => {
      const { data, error } = await supabase
        .from("courts")
        .select("*");

      if (error) {
        console.error(error);
      } else {
        setCourts(data || []);
      }
    };

    fetchCourts();
  }, []);

  return (
    <div>
      <h1>Test Courts</h1>
      <pre>{JSON.stringify(courts, null, 2)}</pre>
    </div>
  );
}
```

---

## Common Patterns

### Server Components (Fetch Data)

```tsx
// app/courts/page.tsx
import { createClient } from "@/lib/supabase/server";

export default async function CourtsPage() {
  const supabase = await createClient();

  const { data: courts } = await supabase
    .from("courts")
    .select("*")
    .eq("status", "active");

  return (
    <div>
      {courts?.map((court) => (
        <div key={court.id}>{court.name}</div>
      ))}
    </div>
  );
}
```

### Client Components (Real-time)

```tsx
// components/live-queue.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LiveQueue({ sessionId }: { sessionId: string }) {
  const [entries, setEntries] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    // ... real-time subscription code
  }, [sessionId]);

  return <div>...</div>;
}
```

### React Query Integration

```tsx
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

function useCourts() {
  return useQuery({
    queryKey: ["courts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      return data;
    }
  });
}

// Usage
const { data: courts, isLoading, error } = useCourts();
```

---

## Troubleshooting

### "Invalid API key"
- Check `.env.local` has correct values
- Restart dev server: `npm run dev`
- Ensure `.env.local` is in project root

### "Row Level Security policy violation"
- Check RLS policies in Supabase Dashboard
- Ensure user is authenticated
- Verify user owns the resource

### "Function does not exist"
- Run `supabase/schema.sql` in SQL Editor
- Check function names match exactly

### Google OAuth not working
- Verify redirect URI in Google Console
- Check OAuth credentials in Supabase
- Ensure `auth/callback/route.ts` exists

---

## Next Steps

1. ✅ **Authentication is working**
2. ✅ **Database schema is set up**
3. 📝 **Create dashboard page** (`/dashboard`)
4. 📝 **Create courts listing page** (`/courts`)
5. 📝 **Create queue management page** (`/queues`)
6. 📝 **Add real-time queue updates**
7. 📝 **Implement geolocation search**
8. 📝 **Add profile editing**
9. 📝 **Build game history**
10. 📝 **Add court reviews**

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [PostGIS for Geolocation](https://supabase.com/docs/guides/database/extensions/postgis)

---

## Support

For issues or questions:
1. Check [Supabase Discord](https://discord.supabase.com)
2. Review [GitHub Discussions](https://github.com/supabase/supabase/discussions)
3. Check project issues and docs

---

**Happy coding! 🎾**

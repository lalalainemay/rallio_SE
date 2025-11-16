# Supabase Quick Reference

Quick reference for common Supabase operations in Rallio.

---

## 🔐 Authentication

```tsx
import { useAuth } from "@/lib/hooks/useAuth";

const { user, loading, signIn, signUp, signOut, signInWithGoogle } = useAuth();

// Login
await signIn(email, password);

// Sign up
await signUp(email, password, { full_name: "John" });

// Google OAuth
await signInWithGoogle();

// Logout
await signOut();

// Check user
if (user) {
  console.log(user.email);
}
```

---

## 📊 Database Queries

### Fetch Data

```tsx
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Get all courts
const { data, error } = await supabase
  .from("courts")
  .select("*");

// Get with filter
const { data } = await supabase
  .from("courts")
  .select("*")
  .eq("status", "active")
  .order("name");

// Get single item
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

// Get with relations
const { data } = await supabase
  .from("courts")
  .select(`
    *,
    court_reviews (*)
  `);
```

### Insert Data

```tsx
const { data, error } = await supabase
  .from("courts")
  .insert({
    name: "Court Name",
    address: "123 Main St"
  })
  .select()
  .single();
```

### Update Data

```tsx
const { error } = await supabase
  .from("profiles")
  .update({ full_name: "New Name" })
  .eq("id", userId);
```

### Delete Data

```tsx
const { error } = await supabase
  .from("queue_entries")
  .delete()
  .eq("id", entryId);
```

---

## 🌍 Geolocation

```tsx
// Find nearby courts
const { data } = await supabase
  .rpc("nearby_courts", {
    lat: 6.9214,
    lng: 122.0790,
    radius_meters: 5000
  });
```

---

## ⚡ Real-time

```tsx
useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel("queue_updates")
    .on(
      "postgres_changes",
      {
        event: "*", // or "INSERT", "UPDATE", "DELETE"
        schema: "public",
        table: "queue_entries",
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        console.log("Change:", payload);
        // Update UI
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 🔧 Custom Functions

```tsx
// Get next queue position
const { data } = await supabase
  .rpc("get_next_queue_position", {
    p_session_id: sessionId
  });
```

---

## 📁 File Uploads (Storage)

```tsx
// Upload file
const { data, error } = await supabase
  .storage
  .from("avatars")
  .upload(`${userId}/avatar.png`, file);

// Get public URL
const { data } = supabase
  .storage
  .from("avatars")
  .getPublicUrl(`${userId}/avatar.png`);

console.log(data.publicUrl);
```

---

## 🔒 Server-side Auth

```tsx
// In Server Components or API Routes
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  // Not authenticated
}
```

---

## 🎯 React Query Integration

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch
const { data, isLoading } = useQuery({
  queryKey: ["courts"],
  queryFn: async () => {
    const supabase = createClient();
    const { data } = await supabase.from("courts").select("*");
    return data;
  }
});

// Mutate
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (newCourt) => {
    const supabase = createClient();
    return supabase.from("courts").insert(newCourt);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["courts"] });
  }
});

// Usage
mutation.mutate({ name: "New Court", address: "..." });
```

---

## 📋 TypeScript Types

```tsx
import { Database } from "@/types/database";

type Court = Database["public"]["Tables"]["courts"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type QueueEntry = Database["public"]["Tables"]["queue_entries"]["Row"];

// With Supabase client
const supabase = createClient<Database>();

// Now fully typed!
const { data } = await supabase
  .from("courts") // ← autocomplete!
  .select("*");

// data is typed as Court[]
```

---

## 🛡️ Error Handling

```tsx
const { data, error } = await supabase
  .from("courts")
  .select("*");

if (error) {
  console.error("Database error:", error.message);
  // Handle error
  return;
}

// Use data safely
console.log(data);
```

---

## 🎨 Common Patterns

### Protected Page (Server Component)

```tsx
// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <div>Welcome {user.email}</div>;
}
```

### Client Component with Auth

```tsx
"use client";

import { useAuth } from "@/lib/hooks/useAuth";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Profile: {user.email}</div>;
}
```

---

## 📖 Database Tables Reference

| Table | Description |
|-------|-------------|
| `profiles` | User profiles |
| `courts` | Court listings |
| `queue_sessions` | Active queue sessions |
| `queue_entries` | Queue participants |
| `games` | Game history |
| `court_reviews` | Court ratings |

---

## 🔗 Useful Commands

```bash
# Install Supabase (done)
npm install @supabase/supabase-js @supabase/ssr

# Generate types (optional)
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts

# Start dev server
npm run dev
```

---

## 📚 Resources

- [Full Setup Guide](./SUPABASE_SETUP_GUIDE.md)
- [Database Schema](./supabase/schema.sql)
- [Supabase Docs](https://supabase.com/docs)

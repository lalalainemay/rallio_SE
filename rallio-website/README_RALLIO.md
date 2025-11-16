# Rallio - Badminton Court Finder & Queue Management

Modern web application for finding badminton courts and managing player queues in Zamboanga City.

## 🎯 Features

- **User Authentication** - Email/password and Google OAuth
- **Court Discovery** - Find nearby badminton courts with geolocation
- **Queue Management** - Real-time queue system for fair play
- **Player Profiles** - Track games, stats, and skill levels
- **Reviews & Ratings** - Rate and review courts
- **Real-time Updates** - Live queue and session updates

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase credentials to `.env.local`
4. Run the database schema (see [Supabase Setup Guide](./SUPABASE_SETUP_GUIDE.md))

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
rallio-website/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth pages (landing, login)
│   │   ├── auth/callback/        # OAuth callback
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   ├── components/               # React components
│   │   ├── logo.tsx              # Rallio logo
│   │   └── auth-background.tsx   # Auth page background
│   ├── lib/                      # Utilities
│   │   ├── supabase/             # Supabase clients & middleware
│   │   ├── hooks/                # Custom hooks (useAuth)
│   │   └── providers/            # React providers
│   └── types/                    # TypeScript types
│       └── database.ts           # Supabase database types
├── supabase/
│   └── schema.sql                # Database schema
├── public/
│   └── images/                   # Static images
└── docs/                         # Documentation
    ├── SUPABASE_SETUP_GUIDE.md   # Complete Supabase guide
    └── SUPABASE_QUICK_REFERENCE.md # Quick reference
```

---

## 🔐 Authentication

- **Email/Password** login
- **Google OAuth** integration
- Protected routes via middleware
- Auto profile creation on signup

See [`useAuth` hook](./src/lib/hooks/useAuth.tsx) for usage.

---

## 📊 Database Schema

- **profiles** - User profiles with stats
- **courts** - Court listings with geolocation
- **queue_sessions** - Active queue sessions
- **queue_entries** - Queue participants
- **games** - Game history
- **court_reviews** - Court ratings & reviews

See [schema.sql](./supabase/schema.sql) for full schema.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI (shadcn/ui) |
| Backend | Supabase |
| Database | PostgreSQL + PostGIS |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| State Management | React Query |
| Font | Plus Jakarta Sans |

---

## 📚 Documentation

- **[Supabase Setup Guide](./SUPABASE_SETUP_GUIDE.md)** - Complete setup instructions
- **[Supabase Quick Reference](./SUPABASE_QUICK_REFERENCE.md)** - Common patterns & examples
- **[Setup Guide](./SETUP_GUIDE.md)** - General setup and customization
- **[Auth Pages README](./AUTH_PAGES_README.md)** - Landing & login page details
- **[Image Instructions](./IMAGE_INSTRUCTIONS.md)** - Logo and background images

---

## 🎨 Design

- **Brand Color:** #006D77 (deep teal)
- **Font:** Plus Jakarta Sans
- **UI Framework:** Radix UI primitives
- **Responsive:** Mobile-first design

---

## 🔧 Available Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

---

## 🌟 Key Features Explained

### 1. Real-time Queue System

Players can join queue sessions and receive live updates when it's their turn to play.

```tsx
import { createClient } from "@/lib/supabase/client";

// Subscribe to queue updates
supabase
  .channel("queue")
  .on("postgres_changes", { ... }, (payload) => {
    // Handle queue updates
  })
  .subscribe();
```

### 2. Geolocation Search

Find courts near you using PostGIS geospatial queries.

```tsx
const { data } = await supabase
  .rpc("nearby_courts", {
    lat: userLat,
    lng: userLng,
    radius_meters: 5000
  });
```

### 3. Authentication

Secure authentication with automatic profile creation.

```tsx
import { useAuth } from "@/lib/hooks/useAuth";

const { user, signIn, signOut } = useAuth();
```

---

## 🚧 Roadmap

- [x] Authentication (email + OAuth)
- [x] Database schema
- [x] Landing & login pages
- [ ] Dashboard page
- [ ] Court listing & search
- [ ] Queue management UI
- [ ] Profile editing
- [ ] Game history
- [ ] Court reviews
- [ ] Mobile app (Flutter)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the badminton community in Zamboanga City**

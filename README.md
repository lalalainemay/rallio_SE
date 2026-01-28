# 🏸 Rallio

**Badminton Court Finder & Queue Management System**  
*Built for Zamboanga City, Philippines*

---

## 📖 What is Rallio?

Rallio is a mobile and web platform that helps badminton players:

- **Find courts** – Discover nearby badminton venues with real-time availability
- **Book instantly** – Reserve courts and pay via GCash or Maya
- **Join queues** – Hop into pickup games without the hassle of organizing
- **Track matches** – Record scores, view match history, and rate players

For **venue owners**, Rallio provides:
- Dashboard for managing multiple courts
- Pricing configuration with dynamic discounts
- Revenue analytics and booking insights
- Queue approval and session management

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Web** | Next.js 15, React 18, TypeScript, Tailwind CSS 4, shadcn/ui |
| **Mobile** | React Native, Expo 54, Expo Router |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| **Maps** | Leaflet + OpenStreetMap (web), react-native-maps (mobile) |
| **Payments** | PayMongo (GCash, Maya) |
| **Geospatial** | PostGIS |

---

## 📁 Project Structure

```
rallio/
├── web/           # Next.js web application
├── mobile/        # React Native + Expo mobile app
├── backend/       # Supabase migrations & Edge Functions
├── shared/        # Shared types, validations, utilities
└── docs/          # Documentation & planning
```

---

## 🤝 Collaboration Guide

### Prerequisites

1. **Node.js 18+** – [Download](https://nodejs.org/)
2. **Git** – [Download](https://git-scm.com/)
3. **Expo Go app** – For mobile testing (iOS/Android)

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/madz/rallio.git
cd rallio

# 2. Install all dependencies
npm install

# 3. Get environment variables from team lead
# (See "Environment Setup" below)

# 4. Run development server
npm run dev:web      # Web app at localhost:3000
npm run dev:mobile   # Mobile app (scan QR with Expo Go)
```

### Environment Setup

**Ask the team lead for the `.env` files.** These contain Supabase and PayMongo credentials.

Create these files with the credentials you receive:

```bash
# For web development
web/.env.local

# For mobile development  
mobile/.env
```

> ⚠️ **Never commit `.env` files to Git.** They're already in `.gitignore`.

---

## 🧑‍💻 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Start web dev server (localhost:3000) |
| `npm run dev:mobile` | Start Expo mobile server |
| `npm run build:web` | Production build |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |

---

## 📚 Key Documentation

| File | Purpose |
|------|---------|
| [docs/planning.md](docs/planning.md) | Development phases & roadmap |
| [docs/tasks.md](docs/tasks.md) | Current tasks & progress |
| [CLAUDE.md](CLAUDE.md) | AI assistant guidelines |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Module not found: @rallio/shared` | Run `npm install` from root |
| Supabase connection error | Check your `.env` credentials |
| Map shows white screen | Refresh page (Leaflet SSR issue) |
| Expo app won't connect | Ensure phone and laptop are on same WiFi |

---

## 👥 Team

Built with ❤️ for the Zamboanga City badminton community.


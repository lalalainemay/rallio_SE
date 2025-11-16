# Rallio Next.js Project Setup Guide

## Prerequisites

Before starting, ensure you have:
- **Node.js 20+** installed (check with `node --version`)
- **npm** or **pnpm** or **yarn** (we'll use pnpm for this guide)
- **Git** installed
- A code editor (VS Code recommended)

---

## Step 1: Create Next.js Project

### 1.1 Initialize the Project

Open your terminal and run:

```bash
# Using npx (comes with Node.js)
npx create-next-app@latest rallio-frontend

# OR using pnpm (recommended - faster)
pnpm create next-app rallio-frontend

# OR using yarn
yarn create next-app rallio-frontend
```

### 1.2 Configuration Prompts

When prompted, select these options:

```
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like your code inside a `src/` directory? … Yes
✔ Would you like to use App Router? (recommended) … Yes
✔ Would you like to use Turbopack for next dev? … Yes
✔ Would you like to customize the import alias (@/* by default)? … No
```

**Why these choices?**
- **TypeScript**: Type safety prevents bugs
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Fast styling with utility classes
- **src/ directory**: Cleaner project structure
- **App Router**: Modern Next.js with server components
- **Turbopack**: Faster development builds

### 1.3 Navigate to Project

```bash
cd rallio-frontend
```

---

## Step 2: Project Structure Setup

### 2.1 Create the Folder Structure

Run these commands to create the recommended folder structure:

```bash
# Core application folders
mkdir -p src/components/ui
mkdir -p src/components/features/courts
mkdir -p src/components/features/queues
mkdir -p src/components/features/players
mkdir -p src/components/features/reservations
mkdir -p src/components/layout

# Utility and configuration folders
mkdir -p src/lib/api
mkdir -p src/lib/hooks
mkdir -p src/lib/utils
mkdir -p src/lib/validations

# State management
mkdir -p src/stores

# Type definitions
mkdir -p src/types

# Constants and configurations
mkdir -p src/config

# Public assets
mkdir -p public/images
mkdir -p public/icons
```

### 2.2 Your Folder Structure Should Look Like This

```
rallio-frontend/
├── public/
│   ├── images/          # Court images, logos, etc.
│   └── icons/           # SVG icons, favicons
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── (auth)/      # Authentication routes (grouped)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (platform)/  # Main platform routes (grouped)
│   │   │   ├── courts/
│   │   │   ├── queues/
│   │   │   ├── profile/
│   │   │   └── reservations/
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
│   ├── components/
│   │   ├── features/    # Feature-specific components
│   │   │   ├── courts/
│   │   │   ├── queues/
│   │   │   ├── players/
│   │   │   └── reservations/
│   │   ├── layout/      # Layout components (Header, Footer, Sidebar)
│   │   └── ui/          # Reusable UI components (shadcn/ui)
│   ├── config/          # App configuration
│   ├── lib/             # Utility functions and helpers
│   │   ├── api/         # API client functions
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Helper functions
│   │   └── validations/ # Zod schemas
│   ├── stores/          # Zustand stores (state management)
│   └── types/           # TypeScript type definitions
├── .env.local           # Environment variables
├── .eslintrc.json       # ESLint configuration
├── next.config.js       # Next.js configuration
├── package.json
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

---

## Step 3: Install Essential Dependencies

### 3.1 UI Components (shadcn/ui)

shadcn/ui provides high-quality, customizable components. Initialize it:

```bash
pnpm dlx shadcn@latest init
```

When prompted:
```
✔ Preflight checks.
✔ Verifying framework. Found Next.js.
✔ Validating Tailwind CSS.
✔ Validating import alias.
✔ Which style would you like to use? › New York
✔ Which color would you like to use as base color? › Slate
✔ Would you like to use CSS variables for colors? › Yes
```

Install commonly needed components:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add toast
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add table
```

### 3.2 State Management & Data Fetching

```bash
# Zustand for state management (lightweight, simple)
pnpm add zustand

# TanStack Query for server state and caching
pnpm add @tanstack/react-query @tanstack/react-query-devtools

# Axios for API calls
pnpm add axios
```

### 3.3 Form Handling & Validation

```bash
# React Hook Form for form handling
pnpm add react-hook-form

# Zod for schema validation
pnpm add zod @hookform/resolvers
```

### 3.4 Date & Time Handling

```bash
# date-fns for date manipulation
pnpm add date-fns
```

### 3.5 Maps Integration (for Court Finder)

```bash
# Mapbox GL JS
pnpm add mapbox-gl react-map-gl

# Types for Mapbox
pnpm add -D @types/mapbox-gl
```

### 3.6 Real-time Communication

```bash
# Socket.io client for real-time queue updates
pnpm add socket.io-client
```

### 3.7 Utilities

```bash
# Class name utility for Tailwind
pnpm add clsx tailwind-merge

# Icons
pnpm add lucide-react
```

### 3.8 Development Dependencies

```bash
# Prettier for code formatting
pnpm add -D prettier prettier-plugin-tailwindcss

# ESLint plugins
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

---

## Step 4: Configuration Files

### 4.1 Environment Variables

Create `.env.local` in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Mapbox (get free API key from https://www.mapbox.com/)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Rallio

# Feature Flags (for gradual rollout)
NEXT_PUBLIC_ENABLE_AI_RECOMMENDATIONS=true
NEXT_PUBLIC_ENABLE_REALTIME_QUEUES=true
```

### 4.2 TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/config/*": ["./src/config/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4.3 Tailwind Configuration

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your brand colors
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 4.4 Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 4.5 ESLint Configuration

Update `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 4.6 Next.js Configuration

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all HTTPS images (restrict in production)
      },
    ],
  },
  // Enable experimental features if needed
  experimental: {
    // serverActions: true, // Enable Server Actions if you use them
  },
};

module.exports = nextConfig;
```

---

## Step 5: Create Core Utility Files

### 5.1 Create `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency for Philippine Peso
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format time to 12-hour format
 */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}
```

### 5.2 Create `src/lib/api/client.ts`

```typescript
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or your auth solution
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

### 5.3 Create `src/types/index.ts`

```typescript
// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  profileCompleted: boolean;
}

export interface Player {
  id: string;
  userId: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  skillLevel: number; // 1-10
  playStyle?: string;
  rating: number;
  createdAt: string;
}

// Court types
export interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  createdAt: string;
}

export interface Court {
  id: string;
  venueId: string;
  name: string;
  surfaceType?: string;
  courtType: "indoor" | "outdoor";
  capacity: number;
  hourlyRate: number;
  createdAt: string;
}

// Queue types
export interface QueueSession {
  id: string;
  courtId: string;
  organizerId: string;
  startTime: string;
  endTime: string;
  mode: "casual" | "competitive";
  maxPlayers: number;
  status: "open" | "active" | "closed";
  createdAt: string;
}

export interface QueueParticipant {
  id: string;
  queueSessionId: string;
  userId: string;
  joinedAt: string;
  skillAtJoin: number;
  status: "waiting" | "playing" | "completed";
  paymentStatus: "unpaid" | "paid";
}

// Reservation types
export interface Reservation {
  id: string;
  courtAvailabilityId: string;
  organizerId: string;
  reservedFor: number;
  status: "confirmed" | "cancelled" | "completed";
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 5.4 Create `src/config/constants.ts`

```typescript
export const APP_NAME = "Rallio";

export const SKILL_LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Beginner+" },
  { value: 3, label: "Intermediate-" },
  { value: 4, label: "Intermediate" },
  { value: 5, label: "Intermediate+" },
  { value: 6, label: "Advanced-" },
  { value: 7, label: "Advanced" },
  { value: 8, label: "Advanced+" },
  { value: 9, label: "Elite-" },
  { value: 10, label: "Elite" },
];

export const PLAY_STYLES = [
  "Casual",
  "Competitive",
  "Singles Only",
  "Doubles Only",
  "Mixed",
];

export const COURT_TYPES = ["Indoor", "Outdoor"];

export const PAYMENT_METHODS = ["GCash", "Maya", "Cash"];

export const DEFAULT_RATING = 1500;

export const QUEUE_STATUSES = {
  OPEN: "open",
  ACTIVE: "active",
  CLOSED: "closed",
} as const;
```

---

## Step 6: Set Up Query Provider

### 6.1 Create `src/lib/providers/query-provider.tsx`

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 6.2 Update Root Layout

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Rallio - Badminton Court Finder & Queue Management",
  description: "Find badminton courts and manage queues in Zamboanga City",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## Step 7: Create a Sample Homepage

Update `src/app/page.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Rallio
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Find badminton courts and manage queues in Zamboanga City
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Courts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Search for badminton courts near you with real-time
                availability.
              </p>
              <Button asChild className="w-full">
                <Link href="/courts">Browse Courts</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Join a queue session and get matched with players of similar
                skill.
              </p>
              <Button asChild className="w-full">
                <Link href="/queues">View Queues</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Track your games, view statistics, and manage your skill
                rating.
              </p>
              <Button asChild className="w-full">
                <Link href="/profile">View Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
```

---

## Step 8: Run the Development Server

### 8.1 Start the Development Server

```bash
pnpm dev
```

Your app should now be running at http://localhost:3000

### 8.2 Verify Installation

Open http://localhost:3000 in your browser. You should see the Rallio homepage with three cards.

---

## Step 9: Package.json Scripts

Your `package.json` should have these scripts:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Step 10: Git Setup

### 10.1 Create `.gitignore`

Make sure your `.gitignore` includes:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
.vercel

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Local env files
.env
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

### 10.2 Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial Next.js setup for Rallio"
```

### 10.3 Create GitHub Repository

```bash
# After creating a repo on GitHub
git remote add origin https://github.com/yourusername/rallio-frontend.git
git branch -M main
git push -u origin main
```

---

## Step 11: Helpful VS Code Extensions

Install these extensions for better development experience:

1. **ES7+ React/Redux/React-Native snippets** - Code snippets
2. **Tailwind CSS IntelliSense** - Autocomplete for Tailwind
3. **Prettier - Code formatter** - Auto-formatting
4. **ESLint** - Linting
5. **Auto Rename Tag** - Automatically rename paired HTML tags
6. **Path Intellisense** - Autocomplete for file paths
7. **TypeScript Vue Plugin (Volar)** - Better TypeScript support

---

## Step 12: Development Workflow

### 12.1 Daily Development

```bash
# Start development server
pnpm dev

# In a new terminal, run type checking
pnpm type-check

# Format code before committing
pnpm format
```

### 12.2 Before Committing

```bash
# Check for linting errors
pnpm lint

# Check for type errors
pnpm type-check

# Format all files
pnpm format
```

### 12.3 Testing the Build

```bash
# Build for production
pnpm build

# Start production server locally
pnpm start
```

---

## Next Steps

Now that your Next.js project is set up, you can:

1. **Set up authentication** (we'll cover this in a separate guide)
2. **Create the Court Finder feature** with maps integration
3. **Build the Queue Management UI** with real-time updates
4. **Implement Player Profiles** and statistics
5. **Connect to the backend API** (NestJS)

---

## Troubleshooting

### Port Already in Use

```bash
# If port 3000 is already in use, specify a different port
pnpm dev -- -p 3001
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### TypeScript Errors

```bash
# Restart TypeScript server in VS Code
# Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
# Type: "TypeScript: Restart TS Server"
```

### Tailwind Classes Not Working

```bash
# Make sure you've saved tailwind.config.ts
# Restart the dev server
```

---

## Summary

You now have a fully configured Next.js project with:

✅ TypeScript for type safety
✅ Tailwind CSS for styling
✅ shadcn/ui for beautiful components
✅ TanStack Query for server state management
✅ Zustand for client state management
✅ React Hook Form + Zod for forms
✅ Axios for API calls
✅ Socket.io for real-time features
✅ Mapbox for maps integration
✅ Proper folder structure
✅ Development tools configured

Your project is now ready for feature development!

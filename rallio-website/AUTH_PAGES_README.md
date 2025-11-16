# Rallio Auth Pages - Website Version

Landing and login pages for your Rallio website, converted from the mobile app design to a responsive web version.

## ✨ Latest Updates

- ✅ **Font:** Now using Plus Jakarta Sans
- ✅ **Form Inputs:** Increased height (56px) with proper padding
- ✅ **Logo:** Accepts custom image via `imageSrc` prop
- ✅ **Background:** Reusable component with image support
- ✅ **Brand Color:** Updated to #006D77
- ✅ **All components are fully reusable**

## Pages Created

### 1. Landing Page (`/landing`)
**Location:** `src/app/(auth)/landing/page.tsx`

**Features:**
- Rallio logo with custom diamond icon
- Teal gradient background matching your brand
- Background court image (see IMAGE_INSTRUCTIONS.md)
- "Get Started" and "Sign In" call-to-action buttons
- Fully responsive design

**Routes to:**
- `/login` - Takes users to the login page

### 2. Login/Signup Page (`/login`)
**Location:** `src/app/(auth)/login/page.tsx`

**Features:**
- Email and password input fields
- Password visibility toggle (eye icon)
- "Forgot password?" link
- "Login" button
- "Register now" link for new users
- Google OAuth button with official branding
- Terms of Service and Privacy Policy links
- Beautiful glassmorphic card design
- Fully responsive

**Interactive Elements:**
- Show/hide password toggle
- Form validation (HTML5 required fields)
- Google OAuth integration ready (console logs for now)

## Components Created

### Logo Component
**Location:** `src/components/logo.tsx`

**Props:**
- `size` (number): Size of the logo in pixels (default: 48)
- `showText` (boolean): Whether to show "Rallio" text (default: true)
- `className` (string): Additional CSS classes

**Usage:**
```tsx
import { Logo } from "@/components/logo";

// Logo with text
<Logo size={64} showText={true} />

// Icon only
<Logo size={48} showText={false} />
```

## Styling & Theme

### Custom Colors Added
**Location:** `src/app/globals.css`

```css
--rallio-teal: #4A9B9B;
--rallio-teal-light: #5FB3B3;
--rallio-teal-dark: #3A8383;
```

### Design Features
- Teal gradient backgrounds (#4A9B9B - #5FB3B3)
- Glassmorphic card with backdrop blur
- White text for high contrast on teal background
- Rounded, modern input fields
- Smooth hover transitions
- Border glow effects on focus

## Routes

- `/` → Redirects to `/landing`
- `/landing` → Landing page
- `/login` → Login/Signup page

## Next Steps

### 1. Add Background Image
See `IMAGE_INSTRUCTIONS.md` for details on adding the court background image.

### 2. Implement Authentication
The login page has placeholder functions ready for:
- Email/password login (`handleLogin`)
- Google OAuth (`handleGoogleLogin`)

Connect these to your authentication service (Firebase, Auth0, NextAuth, etc.)

### 3. Create Additional Pages
You may want to create:
- `/register` - Dedicated registration page
- `/forgot-password` - Password reset page
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy

### 4. Add Form Validation
Consider adding a form library for better validation:
```bash
# Already installed in package.json:
# - react-hook-form
# - @hookform/resolvers
# - zod
```

Example implementation:
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

## Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# Navigate to http://localhost:3000
```

## Mobile Responsiveness

Both pages are fully responsive:
- **Mobile (< 640px):** Single column, full-width cards
- **Tablet (640px - 1024px):** Centered cards with padding
- **Desktop (> 1024px):** Centered cards, max-width 28rem

## Tech Stack Used

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI primitives (via shadcn/ui)
- **Icons:** Lucide React (Eye, EyeOff)
- **TypeScript:** Full type safety

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx         # Auth layout wrapper
│   │   ├── landing/
│   │   │   └── page.tsx       # Landing page
│   │   └── login/
│   │       └── page.tsx       # Login page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home (redirects to /landing)
│   └── globals.css            # Global styles + Rallio colors
└── components/
    └── logo.tsx               # Rallio logo component

public/
└── images/
    └── court-background.jpg   # Add your background image here
```

## Customization

### Change Colors
Edit `src/app/globals.css`:
```css
--rallio-teal: #YourColor;
--rallio-teal-light: #YourLightColor;
--rallio-teal-dark: #YourDarkColor;
```

### Modify Button Styles
The pages use the Button component from `components/ui/button.tsx`. You can modify variants there.

### Update Logo
Edit `src/components/logo.tsx` to use your custom logo SVG or image.

## Questions?

The pages are production-ready and match your mobile design, adapted for web viewing. All interactive elements are functional and ready for backend integration.

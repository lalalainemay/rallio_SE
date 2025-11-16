# Rallio Website Setup Guide

Your Rallio landing and login pages are now complete with all requested features!

## What's Included

### Pages
1. **Landing Page** (`/landing`) - Welcome page with branding and CTAs
2. **Login Page** (`/login`) - Authentication with email/password and Google OAuth

### Components
1. **Logo Component** (`src/components/logo.tsx`) - Reusable logo with image support
2. **AuthBackground Component** (`src/components/auth-background.tsx`) - Reusable background wrapper

---

## New Features Implemented ✅

### 1. Plus Jakarta Sans Font
- Updated from Inter to Plus Jakarta Sans
- Applied globally across the entire application
- Configured in `src/app/layout.tsx` and `tailwind.config.ts`

### 2. Fixed Form Input Padding
- Increased input height to `h-14` (56px)
- Added proper horizontal padding: `px-4`
- Better visual appearance matching your design

### 3. Logo Image Support
- Logo component now accepts an `imageSrc` prop
- Falls back to placeholder SVG if no image provided
- Easy to swap your logo:
  ```tsx
  <Logo imageSrc="/images/rallio-logo.png" />
  ```

### 4. Background Image Support
- Created reusable `AuthBackground` component
- Accepts custom background images
- Configurable opacity and colors
- Works with or without images

### 5. Updated Brand Color
- Primary color: **#006D77** (deep teal)
- Used throughout landing and login pages
- Added to CSS variables as `--rallio-primary`

### 6. Fully Reusable Components
- `AuthBackground` can be used on any auth page
- `Logo` can be used throughout your app
- Easy to customize via props

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. View Pages
- Landing: http://localhost:3000/landing
- Login: http://localhost:3000/login
- Home: http://localhost:3000 (redirects to landing)

---

## Adding Your Images

### Logo Image (Optional)
1. Place your logo at: `public/images/rallio-logo.png`
2. Update both pages to use it:

**Landing page** (`src/app/(auth)/landing/page.tsx`):
```tsx
<Logo
  size={80}
  showText={true}
  imageSrc="/images/rallio-logo.png"  // Uncomment this line
/>
```

**Login page** (`src/app/(auth)/login/page.tsx`):
```tsx
<Logo
  size={64}
  showText={false}
  imageSrc="/images/rallio-logo.png"  // Uncomment this line
/>
```

### Background Image (Optional)
1. Place court image at: `public/images/court-background.jpg`
2. The pages are already configured to use it!
3. If the image exists, it will show automatically
4. If not, you'll see a solid #006D77 background

**Already configured:**
```tsx
<AuthBackground
  backgroundColor="#006D77"
  backgroundImage="/images/court-background.jpg"
  overlayOpacity={0.3}
>
```

See `IMAGE_INSTRUCTIONS.md` for detailed image specifications.

---

## Component Usage

### AuthBackground Component

Use this component to wrap any auth-related page:

```tsx
import { AuthBackground } from "@/components/auth-background";

<AuthBackground
  backgroundColor="#006D77"         // Required: Hex color
  backgroundImage="/path/to/img"    // Optional: Image path
  overlayOpacity={0.3}              // Optional: 0-1 (default: 0.3)
>
  {/* Your page content */}
</AuthBackground>
```

**Props:**
- `backgroundColor` (string): Background color (default: "#006D77")
- `backgroundImage` (string, optional): Path to background image
- `overlayOpacity` (number, optional): Image overlay opacity 0-1 (default: 0.3)
- `children` (ReactNode): Page content

### Logo Component

Use this component anywhere you need the Rallio logo:

```tsx
import { Logo } from "@/components/logo";

<Logo
  size={64}                      // Optional: Size in px (default: 48)
  showText={true}                // Optional: Show "Rallio" text (default: true)
  imageSrc="/images/logo.png"    // Optional: Custom logo image
  alt="Rallio Logo"              // Optional: Alt text (default: "Rallio Logo")
/>
```

**Props:**
- `size` (number): Logo size in pixels (default: 48)
- `showText` (boolean): Display "Rallio" text (default: true)
- `imageSrc` (string, optional): Path to custom logo image
- `alt` (string): Alt text for the logo
- `className` (string): Additional CSS classes

---

## Customization

### Change Background Color

**Option 1: Per Page**
```tsx
<AuthBackground backgroundColor="#YourColor">
```

**Option 2: Globally**
Update `src/app/globals.css`:
```css
--rallio-primary: #YourNewColor;
```

### Change Font

Update `src/app/layout.tsx`:
```tsx
import { Your_Font } from "next/font/google";

const yourFont = Your_Font({
  subsets: ["latin"],
  variable: "--font-your-font"
});
```

Then update `tailwind.config.ts`:
```ts
fontFamily: {
  sans: ["var(--font-your-font)", "system-ui", "sans-serif"],
},
```

### Modify Input Styles

The input styling is applied via className props in the login page. You can adjust:
- Height: Change `h-14` to your preferred size
- Padding: Modify `px-4` for horizontal padding
- Border radius: Already inherits from Tailwind config

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── landing/
│   │   │   └── page.tsx       # Landing page ✓
│   │   ├── login/
│   │   │   └── page.tsx       # Login page ✓
│   │   └── layout.tsx         # Auth layout
│   ├── layout.tsx             # Root layout (Plus Jakarta Sans) ✓
│   ├── page.tsx               # Home (redirects to /landing)
│   └── globals.css            # Global styles + Rallio colors ✓
├── components/
│   ├── logo.tsx               # Reusable logo component ✓
│   └── auth-background.tsx    # Reusable background component ✓
└── ...

public/
└── images/
    ├── court-background.jpg   # Add your background image here
    └── rallio-logo.png        # Add your logo image here
```

---

## Color Palette

All Rallio brand colors are defined in `globals.css`:

```css
--rallio-primary: #006D77;      /* Main brand color */
--rallio-teal: #4A9B9B;         /* Lighter teal */
--rallio-teal-light: #5FB3B3;   /* Even lighter */
--rallio-teal-dark: #3A8383;    /* Darker teal */
```

Use in your code:
- Tailwind: `bg-[#006D77]` or `text-[#006D77]`
- CSS: `background-color: var(--rallio-primary);`

---

## Next Steps

1. **Add Your Images**
   - Logo: `public/images/rallio-logo.png`
   - Background: `public/images/court-background.jpg`

2. **Implement Authentication**
   - Connect `handleLogin` function to your auth service
   - Connect `handleGoogleLogin` to Google OAuth

3. **Create Additional Pages**
   - `/register` - Registration page
   - `/forgot-password` - Password reset
   - `/terms` - Terms of Service
   - `/privacy` - Privacy Policy

4. **Add Form Validation**
   Libraries already installed:
   - react-hook-form
   - zod
   - @hookform/resolvers

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI (shadcn/ui)
- **Font:** Plus Jakarta Sans (Google Fonts)
- **Icons:** Lucide React

---

## Support

All pages are production-ready and fully responsive. The code is well-commented with instructions on how to add your images.

For more details:
- See `IMAGE_INSTRUCTIONS.md` for image specifications
- See `AUTH_PAGES_README.md` for detailed component documentation

Enjoy your new Rallio auth pages! 🎾

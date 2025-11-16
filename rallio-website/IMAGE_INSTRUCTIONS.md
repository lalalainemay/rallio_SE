# Image Assets for Rallio

## 1. Background Image

Add a background image for the landing and login pages:

**Location:** `public/images/court-background.jpg`

**Specifications:**
- Image: Aerial view of a tennis/pickleball/badminton court
- Recommended colors: Works best with blue-green tones
- Resolution: At least 1920x1080px for optimal quality
- Format: JPG or PNG

**Where it's used:**
- Landing page (`/landing`) - 30% opacity
- Login page (`/login`) - 20% opacity

The pages use a reusable `AuthBackground` component that overlays the image with the Rallio brand color (#006D77) and gradients.

**To use without an image:**
Simply don't pass the `backgroundImage` prop to the `AuthBackground` component, and you'll get a solid color background:

```tsx
<AuthBackground backgroundColor="#006D77">
  {/* Your content */}
</AuthBackground>
```

---

## 2. Logo Image (Optional)

Replace the placeholder SVG logo with your actual logo:

**Location:** `public/images/rallio-logo.png` (or .svg, .jpg)

**Specifications:**
- Square aspect ratio (1:1) for best results
- Recommended size: 512x512px minimum
- Format: PNG with transparent background (recommended) or SVG
- The logo will be displayed in a white circular container

**How to use:**
Update the Logo component in both pages:

```tsx
// In landing page
<Logo
  size={80}
  showText={true}
  imageSrc="/images/rallio-logo.png"  // Add this line
/>

// In login page
<Logo
  size={64}
  showText={false}
  imageSrc="/images/rallio-logo.png"  // Add this line
/>
```

**Current behavior:**
Without the `imageSrc` prop, the Logo component displays a placeholder diamond SVG icon.

---

## Stock Photo Resources

If you need free stock photos:
- **Unsplash:** https://unsplash.com/s/photos/tennis-court-aerial
- **Pexels:** https://www.pexels.com/search/badminton%20court/
- **Pixabay:** https://pixabay.com/images/search/sports%20court/

---

## Customization

Both the background and logo are fully customizable through component props:

### AuthBackground Props
```tsx
<AuthBackground
  backgroundColor="#006D77"        // Any hex color
  backgroundImage="/path/to/image" // Optional image path
  overlayOpacity={0.3}             // 0-1 opacity value
>
```

### Logo Props
```tsx
<Logo
  size={80}                    // Size in pixels
  showText={true}              // Show/hide "Rallio" text
  imageSrc="/path/to/logo"     // Optional logo image
  alt="Your Alt Text"          // Optional alt text
/>
```

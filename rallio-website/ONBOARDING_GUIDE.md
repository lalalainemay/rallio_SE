# Rallio Onboarding Flow Guide

Complete documentation for the multi-step user onboarding process.

---

## 📋 Overview

The Rallio onboarding flow consists of **5 steps**:

1. **Sign Up** - Create account with email/password or Google OAuth
2. **Phone Verification** - Add and verify phone number
3. **Code Verification** - Verify phone with 4-digit SMS code
4. **Location Permission** - Enable location services
5. **Dashboard** - Complete onboarding and access the app

---

## 🎯 Flow Diagram

```
Landing Page → Login Page
                    ↓
              Sign Up Page (Step 1)
                    ↓
              Phone Page (Step 2)
                    ↓
              Verify Code Page (Step 3)
                    ↓
              Location Page (Step 4)
                    ↓
              Dashboard (Complete!)
```

---

## 📄 Page Details

### 1. Sign Up Page (`/signup`)

**Purpose:** Collect user information and create account

**Fields:**
- First Name (required)
- Middle Initial (optional)
- Last Name (required)
- Email (required)
- Password (required, min 8 characters)
- Confirm Password (required)
- Terms & Conditions checkbox (required)

**Actions:**
- Sign up with email/password
- Sign up with Google OAuth
- Navigate to login if already have account

**Validations:**
- Email format validation
- Password match validation
- Password strength (min 8 characters)
- Terms agreement required

**Database:**
```typescript
// Stored in profiles table
{
  first_name: string;
  middle_initial?: string;
  last_name: string;
  full_name: string; // Auto-generated
  email: string;
  onboarding_completed: false;
}
```

**Success:**
- User account created in Supabase Auth
- Profile created in `profiles` table
- Redirect to `/signup/phone`

---

### 2. Phone Verification Page (`/signup/phone`)

**Purpose:** Collect and verify user's phone number

**Fields:**
- Phone Number (Philippines format: +639xxxxxxxxx)

**Features:**
- Auto-formats phone number to +63 format
- Generates random 4-digit verification code
- Stores code in localStorage (dev mode)
- In production: Send SMS via Twilio/similar

**Actions:**
- Continue (sends verification code)
- Skip for now (redirects to location page)

**Database:**
```typescript
// Updates profiles table
{
  phone: string; // E.g., "+639054085084"
}
```

**Storage:**
```typescript
// localStorage
rallio_verification_code: "1039"
rallio_phone_number: "+639054085084"
```

**Success:**
- Phone number saved to profile
- Verification code generated
- Redirect to `/signup/verify`

---

### 3. Code Verification Page (`/signup/verify`)

**Purpose:** Verify phone number with SMS code

**Fields:**
- 4 individual digit inputs (auto-focus next)
- Supports paste (e.g., "1039" pastes all 4 digits)

**Features:**
- Visual notification showing the code (dev mode)
- Auto-hide notification after 10 seconds
- Backspace navigation between inputs
- Resend code functionality

**Actions:**
- Continue (verifies code)
- Resend code (generates new code)

**Validations:**
- All 4 digits must be entered
- Code must match stored verification code

**Storage:**
```typescript
// localStorage
rallio_phone_verified: "true" // On success
```

**Success:**
- Phone marked as verified
- Verification code cleared from storage
- Redirect to `/signup/location`

---

### 4. Location Permission Page (`/signup/location`)

**Purpose:** Request location access for nearby court search

**Features:**
- Explains why location is needed
- Shows "Precise: On" toggle (visual)
- Uses browser Geolocation API
- High accuracy mode enabled

**Actions:**
- Enable Location (requests browser permission)
- Remind me later (skips to dashboard)

**Browser API:**
```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Save to profile
  },
  (error) => {
    // Handle error
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
);
```

**Database:**
```typescript
// Updates profiles table
{
  location_enabled: true,
  latitude: 6.9214,
  longitude: 122.0790,
  onboarding_completed: true
}
```

**Storage:**
```typescript
// localStorage
rallio_location_enabled: "true"
rallio_user_location: { latitude: 6.9214, longitude: 122.0790 }
```

**Success:**
- Location saved to profile
- Onboarding marked complete
- Redirect to `/dashboard`

---

### 5. Dashboard Page (`/dashboard`)

**Purpose:** Main app interface after onboarding

**Features:**
- Welcome message with user's first name
- Profile information display
- Game statistics (total games, skill level, win rate)
- Quick action buttons
- Onboarding check (redirects if incomplete)

**Protection:**
- Server-side auth check
- Redirects to login if not authenticated
- Redirects to phone step if onboarding incomplete

---

## 🗄️ Database Schema Updates

### Migration File: `supabase/onboarding_migration.sql`

**New Columns Added to `profiles` table:**

```sql
ALTER TABLE profiles
ADD COLUMN first_name TEXT,
ADD COLUMN middle_initial TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN location_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);
```

**Indexes:**
```sql
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed);
CREATE INDEX idx_profiles_phone ON profiles(phone);
```

---

## 🔐 Security & Privacy

### Phone Verification

**Development Mode:**
- Code stored in localStorage
- Code printed to console
- SMS not actually sent

**Production Mode:**
You'll need to integrate an SMS provider:

```typescript
// Example with Twilio
import twilio from 'twilio';

const sendSMS = async (phoneNumber: string, code: string) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: `Your Rallio verification code is ${code}`,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER
  });
};
```

### Location Privacy

- Location only requested with user consent
- Can be skipped ("Remind me later")
- Stored securely in user profile
- Used only for nearby court search
- Can be disabled in settings

### Data Storage

**Supabase (Database):**
- User profile information
- Phone number (hashed in production)
- Location coordinates
- Onboarding status

**localStorage (Browser):**
- Verification code (temporary, dev only)
- Location preference
- User location (cached)

---

## 🧪 Testing the Flow

### 1. Test Sign Up

```bash
npm run dev
```

1. Go to http://localhost:3000/signup
2. Fill in all fields
3. Check "Terms and Conditions"
4. Click "Sign up"

### 2. Test Phone Verification

1. Enter phone number: `09054085084`
2. Click "Continue"
3. Check console for verification code
4. See notification with code

### 3. Test Code Entry

1. Enter the 4-digit code from console/notification
2. Or use the dev mode display
3. Click "Continue"

**Test Features:**
- Paste code: Try copying "1039" and pasting in first box
- Backspace navigation: Type in a box, backspace to go back
- Resend: Click "Resend code" to get new code

### 4. Test Location

1. Click "Enable Location"
2. Browser will ask for permission
3. Allow location access
4. Should redirect to dashboard

**Or skip:**
- Click "Remind me later"
- Goes straight to dashboard

---

## 🎨 Responsive Design

All pages are fully responsive:

### Mobile (< 640px)
- Single column layout
- Full-width cards
- Touch-optimized inputs
- Stack all elements vertically

### Tablet (640px - 1024px)
- Centered cards with padding
- Comfortable touch targets
- Optimized spacing

### Desktop (> 1024px)
- Max-width 28rem cards
- Centered on screen
- Keyboard navigation
- Hover states

---

## 🔄 Flow Control

### Skip Options

Users can skip certain steps:

1. **Phone Verification**
   - Click "Skip for now"
   - Goes to location page
   - Phone can be added later in profile

2. **Location Permission**
   - Click "Remind me later"
   - Goes to dashboard
   - Can enable later in settings

### Incomplete Onboarding

If user closes browser mid-flow:

```typescript
// Dashboard checks onboarding status
if (!profile.onboarding_completed) {
  redirect('/signup/phone'); // Resume from here
}
```

---

## 🚀 Next Steps for Production

### 1. SMS Integration

Install Twilio (or alternative):
```bash
npm install twilio
```

Create API route:
```typescript
// app/api/send-sms/route.ts
export async function POST(req: Request) {
  const { phoneNumber, code } = await req.json();

  // Send SMS via Twilio
  await sendSMS(phoneNumber, code);

  return Response.json({ success: true });
}
```

### 2. Code Storage

Use Redis or Supabase instead of localStorage:

```typescript
// Store in Supabase
await supabase
  .from('verification_codes')
  .insert({
    phone: phoneNumber,
    code: hashedCode,
    expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 min
  });
```

### 3. Rate Limiting

Prevent abuse:

```typescript
// Limit SMS sends per phone number
const canSendSMS = await checkRateLimit(phoneNumber);
if (!canSendSMS) {
  throw new Error('Too many requests. Try again later.');
}
```

### 4. Phone Number Validation

Use a library like `libphonenumber-js`:

```bash
npm install libphonenumber-js
```

```typescript
import { parsePhoneNumber } from 'libphonenumber-js';

const phone = parsePhoneNumber(input, 'PH');
if (!phone.isValid()) {
  throw new Error('Invalid phone number');
}
```

---

## 📊 Analytics Events

Track onboarding completion:

```typescript
// Track with your analytics tool
analytics.track('signup_started');
analytics.track('phone_entered');
analytics.track('phone_verified');
analytics.track('location_enabled');
analytics.track('onboarding_completed');
```

---

## 🐛 Troubleshooting

### "Verification code not found"
- Check localStorage in dev tools
- Make sure you're on the same browser tab
- Code may have expired

### "Location not working"
- Check browser permissions
- Ensure HTTPS in production
- Try "Remind me later" to skip

### "Already signed up but can't login"
- Check Supabase Dashboard → Auth → Users
- Verify email is confirmed
- Check for error messages

### "Redirected to phone page from dashboard"
- Onboarding not marked complete
- Check `onboarding_completed` in database
- Complete remaining steps

---

## 📝 Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# For SMS (Production)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## ✅ Checklist for Launch

- [ ] SMS provider configured
- [ ] Rate limiting implemented
- [ ] Phone validation added
- [ ] Verification codes in database (not localStorage)
- [ ] Analytics tracking added
- [ ] Error handling improved
- [ ] Loading states tested
- [ ] Mobile tested on real devices
- [ ] Location privacy policy updated
- [ ] Terms & conditions reviewed

---

**Ready to onboard users! 🎉**

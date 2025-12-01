# Quick Start Guide - Venue Management Enhancements

## 🚀 Get Started in 5 Minutes

### Step 1: Apply Migrations (2 minutes)
```bash
# Option A: Supabase Dashboard
1. Go to SQL Editor
2. Run migration 021 (copy from file)
3. Run migration 022 (copy from file)

# Option B: CLI
cd backend
npx supabase db push
```

### Step 2: Restart Dev Server (30 seconds)
```bash
npm run dev
# or
yarn dev
```

### Step 3: Test Basic Functionality (2 minutes)

#### As Global Admin:
1. Go to **Admin → Venues & Courts**
2. Click checkbox next to 2 venues
3. Click **Activate** or **Verify** in batch toolbar
4. ✅ Success!

#### As Court Admin:
1. Go to **Court Admin → My Venues**
2. Create a new court
3. Go to **Court Admin → Pending Courts**
4. ✅ See your unverified court

#### As Global Admin (verify court):
1. Go to **Admin → Venues & Courts**
2. Click on venue row (not checkbox)
3. Find unverified court
4. Click actions → **Verify**
5. ✅ Court now verified!

---

## 📋 Feature Checklist

### ✅ What's New

- [x] Batch select venues with checkboxes
- [x] Batch activate/deactivate/verify/delete
- [x] Click venue row to open details
- [x] Edit Venue button in details panel
- [x] Court verification workflow (is_verified column)
- [x] Pending Courts page for court admins
- [x] Verify/Unverify courts action
- [x] RLS: Unverified courts hidden from public
- [x] Visual badges (Verified/Pending Verification)

---

## 🎯 Key Workflows

### Workflow 1: Batch Verify Venues (Global Admin)
```
1. Select multiple venues (checkboxes)
2. Click "Verify" in batch toolbar
3. Done! All selected venues verified
```

### Workflow 2: Create & Verify Court (Court Admin → Global Admin)
```
Court Admin:
1. Create venue + court
2. Check "Pending Courts" page

Global Admin:
3. Open venue details
4. Find unverified court
5. Actions → Verify
6. Done! Court now bookable
```

### Workflow 3: Edit Venue from Details Panel
```
1. Click venue row
2. Click "Edit Venue" button (purple, top-right)
3. Make changes
4. Save
5. Panel refreshes with new data
```

---

## 🔑 User Permissions Quick Reference

| Action | Global Admin | Court Admin | Player |
|--------|--------------|-------------|--------|
| View all venues | ✅ | ❌ | ✅ (public) |
| Batch operations | ✅ | ❌ | ❌ |
| Create venue | ✅ | ✅ | ❌ |
| Edit any venue | ✅ | ✅ (own) | ❌ |
| Delete venue | ✅ | ❌ | ❌ |
| Create court | ✅ | ✅ | ❌ |
| Verify court | ✅ | ❌ | ❌ |
| View unverified courts | ✅ (all) | ✅ (own) | ❌ |
| View pending courts page | ❌ | ✅ | ❌ |

---

## 🗂️ File Locations

### Migrations
- `backend/supabase/migrations/021_*.sql` - RLS policies
- `backend/supabase/migrations/022_*.sql` - Court verification

### Components
- `web/src/components/global-admin/venue-management-global.tsx` - Main venue page
- `web/src/components/global-admin/venue-details-panel.tsx` - Details panel
- `web/src/components/court-admin/pending-courts-management.tsx` - Pending page

### Actions
- `web/src/app/actions/global-admin-venue-actions.ts` - Venue/court CRUD
- `web/src/app/actions/court-admin-actions.ts` - Court admin actions

### Pages
- `/admin/venues` - Global admin venue management
- `/court-admin/pending-courts` - Court admin pending courts

---

## 🧪 Quick Test Commands

### Test RLS Policies
```sql
-- As authenticated user (court admin)
SELECT * FROM courts WHERE is_verified = false;
-- Should return only YOUR unverified courts

-- As unauthenticated
SELECT * FROM courts;
-- Should return only verified courts

-- As global admin
SELECT * FROM courts;
-- Should return ALL courts
```

### Test Batch Operations
```sql
-- Create test venues
INSERT INTO venues (owner_id, name, city)
VALUES 
  ('OWNER_ID', 'Test Venue 1', 'City A'),
  ('OWNER_ID', 'Test Venue 2', 'City B'),
  ('OWNER_ID', 'Test Venue 3', 'City C')
RETURNING id, name;

-- Batch verify via UI, then check
SELECT name, is_verified FROM venues WHERE name LIKE 'Test%';
```

---

## 💡 Pro Tips

### Tip 1: Fast Batch Selection
- Click header checkbox to select all on page
- Hold Shift + Click for range selection (browser native)

### Tip 2: Keyboard Shortcuts
- ESC to close modals
- Click backdrop to close panels/modals

### Tip 3: Filter Before Batch
- Use status filters (All/Active/Inactive/Verified/Unverified)
- Search by name/location
- Select matching results → batch action

### Tip 4: Court Verification Badge Colors
- 🟢 Green Shield = Verified (public can see)
- 🟡 Yellow Clock = Pending Verification (owner + admin only)
- ⚫ Gray Ban = Inactive (hidden even if verified)

### Tip 5: Z-Index Hierarchy
- Court Modal (z-60) - Always on top
- Venue Details (z-50) - Below modals
- Main Table (z-0) - Base layer

---

## 🐛 Troubleshooting Quick Fixes

### Can't create venue
```sql
-- Check if Migration 021 applied
SELECT * FROM pg_policies WHERE tablename = 'venues' AND policyname LIKE '%insert%';
```

### Unverified courts showing publicly
```sql
-- Check if Migration 022 applied
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'courts' AND column_name = 'is_verified';
```

### Batch actions not working
1. Check browser console for errors
2. Verify user has global_admin role
3. Check network tab for failed API calls
4. Ensure `batchUpdateVenues` function exists in actions file

### Pending courts page empty
```sql
-- Check if you have unverified courts
SELECT c.name, c.is_verified, v.name as venue_name
FROM courts c
JOIN venues v ON v.id = c.venue_id
WHERE v.owner_id = 'YOUR_USER_ID' AND c.is_verified = false;
```

---

## 📱 Mobile/Responsive Notes

- Batch toolbar wraps on mobile
- Venue details panel takes full screen on mobile
- Court cards stack vertically on small screens
- All features fully functional on touch devices

---

## 🎓 Learn More

- **Full Testing Guide**: [TESTING_VENUE_ENHANCEMENTS.md](./TESTING_VENUE_ENHANCEMENTS.md)
- **Migration Guide**: [APPLY_MIGRATIONS_021_022.md](./APPLY_MIGRATIONS_021_022.md)
- **Complete Summary**: [VENUE_ENHANCEMENTS_SUMMARY.md](./VENUE_ENHANCEMENTS_SUMMARY.md)

---

## ✅ Daily Usage Checklist

### For Global Admins:
- [ ] Check new venue submissions
- [ ] Verify pending courts
- [ ] Review venue statuses
- [ ] Perform batch operations as needed

### For Court Admins:
- [ ] Create venues/courts
- [ ] Monitor pending courts page
- [ ] Update court details after verification

---

## 🎉 You're All Set!

Start by:
1. Applying migrations
2. Testing batch selection
3. Creating an unverified court
4. Verifying it as global admin

**Need Help?** Check the troubleshooting section or refer to detailed testing guide.

**Happy Managing! 🚀**

# Testing Instructions for Venue Management Enhancements

## Prerequisites

Before testing, ensure you have applied all migrations:

```bash
cd backend
# Apply Migration 021 (Global Admin RLS Policies)
# Apply Migration 022 (Court Verification)
```

You need:
- **Global Admin Account** (to test venue management and court verification)
- **Court Admin Account** (to test pending courts page)
- **Player Account** (to verify RLS policies for unverified courts)

---

## Part 1: Batch Selection and Operations

### Test 1.1: Batch Select Venues
1. Log in as **Global Admin**
2. Navigate to **Admin → Venues & Courts**
3. ✅ **Verify**: Checkbox appears in table header
4. ✅ **Verify**: Each venue row has a checkbox

### Test 1.2: Select All Venues
1. Click the header checkbox
2. ✅ **Verify**: All venues on current page are selected
3. ✅ **Verify**: Header text updates to "X venue(s) selected"
4. ✅ **Verify**: Batch action toolbar appears
5. Click header checkbox again
6. ✅ **Verify**: All venues deselected
7. ✅ **Verify**: Batch action toolbar disappears

### Test 1.3: Select Individual Venues
1. Click checkbox for 2-3 individual venues
2. ✅ **Verify**: Selected count updates correctly
3. ✅ **Verify**: Only selected venues have checked checkboxes

### Test 1.4: Batch Activate
1. Select 2+ inactive venues
2. Click **Activate** in batch actions
3. ✅ **Verify**: Success toast appears
4. ✅ **Verify**: Venues no longer show "Inactive" badge
5. ✅ **Verify**: Selection cleared after action

### Test 1.5: Batch Deactivate
1. Select 2+ active venues
2. Click **Deactivate** in batch actions
3. ✅ **Verify**: Success toast appears
4. ✅ **Verify**: Venues show "Inactive" badge

### Test 1.6: Batch Verify
1. Select 2+ unverified venues
2. Click **Verify** in batch actions
3. ✅ **Verify**: Success toast appears
4. ✅ **Verify**: Venues show "Verified" badge (green shield)

### Test 1.7: Batch Delete
1. Select 2+ test venues
2. Click **Delete** in batch actions
3. ✅ **Verify**: Browser confirmation prompt appears
4. Click OK
5. ✅ **Verify**: Venues removed from list
6. ✅ **Verify**: Success toast appears

---

## Part 2: Clickable Table Rows

### Test 2.1: Click Row to View Details
1. On venues page, click anywhere on a venue row (EXCEPT checkbox or actions dropdown)
2. ✅ **Verify**: Venue details panel opens from right
3. ✅ **Verify**: Panel shows venue info, owner, courts, statistics

### Test 2.2: Checkbox Click Doesn't Open Panel
1. Click only the checkbox on a venue row
2. ✅ **Verify**: Checkbox toggles but panel does NOT open

### Test 2.3: Actions Dropdown Doesn't Open Panel
1. Click the actions (three dots) button
2. ✅ **Verify**: Dropdown menu opens but panel does NOT open

### Test 2.4: Multiple Row Clicks
1. Click row A to open panel
2. Click row B while panel A is open
3. ✅ **Verify**: Panel switches to show row B details
4. Close panel with X button
5. ✅ **Verify**: Panel closes completely

---

## Part 3: Modal Z-Index Fix

### Test 3.1: Add Court from Venue Details
1. Open venue details panel
2. Click **Add Court** button
3. ✅ **Verify**: Court form modal appears ABOVE the venue details panel
4. ✅ **Verify**: Modal overlay dims both the table AND the venue details panel
5. ✅ **Verify**: Court form is fully functional (can type, select amenities)

### Test 3.2: Edit Court from Venue Details
1. In venue details panel, click actions (three dots) on a court
2. Select **Edit**
3. ✅ **Verify**: Edit court modal appears above venue details
4. ✅ **Verify**: Form pre-filled with court data
5. Make a change and save
6. ✅ **Verify**: Modal closes and court updates in panel

---

## Part 4: Edit Venue Button in Details Panel

### Test 4.1: Edit Venue from Details Panel
1. Open venue details panel
2. ✅ **Verify**: "Edit Venue" button appears in header (next to close button)
3. Click **Edit Venue** button
4. ✅ **Verify**: Edit venue modal opens
5. ✅ **Verify**: Form pre-filled with venue data (owner, name, address, etc.)
6. Change venue name
7. Click **Update Venue**
8. ✅ **Verify**: Success toast appears
9. ✅ **Verify**: Venue details panel refreshes with new name
10. ✅ **Verify**: Venue list also shows updated name

### Test 4.2: Edit Venue Button Styling
1. Open venue details panel
2. ✅ **Verify**: Button has purple background (matching theme)
3. Hover over button
4. ✅ **Verify**: Button darkens on hover

---

## Part 5: Court Verification Workflow

### Test 5.1: Create Unverified Court (as Court Admin)
1. Log in as **Court Admin**
2. Navigate to **Court Admin → My Venues**
3. Select a venue and click **Add Court**
4. Fill out court form:
   - Name: "Test Court Unverified"
   - Type: Indoor
   - Capacity: 10
   - Hourly Rate: 500
5. Click **Create Court**
6. ✅ **Verify**: Court created successfully
7. ✅ **Verify**: Court shows "Pending Verification" badge (yellow)

### Test 5.2: Verify Court in Pending Courts Page (Court Admin)
1. Still as **Court Admin**, navigate to **Court Admin → Pending Courts**
2. ✅ **Verify**: Page shows alert banner explaining verification requirement
3. ✅ **Verify**: Your unverified court appears in the grid
4. ✅ **Verify**: Court card shows:
   - Yellow "Pending Verification" badge
   - Court details (type, capacity, rate)
   - Venue name
   - Amenities (if any)
   - Submission date

### Test 5.3: Unverified Courts Hidden from Public (Player)
1. Log out and log in as **Player** (or unauthenticated)
2. Navigate to venue listing page (user-facing)
3. Find the venue with the unverified court
4. ✅ **Verify**: Unverified court does NOT appear in court listings
5. ✅ **Verify**: Only verified courts are visible

### Test 5.4: Court Owner Sees Own Unverified Courts
1. Log in as **Court Admin** (owner)
2. Navigate to **Court Admin → My Venues**
3. View venue with unverified court
4. ✅ **Verify**: Unverified court IS visible to owner
5. ✅ **Verify**: Shows "Pending Verification" badge

### Test 5.5: Verify Court (as Global Admin)
1. Log in as **Global Admin**
2. Navigate to **Admin → Venues & Courts**
3. Click on venue with unverified court
4. In venue details panel, find the unverified court
5. ✅ **Verify**: Court shows "Pending Verification" badge
6. Click actions (three dots) on court
7. ✅ **Verify**: Dropdown includes **Verify** option
8. Click **Verify**
9. ✅ **Verify**: Success toast appears
10. ✅ **Verify**: Court badge changes to "Verified" (green shield)

### Test 5.6: Verified Court Now Public
1. Log out and log in as **Player**
2. Navigate to venue listing
3. ✅ **Verify**: Previously unverified court NOW appears
4. ✅ **Verify**: Court is bookable

### Test 5.7: Unverify Court (as Global Admin)
1. Log in as **Global Admin**
2. Open venue details with verified court
3. Click actions on court → **Unverify**
4. ✅ **Verify**: Badge changes back to "Pending Verification"
5. ✅ **Verify**: Court hidden from public again

---

## Part 6: Pending Courts Page (Court Admin)

### Test 6.1: Empty State
1. Log in as **Court Admin** with all courts verified
2. Navigate to **Court Admin → Pending Courts**
3. ✅ **Verify**: Shows "All Courts Verified" message
4. ✅ **Verify**: Shield icon displayed
5. ✅ **Verify**: No courts in list

### Test 6.2: Multiple Pending Courts
1. As **Court Admin**, create 3 new courts
2. Navigate to **Pending Courts** page
3. ✅ **Verify**: All 3 courts appear
4. ✅ **Verify**: Courts display in grid (responsive)
5. ✅ **Verify**: Each card shows complete information

### Test 6.3: Pending Courts Sidebar Navigation
1. In court admin dashboard
2. ✅ **Verify**: "Pending Courts" appears in sidebar
3. ✅ **Verify**: Clock icon displayed
4. Hover over sidebar
5. ✅ **Verify**: "Pending Courts" label expands
6. Click **Pending Courts**
7. ✅ **Verify**: Navigates to pending courts page
8. ✅ **Verify**: Menu item highlighted as active

---

## Part 7: Integration Tests

### Test 7.1: Complete Workflow - Court Admin
1. Log in as **Court Admin**
2. Create a new venue
3. Add 2 courts to venue
4. ✅ **Verify**: Both courts appear in "Pending Courts"
5. Log in as **Global Admin**
6. Verify both courts
7. Log back in as **Court Admin**
8. ✅ **Verify**: Pending courts page now empty
9. ✅ **Verify**: Courts visible in "My Venues"

### Test 7.2: Complete Workflow - Global Admin
1. Log in as **Global Admin**
2. Navigate to **Venues & Courts**
3. Select 3 venues (mix of active/inactive, verified/unverified)
4. Batch verify all
5. ✅ **Verify**: All show verified badge
6. Click on one venue row
7. ✅ **Verify**: Details panel opens
8. Click **Edit Venue**
9. Update venue details
10. ✅ **Verify**: Panel refreshes with new data
11. Add a new court
12. ✅ **Verify**: Court modal appears above panel
13. Create court
14. ✅ **Verify**: Court appears in panel
15. Verify the new court
16. ✅ **Verify**: Badge updates to verified

### Test 7.3: RLS Policy Verification
1. Log in as **Court Admin A**
2. Create unverified court in venue A
3. Log in as **Court Admin B** (different admin)
4. Navigate to venue listing
5. ✅ **Verify**: Admin B cannot see Admin A's unverified court
6. Log in as **Global Admin**
7. ✅ **Verify**: Global admin CAN see all unverified courts

---

## Part 8: Edge Cases and Error Handling

### Test 8.1: Delete Venue with Unverified Courts
1. As **Global Admin**, find venue with unverified courts
2. Delete venue
3. ✅ **Verify**: Venue and courts deleted (CASCADE)
4. ✅ **Verify**: No orphaned courts in database

### Test 8.2: Batch Operations on Mixed Selection
1. Select 3 venues: 1 verified, 2 unverified
2. Batch verify
3. ✅ **Verify**: All 3 now verified
4. Select same 3 venues + 2 more
5. Batch delete
6. ✅ **Verify**: All 5 deleted

### Test 8.3: Rapid Click Actions
1. Click venue row quickly multiple times
2. ✅ **Verify**: Panel opens only once, no errors
3. Click Edit Venue, immediately click X
4. ✅ **Verify**: Modal closes properly

### Test 8.4: Modal Stack Cleanup
1. Open venue details panel
2. Click Edit Venue
3. Press ESC or click backdrop
4. ✅ **Verify**: Only edit modal closes, panel remains
5. Click Add Court
6. Cancel court creation
7. ✅ **Verify**: Returns to panel, not main page

---

## Part 9: Responsive Testing

### Test 9.1: Mobile View - Batch Actions
1. Resize browser to mobile width (< 768px)
2. ✅ **Verify**: Checkboxes still functional
3. ✅ **Verify**: Batch actions toolbar wraps gracefully
4. ✅ **Verify**: All buttons accessible

### Test 9.2: Tablet View - Pending Courts
1. View pending courts page on tablet (768-1024px)
2. ✅ **Verify**: Courts display in 2-column grid
3. ✅ **Verify**: All information readable

### Test 9.3: Mobile - Venue Details Panel
1. Open venue details on mobile
2. ✅ **Verify**: Panel takes full screen
3. ✅ **Verify**: Edit Venue button accessible
4. ✅ **Verify**: Court cards stack vertically

---

## Part 10: Performance Testing

### Test 10.1: Large Dataset - Batch Select
1. Create or navigate to page with 20+ venues
2. Click "Select All"
3. ✅ **Verify**: Selection completes quickly (< 1s)
4. Perform batch action
5. ✅ **Verify**: Action completes and refreshes

### Test 10.2: Pending Courts - Many Items
1. As **Court Admin**, create 20+ unverified courts
2. Navigate to Pending Courts page
3. ✅ **Verify**: Page loads reasonably fast
4. ✅ **Verify**: Grid renders all items
5. ✅ **Verify**: No layout breaking or overlap

---

## Bug Reporting Template

If you find issues during testing, please report with:

```
**Feature**: [e.g., Batch Selection]
**Test**: [e.g., Test 1.4 - Batch Activate]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Steps to Reproduce**:
1. 
2. 
3. 
**Browser/Device**: [e.g., Chrome 120 / macOS]
**User Role**: [Global Admin / Court Admin / Player]
**Screenshots**: [If applicable]
```

---

## Summary Checklist

Before marking testing complete, ensure:

- [ ] All migrations applied successfully
- [ ] Batch selection works for venues
- [ ] All batch operations (activate, deactivate, verify, delete) functional
- [ ] Clicking venue rows opens details panel
- [ ] Checkboxes and actions don't trigger row click
- [ ] Court modal appears above venue details panel
- [ ] Edit Venue button in details panel works
- [ ] Courts start as unverified by default
- [ ] Unverified courts hidden from public/non-owners
- [ ] Court admins see their unverified courts
- [ ] Global admins can verify/unverify courts
- [ ] Pending Courts page shows correct data
- [ ] Pending Courts link in court admin sidebar
- [ ] All RLS policies enforced correctly
- [ ] No console errors during normal operation
- [ ] Responsive layouts work on mobile/tablet
- [ ] Performance acceptable with realistic data volumes

---

## Clean Up After Testing

```sql
-- If you need to reset test data
DELETE FROM courts WHERE name LIKE '%Test%';
DELETE FROM venues WHERE name LIKE '%Test%';

-- Re-verify existing courts (if needed)
UPDATE courts SET is_verified = true WHERE is_verified = false;
```

---

## Questions or Issues?

If you encounter any problems during testing:
1. Check browser console for errors
2. Verify all migrations were applied
3. Confirm user has correct roles assigned
4. Review RLS policies in Supabase dashboard
5. Check network tab for failed API calls

**Happy Testing! 🎉**

# Venue Ratings & Reviews System - Testing Guide

## Overview
Complete testing guide for the newly implemented venue ratings and reviews system.

## Features Implemented

### 1. Review Submission
- ✅ Server action: `submitCourtReview()` in `/web/src/app/actions/review-actions.ts`
- ✅ Form component: `SubmitReviewForm` with star ratings and text input
- ✅ Modal wrapper: `ReviewModal` with eligibility checking
- ✅ Permission check: Users can only review venues with confirmed bookings
- ✅ Rate limiting: 3 reviews per hour per user
- ✅ Auto-verification: Reviews from confirmed bookings marked as verified
- ✅ Notifications: Venue owners notified when reviews are received

### 2. Review Display & Filtering
- ✅ Enhanced `ReviewsSection` component with:
  - Rating distribution chart (clickable bars)
  - Filter buttons (All, 5★, 4★, 3★, 2★, 1★)
  - Sort options (Newest, Highest Rated, Lowest Rated)
  - Load more pagination (5 reviews at a time)
  - Overall stats dashboard

### 3. Integration Points
- ✅ Venue detail page: "Write Review" button in reviews section
- ✅ Bookings page: "Write Review" button for past confirmed bookings

---

## Testing Prerequisites

### Required Data
1. **User Account** with confirmed bookings
2. **Venue** with at least one court
3. **Completed Booking** (status: 'confirmed', past date)

### Test User Setup
Run this in Supabase SQL Editor to create test data:

```sql
-- 1. Get your user ID (logged in user)
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Create a test venue (if needed)
INSERT INTO venues (name, description, address, city, latitude, longitude, is_active, owner_id)
VALUES (
  'Test Badminton Court',
  'Test venue for reviews',
  '123 Test Street',
  'Zamboanga City',
  6.9214,
  122.0790,
  true,
  (SELECT id FROM profiles WHERE email = 'admin@rallio.com' LIMIT 1)
)
RETURNING id;

-- 3. Create a court
INSERT INTO courts (venue_id, name, court_type, hourly_rate, is_active)
VALUES (
  '<venue_id_from_above>',
  'Test Court 1',
  'indoor',
  300,
  true
)
RETURNING id;

-- 4. Create a past confirmed booking for your user
INSERT INTO reservations (
  user_id,
  court_id,
  start_time,
  end_time,
  status,
  total_amount,
  amount_paid,
  num_players,
  payment_type
)
VALUES (
  '<your_user_id>',
  '<court_id_from_above>',
  NOW() - INTERVAL '2 days', -- 2 days ago
  NOW() - INTERVAL '2 days' + INTERVAL '2 hours', -- 2 hour duration
  'confirmed',
  600.00,
  600.00,
  2,
  'full'
)
RETURNING id;
```

---

## Test Cases

### Test 1: Submit Review from Venue Page

**Steps:**
1. Navigate to `/courts/<venue_id>`
2. Scroll to "Reviews & Ratings" section
3. Click "Write Review" button (top right)
4. **Expected:** Modal opens with eligibility check
5. **If eligible:** Form displays with venue/court name
6. **If not eligible:** Error message explaining why (no bookings, already reviewed, etc.)

**Test Review Submission:**
1. Click stars to set overall rating (required)
2. Optionally set breakdown ratings (quality, cleanliness, facilities, value)
3. Optionally write review text (max 1000 chars)
4. Click "Submit Review"
5. **Expected:**
   - Loading spinner shows
   - Success message appears
   - Modal auto-closes after 1.5 seconds
   - Page revalidates and shows new review

**Edge Cases to Test:**
- Try submitting without overall rating (should show error)
- Try submitting with only overall rating (should succeed)
- Try submitting with all fields filled (should succeed)
- Check character counter for review text

### Test 2: Submit Review from Bookings Page

**Steps:**
1. Navigate to `/bookings`
2. Find a past confirmed booking (booking date in the past)
3. Look for "Write Review" button below booking details
4. **Expected:** Yellow button with star icon visible
5. Click "Write Review"
6. **Expected:** Same review modal opens

**Validation:**
- Future bookings should NOT show review button
- Cancelled bookings should NOT show review button
- Only confirmed/paid past bookings show review button

### Test 3: Permission Checks

**Test Scenario: No Bookings**
1. Create new user account with no bookings
2. Navigate to any venue page
3. Click "Write Review"
4. **Expected:** Modal shows "Cannot Submit Review" with message:
   - "You can only review venues where you have confirmed bookings"

**Test Scenario: Already Reviewed**
1. Submit a review for a venue
2. Try to write another review for the same venue
3. **Expected:** Modal shows "Cannot Submit Review" with message:
   - "You have already submitted a review for this court"

**Test Scenario: Rate Limit**
1. Submit 3 reviews in quick succession
2. Try to submit a 4th review
3. **Expected:** Error message:
   - "Too many review submissions. Please wait X seconds."

### Test 4: Review Filtering

**Steps:**
1. Navigate to venue with multiple reviews (different star ratings)
2. In "Reviews & Ratings" section, observe:
   - Overall stats (average rating, total reviews)
   - Rating distribution chart with bars
   - Filter buttons (All, 5★, 4★, etc.)

**Test Filtering:**
1. Click "5★" filter button
   - **Expected:** Only 5-star reviews display
   - Button highlighted in blue
   - Review count updates
2. Click rating bar in distribution chart
   - **Expected:** Same as clicking filter button
3. Click "All" or click same filter again
   - **Expected:** Filter clears, all reviews show

**Test Edge Case:**
1. Filter to rating with no reviews (e.g., 1★ with 0 reviews)
   - **Expected:** Empty state message
   - "No reviews match your filter"
   - "Clear filter" button appears

### Test 5: Review Sorting

**Steps:**
1. Navigate to venue with 5+ reviews
2. Use sort dropdown (top right of reviews)
3. Test each option:

**Newest First (default):**
- Reviews ordered by created_at DESC
- Most recent review at top

**Highest Rated:**
- Reviews ordered by overall_rating DESC
- 5-star reviews first, then 4-star, etc.

**Lowest Rated:**
- Reviews ordered by overall_rating ASC
- 1-star reviews first

### Test 6: Load More Pagination

**Steps:**
1. Navigate to venue with 10+ reviews
2. **Expected:** Only 5 reviews initially displayed
3. "Load More Reviews (X remaining)" button visible at bottom
4. Click "Load More"
   - **Expected:** Next 5 reviews appear
   - Button updates count or disappears if all loaded

**Test with Filters:**
1. Apply 5★ filter with 10+ five-star reviews
2. **Expected:** Still paginated (5 at a time)
3. Load more shows next 5-star reviews only

### Test 7: Venue Owner Notification

**Steps:**
1. Submit a review as a regular user
2. Log in as the venue owner account
3. Check `/notifications` or notification bell
4. **Expected:** Notification appears:
   - Type: "venue_review_received"
   - Title: "New Review Received"
   - Message: "[X] ★ review for [Court Name] at [Venue Name]"
   - Action URL: `/court-admin/venues/<venue_id>?tab=reviews`

### Test 8: Court Admin Review Management

**Steps:**
1. Log in as venue owner/court admin
2. Navigate to `/court-admin/venues/<venue_id>?tab=reviews`
3. **Expected:** See all reviews for the venue
4. **Expected:** Can respond to reviews (existing feature)

---

## SQL Queries for Testing

### Check Review Submission
```sql
-- View all reviews for a court
SELECT 
  cr.id,
  cr.overall_rating,
  cr.review,
  cr.is_verified,
  cr.created_at,
  p.display_name as reviewer_name,
  c.name as court_name,
  v.name as venue_name
FROM court_ratings cr
JOIN profiles p ON cr.user_id = p.id
JOIN courts c ON cr.court_id = c.id
JOIN venues v ON c.venue_id = v.id
WHERE c.id = '<court_id>'
ORDER BY cr.created_at DESC;
```

### Check User's Reviews
```sql
-- See all reviews submitted by a user
SELECT 
  cr.*,
  c.name as court_name,
  v.name as venue_name
FROM court_ratings cr
JOIN courts c ON cr.court_id = c.id
JOIN venues v ON c.venue_id = v.id
WHERE cr.user_id = '<user_id>'
ORDER BY cr.created_at DESC;
```

### Check Notifications
```sql
-- View venue review notifications
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.action_url,
  n.is_read,
  n.created_at,
  p.email as recipient_email
FROM notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.type = 'venue_review_received'
ORDER BY n.created_at DESC
LIMIT 20;
```

### Simulate Past Booking
```sql
-- Create a past confirmed booking for testing
INSERT INTO reservations (
  user_id,
  court_id,
  start_time,
  end_time,
  status,
  total_amount,
  amount_paid,
  num_players,
  payment_type
)
VALUES (
  '<your_user_id>',
  '<court_id>',
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week' + INTERVAL '2 hours',
  'confirmed',
  600.00,
  600.00,
  2,
  'full'
);
```

### Delete Test Review
```sql
-- Remove a test review (if needed)
DELETE FROM court_ratings
WHERE id = '<review_id>';
```

---

## Expected Behaviors Summary

| Scenario | Expected Behavior |
|----------|------------------|
| User with confirmed booking | Can submit review |
| User with no bookings | Cannot submit review - error shown |
| User who already reviewed | Cannot submit again - error shown |
| Rating 1-5 stars required | Form validates before submission |
| Breakdown ratings optional | Can submit with only overall rating |
| Review text optional | Can submit without written review |
| Rate limit (3/hour) | Shows error after 3 submissions |
| Reviews auto-verified | `is_verified = true` for confirmed bookings |
| Venue owner notified | Receives notification when review submitted |
| Filtering by stars | Only selected rating reviews display |
| Sorting | Reviews reorder based on selected sort |
| Pagination | Shows 5 reviews at a time, load more button |
| Empty states | Appropriate messages when no reviews/filtered |

---

## Troubleshooting

### Review doesn't appear after submission
1. Check browser console for errors
2. Verify `revalidatePath()` is working
3. Try hard refresh (Cmd+Shift+R)
4. Check if review was inserted in database

### Cannot submit review despite having booking
1. Verify booking status is 'confirmed' or 'paid'
2. Check booking start_time is in the past
3. Ensure no existing review for that court_id + user_id

### Notification not received
1. Check `notifications` table in database
2. Verify venue has correct `owner_id`
3. Check notification service logs

### Filtering/sorting not working
1. Check browser console for JavaScript errors
2. Verify `filteredReviews` state is updating
3. Test with different review data

---

## Success Criteria

- ✅ Users can submit reviews from venue page
- ✅ Users can submit reviews from bookings page
- ✅ Permission checks work correctly
- ✅ Rate limiting prevents spam
- ✅ Reviews appear immediately after submission
- ✅ Filtering works for all star ratings
- ✅ Sorting reorders reviews correctly
- ✅ Pagination loads more reviews
- ✅ Venue owners receive notifications
- ✅ Review stats calculate correctly
- ✅ Empty states display appropriately
- ✅ Form validation prevents invalid submissions

---

## Next Steps After Testing

1. **Create more test data** - Add 10-20 reviews with varied ratings
2. **Test Court Admin response feature** - Existing feature, ensure still works
3. **Mobile testing** - Test on mobile devices/responsive view
4. **Performance testing** - Test with 100+ reviews
5. **User acceptance testing** - Get feedback from real users

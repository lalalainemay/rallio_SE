-- Quick Setup Script for Testing Ratings & Reviews System
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Get your current user ID
-- ============================================
-- Copy your user_id from the output
SELECT 
  id as user_id, 
  email,
  'Copy this user_id for the next steps ↓' as instruction
FROM auth.users 
WHERE email = auth.email(); -- Your logged-in email

-- ============================================
-- STEP 2: Find an existing venue or create one
-- ============================================
-- Option A: Use existing venue
SELECT 
  v.id as venue_id,
  v.name,
  c.id as court_id,
  c.name as court_name,
  'Use this venue_id and court_id ↓' as instruction
FROM venues v
JOIN courts c ON c.venue_id = v.id
WHERE v.is_active = true
LIMIT 1;

-- Option B: Create test venue (if no venues exist)
-- Uncomment below if needed:
/*
INSERT INTO venues (name, description, address, city, latitude, longitude, is_active)
VALUES (
  'Test Badminton Arena',
  'Test venue for reviews',
  '123 Test Avenue, Barangay Test',
  'Zamboanga City',
  6.9214,
  122.0790,
  true
)
RETURNING id, name;

-- Then create a court for this venue
INSERT INTO courts (venue_id, name, court_type, hourly_rate, is_active)
VALUES (
  '<paste_venue_id_here>',
  'Test Court 1',
  'indoor',
  300,
  true
)
RETURNING id, name;
*/

-- ============================================
-- STEP 3: Create past confirmed bookings
-- ============================================
-- Replace <your_user_id> and <court_id> with values from above

-- Booking 1: 3 days ago (confirmed - ready for review)
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
  '<your_user_id>',  -- Replace with your user_id
  '<court_id>',      -- Replace with court_id
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
  'confirmed',
  600.00,
  600.00,
  2,
  'full'
);

-- Booking 2: 1 week ago (confirmed - ready for review)
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
  '<your_user_id>',  -- Replace with your user_id
  '<court_id>',      -- Replace with court_id
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week' + INTERVAL '2 hours',
  'confirmed',
  600.00,
  600.00,
  2,
  'full'
);

-- Booking 3: Future booking (should NOT show review button)
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
  '<your_user_id>',  -- Replace with your user_id
  '<court_id>',      -- Replace with court_id
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days' + INTERVAL '2 hours',
  'confirmed',
  600.00,
  600.00,
  2,
  'full'
);

-- ============================================
-- STEP 4: Verify bookings created
-- ============================================
SELECT 
  r.id,
  r.start_time,
  r.status,
  CASE 
    WHEN r.start_time < NOW() THEN '✅ Past (can review)'
    ELSE '❌ Future (no review button)'
  END as review_eligible,
  c.name as court_name,
  v.name as venue_name
FROM reservations r
JOIN courts c ON r.court_id = c.id
JOIN venues v ON c.venue_id = v.id
WHERE r.user_id = '<your_user_id>'  -- Replace with your user_id
ORDER BY r.start_time DESC;

-- ============================================
-- OPTIONAL: Create sample reviews from other users
-- ============================================
-- This will populate the venue with existing reviews
-- You'll need to create test users first or use existing user IDs

-- Example: Create 5-star review
/*
INSERT INTO court_ratings (
  user_id,
  court_id,
  reservation_id,
  overall_rating,
  quality_rating,
  cleanliness_rating,
  facilities_rating,
  value_rating,
  review,
  is_verified
)
VALUES (
  '<another_user_id>',
  '<court_id>',
  NULL, -- Or link to their reservation
  5,
  5,
  5,
  5,
  5,
  'Excellent court! Very clean and well-maintained. Staff was friendly and helpful.',
  true
);
*/

-- ============================================
-- CLEANUP: Delete test data (run when done testing)
-- ============================================
/*
-- Delete test reviews
DELETE FROM court_ratings 
WHERE user_id = '<your_user_id>';

-- Delete test reservations
DELETE FROM reservations 
WHERE user_id = '<your_user_id>' 
  AND court_id = '<court_id>';

-- Delete test court/venue (if you created them)
DELETE FROM courts WHERE id = '<court_id>';
DELETE FROM venues WHERE id = '<venue_id>';
*/

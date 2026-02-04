-- =====================================================
-- RALLIO SEED DATA - ZAMBOANGA CITY (ROLES, AMENITIES, VENUES, RATINGS)
-- =====================================================
-- This script inserts:
-- 1. User Roles (if missing)
-- 2. Amenities (if missing)
-- 3. Venues (Zamboanga City locations)
-- 4. Courts
-- 5. Court Amenities
-- 6. Discount Rules
-- 7. Sample Ratings (without bookings)
--
-- It does NOT insert:
-- - New Users (uses existing profiles)
-- - Reservations/Bookings
-- - Queue Sessions/Matches
-- =====================================================

DO $$
DECLARE
    -- User IDs (we will find existing ones)
    owner_id UUID;
    rater_id UUID;
    
    -- Role IDs
    r_player UUID;
    r_court_admin UUID;
    r_queue_master UUID;
    r_global_admin UUID;

    -- Venue IDs (generated)
    v_malagutay_id UUID := gen_random_uuid();
    v_canelar_id UUID := gen_random_uuid();
    v_tetuan_id UUID := gen_random_uuid();
    v_sta_maria_id UUID := gen_random_uuid();
    v_tumaga_id UUID := gen_random_uuid();
    v_pasonanca_id UUID := gen_random_uuid();
    v_divisoria_id UUID := gen_random_uuid();
    v_ayala_id UUID := gen_random_uuid();
    
    -- Court IDs (generated)
    c_malagutay_1 UUID := gen_random_uuid();
    c_malagutay_2 UUID := gen_random_uuid();
    c_canelar_1 UUID := gen_random_uuid();
    c_canelar_2 UUID := gen_random_uuid();
    c_canelar_3 UUID := gen_random_uuid();
    c_tetuan_1 UUID := gen_random_uuid();
    c_tetuan_2 UUID := gen_random_uuid();
    c_sta_maria_1 UUID := gen_random_uuid();
    c_sta_maria_2 UUID := gen_random_uuid();
    c_tumaga_1 UUID := gen_random_uuid();
    c_tumaga_2 UUID := gen_random_uuid();
    c_tumaga_3 UUID := gen_random_uuid();
    c_pasonanca_1 UUID := gen_random_uuid();
    c_pasonanca_2 UUID := gen_random_uuid();
    c_divisoria_1 UUID := gen_random_uuid();
    c_divisoria_2 UUID := gen_random_uuid();
    c_ayala_1 UUID := gen_random_uuid();
    c_ayala_2 UUID := gen_random_uuid();
    c_ayala_3 UUID := gen_random_uuid();
    c_ayala_4 UUID := gen_random_uuid();
    
    -- Amenity IDs
    a_parking UUID;
    a_restroom UUID;
    a_shower UUID;
    a_lockers UUID;
    a_water UUID;
    a_aircon UUID;
    a_lighting UUID;
    a_waiting UUID;
    a_equipment UUID;
    a_firstaid UUID;
    a_wifi UUID;
    a_canteen UUID;
    
BEGIN
    -- =====================================================
    -- 1. ENSURE ROLES EXIST
    -- =====================================================
    RAISE NOTICE 'Checking Roles...';
    
    -- Insert roles if they don't exist and capture IDs
    INSERT INTO roles (name, description) VALUES ('player', 'Regular player who can book courts and join queues') ON CONFLICT (name) DO NOTHING;
    SELECT id INTO r_player FROM roles WHERE name = 'player';
    
    INSERT INTO roles (name, description) VALUES ('court_admin', 'Court/venue owner who manages their facilities') ON CONFLICT (name) DO NOTHING;
    SELECT id INTO r_court_admin FROM roles WHERE name = 'court_admin';
    
    INSERT INTO roles (name, description) VALUES ('queue_master', 'User who can create and manage queue sessions') ON CONFLICT (name) DO NOTHING;
    SELECT id INTO r_queue_master FROM roles WHERE name = 'queue_master';
    
    INSERT INTO roles (name, description) VALUES ('global_admin', 'Platform administrator with full access') ON CONFLICT (name) DO NOTHING;
    SELECT id INTO r_global_admin FROM roles WHERE name = 'global_admin';
    
    -- =====================================================
    -- 2. ENSURE AMENITIES EXIST
    -- =====================================================
    RAISE NOTICE 'Checking Amenities...';
    
    INSERT INTO amenities (name, icon, description) VALUES 
        ('Parking', 'car', 'On-site parking available'),
        ('Restroom', 'bath', 'Clean restroom facilities'),
        ('Shower', 'shower-head', 'Shower facilities available'),
        ('Lockers', 'lock', 'Secure locker storage'),
        ('Water', 'droplet', 'Drinking water/water dispenser'),
        ('Air Conditioning', 'snowflake', 'Air-conditioned facility'),
        ('Lighting', 'lightbulb', 'Good lighting for night play'),
        ('Waiting Area', 'armchair', 'Comfortable waiting area'),
        ('Equipment Rental', 'package', 'Racket and shuttlecock rental'),
        ('First Aid', 'heart-pulse', 'First aid kit available'),
        ('WiFi', 'wifi', 'Free WiFi available'),
        ('Canteen', 'utensils', 'Food and drinks available')
    ON CONFLICT (name) DO NOTHING;

    -- Capture Amenity IDs
    SELECT id INTO a_parking FROM amenities WHERE name = 'Parking';
    SELECT id INTO a_restroom FROM amenities WHERE name = 'Restroom';
    SELECT id INTO a_shower FROM amenities WHERE name = 'Shower';
    SELECT id INTO a_lockers FROM amenities WHERE name = 'Lockers';
    SELECT id INTO a_water FROM amenities WHERE name = 'Water';
    SELECT id INTO a_aircon FROM amenities WHERE name = 'Air Conditioning';
    SELECT id INTO a_lighting FROM amenities WHERE name = 'Lighting';
    SELECT id INTO a_waiting FROM amenities WHERE name = 'Waiting Area';
    SELECT id INTO a_equipment FROM amenities WHERE name = 'Equipment Rental';
    SELECT id INTO a_firstaid FROM amenities WHERE name = 'First Aid';
    SELECT id INTO a_wifi FROM amenities WHERE name = 'WiFi';
    SELECT id INTO a_canteen FROM amenities WHERE name = 'Canteen';

    -- =====================================================
    -- 3. GET EXISTING USER FOR OWNER & RATER
    -- =====================================================
    
    -- Try to find a user with court_admin role, otherwise fallback to any user
    SELECT p.id INTO owner_id 
    FROM profiles p 
    JOIN user_roles ur ON p.id = ur.user_id 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name = 'court_admin' 
    LIMIT 1;
    
    IF owner_id IS NULL THEN
        SELECT id INTO owner_id FROM profiles LIMIT 1;
    END IF;

    -- Get a user for ratings (can be the same or different)
    SELECT id INTO rater_id FROM profiles WHERE id != owner_id LIMIT 1;
    IF rater_id IS NULL THEN rater_id := owner_id; END IF;
    
    IF owner_id IS NULL THEN
        RAISE NOTICE '⚠️ No profiles found. Please create at least one user account first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using owner_id: %', owner_id;

    -- =====================================================
    -- 4. INSERT VENUES (Zamboanga City)
    -- =====================================================
    RAISE NOTICE 'Inserting Venues...';

    -- 1. Malagutay Badminton Club
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (v_malagutay_id, owner_id, 'Malagutay Badminton Club', 'Premier badminton facility in Malagutay with professional-grade courts. Perfect for serious players and casual games alike. Air-conditioned indoor courts with excellent lighting.', 'Purok 5, Barangay Malagutay, Zamboanga City', 'Zamboanga City', 6.9547, 122.0631, '+63 917 123 4567', 'malagutay.badminton@gmail.com', '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "23:00"}, "sunday": {"open": "07:00", "close": "21:00"}}', true, true, true)
    ON CONFLICT DO NOTHING;
    
    -- 2. Canelar Sports Complex
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (v_canelar_id, owner_id, 'Canelar Sports Complex', 'Multi-sport complex featuring 3 indoor badminton courts. Located in the heart of Canelar with easy access from downtown.', 'Don Alfaro Street, Barangay Canelar, Zamboanga City', 'Zamboanga City', 6.9134, 122.0738, '+63 927 234 5678', 'canelar.sports@gmail.com', '{"monday": {"open": "05:00", "close": "21:00"}, "tuesday": {"open": "05:00", "close": "21:00"}, "wednesday": {"open": "05:00", "close": "21:00"}, "thursday": {"open": "05:00", "close": "21:00"}, "friday": {"open": "05:00", "close": "21:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "20:00"}}', true, true, false)
    ON CONFLICT DO NOTHING;
    
    -- 3. Tetuan Badminton Center
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (v_tetuan_id, owner_id, 'Tetuan Badminton Center', 'Modern badminton center in the bustling Tetuan district. Features synthetic flooring and bright LED lighting.', 'Governor Lim Avenue, Barangay Tetuan, Zamboanga City', 'Zamboanga City', 6.9089, 122.0689, '+63 938 345 6789', 'tetuan.badminton@gmail.com', '{"monday": {"open": "08:00", "close": "22:00"}, "tuesday": {"open": "08:00", "close": "22:00"}, "wednesday": {"open": "08:00", "close": "22:00"}, "thursday": {"open": "08:00", "close": "22:00"}, "friday": {"open": "08:00", "close": "23:00"}, "saturday": {"open": "07:00", "close": "23:00"}, "sunday": {"open": "08:00", "close": "21:00"}}', true, true, true)
    ON CONFLICT DO NOTHING;
    
    -- 4. Sta. Maria Gym & Badminton Courts
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (v_sta_maria_id, owner_id, 'Sta. Maria Gym & Badminton Courts', 'Community gym with dedicated badminton courts. Affordable rates for local residents.', 'Barangay Hall Road, Sta. Maria, Zamboanga City', 'Zamboanga City', 6.9245, 122.0512, '+63 945 456 7890', 'stamaria.gym@gmail.com', '{"monday": {"open": "06:00", "close": "20:00"}, "tuesday": {"open": "06:00", "close": "20:00"}, "wednesday": {"open": "06:00", "close": "20:00"}, "thursday": {"open": "06:00", "close": "20:00"}, "friday": {"open": "06:00", "close": "20:00"}, "saturday": {"open": "07:00", "close": "21:00"}, "sunday": {"open": "07:00", "close": "18:00"}}', true, true, false)
    ON CONFLICT DO NOTHING;

    -- 5. Tumaga Sports Hub
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (v_tumaga_id, owner_id, 'Tumaga Sports Hub', 'Full-service sports facility with 3 badminton courts. Located in the peaceful Tumaga neighborhood.', 'National Highway, Barangay Tumaga, Zamboanga City', 'Zamboanga City', 6.9412, 122.1023, '+63 956 567 8901', 'tumaga.sports@gmail.com', '{"monday": {"open": "05:30", "close": "21:30"}, "tuesday": {"open": "05:30", "close": "21:30"}, "wednesday": {"open": "05:30", "close": "21:30"}, "thursday": {"open": "05:30", "close": "21:30"}, "friday": {"open": "05:30", "close": "22:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "20:00"}}', true, true, true)
    ON CONFLICT DO NOTHING;
    
    -- 6. Pasonanca Park Badminton Courts
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (v_pasonanca_id, owner_id, 'Pasonanca Park Badminton Courts', 'Outdoor courts nestled in the scenic Pasonanca Park area. Enjoy badminton with a view of the mountains.', 'Pasonanca Road, Barangay Pasonanca, Zamboanga City', 'Zamboanga City', 6.9523, 122.0234, '+63 967 678 9012', 'pasonanca.courts@gmail.com', '{"monday": {"open": "06:00", "close": "18:00"}, "tuesday": {"open": "06:00", "close": "18:00"}, "wednesday": {"open": "06:00", "close": "18:00"}, "thursday": {"open": "06:00", "close": "18:00"}, "friday": {"open": "06:00", "close": "18:00"}, "saturday": {"open": "06:00", "close": "18:00"}, "sunday": {"open": "06:00", "close": "17:00"}}', true, false, false)
    ON CONFLICT DO NOTHING;

    -- 7. Divisoria Badminton Arena
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (v_divisoria_id, owner_id, 'Divisoria Badminton Arena', 'Conveniently located near the Divisoria market area. Budget-friendly courts popular with students.', 'Rizal Street, Divisoria, Zamboanga City', 'Zamboanga City', 6.9156, 122.0745, '+63 978 789 0123', 'divisoria.badminton@gmail.com', '{"monday": {"open": "07:00", "close": "21:00"}, "tuesday": {"open": "07:00", "close": "21:00"}, "wednesday": {"open": "07:00", "close": "21:00"}, "thursday": {"open": "07:00", "close": "21:00"}, "friday": {"open": "07:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "22:00"}, "sunday": {"open": "08:00", "close": "20:00"}}', true, true, true)
    ON CONFLICT DO NOTHING;

    -- 8. KCC Badminton Complex
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (v_ayala_id, owner_id, 'KCC Badminton Complex', 'Premium badminton facility near KCC Mall. Features 4 professional courts with maple flooring.', 'Mayor Jaldon Street, Barangay Canelar, Zamboanga City', 'Zamboanga City', 6.9098, 122.0612, '+63 989 890 1234', 'kcc.badminton@gmail.com', '{"monday": {"open": "09:00", "close": "22:00"}, "tuesday": {"open": "09:00", "close": "22:00"}, "wednesday": {"open": "09:00", "close": "22:00"}, "thursday": {"open": "09:00", "close": "22:00"}, "friday": {"open": "09:00", "close": "23:00"}, "saturday": {"open": "08:00", "close": "23:00"}, "sunday": {"open": "09:00", "close": "21:00"}}', true, true, true)
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 5. INSERT COURTS
    -- =====================================================
    RAISE NOTICE 'Inserting Courts...';

    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_malagutay_1, v_malagutay_id, 'Court 1', 'Main court with premium synthetic flooring', 'Synthetic', 'indoor', 4, 150.00, true),
        (c_malagutay_2, v_malagutay_id, 'Court 2', 'Secondary court with vinyl mat', 'Vinyl', 'indoor', 4, 120.00, true),
        (c_canelar_1, v_canelar_id, 'Court A', 'Competition-grade synthetic court', 'Synthetic', 'indoor', 4, 180.00, true),
        (c_canelar_2, v_canelar_id, 'Court B', 'Standard court for practice', 'Vinyl', 'indoor', 4, 140.00, true),
        (c_canelar_3, v_canelar_id, 'Court C', 'Training court', 'Vinyl', 'indoor', 4, 140.00, true),
        (c_tetuan_1, v_tetuan_id, 'Court 1', 'Air-conditioned premium court', 'Synthetic', 'indoor', 4, 200.00, true),
        (c_tetuan_2, v_tetuan_id, 'Court 2', 'Standard indoor court', 'Vinyl', 'indoor', 4, 160.00, true),
        (c_sta_maria_1, v_sta_maria_id, 'Main Court', 'Community court with basic amenities', 'Concrete', 'indoor', 4, 80.00, true),
        (c_sta_maria_2, v_sta_maria_id, 'Practice Court', 'Secondary court for casual play', 'Concrete', 'indoor', 4, 60.00, true),
        (c_tumaga_1, v_tumaga_id, 'Court Alpha', 'Premium court with maple flooring', 'Wood', 'indoor', 4, 170.00, true),
        (c_tumaga_2, v_tumaga_id, 'Court Beta', 'Standard synthetic court', 'Synthetic', 'indoor', 4, 140.00, true),
        (c_tumaga_3, v_tumaga_id, 'Court Gamma', 'Training court', 'Vinyl', 'indoor', 4, 110.00, true),
        (c_pasonanca_1, v_pasonanca_id, 'Hillside Court', 'Outdoor court with mountain view', 'Concrete', 'outdoor', 4, 70.00, true),
        (c_pasonanca_2, v_pasonanca_id, 'Garden Court', 'Covered outdoor court', 'Concrete', 'outdoor', 4, 70.00, true),
        (c_divisoria_1, v_divisoria_id, 'Court 1', 'Budget-friendly court', 'Vinyl', 'indoor', 4, 90.00, true),
        (c_divisoria_2, v_divisoria_id, 'Court 2', 'Standard court', 'Vinyl', 'indoor', 4, 90.00, true),
        (c_ayala_1, v_ayala_id, 'Championship Court', 'Tournament-grade maple court', 'Wood', 'indoor', 4, 300.00, true),
        (c_ayala_2, v_ayala_id, 'Pro Court 1', 'Professional synthetic court', 'Synthetic', 'indoor', 4, 250.00, true),
        (c_ayala_3, v_ayala_id, 'Pro Court 2', 'Professional synthetic court', 'Synthetic', 'indoor', 4, 250.00, true),
        (c_ayala_4, v_ayala_id, 'Training Court', 'Practice and training court', 'Vinyl', 'indoor', 4, 180.00, true)
    ON CONFLICT (id) DO NOTHING;

    -- =====================================================
    -- 6. LINK COURTS & AMENITIES
    -- =====================================================
    RAISE NOTICE 'Linking Amenities...';

    -- Only attempt insert if amenity exists
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_parking), (c_malagutay_2, a_parking) ON CONFLICT DO NOTHING; END IF;
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_restroom), (c_malagutay_2, a_restroom) ON CONFLICT DO NOTHING; END IF;
    IF a_aircon IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_aircon), (c_malagutay_2, a_aircon) ON CONFLICT DO NOTHING; END IF;
    
    -- Canelar
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_parking), (c_canelar_2, a_parking), (c_canelar_3, a_parking) ON CONFLICT DO NOTHING; END IF;
    IF a_lockers IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_lockers) ON CONFLICT DO NOTHING; END IF;
    
    -- KCC
    IF a_aircon IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_aircon), (c_ayala_2, a_aircon), (c_ayala_3, a_aircon), (c_ayala_4, a_aircon) ON CONFLICT DO NOTHING; END IF;
    IF a_equipment IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_equipment) ON CONFLICT DO NOTHING; END IF;

    -- =====================================================
    -- 7. INSERT DISCOUNT RULES
    -- =====================================================
    RAISE NOTICE 'Inserting Discount Rules...';
    
    INSERT INTO discount_rules (venue_id, name, description, discount_type, discount_value, discount_unit, min_days, is_active)
    VALUES (v_malagutay_id, 'Weekly Booking', 'Book for 3+ consecutive days', 'multi_day', 10.00, 'percent', 3, true)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO discount_rules (venue_id, name, description, discount_type, discount_value, discount_unit, min_players, is_active)
    VALUES (v_canelar_id, 'Group Discount', 'Groups of 8+ players', 'group', 15.00, 'percent', 8, true)
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 8. INSERT SAMPLE RATINGS (No Reservations Involved)
    -- =====================================================
    RAISE NOTICE 'Inserting Ratings...';

    -- Note: rating_id is auto-generated. reservation_id is NULL.
    INSERT INTO court_ratings (court_id, user_id, overall_rating, quality_rating, cleanliness_rating, facilities_rating, value_rating, review, is_verified)
    VALUES
    (c_malagutay_1, rater_id, 5, 5, 5, 5, 4, 'Excellent court, best in Malagutay!', true),
    (c_canelar_1, rater_id, 4, 4, 3, 4, 5, 'Good location but parking is tight.', true),
    (c_ayala_1, rater_id, 5, 5, 5, 5, 5, 'Top tier facility. Expensive but worth it.', true),
    (c_tumaga_1, rater_id, 5, 5, 5, 5, 5, 'Nice place and friendly staff', true),
    (c_pasonanca_1, rater_id, 4, 3, 4, 4, 5, 'Great view and fresh air', true)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Seed complete!';
END $$;

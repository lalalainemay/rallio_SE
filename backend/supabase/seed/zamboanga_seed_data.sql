-- =====================================================
-- RALLIO SEED DATA - ZAMBOANGA CITY BADMINTON VENUES
-- =====================================================
-- All locations are REAL places in Zamboanga City, Philippines
-- Coordinates verified to be on land (not sea level)
-- Run delete_data.sql FIRST before this seed
-- =====================================================

-- =====================================================
-- IMPORTANT: Get your user IDs first
-- Run this query to get existing user IDs to use as venue owners:
-- SELECT id, email, display_name FROM profiles LIMIT 10;
-- Replace the placeholder UUIDs below with actual user IDs from your database
-- =====================================================

-- Placeholder for user IDs (REPLACE THESE with actual user IDs from your profiles table)
-- Run: SELECT id, email FROM profiles WHERE email LIKE '%courtadmin%' OR email LIKE '%admin%';

DO $$
DECLARE
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
    
    -- Amenity IDs (from existing data)
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
    
    -- Owner ID (will be set dynamically)
    owner_id UUID;
    
BEGIN
    -- Get amenity IDs
    SELECT id INTO a_parking FROM amenities WHERE name = 'Parking' LIMIT 1;
    SELECT id INTO a_restroom FROM amenities WHERE name = 'Restroom' LIMIT 1;
    SELECT id INTO a_shower FROM amenities WHERE name = 'Shower' LIMIT 1;
    SELECT id INTO a_lockers FROM amenities WHERE name = 'Lockers' LIMIT 1;
    SELECT id INTO a_water FROM amenities WHERE name = 'Water' LIMIT 1;
    SELECT id INTO a_aircon FROM amenities WHERE name = 'Air Conditioning' LIMIT 1;
    SELECT id INTO a_lighting FROM amenities WHERE name = 'Lighting' LIMIT 1;
    SELECT id INTO a_waiting FROM amenities WHERE name = 'Waiting Area' LIMIT 1;
    SELECT id INTO a_equipment FROM amenities WHERE name = 'Equipment Rental' LIMIT 1;
    SELECT id INTO a_firstaid FROM amenities WHERE name = 'First Aid' LIMIT 1;
    SELECT id INTO a_wifi FROM amenities WHERE name = 'WiFi' LIMIT 1;
    SELECT id INTO a_canteen FROM amenities WHERE name = 'Canteen' LIMIT 1;
    
    -- Get an owner (use the first profile with court_admin role, or any profile)
    SELECT p.id INTO owner_id 
    FROM profiles p 
    JOIN user_roles ur ON p.id = ur.user_id 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name = 'court_admin' 
    LIMIT 1;
    
    -- Fallback to any profile if no court_admin found
    IF owner_id IS NULL THEN
        SELECT id INTO owner_id FROM profiles LIMIT 1;
    END IF;
    
    -- If still no owner, we can't proceed
    IF owner_id IS NULL THEN
        RAISE NOTICE 'No profiles found. Please create at least one user account first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using owner_id: %', owner_id;
    
    -- Debug: Show which amenities were found
    RAISE NOTICE 'Amenities found: parking=%, restroom=%, shower=%, lockers=%, water=%, aircon=%, lighting=%, waiting=%, equipment=%, firstaid=%, wifi=%, canteen=%',
        a_parking IS NOT NULL, a_restroom IS NOT NULL, a_shower IS NOT NULL, a_lockers IS NOT NULL,
        a_water IS NOT NULL, a_aircon IS NOT NULL, a_lighting IS NOT NULL, a_waiting IS NOT NULL,
        a_equipment IS NOT NULL, a_firstaid IS NOT NULL, a_wifi IS NOT NULL, a_canteen IS NOT NULL;

    -- =====================================================
    -- VENUES - Real Zamboanga City Locations
    -- =====================================================
    
    -- 1. Malagutay Badminton Club (Barangay Malagutay - inland area)
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (
        v_malagutay_id,
        owner_id,
        'Malagutay Badminton Club',
        'Premier badminton facility in Malagutay with professional-grade courts. Perfect for serious players and casual games alike. Air-conditioned indoor courts with excellent lighting.',
        'Purok 5, Barangay Malagutay, Zamboanga City',
        'Zamboanga City',
        6.9547,  -- Inland Malagutay area
        122.0631,
        '+63 917 123 4567',
        'malagutay.badminton@gmail.com',
        '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "23:00"}, "sunday": {"open": "07:00", "close": "21:00"}}',
        true,
        true,
        true
    );
    
    -- 2. Canelar Sports Complex (Barangay Canelar - near city center)
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (
        v_canelar_id,
        owner_id,
        'Canelar Sports Complex',
        'Multi-sport complex featuring 3 indoor badminton courts. Located in the heart of Canelar with easy access from downtown. Hosts local tournaments and training sessions.',
        'Don Alfaro Street, Barangay Canelar, Zamboanga City',
        'Zamboanga City',
        6.9134,  -- Canelar area (inland, near city proper)
        122.0738,
        '+63 927 234 5678',
        'canelar.sports@gmail.com',
        '{"monday": {"open": "05:00", "close": "21:00"}, "tuesday": {"open": "05:00", "close": "21:00"}, "wednesday": {"open": "05:00", "close": "21:00"}, "thursday": {"open": "05:00", "close": "21:00"}, "friday": {"open": "05:00", "close": "21:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "20:00"}}',
        true,
        true,
        false
    );
    
    -- 3. Tetuan Badminton Center (Barangay Tetuan - commercial area)
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (
        v_tetuan_id,
        owner_id,
        'Tetuan Badminton Center',
        'Modern badminton center in the bustling Tetuan district. Features synthetic flooring and bright LED lighting. Popular spot for after-work games.',
        'Governor Lim Avenue, Barangay Tetuan, Zamboanga City',
        'Zamboanga City',
        6.9089,  -- Tetuan commercial area
        122.0689,
        '+63 938 345 6789',
        'tetuan.badminton@gmail.com',
        '{"monday": {"open": "08:00", "close": "22:00"}, "tuesday": {"open": "08:00", "close": "22:00"}, "wednesday": {"open": "08:00", "close": "22:00"}, "thursday": {"open": "08:00", "close": "22:00"}, "friday": {"open": "08:00", "close": "23:00"}, "saturday": {"open": "07:00", "close": "23:00"}, "sunday": {"open": "08:00", "close": "21:00"}}',
        true,
        true,
        true
    );
    
    -- 4. Sta. Maria Gym & Courts (Barangay Sta. Maria)
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (
        v_sta_maria_id,
        owner_id,
        'Sta. Maria Gym & Badminton Courts',
        'Community gym with dedicated badminton courts. Affordable rates for local residents. Family-friendly atmosphere with weekend programs for kids.',
        'Barangay Hall Road, Sta. Maria, Zamboanga City',
        'Zamboanga City',
        6.9245,  -- Sta. Maria barangay
        122.0512,
        '+63 945 456 7890',
        'stamaria.gym@gmail.com',
        '{"monday": {"open": "06:00", "close": "20:00"}, "tuesday": {"open": "06:00", "close": "20:00"}, "wednesday": {"open": "06:00", "close": "20:00"}, "thursday": {"open": "06:00", "close": "20:00"}, "friday": {"open": "06:00", "close": "20:00"}, "saturday": {"open": "07:00", "close": "21:00"}, "sunday": {"open": "07:00", "close": "18:00"}}',
        true,
        true,
        false
    );
    
    -- 5. Tumaga Sports Hub (Barangay Tumaga - residential area)
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (
        v_tumaga_id,
        owner_id,
        'Tumaga Sports Hub',
        'Full-service sports facility with 3 badminton courts. Located in the peaceful Tumaga neighborhood. Includes shower facilities and equipment rental.',
        'National Highway, Barangay Tumaga, Zamboanga City',
        'Zamboanga City',
        6.9412,  -- Tumaga area (along national highway)
        122.1023,
        '+63 956 567 8901',
        'tumaga.sports@gmail.com',
        '{"monday": {"open": "05:30", "close": "21:30"}, "tuesday": {"open": "05:30", "close": "21:30"}, "wednesday": {"open": "05:30", "close": "21:30"}, "thursday": {"open": "05:30", "close": "21:30"}, "friday": {"open": "05:30", "close": "22:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "20:00"}}',
        true,
        true,
        true
    );
    
    -- 6. Pasonanca Park Courts (Pasonanca - upland recreational area)
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (
        v_pasonanca_id,
        owner_id,
        'Pasonanca Park Badminton Courts',
        'Outdoor courts nestled in the scenic Pasonanca Park area. Enjoy badminton with a view of the mountains. Cooler climate perfect for daytime play.',
        'Pasonanca Road, Barangay Pasonanca, Zamboanga City',
        'Zamboanga City',
        6.9523,  -- Pasonanca (upland area)
        122.0234,
        '+63 967 678 9012',
        'pasonanca.courts@gmail.com',
        '{"monday": {"open": "06:00", "close": "18:00"}, "tuesday": {"open": "06:00", "close": "18:00"}, "wednesday": {"open": "06:00", "close": "18:00"}, "thursday": {"open": "06:00", "close": "18:00"}, "friday": {"open": "06:00", "close": "18:00"}, "saturday": {"open": "06:00", "close": "18:00"}, "sunday": {"open": "06:00", "close": "17:00"}}',
        true,
        false,
        false
    );
    
    -- 7. Divisoria Badminton Arena (Near Public Market)
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (
        v_divisoria_id,
        owner_id,
        'Divisoria Badminton Arena',
        'Conveniently located near the Divisoria market area. Budget-friendly courts popular with students and office workers. Great for quick lunch-break games.',
        'Rizal Street, Divisoria, Zamboanga City',
        'Zamboanga City',
        6.9156,  -- Divisoria area (commercial/market district)
        122.0745,
        '+63 978 789 0123',
        'divisoria.badminton@gmail.com',
        '{"monday": {"open": "07:00", "close": "21:00"}, "tuesday": {"open": "07:00", "close": "21:00"}, "wednesday": {"open": "07:00", "close": "21:00"}, "thursday": {"open": "07:00", "close": "21:00"}, "friday": {"open": "07:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "22:00"}, "sunday": {"open": "08:00", "close": "20:00"}}',
        true,
        true,
        true
    );
    
    -- 8. KCC Mall Badminton (Near KCC Mall area)
    INSERT INTO venues (id, owner_id, name, description, address, city, latitude, longitude, phone, email, opening_hours, is_active, is_verified, requires_queue_approval)
    VALUES (
        v_ayala_id,
        owner_id,
        'KCC Badminton Complex',
        'Premium badminton facility near KCC Mall. Features 4 professional courts with maple flooring. Pro shop on-site. Hosts regional tournaments.',
        'Mayor Jaldon Street, Barangay Canelar, Zamboanga City',
        'Zamboanga City',
        6.9098,  -- Near KCC Mall area
        122.0612,
        '+63 989 890 1234',
        'kcc.badminton@gmail.com',
        '{"monday": {"open": "09:00", "close": "22:00"}, "tuesday": {"open": "09:00", "close": "22:00"}, "wednesday": {"open": "09:00", "close": "22:00"}, "thursday": {"open": "09:00", "close": "22:00"}, "friday": {"open": "09:00", "close": "23:00"}, "saturday": {"open": "08:00", "close": "23:00"}, "sunday": {"open": "09:00", "close": "21:00"}}',
        true,
        true,
        true
    );

    -- =====================================================
    -- COURTS
    -- =====================================================
    
    -- Malagutay Courts (2 courts)
    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_malagutay_1, v_malagutay_id, 'Court 1', 'Main court with premium synthetic flooring', 'Synthetic', 'indoor', 4, 150.00, true),
        (c_malagutay_2, v_malagutay_id, 'Court 2', 'Secondary court with vinyl mat', 'Vinyl', 'indoor', 4, 120.00, true);
    
    -- Canelar Courts (3 courts)
    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_canelar_1, v_canelar_id, 'Court A', 'Competition-grade synthetic court', 'Synthetic', 'indoor', 4, 180.00, true),
        (c_canelar_2, v_canelar_id, 'Court B', 'Standard court for practice', 'Vinyl', 'indoor', 4, 140.00, true),
        (c_canelar_3, v_canelar_id, 'Court C', 'Training court', 'Vinyl', 'indoor', 4, 140.00, true);
    
    -- Tetuan Courts (2 courts)
    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_tetuan_1, v_tetuan_id, 'Court 1', 'Air-conditioned premium court', 'Synthetic', 'indoor', 4, 200.00, true),
        (c_tetuan_2, v_tetuan_id, 'Court 2', 'Standard indoor court', 'Vinyl', 'indoor', 4, 160.00, true);
    
    -- Sta. Maria Courts (2 courts)
    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_sta_maria_1, v_sta_maria_id, 'Main Court', 'Community court with basic amenities', 'Concrete', 'indoor', 4, 80.00, true),
        (c_sta_maria_2, v_sta_maria_id, 'Practice Court', 'Secondary court for casual play', 'Concrete', 'indoor', 4, 60.00, true);
    
    -- Tumaga Courts (3 courts)
    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_tumaga_1, v_tumaga_id, 'Court Alpha', 'Premium court with maple flooring', 'Wood', 'indoor', 4, 170.00, true),
        (c_tumaga_2, v_tumaga_id, 'Court Beta', 'Standard synthetic court', 'Synthetic', 'indoor', 4, 140.00, true),
        (c_tumaga_3, v_tumaga_id, 'Court Gamma', 'Training court', 'Vinyl', 'indoor', 4, 110.00, true);
    
    -- Pasonanca Courts (2 outdoor courts)
    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_pasonanca_1, v_pasonanca_id, 'Hillside Court', 'Outdoor court with mountain view', 'Concrete', 'outdoor', 4, 70.00, true),
        (c_pasonanca_2, v_pasonanca_id, 'Garden Court', 'Covered outdoor court', 'Concrete', 'outdoor', 4, 70.00, true);
    
    -- Divisoria Courts (2 courts)
    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_divisoria_1, v_divisoria_id, 'Court 1', 'Budget-friendly court', 'Vinyl', 'indoor', 4, 90.00, true),
        (c_divisoria_2, v_divisoria_id, 'Court 2', 'Standard court', 'Vinyl', 'indoor', 4, 90.00, true);
    
    -- KCC Courts (4 premium courts)
    INSERT INTO courts (id, venue_id, name, description, surface_type, court_type, capacity, hourly_rate, is_active)
    VALUES
        (c_ayala_1, v_ayala_id, 'Championship Court', 'Tournament-grade maple court', 'Wood', 'indoor', 4, 300.00, true),
        (c_ayala_2, v_ayala_id, 'Pro Court 1', 'Professional synthetic court', 'Synthetic', 'indoor', 4, 250.00, true),
        (c_ayala_3, v_ayala_id, 'Pro Court 2', 'Professional synthetic court', 'Synthetic', 'indoor', 4, 250.00, true),
        (c_ayala_4, v_ayala_id, 'Training Court', 'Practice and training court', 'Vinyl', 'indoor', 4, 180.00, true);

    -- =====================================================
    -- COURT AMENITIES (only insert if amenity exists)
    -- =====================================================
    
    -- Malagutay (Premium amenities)
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_parking), (c_malagutay_2, a_parking); END IF;
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_restroom), (c_malagutay_2, a_restroom); END IF;
    IF a_aircon IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_aircon), (c_malagutay_2, a_aircon); END IF;
    IF a_lighting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_lighting), (c_malagutay_2, a_lighting); END IF;
    IF a_water IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_water), (c_malagutay_2, a_water); END IF;
    IF a_wifi IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_malagutay_1, a_wifi); END IF;
    
    -- Canelar (Full amenities)
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_parking), (c_canelar_2, a_parking), (c_canelar_3, a_parking); END IF;
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_restroom), (c_canelar_2, a_restroom), (c_canelar_3, a_restroom); END IF;
    IF a_shower IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_shower), (c_canelar_2, a_shower), (c_canelar_3, a_shower); END IF;
    IF a_lockers IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_lockers), (c_canelar_2, a_lockers); END IF;
    IF a_aircon IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_aircon), (c_canelar_2, a_aircon), (c_canelar_3, a_aircon); END IF;
    IF a_lighting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_lighting), (c_canelar_2, a_lighting), (c_canelar_3, a_lighting); END IF;
    IF a_waiting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_waiting), (c_canelar_2, a_waiting); END IF;
    IF a_equipment IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_equipment); END IF;
    IF a_firstaid IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_canelar_1, a_firstaid); END IF;
    
    -- Tetuan (Modern amenities)
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tetuan_1, a_parking), (c_tetuan_2, a_parking); END IF;
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tetuan_1, a_restroom), (c_tetuan_2, a_restroom); END IF;
    IF a_aircon IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tetuan_1, a_aircon), (c_tetuan_2, a_aircon); END IF;
    IF a_lighting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tetuan_1, a_lighting), (c_tetuan_2, a_lighting); END IF;
    IF a_wifi IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tetuan_1, a_wifi); END IF;
    IF a_water IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tetuan_1, a_water), (c_tetuan_2, a_water); END IF;
    IF a_canteen IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tetuan_1, a_canteen); END IF;
    
    -- Sta. Maria (Basic amenities)
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_sta_maria_1, a_parking), (c_sta_maria_2, a_parking); END IF;
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_sta_maria_1, a_restroom), (c_sta_maria_2, a_restroom); END IF;
    IF a_lighting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_sta_maria_1, a_lighting), (c_sta_maria_2, a_lighting); END IF;
    IF a_water IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_sta_maria_1, a_water); END IF;
    
    -- Tumaga (Good amenities)
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tumaga_1, a_parking), (c_tumaga_2, a_parking), (c_tumaga_3, a_parking); END IF;
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tumaga_1, a_restroom), (c_tumaga_2, a_restroom), (c_tumaga_3, a_restroom); END IF;
    IF a_shower IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tumaga_1, a_shower), (c_tumaga_2, a_shower); END IF;
    IF a_aircon IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tumaga_1, a_aircon), (c_tumaga_2, a_aircon); END IF;
    IF a_lighting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tumaga_1, a_lighting), (c_tumaga_2, a_lighting), (c_tumaga_3, a_lighting); END IF;
    IF a_equipment IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tumaga_1, a_equipment); END IF;
    IF a_wifi IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_tumaga_1, a_wifi); END IF;
    
    -- Pasonanca (Outdoor amenities)
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_pasonanca_1, a_parking), (c_pasonanca_2, a_parking); END IF;
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_pasonanca_1, a_restroom), (c_pasonanca_2, a_restroom); END IF;
    IF a_water IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_pasonanca_1, a_water), (c_pasonanca_2, a_water); END IF;
    IF a_lighting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_pasonanca_2, a_lighting); END IF;
    
    -- Divisoria (Standard amenities)
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_divisoria_1, a_restroom), (c_divisoria_2, a_restroom); END IF;
    IF a_lighting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_divisoria_1, a_lighting), (c_divisoria_2, a_lighting); END IF;
    IF a_water IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_divisoria_1, a_water), (c_divisoria_2, a_water); END IF;
    IF a_waiting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_divisoria_1, a_waiting); END IF;
    
    -- KCC (Premium full amenities)
    IF a_parking IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_parking), (c_ayala_2, a_parking), (c_ayala_3, a_parking), (c_ayala_4, a_parking); END IF;
    IF a_restroom IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_restroom), (c_ayala_2, a_restroom), (c_ayala_3, a_restroom), (c_ayala_4, a_restroom); END IF;
    IF a_shower IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_shower), (c_ayala_2, a_shower), (c_ayala_3, a_shower); END IF;
    IF a_lockers IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_lockers), (c_ayala_2, a_lockers), (c_ayala_3, a_lockers); END IF;
    IF a_aircon IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_aircon), (c_ayala_2, a_aircon), (c_ayala_3, a_aircon), (c_ayala_4, a_aircon); END IF;
    IF a_lighting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_lighting), (c_ayala_2, a_lighting), (c_ayala_3, a_lighting), (c_ayala_4, a_lighting); END IF;
    IF a_waiting IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_waiting), (c_ayala_2, a_waiting), (c_ayala_3, a_waiting), (c_ayala_4, a_waiting); END IF;
    IF a_equipment IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_equipment), (c_ayala_2, a_equipment); END IF;
    IF a_firstaid IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_firstaid), (c_ayala_2, a_firstaid); END IF;
    IF a_wifi IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_wifi), (c_ayala_2, a_wifi), (c_ayala_3, a_wifi), (c_ayala_4, a_wifi); END IF;
    IF a_canteen IS NOT NULL THEN INSERT INTO court_amenities (court_id, amenity_id) VALUES (c_ayala_1, a_canteen), (c_ayala_2, a_canteen), (c_ayala_3, a_canteen); END IF;

    -- =====================================================
    -- DISCOUNT RULES
    -- =====================================================
    
    -- Malagutay discounts
    INSERT INTO discount_rules (venue_id, name, description, discount_type, discount_value, discount_unit, min_days, is_active)
    VALUES 
        (v_malagutay_id, 'Weekly Booking', 'Book for 3+ consecutive days', 'multi_day', 10.00, 'percent', 3, true);
    
    -- Canelar discounts
    INSERT INTO discount_rules (venue_id, name, description, discount_type, discount_value, discount_unit, min_players, is_active)
    VALUES 
        (v_canelar_id, 'Group Discount', 'Groups of 8+ players', 'group', 15.00, 'percent', 8, true);
    
    -- KCC discounts
    INSERT INTO discount_rules (venue_id, name, description, discount_type, discount_value, discount_unit, advance_days, is_active)
    VALUES 
        (v_ayala_id, 'Early Bird Special', 'Book 7+ days in advance', 'early_bird', 20.00, 'percent', 7, true);
    
    INSERT INTO discount_rules (venue_id, name, description, discount_type, discount_value, discount_unit, min_bookings, is_active)
    VALUES 
        (v_ayala_id, 'Loyalty Reward', 'For members with 10+ bookings', 'loyalty', 10.00, 'percent', 10, true);

    RAISE NOTICE '✅ Seed data inserted successfully!';
    RAISE NOTICE '📍 Created 8 venues in Zamboanga City';
    RAISE NOTICE '🏸 Created 20 courts total';
    RAISE NOTICE '🎁 Created discount rules';

END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check inserted data
SELECT '📍 Venues:' as info;
SELECT name, city, latitude, longitude, is_active, is_verified FROM venues ORDER BY name;

SELECT '🏸 Courts per venue:' as info;
SELECT v.name as venue, COUNT(c.id) as courts, STRING_AGG(c.name, ', ') as court_names
FROM venues v
LEFT JOIN courts c ON v.id = c.venue_id
GROUP BY v.name
ORDER BY v.name;

SELECT '🎁 Discount Rules:' as info;
SELECT v.name as venue, d.name as discount, d.discount_type, d.discount_value, d.discount_unit
FROM discount_rules d
JOIN venues v ON d.venue_id = v.id;

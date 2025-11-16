-- Rallio Database Schema
-- Run this in your Supabase SQL Editor

-- Enable PostGIS extension for geolocation features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum types
CREATE TYPE court_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE queue_status AS ENUM ('waiting', 'playing', 'completed', 'cancelled');
CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed');

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Extends the auth.users table with additional profile information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  skill_level INTEGER DEFAULT 1 CHECK (skill_level BETWEEN 1 AND 10),
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- COURTS TABLE
-- ============================================
CREATE TABLE courts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Zamboanga City',
  location GEOGRAPHY(POINT, 4326), -- PostGIS point for lat/long
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_courts INTEGER DEFAULT 1,
  hourly_rate DECIMAL(10, 2),
  image_url TEXT,
  amenities TEXT[], -- Array of amenities (e.g., ['parking', 'restroom', 'water'])
  opening_time TIME,
  closing_time TIME,
  status court_status DEFAULT 'active',
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on location for geospatial queries
CREATE INDEX courts_location_idx ON courts USING GIST(location);

-- Enable Row Level Security
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Policies for courts
CREATE POLICY "Courts are viewable by everyone"
  ON courts FOR SELECT
  USING (status = 'active');

CREATE POLICY "Court owners can update their courts"
  ON courts FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create courts"
  ON courts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ============================================
-- QUEUE SESSIONS TABLE
-- ============================================
-- Represents an active queue session at a court
CREATE TABLE queue_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE NOT NULL,
  session_name TEXT,
  max_players INTEGER DEFAULT 4,
  game_duration INTEGER DEFAULT 30, -- minutes
  status session_status DEFAULT 'active',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE queue_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for queue_sessions
CREATE POLICY "Queue sessions are viewable by everyone"
  ON queue_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create queue sessions"
  ON queue_sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session creators can update their sessions"
  ON queue_sessions FOR UPDATE
  USING (auth.uid() = created_by);

-- ============================================
-- QUEUE ENTRIES TABLE
-- ============================================
-- Individual player entries in a queue session
CREATE TABLE queue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES queue_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  status queue_status DEFAULT 'waiting',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_playing_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(session_id, user_id), -- User can only join a session once
  UNIQUE(session_id, position) -- Each position in queue is unique
);

-- Enable Row Level Security
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;

-- Policies for queue_entries
CREATE POLICY "Queue entries are viewable by everyone"
  ON queue_entries FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join queue"
  ON queue_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entries"
  ON queue_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entries"
  ON queue_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- GAMES TABLE
-- ============================================
-- Record of completed games
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  session_id UUID REFERENCES queue_sessions(id) ON DELETE SET NULL,
  player1_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player3_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player4_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  winner_team INTEGER CHECK (winner_team IN (1, 2)), -- Team 1 or Team 2
  score TEXT, -- e.g., "21-19, 15-21, 21-18"
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policies for games
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

CREATE POLICY "Players can create game records"
  ON games FOR INSERT
  WITH CHECK (
    auth.uid() IN (player1_id, player2_id, player3_id, player4_id)
  );

-- ============================================
-- COURT REVIEWS TABLE
-- ============================================
CREATE TABLE court_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(court_id, user_id) -- One review per user per court
);

-- Enable Row Level Security
ALTER TABLE court_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for court_reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON court_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON court_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON court_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON court_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courts_updated_at
  BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_sessions_updated_at
  BEFORE UPDATE ON queue_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_court_reviews_updated_at
  BEFORE UPDATE ON court_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to find nearby courts
CREATE OR REPLACE FUNCTION nearby_courts(
  lat DECIMAL,
  lng DECIMAL,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.address,
    ST_Distance(
      c.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    )::DECIMAL AS distance_meters
  FROM courts c
  WHERE c.status = 'active'
    AND ST_DWithin(
      c.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Function to get next queue position
CREATE OR REPLACE FUNCTION get_next_queue_position(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1
  INTO next_pos
  FROM queue_entries
  WHERE session_id = p_session_id;

  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_courts_owner ON courts(owner_id);
CREATE INDEX idx_courts_status ON courts(status);
CREATE INDEX idx_queue_sessions_court ON queue_sessions(court_id);
CREATE INDEX idx_queue_sessions_status ON queue_sessions(status);
CREATE INDEX idx_queue_entries_session ON queue_entries(session_id);
CREATE INDEX idx_queue_entries_user ON queue_entries(user_id);
CREATE INDEX idx_queue_entries_status ON queue_entries(status);
CREATE INDEX idx_games_players ON games(player1_id, player2_id, player3_id, player4_id);
CREATE INDEX idx_court_reviews_court ON court_reviews(court_id);
CREATE INDEX idx_court_reviews_user ON court_reviews(user_id);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data

/*
-- Sample Court
INSERT INTO courts (name, address, latitude, longitude, location, total_courts, hourly_rate, amenities, opening_time, closing_time, status)
VALUES (
  'Zamboanga Sports Complex',
  '123 Main Street, Zamboanga City',
  6.9214,
  122.0790,
  ST_SetSRID(ST_MakePoint(122.0790, 6.9214), 4326)::geography,
  4,
  300.00,
  ARRAY['parking', 'restroom', 'water', 'lighting'],
  '06:00:00',
  '22:00:00',
  'active'
);
*/

-- Migration 021: Add INSERT and DELETE policies for global admins on venues and courts
-- This migration adds the missing RLS policies that allow global admins to create and delete venues/courts

-- Venues Table - INSERT Policy
CREATE POLICY "Global admins can insert venues"
  ON venues FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'global_admin'));

-- Venues Table - DELETE Policy
CREATE POLICY "Global admins can delete venues"
  ON venues FOR DELETE
  USING (has_role(auth.uid(), 'global_admin'));

-- Courts Table - INSERT Policy
CREATE POLICY "Global admins can insert courts"
  ON courts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'global_admin'));

-- Courts Table - DELETE Policy
CREATE POLICY "Global admins can delete courts"
  ON courts FOR DELETE
  USING (has_role(auth.uid(), 'global_admin'));

-- Amenities Table - Full CRUD for global admins
CREATE POLICY "Global admins view all amenities"
  ON amenities FOR SELECT
  USING (has_role(auth.uid(), 'global_admin'));

CREATE POLICY "Global admins insert amenities"
  ON amenities FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'global_admin'));

CREATE POLICY "Global admins update amenities"
  ON amenities FOR UPDATE
  USING (has_role(auth.uid(), 'global_admin'));

CREATE POLICY "Global admins delete amenities"
  ON amenities FOR DELETE
  USING (has_role(auth.uid(), 'global_admin'));

-- Court Amenities Junction Table - Full CRUD for global admins
CREATE POLICY "Global admins view court amenities"
  ON court_amenities FOR SELECT
  USING (has_role(auth.uid(), 'global_admin'));

CREATE POLICY "Global admins insert court amenities"
  ON court_amenities FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'global_admin'));

CREATE POLICY "Global admins delete court amenities"
  ON court_amenities FOR DELETE
  USING (has_role(auth.uid(), 'global_admin'));

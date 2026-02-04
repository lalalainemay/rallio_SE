-- Migration: Add pending_refund status to reservations check constraint
-- Created at: 2026-02-04

-- Drop the existing check constraint
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Re-add the check constraint with pending_refund and other missing statuses found in code
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
CHECK (status IN (
  'pending', 
  'confirmed', 
  'cancelled', 
  'completed', 
  'no_show', 
  'pending_payment', 
  'pending_refund', 
  'refunded'
));

-- Add a comment to document the change
COMMENT ON COLUMN reservations.status IS 'Reservation status: pending, confirmed, cancelled, completed, no_show, pending_payment, pending_refund, refunded';

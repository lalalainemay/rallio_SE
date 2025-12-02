-- Migration: Create refunds table for tracking payment refunds
-- This table tracks refund requests and their status through PayMongo

-- =============================================
-- ADD REFUNDED STATUS TO RESERVATIONS
-- =============================================

-- Drop and recreate the status check constraint with 'refunded' status
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (
    status IN (
      'pending_payment',
      'pending',
      'paid',
      'confirmed',
      'cancelled',
      'completed',
      'no_show',
      'refunded'
    )
  );

-- =============================================
-- REFUNDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS refunds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Links to payment and reservation
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- User who requested the refund
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Refund amounts (stored in centavos for PayMongo compatibility)
  amount integer NOT NULL CHECK (amount > 0),
  currency varchar(3) DEFAULT 'PHP' NOT NULL,
  
  -- Status tracking
  status varchar(50) DEFAULT 'pending' NOT NULL CHECK (
    status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')
  ),
  
  -- PayMongo reference
  external_id varchar(255), -- PayMongo refund ID
  payment_external_id varchar(255), -- Original PayMongo payment ID
  
  -- Reason for refund
  reason text,
  reason_code varchar(50) CHECK (
    reason_code IS NULL OR reason_code IN (
      'requested_by_customer',
      'duplicate',
      'fraudulent',
      'no_show',
      'event_cancelled',
      'other'
    )
  ),
  
  -- Admin/processor info
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  
  -- Additional metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,
  
  -- Error tracking
  error_message text,
  error_code varchar(50),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_reservation_id ON refunds(reservation_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_external_id ON refunds(external_id);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER set_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Users can view their own refunds
CREATE POLICY "Users can view own refunds"
  ON refunds
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can request refunds for their own reservations
CREATE POLICY "Users can request refunds"
  ON refunds
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Court admins can view refunds for their venues
CREATE POLICY "Court admins can view venue refunds"
  ON refunds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN courts c ON r.court_id = c.id
      JOIN venues v ON c.venue_id = v.id
      WHERE r.id = refunds.reservation_id
      AND v.owner_id = auth.uid()
    )
  );

-- Global admins can view and manage all refunds
CREATE POLICY "Global admins can manage refunds"
  ON refunds
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'global_admin'
    )
  );

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access to refunds"
  ON refunds
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get refund summary for a reservation
CREATE OR REPLACE FUNCTION get_reservation_refund_summary(p_reservation_id uuid)
RETURNS TABLE (
  total_paid integer,
  total_refunded integer,
  pending_refunds integer,
  refundable_amount integer
) AS $$
DECLARE
  v_total_paid integer;
  v_total_refunded integer;
  v_pending_refunds integer;
BEGIN
  -- Get total amount paid for this reservation
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE reservation_id = p_reservation_id
  AND status = 'paid';
  
  -- Get total amount already refunded
  SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded
  FROM refunds
  WHERE reservation_id = p_reservation_id
  AND status = 'succeeded';
  
  -- Get pending refund amounts
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_refunds
  FROM refunds
  WHERE reservation_id = p_reservation_id
  AND status IN ('pending', 'processing');
  
  RETURN QUERY SELECT 
    v_total_paid,
    v_total_refunded,
    v_pending_refunds,
    GREATEST(0, v_total_paid - v_total_refunded - v_pending_refunds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE refunds IS 'Tracks payment refunds for reservations';
COMMENT ON COLUMN refunds.amount IS 'Refund amount in centavos (multiply PHP by 100)';
COMMENT ON COLUMN refunds.external_id IS 'PayMongo refund ID returned from API';
COMMENT ON COLUMN refunds.payment_external_id IS 'PayMongo payment ID being refunded';
COMMENT ON COLUMN refunds.reason_code IS 'Standardized reason code for refund';
COMMENT ON COLUMN refunds.metadata IS 'Flexible JSON storage for additional refund data';

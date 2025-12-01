-- Migration 024: Platform Settings
-- This migration creates a platform_settings table for configurable platform-wide settings

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key varchar(100) UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  is_public boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, description, is_public) VALUES
  (
    'platform_fee',
    '{"percentage": 5, "enabled": true, "description": "Platform service fee applied to all bookings"}'::jsonb,
    'Platform fee percentage applied to all reservations and bookings',
    false
  ),
  (
    'terms_and_conditions',
    '{"content": "# Terms and Conditions\n\n## 1. Acceptance of Terms\nBy accessing and using Rallio, you accept and agree to be bound by these terms.\n\n## 2. Court Bookings\n- All bookings must be made through the platform\n- Payment is required at time of booking\n- Cancellations are subject to the refund policy\n\n## 3. User Conduct\n- Users must treat facilities and other players with respect\n- Inappropriate behavior may result in account suspension\n- False or misleading information is prohibited\n\n## 4. Liability\n- Rallio is not liable for injuries or accidents during gameplay\n- Users participate in activities at their own risk\n\n## 5. Changes to Terms\nWe reserve the right to modify these terms at any time.", "last_updated": "2025-12-01T00:00:00Z"}'::jsonb,
    'Platform terms and conditions that users must agree to',
    true
  ),
  (
    'refund_policy',
    '{"content": "# Refund Policy\n\n## Cancellation Timeframes\n\n### Full Refund (100%)\n- Cancellations made 24 hours or more before booking time\n- Platform fee is refunded\n\n### Partial Refund (50%)\n- Cancellations made 12-24 hours before booking time\n- Platform fee is NOT refunded\n\n### No Refund (0%)\n- Cancellations made less than 12 hours before booking time\n- Late cancellations or no-shows\n\n## Processing Time\n- Refunds are processed within 5-7 business days\n- Original payment method will be credited\n\n## Exceptions\n- Venue closures due to weather or emergencies: Full refund\n- Court maintenance issues: Full refund\n- Medical emergencies: Case-by-case basis (proof required)\n\n## Contact\nFor refund inquiries, contact support.", "last_updated": "2025-12-01T00:00:00Z"}'::jsonb,
    'Platform refund and cancellation policy',
    true
  ),
  (
    'general_settings',
    '{"platform_name": "Rallio", "tagline": "Find Your Court, Join The Game", "maintenance_mode": false, "contact_email": "support@rallio.com", "contact_phone": "+63 XXX XXX XXXX"}'::jsonb,
    'General platform configuration and contact information',
    false
  ),
  (
    'notification_settings',
    '{"email_notifications": true, "sms_notifications": false, "push_notifications": true, "booking_confirmations": true, "payment_receipts": true, "admin_alerts": true}'::jsonb,
    'Platform-wide notification preferences',
    false
  ),
  (
    'payment_settings',
    '{"currency": "PHP", "currency_symbol": "₱", "payment_methods": ["gcash", "paymaya", "card"], "min_booking_amount": 100, "max_booking_amount": 50000}'::jsonb,
    'Payment gateway and currency settings',
    false
  );

-- Create index on setting_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);

-- Create index for public settings
CREATE INDEX IF NOT EXISTS idx_platform_settings_public ON platform_settings(is_public) WHERE is_public = true;

-- Add comments
COMMENT ON TABLE platform_settings IS 'Stores platform-wide configurable settings including fees, legal docs, and general config';
COMMENT ON COLUMN platform_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN platform_settings.setting_value IS 'JSONB value allowing flexible schema per setting type';
COMMENT ON COLUMN platform_settings.is_public IS 'Whether this setting can be accessed by non-admin users (e.g., terms, refund policy)';

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Global admins can view all settings
CREATE POLICY "Global admins can view all settings"
  ON platform_settings FOR SELECT
  USING (has_role(auth.uid(), 'global_admin'));

-- Anyone can view public settings (terms, refund policy)
CREATE POLICY "Public settings are viewable by everyone"
  ON platform_settings FOR SELECT
  USING (is_public = true);

-- Only global admins can update settings
CREATE POLICY "Global admins can update settings"
  ON platform_settings FOR UPDATE
  USING (has_role(auth.uid(), 'global_admin'))
  WITH CHECK (has_role(auth.uid(), 'global_admin'));

-- Only global admins can insert settings
CREATE POLICY "Global admins can insert settings"
  ON platform_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'global_admin'));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_timestamp();

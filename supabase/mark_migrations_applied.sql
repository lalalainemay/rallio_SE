-- Mark manually applied migrations as completed in schema_migrations table
-- This syncs the CLI migration tracking with the actual database state

INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES
  ('002', 'add_nearby_venues_function', ARRAY['-- Applied manually via SQL Editor']),
  ('002', 'add_players_insert_policy', ARRAY['-- Applied manually via SQL Editor']),
  ('003', 'fix_court_availabilities', ARRAY['-- Applied manually via SQL Editor']),
  ('004', 'prevent_double_booking', ARRAY['-- Applied manually via SQL Editor']),
  ('005', 'add_missing_rls_policies', ARRAY['-- Applied manually via SQL Editor']),
  ('006', 'queue_master_helpers', ARRAY['-- Applied manually via SQL Editor']),
  ('007', 'auto_close_expired_sessions', ARRAY['-- Applied manually via SQL Editor']),
  ('008', 'add_matches_rls_policies', ARRAY['-- Applied manually via SQL Editor']),
  ('009', 'fix_queue_participant_count', ARRAY['-- Applied manually via SQL Editor']),
  ('010', 'add_missing_queue_rls_policies', ARRAY['-- Applied manually via SQL Editor']),
  ('011', 'create_player_ratings_table_v2', ARRAY['-- Applied manually via SQL Editor'])
ON CONFLICT (version, name) DO NOTHING;

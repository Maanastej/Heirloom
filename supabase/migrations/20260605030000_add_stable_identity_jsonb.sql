-- Migration: Add stable_identity JSONB column to identity_profiles
BEGIN;
ALTER TABLE identity_profiles
  ADD COLUMN IF NOT EXISTS stable_identity JSONB DEFAULT '{}';
COMMIT;

-- Migration: Add stable identity core fields to identity_profiles
BEGIN;
ALTER TABLE identity_profiles
  ADD COLUMN IF NOT EXISTS stable_family_vs_work NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS stable_risk_tolerance NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS stable_financial_mindset NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS stable_legacy_orientation NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS stable_stability_vs_growth NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS identity_consistency_score NUMERIC DEFAULT 0.0;
COMMIT;

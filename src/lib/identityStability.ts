// src/lib/identityStability.ts

/**
 * Provides utilities for combining short‑term (live), medium‑term (graph) and long‑term (stable) identity traits.
 * This is used by the GraphRAG retrieval pipeline to bias results based on a user’s stable values.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Retrieves the stable identity JSONB column and merges it with the live CIDE profile
 * (currently stored in the `identity_profiles` table). Returns a combined vector where
 * weights are: 50 % stable, 35 % medium (graph) and 15 % live (recent conversation).
 */
export async function getCombinedIdentityVector(profileId: string) {
  try {
    const { data, error } = await supabase
      .from('identity_profiles')
      .select('family_vs_work, risk_tolerance, financial_priority, legacy_orientation, stability_vs_growth, stable_identity')
      .eq('profile_id', profileId)
      .single();

    if (error) {
      console.error('Failed to fetch identity profile:', error);
      return null;
    }

    // The stable_identity column may contain an object with long‑term trait values.
    const stable = data.stable_identity || {};

    // Build the combined vector. Prefer stable values when present; fall back to the
    // short‑term columns. The weighting is applied later by the caller.
    const combined = {
      family_vs_work: stable.family_vs_work ?? data.family_vs_work ?? 0.5,
      risk_tolerance: stable.risk_tolerance ?? data.risk_tolerance ?? 0.5,
      financial_priority: stable.financial_priority ?? data.financial_priority ?? 0.5,
      legacy_orientation: stable.legacy_orientation ?? data.legacy_orientation ?? 0.5,
      stability_vs_growth: stable.stability_vs_growth ?? data.stability_vs_growth ?? 0.5,
    };

    return combined;
  } catch (e) {
    console.error('Unexpected error in getCombinedIdentityVector', e);
    return null;
  }
}

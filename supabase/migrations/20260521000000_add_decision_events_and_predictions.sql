-- Add behavioral decision events and predictions tables
CREATE TABLE IF NOT EXISTS decision_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES dna_profiles(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now(),
  situation_type text,
  user_input text,
  inferred_stress_level numeric,
  inferred_decision_style text,
  inferred_biases jsonb,
  predicted_failure_modes jsonb,
  generated_recommendations jsonb,
  confidence_score numeric,
  outcome_status text,
  outcome_notes text,
  decision_embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decision_events_embedding ON decision_events USING ivfflat (decision_embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS decision_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES dna_profiles(id) ON DELETE CASCADE,
  decision_event_id uuid REFERENCES decision_events(id) ON DELETE CASCADE,
  prediction_type text,
  predicted_behavior text,
  confidence numeric,
  verification_status text,
  actual_outcome jsonb,
  calibration_error numeric,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE decision_events IS 'Behavioral decision event memory: stores situation, inferred stress, biases, predicted failure modes, recommendations, and embedding.';
COMMENT ON TABLE decision_predictions IS 'Predictions generated for decision events and later verified against outcomes.';

-- Conversational Identity Discovery Engine (CIDE) Tables
-- Path: supabase/migrations/20260605010000_conversational_identity_discovery_engine.sql

-- 1. Identity Profiles Table
CREATE TABLE IF NOT EXISTS public.identity_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  family_vs_work NUMERIC DEFAULT 0.5 CHECK (family_vs_work BETWEEN 0 AND 1),
  risk_tolerance NUMERIC DEFAULT 0.5 CHECK (risk_tolerance BETWEEN 0 AND 1),
  financial_priority NUMERIC DEFAULT 0.5 CHECK (financial_priority BETWEEN 0 AND 1),
  legacy_orientation NUMERIC DEFAULT 0.5 CHECK (legacy_orientation BETWEEN 0 AND 1),
  stability_vs_growth NUMERIC DEFAULT 0.5 CHECK (stability_vs_growth BETWEEN 0 AND 1),
  
  confidence_family_vs_work NUMERIC DEFAULT 0.1 CHECK (confidence_family_vs_work BETWEEN 0 AND 1),
  confidence_risk_tolerance NUMERIC DEFAULT 0.1 CHECK (confidence_risk_tolerance BETWEEN 0 AND 1),
  confidence_financial_priority NUMERIC DEFAULT 0.1 CHECK (confidence_financial_priority BETWEEN 0 AND 1),
  confidence_legacy_orientation NUMERIC DEFAULT 0.1 CHECK (confidence_legacy_orientation BETWEEN 0 AND 1),
  confidence_stability_vs_growth NUMERIC DEFAULT 0.1 CHECK (confidence_stability_vs_growth BETWEEN 0 AND 1),
  
  contradiction_flags JSONB DEFAULT '[]'::jsonb NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Identity Conversations Table
CREATE TABLE IF NOT EXISTS public.identity_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Value Inferences Table
CREATE TABLE IF NOT EXISTS public.value_inferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  trait TEXT NOT NULL,
  previous_value NUMERIC NOT NULL,
  new_value NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  reasoning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Preference Evidence Table
CREATE TABLE IF NOT EXISTS public.preference_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  trait TEXT NOT NULL,
  evidence_type TEXT NOT NULL, -- 'story', 'tradeoff', 'follow-up'
  content TEXT NOT NULL,
  score_impact NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.identity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_inferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preference_evidence ENABLE ROW LEVEL SECURITY;

-- Security Policies (Consistent with profiles & families roles)
CREATE POLICY "Family members can view identity profiles" ON public.identity_profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = identity_profiles.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage identity profiles" ON public.identity_profiles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = identity_profiles.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view identity conversations" ON public.identity_conversations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = identity_conversations.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage identity conversations" ON public.identity_conversations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = identity_conversations.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view value inferences" ON public.value_inferences
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = value_inferences.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage value inferences" ON public.value_inferences
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = value_inferences.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view preference evidence" ON public.preference_evidence
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = preference_evidence.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage preference evidence" ON public.preference_evidence
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = preference_evidence.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

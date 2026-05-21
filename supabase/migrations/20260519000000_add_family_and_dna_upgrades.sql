-- Supabase Migration: Family Hub & Next-Gen Decision DNA Schema
-- Path: supabase/migrations/20260519000000_add_family_and_dna_upgrades.sql

-- 1. Create Families Table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_name TEXT NOT NULL,
  is_inherited BOOLEAN DEFAULT false NOT NULL, -- Manual Release Trigger Key
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable pgvector for embedding storage and similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Refactor/Extend Profiles with family relationships and roles
-- (Using IF NOT EXISTS logic to add columns safely)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer', 'time_locked')),
  ADD COLUMN IF NOT EXISTS relationship TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 3. Create Invites Table for adding family members
CREATE TABLE IF NOT EXISTS public.family_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer', 'time_locked')),
  relationship TEXT,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 4. Create Decision DNA Profiles Table
CREATE TABLE IF NOT EXISTS public.dna_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  avatar_url TEXT,
  risk_score INT DEFAULT 3 CHECK (risk_score BETWEEN 1 AND 5),
  trust_score INT DEFAULT 3 CHECK (trust_score BETWEEN 1 AND 5),
  horizon_score INT DEFAULT 3 CHECK (horizon_score BETWEEN 1 AND 5),
  adversity_score INT DEFAULT 3 CHECK (adversity_score BETWEEN 1 AND 5),
  ethics_score INT DEFAULT 3 CHECK (ethics_score BETWEEN 1 AND 5),
  core_values TEXT NOT NULL,
  decision_rules TEXT NOT NULL,
  life_experiences TEXT NOT NULL,
  profile_embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create DNA Chat History for persistent simulator conversations
CREATE TABLE IF NOT EXISTS public.dna_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dna_profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dna_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.dna_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.decision_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dna_profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  log_embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Setup Row Level Security for Families & Profiles
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_logs ENABLE ROW LEVEL SECURITY;

-- 7. Add Policies
CREATE POLICY "Users can view their own family details"
  ON public.families FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = families.id
  ));

CREATE POLICY "Owners can update family details"
  ON public.families FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = families.id AND profiles.role = 'owner'
  ));

CREATE POLICY "Family members can view DNA profiles in their family"
  ON public.dna_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners and Editors can manage DNA profiles"
  ON public.dna_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view decision logs"
  ON public.decision_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = decision_logs.dna_profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

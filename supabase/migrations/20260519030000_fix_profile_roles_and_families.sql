-- Supabase Migration: Fix User Profiles, Family ID Mapping, Roles, and RLS Recursion
-- Path: supabase/migrations/20260519030000_fix_profile_roles_and_families.sql

-- 1. Drop existing trigger & trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Add email column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Recreate handle_new_user trigger function with full metadata extraction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  f_id UUID;
  f_name TEXT;
  u_role TEXT;
  u_rel TEXT;
BEGIN
  -- Extract metadata fields passed from signUp options
  f_name := NEW.raw_user_meta_data ->> 'family_name';
  u_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'viewer');
  u_rel := COALESCE(NEW.raw_user_meta_data ->> 'relationship', 'Relative');

  -- Ensure family name exists
  IF f_name IS NULL OR f_name = '' THEN
    f_name := 'The ' || COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Legacy') || ' Family';
  END IF;

  -- Create or find family
  IF u_role = 'owner' THEN
    -- Patriarch creates a new family unit
    INSERT INTO public.families (family_name)
    VALUES (f_name)
    RETURNING id INTO f_id;
  ELSE
    -- Editors/viewers look up family by name to join
    SELECT id INTO f_id FROM public.families WHERE family_name = f_name LIMIT 1;
    
    -- Fallback: create family if it does not exist
    IF f_id IS NULL THEN
      INSERT INTO public.families (family_name)
      VALUES (f_name)
      RETURNING id INTO f_id;
    END IF;
  END IF;

  -- Insert profile linking the new user, family, role, and relationship
  INSERT INTO public.profiles (user_id, full_name, email, role, relationship, family_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    u_role,
    u_rel,
    f_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create security definer function to fetch current user's family_id without policy recursion
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT family_id FROM public.profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 5. Drop and recreate profiles RLS policies to allow cross-account selection within same family
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view own profile or family profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;

CREATE POLICY "Allow users to view own profile or family profiles"
  ON public.profiles FOR SELECT
  USING (
    user_id = auth.uid() OR
    family_id = public.get_user_family_id()
  );

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

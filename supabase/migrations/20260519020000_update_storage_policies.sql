-- Supabase Migration: Update Storage Policies for Family Sharing & Admin Access
-- Path: supabase/migrations/20260519020000_update_storage_policies.sql

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
DROP POLICY IF EXISTS "View own or family shared documents" ON storage.objects;
DROP POLICY IF EXISTS "View own or family shared videos" ON storage.objects;
DROP POLICY IF EXISTS "Insert own documents" ON storage.objects;
DROP POLICY IF EXISTS "Insert own videos" ON storage.objects;
DROP POLICY IF EXISTS "Delete own or admin documents" ON storage.objects;
DROP POLICY IF EXISTS "Delete own or admin videos" ON storage.objects;

-- 1. Document SELECT Policy (Own files OR family shared files in 'shared/' path)
CREATE POLICY "View own or family shared documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (
      -- Own folder
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Family shared files
      (
        name LIKE '%_shared_%'
        AND EXISTS (
          SELECT 1 FROM public.profiles p1
          JOIN public.profiles p2 ON p1.family_id = p2.family_id
          WHERE p1.user_id = auth.uid() 
          AND p2.user_id::text = (storage.foldername(name))[1]
        )
      )
    )
  );

-- 2. Video SELECT Policy (Own files OR family shared files in 'shared/' path)
CREATE POLICY "View own or family shared videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'videos'
    AND (
      -- Own folder
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Family shared files
      (
        name LIKE '%_shared_%'
        AND EXISTS (
          SELECT 1 FROM public.profiles p1
          JOIN public.profiles p2 ON p1.family_id = p2.family_id
          WHERE p1.user_id = auth.uid() 
          AND p2.user_id::text = (storage.foldername(name))[1]
        )
      )
    )
  );

-- 3. INSERT Policies (Own folder only)
CREATE POLICY "Insert own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Insert own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. DELETE Policies (Own folder OR Admin/Patriarch)
CREATE POLICY "Delete own or admin documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (
      -- Own folder
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Admin (owner role)
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() AND profiles.role = 'owner'
      )
    )
  );

CREATE POLICY "Delete own or admin videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos'
    AND (
      -- Own folder
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Admin (owner role)
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() AND profiles.role = 'owner'
      )
    )
  );

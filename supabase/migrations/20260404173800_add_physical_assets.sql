CREATE TABLE public.physical_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL,
  description TEXT NOT NULL,
  value_estimate TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.physical_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own physical assets"
  ON public.physical_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own physical assets"
  ON public.physical_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own physical assets"
  ON public.physical_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own physical assets"
  ON public.physical_assets FOR DELETE
  USING (auth.uid() = user_id);

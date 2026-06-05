-- Next-Gen Digital Twin V2 Tables
-- supabase/migrations/20260605000000_digital_twin_schema.sql

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create DNA Memories Table
CREATE TABLE IF NOT EXISTS public.dna_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  year INT NOT NULL,
  event_type TEXT NOT NULL, -- e.g., 'career', 'financial', 'family', 'crisis'
  emotion TEXT, -- e.g., 'hope', 'anxiety', 'pride', 'regret'
  people_involved TEXT[],
  importance_score INT NOT NULL CHECK (importance_score BETWEEN 1 AND 10),
  memory_embedding public.vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dna_memories_embedding ON public.dna_memories USING ivfflat (memory_embedding public.vector_cosine_ops);

-- 2. Create Decision Journal Table
CREATE TABLE IF NOT EXISTS public.decision_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  situation TEXT NOT NULL,
  options JSONB NOT NULL, -- e.g., [{"id": "1", "text": "Option A"}, {"id": "2", "text": "Option B"}]
  selected_option TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  emotional_state TEXT,
  outcome TEXT,
  outcome_quality INT CHECK (outcome_quality BETWEEN 1 AND 10),
  decision_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  decision_embedding public.vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_decision_journal_embedding ON public.decision_journal USING ivfflat (decision_embedding public.vector_cosine_ops);

-- 3. Create Extracted Principles Table
CREATE TABLE IF NOT EXISTS public.extracted_principles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'financial', 'family', 'risk', 'ethics'
  confidence_score NUMERIC NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  supporting_evidence JSONB DEFAULT '[]'::jsonb NOT NULL, -- list of memory/decision links
  contradicting_evidence JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create Knowledge Graph Nodes Table
CREATE TABLE IF NOT EXISTS public.knowledge_graph_nodes (
  id TEXT PRIMARY KEY, -- can be UUID or node key e.g. 'person_1', 'memory_123', 'decision_456'
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('Person', 'Memory', 'Decision', 'Principle', 'Asset', 'Video', 'Document', 'Family Member', 'Event')),
  label TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Create Knowledge Graph Edges Table
CREATE TABLE IF NOT EXISTS public.knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  source_node_id TEXT REFERENCES public.knowledge_graph_nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id TEXT REFERENCES public.knowledge_graph_nodes(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('MADE', 'INFLUENCED', 'MENTIONED', 'OWNED', 'REFERRED_TO', 'CONNECTED_TO', 'INSPIRED', 'INHERITED', 'CAUSED')),
  properties JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Create Accuracy Evaluations Table
CREATE TABLE IF NOT EXISTS public.accuracy_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.dna_profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  real_user_decision TEXT NOT NULL,
  predicted_decision TEXT NOT NULL,
  confidence_score NUMERIC CHECK (confidence_score BETWEEN 0 AND 1),
  is_correct BOOLEAN NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb NOT NULL, -- precision, recall, f1, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. Enable RLS on all tables
ALTER TABLE public.dna_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accuracy_evaluations ENABLE ROW LEVEL SECURITY;

-- 8. Add Security Policies (Allow family members access)
CREATE POLICY "Family members can view DNA memories" ON public.dna_memories
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = dna_memories.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage DNA memories" ON public.dna_memories
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = dna_memories.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view decision journals" ON public.decision_journal
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = decision_journal.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage decision journals" ON public.decision_journal
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = decision_journal.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view extracted principles" ON public.extracted_principles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = extracted_principles.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage extracted principles" ON public.extracted_principles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = extracted_principles.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view KG nodes" ON public.knowledge_graph_nodes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = knowledge_graph_nodes.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage KG nodes" ON public.knowledge_graph_nodes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = knowledge_graph_nodes.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view KG edges" ON public.knowledge_graph_edges
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = knowledge_graph_edges.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage KG edges" ON public.knowledge_graph_edges
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = knowledge_graph_edges.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

CREATE POLICY "Family members can view accuracy evaluations" ON public.accuracy_evaluations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = accuracy_evaluations.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id
  ));

CREATE POLICY "Owners/Editors can manage accuracy evaluations" ON public.accuracy_evaluations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles
    JOIN public.dna_profiles ON dna_profiles.id = accuracy_evaluations.profile_id
    WHERE profiles.user_id = auth.uid() AND profiles.family_id = dna_profiles.family_id AND profiles.role IN ('owner', 'editor')
  ));

-- Supabase Migration: 20260620000000_vector_search_functions.sql
-- Drop existing IVFFlat indexes if they exist
DROP INDEX IF EXISTS public.idx_dna_memories_embedding;
DROP INDEX IF EXISTS public.idx_decision_journal_embedding;

-- Create HNSW indexes for better vector retrieval performance and recall accuracy
CREATE INDEX IF NOT EXISTS idx_dna_memories_hnsw ON public.dna_memories USING hnsw (memory_embedding public.vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_decision_journal_hnsw ON public.decision_journal USING hnsw (decision_embedding public.vector_cosine_ops);

-- Stored procedure for match_memories using pgvector cosine distance
CREATE OR REPLACE FUNCTION public.match_memories(
  query_embedding public.vector(1536),
  match_threshold double precision,
  match_count integer,
  p_profile_id uuid
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  title text,
  description text,
  content text,
  year integer,
  event_type text,
  emotion text,
  people_involved text[],
  importance_score integer,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.profile_id,
    m.title,
    m.description,
    m.content,
    m.year,
    m.event_type,
    m.emotion,
    m.people_involved,
    m.importance_score,
    1 - (m.memory_embedding <=> query_embedding) AS similarity
  FROM public.dna_memories m
  WHERE m.profile_id = p_profile_id
    AND m.memory_embedding IS NOT NULL
    AND (1 - (m.memory_embedding <=> query_embedding)) > match_threshold
  ORDER BY m.memory_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Stored procedure for match_decisions using pgvector cosine distance
CREATE OR REPLACE FUNCTION public.match_decisions(
  query_embedding public.vector(1536),
  match_threshold double precision,
  match_count integer,
  p_profile_id uuid
)
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  situation text,
  options jsonb,
  selected_option text,
  reasoning text,
  emotional_state text,
  outcome text,
  outcome_quality integer,
  decision_date timestamp with time zone,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.profile_id,
    d.situation,
    d.options,
    d.selected_option,
    d.reasoning,
    d.emotional_state,
    d.outcome,
    d.outcome_quality,
    d.decision_date,
    1 - (d.decision_embedding <=> query_embedding) AS similarity
  FROM public.decision_journal d
  WHERE d.profile_id = p_profile_id
    AND d.decision_embedding IS NOT NULL
    AND (1 - (d.decision_embedding <=> query_embedding)) > match_threshold
  ORDER BY d.decision_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

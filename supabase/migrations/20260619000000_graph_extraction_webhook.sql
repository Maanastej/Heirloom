-- Enable pg_net to allow database HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.trigger_graph_extraction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
  request_payload JSONB;
BEGIN
  -- We assume SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are available or we use a relative path
  -- However, since this is local / hosted, we can just point to the relative edge function endpoint
  -- A safer approach for Webhooks is to configure this via the Supabase Dashboard,
  -- but here is the pg_net equivalent if you have the URL.
  
  -- If deploying to production, replace these with your actual project URL and anon/service key
  -- or use the Supabase Dashboard Webhooks UI for easier configuration.
  edge_function_url := current_setting('custom.edge_function_url', true);
  service_role_key := current_setting('custom.service_role_key', true);

  IF edge_function_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Edge function URL or Service Role Key not set. Webhook will not fire.';
    RETURN NEW;
  END IF;

  request_payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
      url := edge_function_url || '/functions/v1/extract-graph',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
      ),
      body := request_payload
  );

  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS after_dna_memory_insert ON public.dna_memories;
DROP TRIGGER IF EXISTS after_decision_journal_insert ON public.decision_journal;

-- Create trigger on dna_memories
CREATE TRIGGER after_dna_memory_insert
  AFTER INSERT ON public.dna_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_graph_extraction();

-- Create trigger on decision_journal
CREATE TRIGGER after_decision_journal_insert
  AFTER INSERT ON public.decision_journal
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_graph_extraction();

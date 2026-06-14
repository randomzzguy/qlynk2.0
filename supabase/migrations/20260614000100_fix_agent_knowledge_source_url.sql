ALTER TABLE public.agent_knowledge
  ADD COLUMN IF NOT EXISTS source_url TEXT;

COMMENT ON COLUMN public.agent_knowledge.source_url IS 'Original URL used when the knowledge item was scraped from the web';

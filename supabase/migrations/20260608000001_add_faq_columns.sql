-- Add FAQ columns to agent_knowledge table
ALTER TABLE public.agent_knowledge
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Index for faster sorting by priority
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_priority ON public.agent_knowledge(priority DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_category ON public.agent_knowledge(category);

-- Update existing rows to have default values
UPDATE public.agent_knowledge
SET priority = 1, category = 'general'
WHERE priority IS NULL OR category IS NULL;

COMMENT ON COLUMN public.agent_knowledge.priority IS 'Priority level 1-5, higher = referenced first by AI';
COMMENT ON COLUMN public.agent_knowledge.category IS 'Category for organizing FAQs (general, pricing, services, etc.)';

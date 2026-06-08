-- Add sender_type column to agent_messages to distinguish between AI and owner replies
ALTER TABLE public.agent_messages
  ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'ai';

-- Update existing messages: role='assistant' without explicit sender_type are AI messages
UPDATE public.agent_messages
SET sender_type = 'ai'
WHERE role = 'assistant' AND sender_type IS NULL;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_agent_messages_sender_type ON public.agent_messages(sender_type);

COMMENT ON COLUMN public.agent_messages.sender_type IS 'For assistant messages: ai (default) or owner (manual reply)';

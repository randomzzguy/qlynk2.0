-- Fix missing created_at column in agent_conversations
-- Some environments might have started_at instead or be missing it entirely

DO $$ 
BEGIN
    -- 1. If created_at doesn't exist, try to rename started_at or create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_conversations' AND column_name='created_at') THEN
        
        -- If started_at exists, rename it to created_at
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_conversations' AND column_name='started_at') THEN
            ALTER TABLE public.agent_conversations RENAME COLUMN started_at TO created_at;
        ELSE
            -- Otherwise just add it
            ALTER TABLE public.agent_conversations ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
        END IF;
        
    END IF;

    -- 2. Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_conversations' AND column_name='updated_at') THEN
        ALTER TABLE public.agent_conversations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- 3. Ensure visitor tracking columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_conversations' AND column_name='visitor_ip') THEN
        ALTER TABLE public.agent_conversations ADD COLUMN visitor_ip TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_conversations' AND column_name='visitor_location') THEN
        ALTER TABLE public.agent_conversations ADD COLUMN visitor_location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_conversations' AND column_name='visitor_device') THEN
        ALTER TABLE public.agent_conversations ADD COLUMN visitor_device TEXT;
    END IF;

    -- 4. Ensure sentiment column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_conversations' AND column_name='sentiment') THEN
        ALTER TABLE public.agent_conversations ADD COLUMN sentiment TEXT;
    END IF;

END $$;

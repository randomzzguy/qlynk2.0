-- 1. Create the increment_message_count RPC function (used in lib/agent.js)
CREATE OR REPLACE FUNCTION increment_message_count(conv_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.agent_conversations
    SET message_count = message_count + 1,
        updated_at = now()
    WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger function to automatically update message_count on message insert
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Get owner ID from conversation
        SELECT agent_owner_id INTO owner_id FROM public.agent_conversations WHERE id = NEW.conversation_id;
        
        -- Update conversation-specific count
        UPDATE public.agent_conversations
        SET message_count = COALESCE(message_count, 0) + 1,
            updated_at = now()
        WHERE id = NEW.conversation_id;
        
        -- Update global usage count for subscription
        IF owner_id IS NOT NULL THEN
            UPDATE public.subscriptions
            SET messages_used = COALESCE(messages_used, 0) + 1
            WHERE user_id = owner_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.agent_conversations
        SET message_count = (SELECT count(*) FROM public.agent_messages WHERE conversation_id = OLD.conversation_id),
            updated_at = now()
        WHERE id = OLD.conversation_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on agent_messages
DROP TRIGGER IF EXISTS tr_update_message_count ON public.agent_messages;
CREATE TRIGGER tr_update_message_count
AFTER INSERT OR DELETE ON public.agent_messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- 4. Sync existing message counts
UPDATE public.agent_conversations c
SET message_count = (
    SELECT count(*) 
    FROM public.agent_messages m 
    WHERE m.conversation_id = c.id
);

-- 5. Sync global usage counts
UPDATE public.subscriptions s
SET messages_used = (
    SELECT count(*)
    FROM public.agent_messages m
    JOIN public.agent_conversations c ON m.conversation_id = c.id
    WHERE c.agent_owner_id = s.user_id
);

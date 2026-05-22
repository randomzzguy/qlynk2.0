-- Count usage by visitor prompts, not by every stored row.
-- Assistant messages are now persisted server-side too, so counting all rows
-- would charge two message credits for one chat exchange.

CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT agent_owner_id INTO owner_id
        FROM public.agent_conversations
        WHERE id = NEW.conversation_id;

        UPDATE public.agent_conversations
        SET message_count = COALESCE(message_count, 0) + 1,
            updated_at = now()
        WHERE id = NEW.conversation_id;

        IF owner_id IS NOT NULL AND NEW.role = 'user' THEN
            UPDATE public.subscriptions
            SET messages_used = COALESCE(messages_used, 0) + 1
            WHERE user_id = owner_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.agent_conversations
        SET message_count = (
                SELECT count(*)
                FROM public.agent_messages
                WHERE conversation_id = OLD.conversation_id
            ),
            updated_at = now()
        WHERE id = OLD.conversation_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

UPDATE public.subscriptions s
SET messages_used = (
    SELECT count(*)
    FROM public.agent_messages m
    JOIN public.agent_conversations c ON m.conversation_id = c.id
    WHERE c.agent_owner_id = s.user_id
      AND m.role = 'user'
);

-- Public chat and analytics writes now pass through validated, rate-limited API
-- routes using the service-role client.
DROP POLICY IF EXISTS "Public can start conversations"
ON public.agent_conversations;

DROP POLICY IF EXISTS "Public can send messages"
ON public.agent_messages;

DROP POLICY IF EXISTS "Public can insert page views"
ON public.page_views;

BEGIN;
CREATE FUNCTION public.get_resilience_snapshot()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'observed_at', clock_timestamp(),
    'database_bytes', pg_database_size(current_database()),
    'storage', (
      SELECT jsonb_build_object(
        'known_bytes', COALESCE(sum(CASE WHEN size_text ~ '^[0-9]{1,18}$' THEN size_text::bigint ELSE 0 END),0),
        'unknown_objects', count(*) FILTER (WHERE size_text IS NULL OR size_text !~ '^[0-9]{1,18}$'),
        'objects', count(*)
      ) FROM (SELECT to_jsonb(o)->'metadata'->>'size' AS size_text FROM storage.objects o) sizes
    ),
    'expired_chat_reservations', (SELECT count(*) FROM public.agent_chat_requests WHERE status='pending' AND expires_at < clock_timestamp()),
    'budgets', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'scope', b.scope, 'model', b.model, 'blocked_until', b.blocked_until,
        'requests_minute', u.requests_minute, 'requests_day', u.requests_day,
        'tokens_minute', u.tokens_minute, 'tokens_day', u.tokens_day,
        'active_requests', u.active_requests
      )) FROM public.ai_provider_budgets b CROSS JOIN LATERAL (
        SELECT count(*) AS requests_day, COALESCE(sum(r.estimated_tokens),0) AS tokens_day,
          count(*) FILTER(WHERE r.started_at > clock_timestamp()-interval '1 minute') AS requests_minute,
          COALESCE(sum(r.estimated_tokens) FILTER(WHERE r.started_at > clock_timestamp()-interval '1 minute'),0) AS tokens_minute,
          count(*) FILTER(WHERE r.active_until > clock_timestamp()) AS active_requests
        FROM public.ai_provider_requests r WHERE r.scope=b.scope AND r.model=b.model
          AND r.started_at > clock_timestamp()-interval '24 hours'
      ) u WHERE u.requests_day > 0 OR b.blocked_until > clock_timestamp()
    ), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.get_resilience_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_resilience_snapshot() TO service_role;
COMMIT;

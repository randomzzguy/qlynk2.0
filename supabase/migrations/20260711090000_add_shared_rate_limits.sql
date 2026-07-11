CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  namespace TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (namespace, key_hash)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.api_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_namespace TEXT,
  p_key_hash TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.api_rate_limits%ROWTYPE;
BEGIN
  IF p_namespace IS NULL OR length(p_namespace) NOT BETWEEN 1 AND 100
     OR p_key_hash IS NULL OR length(p_key_hash) <> 64
     OR p_max_requests < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate-limit parameters';
  END IF;

  INSERT INTO public.api_rate_limits AS limits (
    namespace, key_hash, request_count, reset_at, updated_at
  ) VALUES (
    p_namespace, p_key_hash, 1, now() + make_interval(secs => p_window_seconds), now()
  )
  ON CONFLICT (namespace, key_hash) DO UPDATE
  SET request_count = CASE
        WHEN limits.reset_at <= now() THEN 1
        ELSE limits.request_count + 1
      END,
      reset_at = CASE
        WHEN limits.reset_at <= now() THEN now() + make_interval(secs => p_window_seconds)
        ELSE limits.reset_at
      END,
      updated_at = now()
  RETURNING limits.* INTO current_row;

  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits
    WHERE api_rate_limits.reset_at < now() - interval '1 day';
  END IF;

  RETURN QUERY SELECT
    current_row.request_count <= p_max_requests,
    greatest(p_max_requests - current_row.request_count, 0),
    current_row.reset_at;
END;
$$;

REVOKE ALL ON FUNCTION public.check_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(TEXT, TEXT, INTEGER, INTEGER)
  TO service_role;

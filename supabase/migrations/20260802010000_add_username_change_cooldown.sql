ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.username_changed_at IS
  'When the public username was last changed after signup; enforced as a 30-day cooldown.';

CREATE OR REPLACE FUNCTION public.enforce_profile_username_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.username := lower(btrim(NEW.username));

  IF NEW.username !~ '^[a-z0-9_-]{3,30}$' THEN
    RAISE EXCEPTION 'Username must be 3-30 characters and use only lowercase letters, numbers, hyphens, or underscores.'
      USING ERRCODE = '22023';
  END IF;

  IF NEW.username = ANY (ARRAY[
    'about', 'account', 'admin', 'agent-rules-preview', 'ai-agent', 'ai-clone',
    'api', 'auth', 'blog', 'compare', 'create', 'dashboard', 'digital-twin',
    'docs', 'email-preferences', 'embed', 'faq', 'features', 'for-business',
    'for-creators', 'for-founders', 'for-freelancers', 'for-job-seekers',
    'help', 'login', 'onboarding', 'personal-ai', 'premium-themes', 'press',
    'preview', 'pricing', 'privacy', 'settings', 'signup', 'solutions',
    'support', 'terms', 'todos', 'www'
  ]) THEN
    RAISE EXCEPTION 'This username is reserved.' USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.username_changed_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF OLD.username_changed_at IS NOT NULL
       AND OLD.username_changed_at + INTERVAL '30 days' > now() THEN
      RAISE EXCEPTION 'Username can only be changed once every 30 days.'
        USING ERRCODE = 'P0001';
    END IF;

    NEW.username_changed_at := now();
  ELSE
    -- Owners can edit profiles directly, so the cooldown timestamp must be immutable.
    NEW.username_changed_at := OLD.username_changed_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_username_change_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_username_change_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_username_change();

REVOKE ALL ON FUNCTION public.enforce_profile_username_change() FROM PUBLIC, anon, authenticated;

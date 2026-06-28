-- Create the rate limiting table
CREATE TABLE IF NOT EXISTS public.login_attempts (
    email TEXT PRIMARY KEY,
    failed_attempts INT DEFAULT 0,
    cooldown_until TIMESTAMPTZ,
    previous_cooldown_mins INT DEFAULT 0
);

-- Revoke direct access to prevent tampering
REVOKE ALL ON public.login_attempts FROM PUBLIC;
REVOKE ALL ON public.login_attempts FROM anon, authenticated;

-- RPC to check if a user is currently rate-limited (returns blocked status and remaining minutes)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(target_email TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_record public.login_attempts%ROWTYPE;
  remaining_mins FLOAT;
BEGIN
  SELECT * INTO attempt_record FROM public.login_attempts WHERE email = target_email;
  
  IF attempt_record IS NULL THEN
    RETURN json_build_object('blocked', false, 'remaining_mins', 0);
  END IF;

  IF attempt_record.cooldown_until > now() THEN
    remaining_mins := EXTRACT(EPOCH FROM (attempt_record.cooldown_until - now())) / 60.0;
    RETURN json_build_object('blocked', true, 'remaining_mins', remaining_mins);
  END IF;

  RETURN json_build_object('blocked', false, 'remaining_mins', 0);
END;
$$;

-- RPC to record a login attempt (success resets it, failure increments and applies cooldowns)
CREATE OR REPLACE FUNCTION public.record_login_attempt(target_email TEXT, is_success BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_record public.login_attempts%ROWTYPE;
  max_allowed_attempts INT;
  new_cooldown_mins INT;
BEGIN
  IF is_success THEN
    -- Reset on success
    DELETE FROM public.login_attempts WHERE email = target_email;
    RETURN;
  END IF;

  -- Handle failure
  SELECT * INTO attempt_record FROM public.login_attempts WHERE email = target_email;

  IF attempt_record IS NULL THEN
    INSERT INTO public.login_attempts (email, failed_attempts) VALUES (target_email, 1);
    RETURN;
  END IF;

  -- Determine max allowed attempts before lockout
  IF attempt_record.previous_cooldown_mins = 0 THEN
    max_allowed_attempts := 5;
  ELSE
    max_allowed_attempts := 2;
  END IF;

  -- Increment failed attempts
  attempt_record.failed_attempts := attempt_record.failed_attempts + 1;

  IF attempt_record.failed_attempts >= max_allowed_attempts THEN
    -- Trigger lockout
    IF attempt_record.previous_cooldown_mins = 0 THEN
      new_cooldown_mins := 15;
    ELSE
      new_cooldown_mins := attempt_record.previous_cooldown_mins + 10;
    END IF;

    UPDATE public.login_attempts
    SET 
      failed_attempts = 0,
      cooldown_until = now() + (new_cooldown_mins || ' minutes')::interval,
      previous_cooldown_mins = new_cooldown_mins
    WHERE email = target_email;
  ELSE
    -- Just increment
    UPDATE public.login_attempts
    SET failed_attempts = attempt_record.failed_attempts
    WHERE email = target_email;
  END IF;
END;
$$;

-- Migration: Auto-assign pilot tier to new users + backfill existing users
-- Date: 2026-02-13
-- Purpose: Every new signup gets a pilot account with 60-day countdown
--          All existing users without pilot_accounts get one starting NOW

-- ============================================================
-- 1. Backfill: Create pilot_accounts for all existing users who don't have one
-- ============================================================
INSERT INTO public.pilot_accounts (user_id, tier, status, pilot_start, pilot_end, grace_end)
SELECT
  u.id,
  'pilot',
  'pilot',
  NOW(),
  NOW() + INTERVAL '60 days',
  NOW() + INTERVAL '67 days'
FROM auth.users u
LEFT JOIN public.pilot_accounts pa ON pa.user_id = u.id
WHERE pa.id IS NULL;

-- ============================================================
-- 2. Trigger: Auto-create pilot_account on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_create_pilot_account()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.pilot_accounts (user_id, tier, status)
  VALUES (NEW.id, 'pilot', 'pilot')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_auto_pilot_account ON auth.users;

-- Create trigger on auth.users INSERT
CREATE TRIGGER trg_auto_pilot_account
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_pilot_account();

-- Add token column for tempmail.lol support
ALTER TABLE public.bot_temp_emails ADD COLUMN IF NOT EXISTS token text;

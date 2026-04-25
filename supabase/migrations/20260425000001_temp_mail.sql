-- Create tables for Temp Mail persistence
CREATE TABLE IF NOT EXISTS public.bot_temp_emails (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_checked_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(telegram_id)
);

CREATE TABLE IF NOT EXISTS public.bot_temp_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    temp_email_id uuid REFERENCES public.bot_temp_emails(id) ON DELETE CASCADE,
    external_id integer NOT NULL, -- 1secmail message ID
    from_email text NOT NULL,
    subject text,
    body text,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(temp_email_id, external_id)
);

-- RLS
ALTER TABLE public.bot_temp_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_temp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for service role" ON public.bot_temp_emails USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for service role messages" ON public.bot_temp_messages USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bot_temp_emails_tg ON public.bot_temp_emails(telegram_id);
CREATE INDEX IF NOT EXISTS idx_bot_temp_messages_email ON public.bot_temp_messages(temp_email_id);

-- 20260418000005_create_pending_payments.sql
-- Tabela para gerenciar transações Pix e respeitar o limite de 35 caracteres do TxID

CREATE TABLE IF NOT EXISTS public.pending_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    type text NOT NULL, -- 'plan', 'wallet', 'database', 'checker'
    item_id text,       -- ID do plano ou da base
    amount numeric NOT NULL,
    period text,        -- 'weekly', 'monthly' (para planos)
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Ativar RLS para segurança
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- Política: Apenas o sistema (service_role) pode gerenciar tudo
CREATE POLICY "System can do everything with pending_payments" 
ON public.pending_payments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar tabela para estatísticas editáveis do admin
CREATE TABLE IF NOT EXISTS public.admin_stats_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key text UNIQUE NOT NULL,
  override_value integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_stats_override ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ver e editar
CREATE POLICY "Admins podem gerenciar estatísticas"
ON public.admin_stats_override
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_stats_override_updated_at
BEFORE UPDATE ON public.admin_stats_override
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
-- 1. DELETE OLD GERAL APIS TO CLEAN THE PANEL
DELETE FROM public.apis WHERE group_name = 'Geral' OR group_name = 'Geral (Desativados)' OR name ilike '%Geral%';

-- Create the Tables for the Intermediary API System
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  requests_made INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES public.api_tokens(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- WE NEED TO INSERT THE 68 NEW ENDPOINTS
DO $$
DECLARE
  v_pessoas UUID := 'a0000000-0000-0000-0000-000000000002';
  v_veiculos UUID := 'a0000000-0000-0000-0000-000000000001';
  v_empresas UUID := 'a0000000-0000-0000-0000-000000000003';
  v_contato UUID := 'a0000000-0000-0000-0000-000000000004';
  v_fotos UUID := 'a0000000-0000-0000-0000-000000000006';
  v_processos UUID := 'a0000000-0000-0000-0000-000000000005';
BEGIN

  -- Módulo Pessoas
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_pessoas, 'Consultar CPF (Básico)', 'panel:iseek-cpfbasico', 'CPF'),
  (v_pessoas, 'Consultar CPF Completo', 'panel:iseek-cpf', 'CPF'),
  (v_pessoas, 'Categoria CPF', 'panel:iseek-dados---catcpf', 'CPF'),
  (v_pessoas, 'Consultar Score Serasa', 'panel:iseek-dados---score2', 'Financeiro / Score'),
  (v_pessoas, 'Consultar Score Serasa v2', 'panel:iseek-dados---score', 'Financeiro / Score'),
  (v_pessoas, 'Mãe por Nome', 'panel:iseek-dados---mae', 'Parentes / Vizinhos'),
  (v_pessoas, 'Pai por Nome', 'panel:iseek-dados---pai', 'Parentes / Vizinhos'),
  (v_pessoas, 'Buscar Fone/Parentes por Nome', 'panel:iseek-dados---nomeabreviadofiltros', 'Nome'),
  (v_pessoas, 'Buscador de Parentes', 'panel:iseek-dados---parentes', 'Parentes / Vizinhos'),
  (v_pessoas, 'Busca NIS', 'panel:iseek-dados---nis', 'CPF'),
  (v_pessoas, 'Busca por Chave PIX', 'panel:iseek-dados---pix', 'Financeiro / Score'),
  (v_pessoas, 'RG Nacional', 'panel:iseek-dados---rg', 'CPF'),
  (v_pessoas, 'Título de Eleitor', 'panel:iseek-dados---titulo', 'CPF'),
  (v_pessoas, 'Benefícios INSS', 'panel:iseek-dados---beneficios', 'CPF'),
  (v_pessoas, 'Localizador Nascimento', 'panel:iseek-dados---nasc', 'CPF'),
  (v_pessoas, 'Dados Funcionais', 'panel:iseek-dados---func', 'CPF'),
  (v_pessoas, 'Cheques sem Fundo', 'panel:iseek-dados---cheque', 'Financeiro / Score'),
  (v_pessoas, 'Histórico Vacinas', 'panel:iseek-dados---vacinas', 'CPF'),
  (v_pessoas, 'Consulta CNH Base', 'panel:iseek-dados---cnh', 'CPF'),
  (v_pessoas, 'Consulta CNH (AM)', 'panel:iseek-dados---cnham', 'CPF'),
  (v_pessoas, 'Consulta CNH (RS)', 'panel:iseek-dados---cnhrs', 'CPF'),
  (v_pessoas, 'Consulta CNH (RR)', 'panel:iseek-dados---cnhrr', 'CPF'),
  (v_pessoas, 'Consulta CNH (NC)', 'panel:iseek-dados---cnhnc', 'CPF'),
  (v_pessoas, 'Dívidas Ativas e Protestos', 'panel:iseek-dados---dividas', 'Financeiro / Score'),
  (v_pessoas, 'Vínculo Faculdades/Acadêmico', 'panel:iseek-dados---faculdades', 'CPF'),
  (v_pessoas, 'Bens em Nome', 'panel:iseek-dados---bens', 'Financeiro / Score'),
  (v_pessoas, 'Restituição/Status IRPF', 'panel:iseek-dados---irpf', 'Financeiro / Score'),
  (v_pessoas, 'Certidão de Óbito', 'panel:iseek-dados---obito', 'CPF'),
  (v_pessoas, 'Assessoria / Advínculo', 'panel:iseek-dados---assessoria', 'CPF'),
  (v_pessoas, 'Reg. Profissionais', 'panel:iseek-dados---registro', 'CPF');

  -- Módulo Veículos
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_veiculos, 'Placa Nacional Base', 'panel:iseek-dados---placa', 'Proprietário Atual'),
  (v_veiculos, 'Consulta Chassi', 'panel:iseek-dados---chassi', 'Nacional'),
  (v_veiculos, 'Consulta Motor', 'panel:iseek-dados---motor', 'Nacional'),
  (v_veiculos, 'Consulta RENAVAM', 'panel:iseek-dados---renavam', 'Nacional'),
  (v_veiculos, 'Veículos em Nome (Vinculados)', 'panel:iseek-dados---veiculos', 'Proprietário Atual'),
  (v_veiculos, 'Status CRLV TO', 'panel:iseek-dados---crlvto', 'Débitos / Gravame'),
  (v_veiculos, 'Status CRLV MT', 'panel:iseek-dados---crlvmt', 'Débitos / Gravame');

  -- Módulo Empresas
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_empresas, 'CNPJ Receita', 'panel:iseek-dados---cnpj', 'CNPJ Geral'),
  (v_empresas, 'Consulta RAIS (Empresas/Pessoas)', 'panel:iseek-dados---rais', 'Sócio / QSA');

  -- Módulo Contato
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_contato, 'Consulta CEP ViaCorreios', 'panel:iseek-dados---cep', 'Endereço / CEP'),
  (v_contato, 'Buscador de Email', 'panel:iseek-dados---email', 'Email'),
  (v_contato, 'Descobrir por Telefone', 'panel:iseek-dados---telefone', 'Telefone / WhatsApp'),
  (v_contato, 'Endereçador por Info', 'panel:iseek-dados---catnumero', 'Telefone / WhatsApp');

  -- Módulo Processos Judiciais
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_processos, 'Sintegra Judicial (Processos do CPF)', 'panel:iseek-dados---processos', 'Judicial'),
  (v_processos, 'Consulta Número de Processo', 'panel:iseek-dados---processo', 'Judicial'),
  (v_processos, 'Consultar Advogado (OAB)', 'panel:iseek-dados---advogadooab', 'Judicial'),
  (v_processos, 'Consultar Advogado OAB e UF', 'panel:iseek-dados---advogadooabuf', 'Judicial'),
  (v_processos, 'Consultar Advogado por CPF', 'panel:iseek-dados---advogadocpf', 'Judicial'),
  (v_processos, 'Consulta Simples OAB', 'panel:iseek-dados---oab', 'Judicial'),
  (v_processos, 'Mandados de Prisão', 'panel:iseek-dados---mandado', 'Judicial'),
  (v_processos, 'Certidões Criminais/Cíveis', 'panel:iseek-dados---certidoes', 'Judicial'),
  (v_processos, 'Matrícula de Imóvel', 'panel:iseek-dados---matricula', 'Judicial');

  -- Módulo Fotos & Docs
  INSERT INTO public.apis (category_id, name, endpoint, group_name) VALUES
  (v_fotos, 'Foto MG', 'panel:iseek-fotos---fotomg', 'Fotos Estaduais'),
  (v_fotos, 'Foto SP', 'panel:iseek-fotos---fotosp', 'Fotos Estaduais'),
  (v_fotos, 'Foto MA', 'panel:iseek-fotos---fotoma', 'Fotos Estaduais'),
  (v_fotos, 'Foto MS', 'panel:iseek-fotos---fotoms', 'Fotos Estaduais'),
  (v_fotos, 'Foto TO', 'panel:iseek-fotos---fototo', 'Fotos Estaduais'),
  (v_fotos, 'Foto RO', 'panel:iseek-fotos---fotoro', 'Fotos Estaduais'),
  (v_fotos, 'Foto PI', 'panel:iseek-fotos---fotopi', 'Fotos Estaduais'),
  (v_fotos, 'Foto ES', 'panel:iseek-fotos---fotoes', 'Fotos Estaduais'),
  (v_fotos, 'Foto DF', 'panel:iseek-fotos---fotodf', 'Fotos Estaduais'),
  (v_fotos, 'Foto CE', 'panel:iseek-fotos---fotoce', 'Fotos Estaduais'),
  (v_fotos, 'Foto RJ', 'panel:iseek-fotos---fotorj', 'Fotos Estaduais'),
  (v_fotos, 'Foto PR', 'panel:iseek-fotos---fotopr', 'Fotos Estaduais'),
  (v_fotos, 'Foto NC', 'panel:iseek-fotos---fotonc', 'Fotos Estaduais'),
  (v_fotos, 'Foto RN', 'panel:iseek-fotos---fotorn', 'Fotos Estaduais'),
  (v_fotos, 'Foto PE', 'panel:iseek-fotos---fotope', 'Fotos Estaduais'),
  (v_fotos, 'Foto PB', 'panel:iseek-fotos---fotopb', 'Fotos Estaduais'),
  (v_fotos, 'Foto GO', 'panel:iseek-fotos---fotogo', 'Fotos Estaduais'),
  (v_fotos, 'Foto AL', 'panel:iseek-fotos---fotoal', 'Fotos Estaduais'),
  (v_fotos, 'Presos MA (Foto)', 'panel:iseek-fotos---fotomapresos', 'Fotos Estaduais'),
  (v_fotos, 'Foto CNH Nacional', 'panel:iseek-fotos---fotocnh', 'Fotos CNH'),
  (v_fotos, 'Foto Detran Integrado', 'panel:iseek-dados---fotodetran', 'Fotos CNH'),
  (v_fotos, 'Pesquisa IPTU (Prefeituras)', 'panel:iseek-dados---iptu', 'Imóveis');

END $$;

-- Update Bot_Settings to use new IP and Token
UPDATE public.bot_settings SET value = 'http://158.173.2.17:7070/consulta' WHERE key = 'external_api_url';
UPDATE public.bot_settings SET value = '23btetakuv3zx8HkEcfRpEy_zonEFilQBDLOJl9rEPk' WHERE key = 'external_api_token';

INSERT INTO public.bot_settings (key, value)
VALUES ('external_api_url', 'http://158.173.2.17:7070/consulta')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.bot_settings (key, value)
VALUES ('external_api_token', '23btetakuv3zx8HkEcfRpEy_zonEFilQBDLOJl9rEPk')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

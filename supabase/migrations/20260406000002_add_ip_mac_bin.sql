-- ──────────────────────────────────────────────
-- MIGRATION: 20260406000002_add_ip_mac_bin.sql
-- ──────────────────────────────────────────────

-- 1. Inserir novas categorias
INSERT INTO public.api_categories (id, name, description, icon, slug) VALUES
('b0000000-0000-0000-0000-000000000001', 'REDE E INTERNET', 'Consultas de IP e Endereço MAC', '🌐', 'internet'),
('b0000000-0000-0000-0000-000000000002', 'FINANCEIRO', 'Consultas de BIN de Cartão', '💳', 'financeiro')
ON CONFLICT (slug) DO NOTHING;

-- 2. Inserir APIs funcionais para IP, MAC e BIN
INSERT INTO public.apis (category_id, name, description, endpoint) VALUES
('b0000000-0000-0000-0000-000000000001', 'IP Geolocation', 'Localização geográfica e provedor do IP', 'http://ip-api.com/json/{valor}'),
('b0000000-0000-0000-0000-000000000001', 'MAC Lookup', 'Identificação de fabricante via MAC', 'https://api.macvendors.com/{valor}'),
('b0000000-0000-0000-0000-000000000002', 'BIN Checker', 'Informações de emissor e tipo de cartão via BIN', 'https://lookup.binlist.net/{valor}')
ON CONFLICT DO NOTHING;

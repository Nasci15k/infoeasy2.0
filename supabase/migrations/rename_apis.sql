DO $$
DECLARE
  v_cpf UUID := 'b0000000-0000-0000-0000-000000000001';
  v_nome UUID := 'b0000000-0000-0000-0000-000000000002';
  v_fin UUID := 'b0000000-0000-0000-0000-000000000003';
  v_vei UUID := 'b0000000-0000-0000-0000-000000000004';
  v_con UUID := 'b0000000-0000-0000-0000-000000000005';
  v_doc UUID := 'b0000000-0000-0000-0000-000000000006';
  v_jud UUID := 'b0000000-0000-0000-0000-000000000007';
  v_emp UUID := 'b0000000-0000-0000-0000-000000000008';
  v_fot UUID := 'b0000000-0000-0000-0000-000000000009';
BEGIN

  UPDATE public.apis SET name = 'CPF Básico' WHERE endpoint = 'panel:iseek-cpfbasico';
  UPDATE public.apis SET name = 'CPF' WHERE endpoint = 'panel:iseek-cpf';
  UPDATE public.apis SET name = 'Cat CPF' WHERE endpoint = 'panel:iseek-dados---catcpf';
  UPDATE public.apis SET name = 'NIS' WHERE endpoint = 'panel:iseek-dados---nis';
  UPDATE public.apis SET name = 'Nascimento' WHERE endpoint = 'panel:iseek-dados---nasc';
  UPDATE public.apis SET name = 'Benefícios' WHERE endpoint = 'panel:iseek-dados---beneficios';

  UPDATE public.apis SET name = 'Mãe' WHERE endpoint = 'panel:iseek-dados---mae';
  UPDATE public.apis SET name = 'Pai' WHERE endpoint = 'panel:iseek-dados---pai';
  UPDATE public.apis SET name = 'Nome' WHERE endpoint = 'panel:iseek-dados---nomeabreviadofiltros';
  UPDATE public.apis SET name = 'Parentes' WHERE endpoint = 'panel:iseek-dados---parentes';

  UPDATE public.apis SET name = 'Score 2' WHERE endpoint = 'panel:iseek-dados---score2';
  UPDATE public.apis SET name = 'Score' WHERE endpoint = 'panel:iseek-dados---score';
  UPDATE public.apis SET name = 'PIX' WHERE endpoint = 'panel:iseek-dados---pix';
  UPDATE public.apis SET name = 'Cheque' WHERE endpoint = 'panel:iseek-dados---cheque';
  UPDATE public.apis SET name = 'Bens' WHERE endpoint = 'panel:iseek-dados---bens';
  UPDATE public.apis SET name = 'IRPF' WHERE endpoint = 'panel:iseek-dados---irpf';
  UPDATE public.apis SET name = 'Dívidas' WHERE endpoint = 'panel:iseek-dados---dividas';

  UPDATE public.apis SET name = 'Placa' WHERE endpoint = 'panel:iseek-dados---placa';
  UPDATE public.apis SET name = 'Chassi' WHERE endpoint = 'panel:iseek-dados---chassi';
  UPDATE public.apis SET name = 'Motor' WHERE endpoint = 'panel:iseek-dados---motor';
  UPDATE public.apis SET name = 'Renavam' WHERE endpoint = 'panel:iseek-dados---renavam';
  UPDATE public.apis SET name = 'CRLV TO' WHERE endpoint = 'panel:iseek-dados---crlvto';
  UPDATE public.apis SET name = 'CRLV MT' WHERE endpoint = 'panel:iseek-dados---crlvmt';
  UPDATE public.apis SET name = 'Veículos' WHERE endpoint = 'panel:iseek-dados---veiculos';
  UPDATE public.apis SET name = 'CNH' WHERE endpoint = 'panel:iseek-dados---cnh';
  UPDATE public.apis SET name = 'CNH AM' WHERE endpoint = 'panel:iseek-dados---cnham';
  UPDATE public.apis SET name = 'CNH RS' WHERE endpoint = 'panel:iseek-dados---cnhrs';
  UPDATE public.apis SET name = 'CNH RR' WHERE endpoint = 'panel:iseek-dados---cnhrr';
  UPDATE public.apis SET name = 'CNH NC' WHERE endpoint = 'panel:iseek-dados---cnhnc';

  UPDATE public.apis SET name = 'CEP' WHERE endpoint = 'panel:iseek-dados---cep';
  UPDATE public.apis SET name = 'Email' WHERE endpoint = 'panel:iseek-dados---email';
  UPDATE public.apis SET name = 'Telefone' WHERE endpoint = 'panel:iseek-dados---telefone';
  UPDATE public.apis SET name = 'Cat Número' WHERE endpoint = 'panel:iseek-dados---catnumero';

  UPDATE public.apis SET name = 'RG' WHERE endpoint = 'panel:iseek-dados---rg';
  UPDATE public.apis SET name = 'Título' WHERE endpoint = 'panel:iseek-dados---titulo';
  UPDATE public.apis SET name = 'Funcional' WHERE endpoint = 'panel:iseek-dados---func';
  UPDATE public.apis SET name = 'Vacinas' WHERE endpoint = 'panel:iseek-dados---vacinas';
  UPDATE public.apis SET name = 'Faculdades' WHERE endpoint = 'panel:iseek-dados---faculdades';
  UPDATE public.apis SET name = 'Óbito' WHERE endpoint = 'panel:iseek-dados---obito';
  UPDATE public.apis SET name = 'Assessoria' WHERE endpoint = 'panel:iseek-dados---assessoria';
  UPDATE public.apis SET name = 'Registro' WHERE endpoint = 'panel:iseek-dados---registro';

  UPDATE public.apis SET name = 'Processos' WHERE endpoint = 'panel:iseek-dados---processos';
  UPDATE public.apis SET name = 'Processo' WHERE endpoint = 'panel:iseek-dados---processo';
  UPDATE public.apis SET name = 'Advogado OAB' WHERE endpoint = 'panel:iseek-dados---advogadooab';
  UPDATE public.apis SET name = 'Advogado OAB UF' WHERE endpoint = 'panel:iseek-dados---advogadooabuf';
  UPDATE public.apis SET name = 'Advogado CPF' WHERE endpoint = 'panel:iseek-dados---advogadocpf';
  UPDATE public.apis SET name = 'OAB' WHERE endpoint = 'panel:iseek-dados---oab';
  UPDATE public.apis SET name = 'Mandado' WHERE endpoint = 'panel:iseek-dados---mandado';
  UPDATE public.apis SET name = 'Certidões' WHERE endpoint = 'panel:iseek-dados---certidoes';
  UPDATE public.apis SET name = 'Matrícula' WHERE endpoint = 'panel:iseek-dados---matricula';
  UPDATE public.apis SET name = 'IPTU' WHERE endpoint = 'panel:iseek-dados---iptu';

  UPDATE public.apis SET name = 'CNPJ' WHERE endpoint = 'panel:iseek-dados---cnpj';
  UPDATE public.apis SET name = 'RAIS' WHERE endpoint = 'panel:iseek-dados---rais';

  UPDATE public.apis SET name = 'Foto CNH' WHERE endpoint = 'panel:iseek-fotos---fotocnh';
  UPDATE public.apis SET name = 'Foto Detran' WHERE endpoint = 'panel:iseek-dados---fotodetran';
  UPDATE public.apis SET name = 'Foto MG' WHERE endpoint = 'panel:iseek-fotos---fotomg';
  UPDATE public.apis SET name = 'Foto SP' WHERE endpoint = 'panel:iseek-fotos---fotosp';
  UPDATE public.apis SET name = 'Foto MA' WHERE endpoint = 'panel:iseek-fotos---fotoma';
  UPDATE public.apis SET name = 'Foto MS' WHERE endpoint = 'panel:iseek-fotos---fotoms';
  UPDATE public.apis SET name = 'Foto TO' WHERE endpoint = 'panel:iseek-fotos---fototo';
  UPDATE public.apis SET name = 'Foto RO' WHERE endpoint = 'panel:iseek-fotos---fotoro';
  UPDATE public.apis SET name = 'Foto PI' WHERE endpoint = 'panel:iseek-fotos---fotopi';
  UPDATE public.apis SET name = 'Foto ES' WHERE endpoint = 'panel:iseek-fotos---fotoes';
  UPDATE public.apis SET name = 'Foto DF' WHERE endpoint = 'panel:iseek-fotos---fotodf';
  UPDATE public.apis SET name = 'Foto CE' WHERE endpoint = 'panel:iseek-fotos---fotoce';
  UPDATE public.apis SET name = 'Foto RJ' WHERE endpoint = 'panel:iseek-fotos---fotorj';
  UPDATE public.apis SET name = 'Foto PR' WHERE endpoint = 'panel:iseek-fotos---fotopr';
  UPDATE public.apis SET name = 'Foto NC' WHERE endpoint = 'panel:iseek-fotos---fotonc';
  UPDATE public.apis SET name = 'Foto RN' WHERE endpoint = 'panel:iseek-fotos---fotorn';
  UPDATE public.apis SET name = 'Foto PE' WHERE endpoint = 'panel:iseek-fotos---fotope';
  UPDATE public.apis SET name = 'Foto PB' WHERE endpoint = 'panel:iseek-fotos---fotopb';
  UPDATE public.apis SET name = 'Foto GO' WHERE endpoint = 'panel:iseek-fotos---fotogo';
  UPDATE public.apis SET name = 'Foto AL' WHERE endpoint = 'panel:iseek-fotos---fotoal';
  UPDATE public.apis SET name = 'Foto Presos MA' WHERE endpoint = 'panel:iseek-fotos---fotomapresos';

END $$;

# Guia de Deploy Gratuito

## Frontend no Netlify (100% Grátis)

1. **Crie uma conta no Netlify**: https://www.netlify.com/
2. **Conecte seu repositório GitHub**
3. **Configure as variáveis de ambiente** no painel do Netlify:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Chave pública do Supabase
   - `VITE_SUPABASE_PROJECT_ID`: ID do projeto Supabase

4. **Deploy automático**: O Netlify detectará automaticamente o `netlify.toml` e fará o build

### Comandos manuais (opcional):
```bash
npm run build
netlify deploy --prod
```

## Backend no Render (100% Grátis)

⚠️ **IMPORTANTE**: O plano Free do Render tem limitações:
- Instâncias dormem após 15 minutos de inatividade
- Primeiro request após dormir pode levar 30-50 segundos
- 750 horas/mês de runtime grátis

### Alternativa Recomendada: Manter no Lovable Cloud
O backend já está funcionando 24/7 no Lovable Cloud (Supabase). Para manter 100% grátis E 24/7:

1. **Mantenha as Edge Functions no Lovable Cloud** (já está configurado)
2. **Deploy apenas o frontend no Netlify**
3. **Configure o CORS** nas Edge Functions para aceitar requests do domínio Netlify

### Se ainda quiser usar Render:

1. **Crie uma conta no Render**: https://render.com/
2. **Crie um novo Web Service**
3. **Conecte seu repositório**
4. **Configure as variáveis de ambiente**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL`

⚠️ **Nota**: Edge Functions do Supabase não rodam nativamente no Render. Você precisará:
- Converter as Edge Functions para endpoints Express/Node.js
- Ou manter as Edge Functions no Supabase e apenas o frontend no Netlify

## Recomendação Final

**Configuração 100% Grátis + 24/7**:
- ✅ Frontend: Netlify (grátis, sempre online)
- ✅ Backend: Lovable Cloud/Supabase (grátis, sempre online)
- ✅ Banco de dados: Já incluído no Supabase

Essa é a melhor combinação para manter tudo gratuito E funcionando 24/7!
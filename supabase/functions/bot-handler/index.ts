import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────
// Limites de caracteres
// ──────────────────────────────────────────────
const TELEGRAM_CHAR_LIMIT = 3800; // margem de segurança abaixo de 4096
const DISCORD_CHAR_LIMIT  = 1900; // margem abaixo de 2000

// ──────────────────────────────────────────────
// Gerador de token curto
// ──────────────────────────────────────────────
function generateToken(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) result += chars[byte % chars.length];
  return result;
}

// ──────────────────────────────────────────────
// Helpers: formatar resposta da API em texto
// ──────────────────────────────────────────────
function renderValue(v: any): string {
  if (v === null || v === undefined) return 'Não encontrado';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  const s = String(v).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'nan') return 'Não encontrado';
  return s;
}

function formatFieldName(key: string): string {
  const specials: Record<string, string> = {
    'cpf': 'CPF', 'cnpj': 'CNPJ', 'rg': 'RG', 'uf': 'UF',
    'cep': 'CEP', 'mae': 'Mãe', 'pai': 'Pai', 'ddd': 'DDD',
  };
  const k = key.toLowerCase();
  if (specials[k]) return specials[k];
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function jsonToText(obj: any, depth = 0, maxDepth = 6): string {
  if (depth > maxDepth) return '';
  if (!obj || typeof obj !== 'object') return renderValue(obj);

  const indent = '  '.repeat(depth);
  let text = '';

  if (Array.isArray(obj)) {
    obj.slice(0, 10).forEach((item, i) => {
      text += `\n${indent}  ┌─ #${i + 1}\n`;
      text += jsonToText(item, depth + 1, maxDepth);
    });
    if (obj.length > 10) text += `\n${indent}  ... e mais ${obj.length - 10} registros`;
    return text;
  }

  const blacklist = ['token', 'apikey', 'senha', 'password', 'auth'];
  for (const [key, value] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (blacklist.some(b => k.includes(b))) continue;
    if (typeof value === 'object' && value !== null) {
      text += `\n${indent}▸ ${formatFieldName(key)}:`;
      text += jsonToText(value, depth + 1, maxDepth);
    } else {
      text += `\n${indent}• ${formatFieldName(key)}: ${renderValue(value)}`;
    }
  }
  return text;
}

// ──────────────────────────────────────────────
// Lógica de consulta (sem autenticação de usuário)
// ──────────────────────────────────────────────
async function doQuery(
  apiId: string,
  queryValue: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ success: boolean; data?: any; apiName?: string; message?: string }> {

  const { data: api, error: apiError } = await supabase
    .from('apis').select('*').eq('id', apiId).single();

  if (apiError || !api) {
    return { success: false, message: 'Módulo de consulta não encontrado.' };
  }

  const TOKEN_PANEL   = "PvhdVpk8zw4PRjIyzpUlpS2ztYB54FmdxWtxTSJAjyk";
  const TOKEN_DUALITY = "DUALITY-FREE";
  const endpoint = api.endpoint || '';
  const cleanValue   = String(queryValue).replace(/\D/g, '');
  const encodedValue = encodeURIComponent(String(queryValue));
  const valueStr     = String(queryValue);

  let apiUrl = '';
  if (endpoint.startsWith('panel:')) {
    const modulo = endpoint.split(':')[1];
    apiUrl = `http://45.190.208.48:7070/consulta?token=${TOKEN_PANEL}&modulo=${modulo}&valor=${encodedValue}`;
  } else if (endpoint.startsWith('brasilpro:')) {
    const param = endpoint.split(':')[1];
    apiUrl = `http://apisbrasilpro.site/api/busca_${param}.php?${param}=${encodedValue}`;
  } else if (endpoint.startsWith('duality:')) {
    const apiName = endpoint.split(':')[1];
    apiUrl = `https://duality.lat/?token=${TOKEN_DUALITY}&api=${apiName}&query=${cleanValue}`;
  } else {
    apiUrl = endpoint
      .replace('{valor}', encodedValue)
      .replace('{ddd}', valueStr.substring(0, 2))
      .replace('{telefone}', valueStr.substring(2));
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const textData = await response.text();
    const errKeywords = ['SQLSTATE', 'General error', 'Connection refused', 'PDOException'];
    if (errKeywords.some(k => textData.includes(k))) {
      throw new Error('Fonte de dados instável ou em manutenção.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(textData);
    } catch {
      const f = textData.indexOf('{'), l = textData.lastIndexOf('}');
      if (f !== -1 && l > f) parsed = JSON.parse(textData.slice(f, l + 1));
      else throw new Error('Resposta inválida do provedor.');
    }

    if (parsed?.erro || parsed?.error || (parsed?.status === false && parsed?.msg)) {
      return { success: false, message: String(parsed.msg || parsed.erro || parsed.error || 'Nenhum dado encontrado.') };
    }

    // Sanitizar
    const sanitize = (obj: any): any => {
      const BL = ['token', 'apikey', 'auth', 'senha', 'password'];
      if (typeof obj === 'string') return obj.replace(/astra/gi, '[FILTRADO]');
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (obj && typeof obj === 'object') {
        const r: any = {};
        for (const [k, v] of Object.entries(obj)) {
          if (BL.some(b => k.toLowerCase().includes(b))) continue;
          r[k] = sanitize(v);
        }
        return r;
      }
      return obj;
    };

    return { success: true, data: sanitize(parsed), apiName: api.name };
  } catch (e: any) {
    return { success: false, message: e.name === 'AbortError' ? 'Tempo esgotado (timeout).' : e.message };
  }
}

// ──────────────────────────────────────────────
// Gerar link compartilhável
// ──────────────────────────────────────────────
async function createShareLink(
  apiName: string,
  queryValue: string,
  responseData: any,
  siteUrl: string,
  source: string,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  let token = generateToken();
  for (let i = 0; i < 5; i++) {
    const { data: ex } = await supabase.from('shared_queries').select('id').eq('token', token).single();
    if (!ex) break;
    token = generateToken();
  }
  await supabase.from('shared_queries').insert({
    token, api_name: apiName, query_value: queryValue, response_data: responseData, source,
  });
  return `${siteUrl}/share/${token}`;
}

// ──────────────────────────────────────────────
// TELEGRAM: enviar mensagem
// ──────────────────────────────────────────────
async function tgSend(token: string, chatId: number | string, text: string, extra: any = {}) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  });
}

async function tgAnswer(token: string, callbackQueryId: string, text = '') {
  return fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

// ──────────────────────────────────────────────
// TELEGRAM: montar menu de categorias
// ──────────────────────────────────────────────
async function buildCategoryMenu(supabase: ReturnType<typeof createClient>) {
  const { data: categories } = await supabase
    .from('api_categories').select('id, name, slug, icon').order('name');
  if (!categories?.length) return { text: 'Nenhuma categoria disponível.', keyboard: [] };

  const buttons = categories.map(c => [{
    text: `${c.icon || '🔍'} ${c.name}`,
    callback_data: `cat:${c.slug}:${c.id}`,
  }]);

  return {
    text: '🔍 <b>InfoEasy Bot</b> — Consultas gratuitas 24/7\n\nSelecione uma categoria:',
    keyboard: buttons,
  };
}

// ──────────────────────────────────────────────
// TELEGRAM: montar menu de APIs de uma categoria
// ──────────────────────────────────────────────
async function buildApiMenu(
  categoryId: string,
  categoryName: string,
  queryValue: string,
  supabase: ReturnType<typeof createClient>
) {
  const { data: apis } = await supabase
    .from('apis').select('id, name, description')
    .eq('category_id', categoryId).eq('is_active', true).order('name');
  if (!apis?.length) return { text: 'Nenhum módulo ativo nesta categoria.', keyboard: [] };

  // Agrupar por group_name se disponível
  const buttons = apis.map(a => [{
    text: `📋 ${a.name}`,
    callback_data: `query:${a.id}:${encodeURIComponent(queryValue).substring(0, 50)}`,
  }]);

  buttons.push([{ text: '🔙 Voltar ao menu', callback_data: 'menu:main' }]);

  return {
    text: `📂 <b>${categoryName}</b>\nValor: <code>${queryValue}</code>\n\nEscolha o módulo de consulta:`,
    keyboard: buttons,
  };
}

// ──────────────────────────────────────────────
// TELEGRAM: handler principal
// ──────────────────────────────────────────────
async function handleTelegram(
  body: any,
  supabase: ReturnType<typeof createClient>,
  tgToken: string,
  siteUrl: string
) {
  const msg = body.message;
  const cb  = body.callback_query;

  // ── Callback (botão inline clicado)
  if (cb) {
    const chatId = cb.message?.chat?.id;
    const data   = cb.data || '';
    await tgAnswer(tgToken, cb.id);

    // Voltar ao menu principal
    if (data === 'menu:main') {
      const { text, keyboard } = await buildCategoryMenu(supabase);
      await tgSend(tgToken, chatId, text, { reply_markup: { inline_keyboard: keyboard } });
      return;
    }

    // Clicou em uma categoria → pede o valor
    if (data.startsWith('cat:')) {
      const [, slug, categoryId] = data.split(':');
      const { data: cat } = await supabase
        .from('api_categories').select('name').eq('id', categoryId).single();
      await tgSend(tgToken, chatId,
        `📂 <b>${cat?.name || slug}</b>\n\nDigite o valor para consulta:\n<i>Ex: /consultar ${slug} 12345678901</i>`,
        { reply_markup: { inline_keyboard: [[{ text: '🔙 Voltar', callback_data: 'menu:main' }]] } }
      );
      return;
    }

    // Clicou em uma API → executar consulta
    if (data.startsWith('query:')) {
      const parts = data.split(':');
      const apiId = parts[1];
      const queryValue = decodeURIComponent(parts.slice(2).join(':'));

      await tgSend(tgToken, chatId, '⏳ <b>Consultando...</b> Aguarde um momento.');

      const result = await doQuery(apiId, queryValue, supabase);

      if (!result.success || !result.data) {
        await tgSend(tgToken, chatId, `❌ <b>Erro:</b> ${result.message || 'Dados não encontrados.'}`);
        return;
      }

      const formatted = `🔍 <b>${result.apiName}</b> — <code>${queryValue}</code>\n\n${jsonToText(result.data)}`;

      if (formatted.length <= TELEGRAM_CHAR_LIMIT) {
        await tgSend(tgToken, chatId, formatted, {
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Nova consulta', callback_data: 'menu:main' }]],
          },
        });
      } else {
        const shareLink = await createShareLink(result.apiName!, queryValue, result.data, siteUrl, 'telegram', supabase);
        await tgSend(tgToken, chatId,
          `✅ <b>${result.apiName}</b> — <code>${queryValue}</code>\n\n📄 Resultado muito extenso! Acesse o link completo abaixo:\n\n🔗 ${shareLink}\n\n⏱ <i>Link válido por 15 minutos</i>`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🌐 Ver resultado completo', url: shareLink }],
                [{ text: '🔙 Nova consulta', callback_data: 'menu:main' }],
              ],
            },
          }
        );
      }
      return;
    }
    return;
  }

  // ── Mensagem de texto
  if (!msg?.text) return;

  const chatId = msg.chat.id;
  const text   = msg.text.trim();
  const lower  = text.toLowerCase();

  // /start
  if (lower === '/start' || lower === '/menu') {
    const { text: menuText, keyboard } = await buildCategoryMenu(supabase);
    await tgSend(tgToken, chatId, menuText, {
      reply_markup: { inline_keyboard: keyboard },
    });
    return;
  }

  // /ajuda
  if (lower === '/ajuda' || lower === '/help') {
    await tgSend(tgToken, chatId,
      `🤖 <b>InfoEasy Bot — Comandos</b>\n\n` +
      `📌 <b>Uso:</b> <code>/consultar [categoria] [valor]</code>\n\n` +
      `📂 <b>Categorias disponíveis:</b>\n` +
      `• <code>/consultar cpf 12345678901</code>\n` +
      `• <code>/consultar cnpj 00000000000191</code>\n` +
      `• <code>/consultar placa ABC1234</code>\n` +
      `• <code>/consultar cep 01310100</code>\n` +
      `• <code>/consultar telefone 11912345678</code>\n` +
      `• <code>/consultar nome João Silva</code>\n` +
      `• <code>/consultar email exemplo@email.com</code>\n\n` +
      `💡 Ou use <b>/menu</b> para navegar por botões interativos.\n\n` +
      `🌐 Acesse também: ${siteUrl}`
    );
    return;
  }

  // /consultar <slug> <valor>
  const consultarMatch = text.match(/^\/consultar\s+(\S+)\s+(.+)$/i);
  if (consultarMatch) {
    const slug  = consultarMatch[1].toLowerCase();
    const value = consultarMatch[2].trim();

    const { data: cat } = await supabase
      .from('api_categories').select('id, name').eq('slug', slug).single();

    if (!cat) {
      await tgSend(tgToken, chatId, `❌ Categoria <b>${slug}</b> não encontrada.\nUse /menu para ver as categorias.`);
      return;
    }

    const { text: menuText, keyboard } = await buildApiMenu(cat.id, cat.name, value, supabase);
    await tgSend(tgToken, chatId, menuText, { reply_markup: { inline_keyboard: keyboard } });
    return;
  }

  // Atalhos diretos: /cpf, /cnpj, /placa, etc.
  const shortcutMatch = text.match(/^\/(cpf|cnpj|placa|cep|telefone|nome|email)\s+(.+)$/i);
  if (shortcutMatch) {
    const slug  = shortcutMatch[1].toLowerCase();
    const value = shortcutMatch[2].trim();

    const { data: cat } = await supabase
      .from('api_categories').select('id, name').eq('slug', slug).single();

    if (!cat) {
      await tgSend(tgToken, chatId, `❌ Categoria <b>${slug}</b> não encontrada.\nUse /menu para ver as opções.`);
      return;
    }

    const { text: menuText, keyboard } = await buildApiMenu(cat.id, cat.name, value, supabase);
    await tgSend(tgToken, chatId, menuText, { reply_markup: { inline_keyboard: keyboard } });
    return;
  }

  // Qualquer outra mensagem → mostrar menu
  const { text: menuText, keyboard } = await buildCategoryMenu(supabase);
  await tgSend(tgToken, chatId,
    `💬 Olá! Para consultar, use <code>/cpf 12345678901</code> ou navegue pelo menu:`,
    { reply_markup: { inline_keyboard: keyboard } }
  );
}

// ──────────────────────────────────────────────
// DISCORD: verificação de assinatura Ed25519
// ──────────────────────────────────────────────
async function verifyDiscordSignature(
  req: Request,
  body: string,
  publicKey: string
): Promise<boolean> {
  try {
    const signature  = req.headers.get('x-signature-ed25519') || '';
    const timestamp  = req.headers.get('x-signature-timestamp') || '';
    const message    = new TextEncoder().encode(timestamp + body);
    const sigBytes   = hexToBytes(signature);
    const keyBytes   = hexToBytes(publicKey);

    const key = await crypto.subtle.importKey(
      'raw', keyBytes,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false, ['verify']
    );

    return await crypto.subtle.verify({ name: 'Ed25519' }, key, sigBytes, message);
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ──────────────────────────────────────────────
// DISCORD: handler principal
// ──────────────────────────────────────────────
async function handleDiscord(
  req: Request,
  bodyText: string,
  body: any,
  supabase: ReturnType<typeof createClient>,
  discordToken: string,
  discordPublicKey: string,
  siteUrl: string
): Promise<Response> {

  // Verificar assinatura
  const isValid = await verifyDiscordSignature(req, bodyText, discordPublicKey);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const { type, data, token: interactionToken, application_id } = body;

  // Ping do Discord
  if (type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Slash command (type 2)
  if (type === 2) {
    const commandName = data?.name?.toLowerCase();
    const optionValue = data?.options?.find((o: any) => o.name === 'valor')?.value || '';

    const CATEGORY_SLUGS: Record<string, string> = {
      cpf: 'cpf', cnpj: 'cnpj', placa: 'placa', cep: 'cep',
      telefone: 'telefone', nome: 'nome', email: 'email',
    };

    if (commandName === 'ajuda') {
      return new Response(JSON.stringify({
        type: 4,
        data: {
          content:
            '## 🤖 InfoEasy Bot\n\n' +
            '**Comandos disponíveis:**\n' +
            '`/cpf` `/cnpj` `/placa` `/cep` `/telefone` `/nome` `/email`\n\n' +
            '**Como usar:** `/cpf valor:12345678901`\n\n' +
            `🌐 Acesse também o site: ${siteUrl}\n` +
            '_Consultas gratuitas, 24/7, sem login._',
          flags: 64,
        },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const slug = CATEGORY_SLUGS[commandName];
    if (!slug || !optionValue) {
      return new Response(JSON.stringify({
        type: 4,
        data: { content: '❌ Comando ou valor inválido. Use `/ajuda` para ver os comandos.', flags: 64 },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Buscar categoria e APIs
    const { data: cat } = await supabase
      .from('api_categories').select('id, name').eq('slug', slug).single();

    if (!cat) {
      return new Response(JSON.stringify({
        type: 4,
        data: { content: `❌ Categoria **${slug}** não encontrada.`, flags: 64 },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const { data: apis } = await supabase
      .from('apis').select('id, name')
      .eq('category_id', cat.id).eq('is_active', true).order('name');

    if (!apis?.length) {
      return new Response(JSON.stringify({
        type: 4,
        data: { content: `❌ Nenhum módulo ativo para **${cat.name}**.`, flags: 64 },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Montar select menu (componentes Discord)
    const options = apis.slice(0, 25).map((a: any) => ({
      label: a.name,
      value: `${a.id}|||${optionValue}`,
      description: `Consultar ${cat.name} via ${a.name}`,
      emoji: { name: '📋' },
    }));

    return new Response(JSON.stringify({
      type: 4,
      data: {
        content: `## 📂 ${cat.name}\n\n**Valor:** \`${optionValue}\`\n\nEscolha o módulo de consulta:`,
        components: [{
          type: 1, // ActionRow
          components: [{
            type: 3, // SelectMenu
            custom_id: `select_api`,
            options,
            placeholder: 'Selecione o módulo...',
          }],
        }],
      },
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Component interaction (tipo 3 = select menu)
  if (type === 3) {
    const selected = data?.values?.[0] || '';
    const [apiId, queryValue] = selected.split('|||');

    if (!apiId || !queryValue) {
      return new Response(JSON.stringify({
        type: 4,
        data: { content: '❌ Seleção inválida.', flags: 64 },
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Responder imediatamente com "aguarde" (deferred)
    const deferredResponse = new Response(JSON.stringify({ type: 5 }), {
      headers: { 'Content-Type': 'application/json' },
    });

    // Executar consulta em background
    (async () => {
      const result = await doQuery(apiId, queryValue, supabase);

      let content: string;

      if (!result.success || !result.data) {
        content = `❌ **Erro:** ${result.message || 'Dados não encontrados.'}`;
      } else {
        const formatted = `### 🔍 ${result.apiName} — \`${queryValue}\`\n\`\`\`\n${jsonToText(result.data)}\n\`\`\``;
        if (formatted.length <= DISCORD_CHAR_LIMIT) {
          content = formatted;
        } else {
          const shareLink = await createShareLink(result.apiName!, queryValue, result.data, siteUrl, 'discord', supabase);
          content =
            `✅ **${result.apiName}** — \`${queryValue}\`\n\n` +
            `📄 Resultado muito extenso. Acesse o link completo:\n${shareLink}\n\n` +
            `⏱ _Link válido por 15 minutos_`;
        }
      }

      // Editar a resposta "aguardando"
      await fetch(
        `https://discord.com/api/v10/webhooks/${application_id}/${interactionToken}/messages/@original`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bot ${discordToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );
    })();

    return deferredResponse;
  }

  return new Response(JSON.stringify({ type: 1 }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// ──────────────────────────────────────────────
// SERVE PRINCIPAL
// ──────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configurações dos bots
    const { data: settings } = await supabase
      .from('bot_settings').select('key, value');
    const cfg: Record<string, string> = {};
    settings?.forEach(s => { cfg[s.key] = s.value; });

    const siteUrl      = cfg['site_url']          || 'https://infoseasy.netlify.app';
    const tgToken      = cfg['telegram_token']     || '';
    const discordToken = cfg['discord_token']      || '';
    const discordPubKey = cfg['discord_public_key'] || '';

    const url  = new URL(req.url);
    const type = url.searchParams.get('type');

    // Limpeza periódica de links expirados
    supabase.rpc('cleanup_expired_shared_queries').then(() => {}).catch(() => {});

    if (type === 'telegram') {
      if (!tgToken) {
        return new Response('Telegram token not configured', { status: 503 });
      }
      const body = await req.json();
      await handleTelegram(body, supabase, tgToken, siteUrl);
      return new Response('ok', { headers: corsHeaders });
    }

    if (type === 'discord') {
      if (!discordToken || !discordPubKey) {
        return new Response('Discord not configured', { status: 503 });
      }
      const bodyText = await req.text();
      const body = JSON.parse(bodyText);
      return await handleDiscord(req, bodyText, body, supabase, discordToken, discordPubKey, siteUrl);
    }

    return new Response(
      JSON.stringify({ error: 'Tipo não especificado. Use ?type=telegram ou ?type=discord' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('bot-handler CRITICAL:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno', message: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

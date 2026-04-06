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
    obj.slice(0, 5).forEach((item, i) => {
      text += `\n${indent}<b>#${i + 1}</b>`;
      text += jsonToText(item, depth + 1, maxDepth);
    });
    return text;
  }

  const blacklist = ['token', 'apikey', 'senha', 'password', 'auth'];
  for (const [key, value] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (blacklist.some(b => k.includes(b))) continue;
    if (typeof value === 'object' && value !== null) {
      text += `\n${indent}▸ <b>${formatFieldName(key)}</b>:`;
      text += jsonToText(value, depth + 1, maxDepth);
    } else {
      text += `\n${indent}• <b>${formatFieldName(key)}</b>: <code>${renderValue(value)}</code>`;
    }
  }
  return text;
}

function getCategoryEmoji(key: string): string {
  const k = key.toLowerCase();
  if (k.includes('identific') || k.includes('basico') || k.includes('pessoa')) return '👤';
  if (k.includes('ender') || k.includes('localiz')) return '📍';
  if (k.includes('parent') || k.includes('familia')) return '👥';
  if (k.includes('contat') || k.includes('telef') || k.includes('email')) return '📞';
  if (k.includes('trabalh') || k.includes('profissi') || k.includes('renda')) return '💼';
  if (k.includes('finance') || k.includes('banc')) return '💰';
  if (k.includes('veicul') || k.includes('placa') || k.includes('detran')) return '🚗';
  if (k.includes('saude') || k.includes('vacina')) return '🏥';
  if (k.includes('process') || k.includes('judici')) return '⚖️';
  if (k.includes('document') || k.includes('cnh') || k.includes('rg')) return '🪪';
  if (k.includes('foto') || k.includes('image')) return '🖼';
  return '📋';
}

function formatProfessionalResponse(data: any, apiName: string, queryValue: string, user: { id: number, name: string }): string {
  let text = `🔍 <b>DOSSIÊ DE INTELIGÊNCIA</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📌 <b>Módulo:</b> <code>${apiName}</code>\n`;
  text += `🔎 <b>Consulta:</b> <code>${queryValue}</code>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  const sections: Record<string, any> = {};
  
  // Agrupamento por categorias com emojis do bot.php
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    const emoji = getCategoryEmoji(key);
    if (!sections[emoji]) sections[emoji] = [];
    sections[emoji].push({ key, value });
  }

  for (const [emoji, items] of Object.entries(sections)) {
    const sectionName = items.length > 1 ? 'DADOS ENCONTRADOS' : formatFieldName(items[0].key).toUpperCase();
    text += `\n${emoji} <b>${sectionName}</b>`;
    items.forEach((item: any) => {
      text += jsonToText({ [item.key]: item.value }, 0, 3);
    });
    text += `\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 <b>Usuário:</b> ${mention_html(user.id, user.name)}\n`;
  text += `⚡ <b>Bot:</b> @InfoEasyBot`;
  
  return text;
}


// ──────────────────────────────────────────────
// Lógica de consulta (sem autenticação de usuário)
// ──────────────────────────────────────────────
async function doQuery(apiId: string, queryValue: string, supabase: ReturnType<typeof createClient>, cfg: Record<string, string>) {
  const { data: api } = await supabase.from('apis').select('*').eq('id', apiId).single();
  if (!api) return { success: false, message: 'API não encontrada.' };

  const endpointStore = api.endpoint || '';
  const encodedValue = encodeURIComponent(queryValue);
  let apiUrl = '';

  const TOKEN_PANEL = cfg['external_api_token'] || "PvhdVpk8zw4PRjIyzpUlpS2ztYB54FmdxWtxTSJAjyk";
  const BASE_URL_PANEL = cfg['external_api_url'] || "http://45.190.208.48:7070/consulta";

  if (endpointStore.startsWith('panel:')) {
    const modulo = endpointStore.split(':')[1];
    apiUrl = `${BASE_URL_PANEL}?token=${TOKEN_PANEL}&modulo=${modulo}&valor=${encodedValue}`;
  } else {
    apiUrl = endpointStore.replace('{valor}', encodedValue);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(apiUrl, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
        'Accept': 'application/json' 
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`O provedor retornou erro HTTP ${response.status}`);

    const textData = await response.text();
    
    // Checagem de erros SQL/Servidor
    const serverErrorKeywords = ['SQLSTATE', 'General error', 'Connection refused', 'PDOException', 'no such table'];
    if (serverErrorKeywords.some(kw => textData.includes(kw))) {
       throw new Error('A fonte de dados está instável ou em manutenção.');
    }

    let responseData: any = null;
    // Parser Robusto
    try {
      responseData = JSON.parse(textData);
    } catch {
      const firstBrace = textData.indexOf('{');
      const lastBrace = textData.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        responseData = JSON.parse(textData.slice(firstBrace, lastBrace + 1));
      }
    }

    if (!responseData || typeof responseData !== 'object') {
      throw new Error('A resposta do provedor é inválida ou vazia.');
    }

    // Checar se o provedor retornou erro no JSON
    const errorKeys = ['erro', 'error', 'msg', 'mensagem', 'message', 'status'];
    let isError = false;
    let errorMsg = 'Nenhum registro encontrado.';

    for (const key of Object.keys(responseData)) {
      const k = key.toLowerCase();
      if (errorKeys.includes(k)) {
        const val = responseData[key];
        if (k === 'status' && (val === false || String(val) === '0' || String(val).toLowerCase() === 'error')) {
          isError = true;
        } else if (k !== 'status' && val && String(val).length > 2) {
          if (String(val).toLowerCase().includes('erro') || String(val).toLowerCase().includes('falha') || String(val).toLowerCase().includes('não encontrado')) {
            isError = true;
            errorMsg = String(val);
          }
        }
      }
    }

    if (isError || responseData.erro || responseData.error) {
       errorMsg = responseData.msg || responseData.erro || responseData.error || responseData.mensagem || responseData.message || errorMsg;
       return { success: false, message: String(errorMsg) };
    }

    return { success: true, data: responseData, apiName: api.name };

  } catch (e: any) {
    return { success: false, message: e.name === 'AbortError' ? 'Tempo esgotado (O provedor demorou mais de 60s)' : e.message };
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
// TELEGRAM: Helpers Profissionais
// ──────────────────────────────────────────────
async function tgSend(token: string, chatId: number | string, text: string, extra: any = {}) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  });
}

async function tgEdit(token: string, chatId: number | string, messageId: number, text: string, extra: any = {}) {
  return fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra }),
  });
}

async function tgDelete(token: string, chatId: number | string, messageId: number) {
  return fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  });
}

async function tgAnswer(token: string, callbackQueryId: string, text = '', showAlert = false) {
  return fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
  });
}

function mention_html(id: number, name: string): string {
  const safe = name.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m] || m));
  return `<a href="tg://user?id=${id}">${safe}</a>`;
}


// ──────────────────────────────────────────────
// TELEGRAM: montar menu de categorias (Dashboard)
// ──────────────────────────────────────────────
async function buildCategoryMenu(supabase: ReturnType<typeof createClient>, firstName: string) {
  const { data: categories } = await supabase
    .from('api_categories').select('id, name, slug, icon').order('name');
  
  if (!categories?.length) return { text: 'Nenhuma categoria disponível.', keyboard: [] };

  const buttons: any[] = [];
  // Agrupar botões em linhas de 2
  for (let i = 0; i < categories.length; i += 2) {
    const row = [];
    row.push({ text: `${categories[i].icon || '🔍'} ${categories[i].name}`, callback_data: `cat:${categories[i].slug}:${categories[i].id}` });
    if (categories[i+1]) {
      row.push({ text: `${categories[i+1].icon || '🔍'} ${categories[i+1].name}`, callback_data: `cat:${categories[i+1].slug}:${categories[i+1].id}` });
    }
    buttons.push(row);
  }

  const welcome = 
    `👋 <b>Olá, ${firstName}!</b>\n\n` +
    `<b>Bem-vindo ao InfoEasy Bot</b> 🤖\n` +
    `Realize consultas completas com rapidez e segurança.\n\n` +
    `📋 <b>Selecione uma categoria para começar:</b>`;

  return { text: welcome, keyboard: buttons };
}


// ──────────────────────────────────────────────
// TELEGRAM: montar menu de APIs (Bases)
// ──────────────────────────────────────────────
async function buildApiMenu(
  categoryId: string,
  categoryName: string,
  queryValue: string,
  supabase: ReturnType<typeof createClient>
) {
  const { data: apis } = await supabase
    .from('apis').select('id, name, description, group_name')
    .eq('category_id', categoryId).eq('is_active', true).order('group_name');
  
  if (!apis?.length) return { text: 'Nenhum módulo ativo nesta categoria.', keyboard: [] };

  const buttons: any[] = [];
  apis.forEach((a: any) => {
    buttons.push([{
      text: `${a.group_name ? '[' + a.group_name + '] ' : ''}📋 ${a.name}`,
      callback_data: `query:${a.id}:${encodeURIComponent(queryValue).substring(0, 50)}`,
    }]);
  });


  buttons.push([{ text: '🔙 Voltar ao menu', callback_data: 'menu:main' }]);

  return {
    text: `📂 <b>${categoryName}</b>\n🔎 Valor: <code>${queryValue}</code>\n\n<i>Selecione o módulo de consulta abaixo:</i>`,
    keyboard: buttons,
  };
}


// ──────────────────────────────────────────────
// TELEGRAM: handler principal
// ──────────────────────────────────────────────
async function handleTelegram(payload: any, supabase: ReturnType<typeof createClient>) {
  const msg = payload.message;
  const cb  = payload.callback_query;

  // Carregar configurações globais logo no início
  const supabaseUrl         = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const serviceClient       = createClient(supabaseUrl, supabaseServiceRole);
  const { data: settings }  = await serviceClient.from('bot_settings').select('key, value');
  const cfg: Record<string, string> = {};
  settings?.forEach((s: any) => { cfg[s.key] = s.value; });

  const tgToken = cfg['telegram_token'];
  const siteUrl = cfg['site_url'] || 'https://infoseasy.netlify.app';

  if (!tgToken) return;

  // ── Callback (botão inline clicado)

  if (cb) {
    const chatId = cb.message?.chat?.id;
    const msgId  = cb.message?.message_id;
    const userId = cb.from.id;
    const data   = cb.data || '';

    // Botão Apagar (Somente quem solicitou)
    if (data.startsWith('delete:')) {
      const ownerId = data.split(':')[1];
      if (String(userId) !== ownerId) {
        await tgAnswer(tgToken, cb.id, '⚠️ Apenas o proprietário pode apagar.', true);
        return;
      }
      await tgDelete(tgToken, chatId, msgId!);
      return;
    }


    await tgAnswer(tgToken, cb.id);

    // Voltar ao menu principal
    if (data === 'menu:main') {
      const { text, keyboard } = await buildCategoryMenu(supabase, cb.from.first_name);
      await tgEdit(tgToken, chatId, msgId, text, { reply_markup: { inline_keyboard: keyboard } });
      return;
    }

    // Clicou em uma categoria → pede o valor
    if (data.startsWith('cat:')) {
      const [, slug, categoryId] = data.split(':');
      const { data: cat } = await supabase.from('api_categories').select('name').eq('id', categoryId).single();
      const helpText = `📂 <b>${cat?.name || slug}</b>\n\nPara consultar, digite:\n<code>/${slug} [valor]</code>\n\n<i>Exemplo: /${slug} 12345678</i>`;
      await tgEdit(tgToken, chatId, msgId, helpText, { 
        reply_markup: { inline_keyboard: [[{ text: '🔙 Voltar', callback_data: 'menu:main' }]] } 
      });
      return;
    }

    // Clicou em uma API → executar consulta
    if (data.startsWith('query:')) {
      const parts = data.split(':');
      const apiId = parts[1];
      const queryValue = decodeURIComponent(parts.slice(2).join(':'));

      // 1. Mostrar estado de carregamento
      await tgEdit(tgToken, chatId, msgId, `⏳ <b>Consultando...</b>\n<i>Processando sua solicitação nas bases de inteligência.</i>`);

      const result = await doQuery(apiId, queryValue, supabase, cfg);


      if (!result.success || !result.data) {
        const errorText = `⚠️ <b>ERRO NA CONSULTA</b>\n\n${result.message || 'O provedor retornou erro ou os dados não foram encontrados.'}`;
        await tgEdit(tgToken, chatId, msgId, errorText, {
          reply_markup: { inline_keyboard: [[{ text: '🗑️ Apagar', callback_data: `delete:${userId}` }, { text: '🔙 Menu', callback_data: 'menu:main' }]] }
        });
        return;
      }

      const userObj = { id: cb.from.id, name: cb.from.first_name };
      const formatted = formatProfessionalResponse(result.data, result.apiName!, queryValue, userObj);

      const commonButtons = [
        [{ text: '🗑️ Apagar Resultado', callback_data: `delete:${userId}` }],
        [{ text: '🔄 Nova Consulta', callback_data: 'menu:main' }]
      ];

      if (formatted.length <= TELEGRAM_CHAR_LIMIT) {
        await tgEdit(tgToken, chatId, msgId, formatted, {
          reply_markup: { inline_keyboard: commonButtons },
        });
      } else {
        const shareLink = await createShareLink(result.apiName!, queryValue, result.data, siteUrl, 'telegram', supabase);
        const longText = 
          `✅ <b>${result.apiName}</b> — <code>${queryValue}</code>\n\n` +
          `📄 <b>RESULTADO COMPLETO ATIVADO</b>\n` +
          `O relatório gerado é muito extenso para o Telegram.\n\n` +
          `🔗 <b>Acesse o resultado aqui:</b>\n${shareLink}\n\n` +
          `⏱ <i>Válido por 15 minutos</i>`;
        
        await tgEdit(tgToken, chatId, msgId, longText, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌐 Ver resultado completo', url: shareLink }],
              ...commonButtons
            ],
          },
        });
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
  const firstName = msg.from.first_name;

  // /start ou /menu
  if (lower === '/start' || lower === '/menu') {
    const { text: menuText, keyboard } = await buildCategoryMenu(supabase, firstName);
    await tgSend(tgToken, chatId, menuText, { reply_markup: { inline_keyboard: keyboard } });
    return;
  }

  // /comandos
  if (lower === '/comandos') {
    const { data: cats } = await supabase.from('api_categories').select('name, slug, icon').order('name');
    let cmdList = `📜 <b>LISTA DE COMANDOS — INFOEASY</b>\n`;
    cmdList += `━━━━━━━━━━━━━━━━━\n\n`;
    
    cats?.forEach(c => {
      cmdList += `${c.icon || '🔍'} <code>/${c.slug} [valor]</code>\n`;
    });

    cmdList += `\n💡 <i>Exemplo: /cpf 12345678901</i>\n`;
    cmdList += `✅ Mais de 60 APIs integradas!`;

    await tgSend(tgToken, chatId, cmdList, {
      reply_markup: { inline_keyboard: [[{ text: '🪪 Abrir Painel', callback_data: 'menu:main' }]] }
    });
    return;
  }

  // /ajuda
  if (lower === '/ajuda' || lower === '/help') {
    await tgSend(tgToken, chatId,
      `🤖 <b>Central de Ajuda — InfoEasy</b>\n\n` +
      `Para começar, utilize comandos diretos como <code>/cpf [valor]</code>.\n\n` +
      `❓ <b>Dúvidas:</b> /comandos\n` +
      `🏠 <b>Menu:</b> /start\n\n` +
      `🌐 <b>Web:</b> ${siteUrl}`
    );
    return;
  }

  // /consultar <slug> <valor> OU /<slug> <valor>
  const genericMatch = text.match(/^\/(\w+)(?:\s+(.+))?$/i); // Regex melhorado para capturar sem valor
  if (genericMatch) {
    const maybeSlug = genericMatch[1].toLowerCase();
    const value = (genericMatch[2] || '').trim();

    const ignored = ['start', 'menu', 'comandos', 'ajuda', 'help'];
    if (!ignored.includes(maybeSlug)) {
      const { data: cat } = await supabase
        .from('api_categories')
        .select('id, name, icon')
        .eq('slug', maybeSlug)
        .single();

      if (cat) {
        // Se NÃO informou o valor, mostra como usar
        if (!value) {
          const howTo = 
            `⚠️ <b>COMO USAR: ${cat.name.toUpperCase()}</b>\n\n` +
            `Por favor, informe o valor para consulta junto ao comando.\n\n` +
            `💻 <b>Formato:</b> <code>/${maybeSlug} [valor]</code>\n` +
            `💡 <b>Exemplo:</b> <code>/${maybeSlug} 12345678</code>`;
          
          await tgSend(tgToken, chatId, howTo, {
            reply_markup: { inline_keyboard: [[{ text: '🔙 Voltar ao Painel', callback_data: 'menu:main' }]] }
          });
          return;
        }

        const { text: menuText, keyboard } = await buildApiMenu(cat.id, cat.name, value, supabase);
        await tgSend(tgToken, chatId, menuText, { reply_markup: { inline_keyboard: keyboard } });
        return;
      }
    }
  }

  // Qualquer outra mensagem → mostrar menu boas-vindas reduzido
  const { text: welcome, keyboard } = await buildCategoryMenu(supabase, firstName);
  await tgSend(tgToken, chatId, welcome, { reply_markup: { inline_keyboard: keyboard } });

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
      // Nota: handleDiscord já recebe cfg se eu atualizar a assinatura ou buscar aqui
      // Mas para simplificar, buscaremos cfg aqui dentro ou passaremos
      const { data: settings } = await supabase.from('bot_settings').select('key, value');
      const cfg: Record<string, string> = {};
      settings?.forEach((s: any) => { cfg[s.key] = s.value; });

      const result = await doQuery(apiId, queryValue, supabase, cfg);


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
      await handleTelegram(body, supabase);
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

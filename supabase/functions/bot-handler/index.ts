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
const DISCORD_CHAR_LIMIT = 1900; // margem abaixo de 2000

const BLACKLIST_INTERNAL = [
  'token', 'apikey', 'senha', 'password', 'auth',
  'protocolo', 'sucesso', 'usuario',
  'consumo_hoje', 'reset_em', 'total_diario', 'limites',
  'status', 'msg', 'message', 'erro', 'error', 'query_value',
  'cache', 'cached_at', 'cached at', 'conta', 'expiracao', 'expiração',
  'saldo', 'tempo_segundos', 'segundos', 'tempo segundos',
  'data_execucao', 'execucao', 'execução',
  'daily limit', 'daily_limit', 'requests remaining', 'requests_remaining', 
  'requests used', 'requests_used', 'api info', 'api_info'
];

const EXACT_INTERNAL = ['valor', 'status', 'msg', 'message', 'sucesso', 'erro', 'error', 'modulo', 'usuario', 'conta', 'api info'];

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

  for (const [key, value] of Object.entries(obj)) {
    const k = key.toLowerCase();

    const isInternal = EXACT_INTERNAL.includes(k) || BLACKLIST_INTERNAL.some(b => k === b || (b.length > 5 && k.includes(b)));

    if (isInternal) continue;
    if (typeof value === 'object' && value !== null) {
      const nested = jsonToText(value, depth + 1, maxDepth);
      if (nested.trim()) {
        text += `\n${indent}▸ <b>${formatFieldName(key)}</b>:`;
        text += nested;
      }
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

function formatProfessionalResponse(data: any, apiName: string, queryValue: string, user: { id: number, name: string }, botHandle: string = '@InfoEasyBot'): string {
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
    // Filtrar itens vazios antes de renderizar a seção
    const sectionBody = items
      .map((item: any) => jsonToText({ [item.key]: item.value }, 0, 3))
      .join('').trim();

    if (sectionBody) {
      // Se houver apenas um item e o nome da chave for igual ao do módulo, vamos tentar ser mais limpos
      const firstKey = items[0].key.toLowerCase();
      const currentModule = apiName.toLowerCase().replace(/\s/g, '');
      const sectionName = (items.length === 1 && (firstKey.includes(currentModule) || currentModule.includes(firstKey)))
        ? 'DADOS ENCONTRADOS'
        : formatFieldName(items[0].key).toUpperCase();

      text += `\n${emoji} <b>${sectionName}</b>`;
      text += `\n${sectionBody}\n`;
    }
  }


  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 <b>Usuário:</b> ${mention_html(user.id, user.name)}\n`;
  text += `⚡ <b>Bot:</b> ${botHandle}`;

  return text;
}

function formatProfessionalResponseDiscord(data: any, apiName: string, queryValue: string, user: { id: string, name: string }, botHandle: string = 'InfoEasy Bot'): string {
  let text = `## 🔍 DOSSIÊ DE INTELIGÊNCIA\n`;
  text += `> **Módulo:** \`${apiName}\`\n`;
  text += `> **Consulta:** \`${queryValue}\`\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  const sections: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    const emoji = getCategoryEmoji(key);
    if (!sections[emoji]) sections[emoji] = [];
    sections[emoji].push({ key, value });
  }

  // Helper para converter JSON em texto Markdown (limitado por profundidade)
  const jsonToDiscordMd = (obj: any, depth = 0): string => {
    if (depth > 4) return '';
    if (!obj || typeof obj !== 'object') return String(obj);
    let md = '';
    const indent = '  '.repeat(depth);
    
    if (Array.isArray(obj)) {
      obj.slice(0, 5).forEach((item, i) => {
        md += `\n${indent}**#${i + 1}**`;
        md += jsonToDiscordMd(item, depth + 1);
      });
      return md;
    }

    for (const [key, value] of Object.entries(obj)) {
      const k = key.toLowerCase();
      const isInternal = EXACT_INTERNAL.includes(k) || BLACKLIST_INTERNAL.some(b => k === b || (b.length > 5 && k.includes(b)));
      if (isInternal) continue;
      
      if (typeof value === 'object' && value !== null) {
        const nested = jsonToDiscordMd(value, depth + 1);
        if (nested.trim()) md += `\n${indent}▸ **${formatFieldName(key)}**: ${nested}`;
      } else {
        md += `\n${indent}• **${formatFieldName(key)}**: \`${renderValue(value)}\``;
      }
    }
    return md;
  };

  for (const [emoji, items] of Object.entries(sections)) {
    const sectionBody = items
      .map((item: any) => jsonToDiscordMd({ [item.key]: item.value }, 0))
      .join('').trim();

    if (sectionBody) {
      const firstKey = items[0].key.toLowerCase();
      const currentModule = apiName.toLowerCase().replace(/\s/g, '');
      const sectionName = (items.length === 1 && (firstKey.includes(currentModule) || currentModule.includes(firstKey)))
        ? 'DADOS ENCONTRADOS'
        : formatFieldName(items[0].key).toUpperCase();

      text += `\n${emoji} **${sectionName}**\n${sectionBody}\n`;
    }
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 **Usuário:** <@${user.id}>\n`;
  text += `⚡ **Bot:** ${botHandle}`;

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

  const TOKEN_PANEL = cfg['external_api_token'] || "23btetakuv3zx8HkEcfRpEy_zonEFilQBDLOJl9rEPk";
  const BASE_URL_PANEL = cfg['external_api_url'] || "http://158.173.2.17:7070/consulta";

  if (endpointStore.startsWith('panel:')) {
    const modulo = endpointStore.split(':')[1];
    apiUrl = `${BASE_URL_PANEL}?token=${TOKEN_PANEL}&modulo=${modulo}&valor=${encodedValue}`;
  } else if (endpointStore.startsWith('brasilpro:')) {
    const param = endpointStore.split(':')[1];
    apiUrl = `http://apisbrasilpro.site/api/busca_${param}.php?${param}=${encodedValue}`;
  } else if (endpointStore.startsWith('tconect:')) {
    let path = endpointStore.substring(8);
    const tconectToken = cfg['tconect_api_token'] || "PNSAPIS";
    const tconectBase = cfg['tconect_api_url'] || "http://node.tconect.xyz:1116";

    apiUrl = `${tconectBase}${path.startsWith('/') ? '' : '/'}${path}`;
    apiUrl = apiUrl.replace('apikey=SeuToken', `apikey=${tconectToken}`).replace('apikey=SUAKEY', `apikey=${tconectToken}`);
    
    if (!apiUrl.includes('{valor}')) {
      if (apiUrl.includes('apikey=')) apiUrl += `=${encodedValue}`;
      else apiUrl += `${apiUrl.includes('?') ? '&' : '?'}apikey=${tconectToken}=${encodedValue}`;
    } else {
      if (!apiUrl.includes('apikey=')) apiUrl += `${apiUrl.includes('?') ? '&' : '?'}apikey=${tconectToken}`;
      apiUrl = apiUrl.replace('{valor}', encodedValue);
    }
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

    // Desembrulhar campos wrapper comuns de forma recursiva/inteligente
    const preferredKeys = ['resultado', 'resultados', 'RETORNO', 'retorno', 'registros', 'DADOS', 'data', 'dados'];
    
    function smartUnwrap(obj: any): any {
      if (!obj || typeof obj !== 'object') return obj;
      
      for (const key of preferredKeys) {
        if (obj[key] && typeof obj[key] === 'object' && obj[key] !== null) {
          // Se for 'data', verificamos se é lixo de meta ou se apenas contém mais dados
          const keys = Object.keys(obj[key]).map(k => k.toLowerCase());
          const isMetadata = keys.some(k => k.includes('limit') || k.includes('request') || k.includes('info'));
          const hasOtherBetterKeys = preferredKeys.some(k => k !== 'data' && obj[k]);
          
          if (isMetadata && hasOtherBetterKeys) continue;
          
          // Se o que achamos é apenas OUTRO container da nossa lista, mergulhamos mais fundo
          return smartUnwrap(obj[key]);
        }
      }
      return obj;
    }

    let unwrapped = smartUnwrap(responseData);

    // Checar se o provedor retornou erro no JSON (usando responseData original para pegar campos de status)
    const errorKeys = ['erro', 'error', 'msg', 'mensagem', 'message', 'status'];
    let isError = false;
    let errorMsg = 'Nenhum registro encontrado.';

    for (const key of Object.keys(responseData)) {
      const k = key.toLowerCase();
      if (errorKeys.includes(k)) {
        const val = responseData[key];
        if (k === 'status' && (val === false || val === 0 || String(val) === '0' ||
          ['false', 'error', 'fail', 'failed', 'erro', 'falha'].includes(String(val).toLowerCase()))) {
          isError = true;
        } else if (k !== 'status' && val && String(val).length > 2) {
          if (String(val).toLowerCase().includes('erro') || String(val).toLowerCase().includes('falha') ||
            String(val).toLowerCase().includes('não encontrado') || String(val).toLowerCase().includes('not found')) {
            isError = true;
            errorMsg = String(val);
          }
        }
      }
    }

    // Verificação de conteúdo real pós-desembrulho
    const substantiveKeys = Object.keys(unwrapped).filter(k => {
      const kl = k.toLowerCase();
      const isInternal = EXACT_INTERNAL.includes(kl) || BLACKLIST_INTERNAL.some(b => kl === b || (b.length > 5 && kl.includes(b)));
      return !isInternal;
    });

    if (substantiveKeys.length === 0) {
      return { success: false, message: 'Nenhum dado substantivo encontrado para esta consulta.' };
    }

    return { success: true, data: unwrapped, apiName: api.name };

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

  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await supabase.from('shared_queries').insert({
    token, api_name: apiName, query_value: queryValue, response_data: responseData, source, expires_at
  });
  return token;
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
  }).catch(e => console.error('Error deleting message:', e));
}

// Helper para agendar deleção em grupos
function scheduleDelete(token: string, chatId: number | string, msgIds: number[], seconds = 60) {
  // @ts-ignore: EdgeRuntime is available in Supabase
  if (typeof EdgeRuntime !== 'undefined') {
    // @ts-ignore
    EdgeRuntime.waitUntil(new Promise(resolve => {
      setTimeout(async () => {
        for (const id of msgIds) {
          await tgDelete(token, chatId, id);
        }
        resolve(null);
      }, seconds * 1000);
    }));
  }
}


async function tgAnswer(token: string, callbackQueryId: string, text = '', showAlert = false) {
  return fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
  });
}

async function tgSendPhoto(token: string, chatId: number | string, photo: string, extra: any = {}) {
  // Se for base64 puro (sem prefixo), adiciona o prefixo
  let photoData = photo;
  if (!photo.startsWith('http') && !photo.startsWith('data:')) {
    photoData = `data:image/jpeg;base64,${photo}`;
  }

  // Telegram não aceita data URI diretamente no sendPhoto via JSON simples. 
  // Precisamos converter para Blob ou usar Multipart. 
  // Alternativa: Se for data URI, o Telegram às vezes aceita se o bot for 'local', mas no Cloud não.
  // VAMOS USAR UM TRUQUE: Enviar via Form Data.

  const formData = new FormData();
  formData.append('chat_id', String(chatId));

  if (photoData.startsWith('data:')) {
    const [meta, base64Data] = photoData.split(',');
    const type = meta.split(':')[1].split(';')[0];
    const binary = atob(base64Data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    const blob = new Blob([array], { type });
    formData.append('photo', blob, 'photo.jpg');
  } else {
    formData.append('photo', photoData);
  }

  if (extra.caption) formData.append('caption', extra.caption);
  if (extra.parse_mode) formData.append('parse_mode', extra.parse_mode);
  if (extra.reply_markup) formData.append('reply_markup', JSON.stringify(extra.reply_markup));

  return fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });
}


function mention_html(id: number, name: string): string {
  return `<a href="tg://user?id=${id}">${escapeHtml(name)}</a>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ──────────────────────────────────────────────
// TELEGRAM: Módulos de Interface (Identical to reference)
// ──────────────────────────────────────────────

async function buildMainMenu(firstName: string) {
  const welcome =
    `👋 <b>Olá, ${firstName}!</b>\n\n` +
    `<b>Bem-vindo ao InfoEasy Bot </b> 🤖\n` +
    `Realize consultas completas com rapidez e total segurança.\n\n` +
    `📋 <b>Escolha uma opção para começar:</b>`;

  const keyboard = [
    [{ text: '➕ Adicionar em Grupo', url: 'https://t.me/InfoEasyBot?startgroup=new' }],
    [
      { text: '🪪 Consultas', callback_data: 'menu:consultas' },
      { text: '📢 Canal', url: 'https://t.me/infoseasy' }
    ],
    [{ text: '🆘 Suporte', url: 'https://t.me/infoseasy' }]
  ];

  return { text: welcome, keyboard };
}
async function checkForceJoin(tgToken: string, userId: number): Promise<boolean> {
  try {
    const channelId = '@infoseasy';
    const url = `https://api.telegram.org/bot${tgToken}/getChatMember?chat_id=${channelId}&user_id=${userId}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) return true; // Falha na API do Telegram -> permitir por precaução
    const status = data.result?.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch {
    return true;
  }
}

async function buildForceJoinMessage() {
  return {
    text: `⚠️ <b>ACESSO RESTRITO</b>\n\n` +
      `Para utilizar o nosso bot, você precisa estar inscrito em nosso canal oficial de avisos.\n\n` +
      `<i>Isso ajuda a manter o bot online e você sempre atualizado!</i>`,
    keyboard: [
      [{ text: '📢 Entrar no Canal', url: 'https://t.me/infoseasy' }],
      [{ text: '✅ Já entrei!', callback_data: 'menu:main' }]
    ]
  };
}

// ──────────────────────────────────────────────
// Mapeamento Global de Tipos de Consulta
// ──────────────────────────────────────────────
async function buildCategoryMenu(supabase: ReturnType<typeof createClient>) {
  const { data: types } = await supabase.from('api_categories').select('name, slug, icon, is_vip').order('name');
  
  // VIP no topo
  const sorted = (types || []).sort((a, b) => (b.is_vip ? 1 : 0) - (a.is_vip ? 1 : 0));
  
  const buttons: any[] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    const r1 = sorted[i];
    const r2 = sorted[i + 1];
    
    const row = [
      { text: `${r1.icon || '📁'} ${escapeHtml(r1.name.toUpperCase())}${r1.is_vip ? ' ⭐' : ''}`, callback_data: `cat:${r1.slug}` }
    ];
    if (r2) {
      row.push({ text: `${r2.icon || '📁'} ${escapeHtml(r2.name.toUpperCase())}${r2.is_vip ? ' ⭐' : ''}`, callback_data: `cat:${r2.slug}` });
    }
    buttons.push(row);
  }
  buttons.push([{ text: '↩️ Voltar', callback_data: 'menu:main' }]);

  const text = `🪪 <b>Selecione o tipo de consulta:</b>\n<i>Itens com ⭐ são exclusivos para Assinantes VIP.</i>`;
  return { text, keyboard: buttons };
}

async function buildInstructionPage(type: string) {
  const text =
    `⚠️ <b>${type.toUpperCase()}</b>\n\n` +
    `Por favor, utilize o formato correto informando o dado para consultar:\n` +
    `<code>/${type} [VALOR]</code>\n\n` +
    `Exemplo numérico:\n<code>/${type} 123456789</code>`;

  const keyboard = [[{ text: '↩️ Voltar', callback_data: 'menu:consultas' }]];
  return { text, keyboard };
}

async function buildApiMenu(
  type: string,
  queryValue: string,
  supabase: ReturnType<typeof createClient>
) {
  // Carrega APIs ligadas a esta categoria.
  const { data: cat } = await supabase.from('api_categories').select('id, name, slug').eq('slug', type).single();
  const { data: allApis } = await supabase.from('apis').select('*').eq('is_active', true);

  let filtered = [];
  if (cat) {
    filtered = (allApis || []).filter(a => a.category_id === cat.id);
  } else {
    filtered = (allApis || []).filter(a =>
      (a.slug || '').toLowerCase() === type ||
      (a.group_name || '').toLowerCase() === type.toLowerCase()
    );
  }

  if (!filtered.length) {
    return { text: `Nenhum módulo ativo para <b>${type.toUpperCase()}</b>.`, keyboard: [[{ text: '↩️ Voltar', callback_data: 'menu:consultas' }]] };
  }

  // Ordenar VIPs no topo
  const sortedApis = filtered.sort((a, b) => (b.is_vip ? 1 : 0) - (a.is_vip ? 1 : 0));

  const buttons: any[] = [];
  for (let i = 0; i < sortedApis.length; i += 2) {
    const r1 = sortedApis[i];
    const r2 = sortedApis[i+1];
    
    const row = [];
    row.push({
      text: `📁 ${escapeHtml(r1.name)}${r1.is_vip ? ' ⭐' : ''}`,
      callback_data: `query:${r1.id}:${encodeURIComponent(queryValue).substring(0, 50)}`
    });
    if (r2) {
      row.push({
        text: `📁 ${escapeHtml(r2.name)}${r2.is_vip ? ' ⭐' : ''}`,
        callback_data: `query:${r2.id}:${encodeURIComponent(queryValue).substring(0, 50)}`
      });
    }
    buttons.push(row);
  }

  buttons.push([{ text: '🛒 Ver Planos VIP', callback_data: 'menu:planos' }]);
  buttons.push([{ text: '❌ Cancelar', callback_data: 'menu:main' }]);

  const text =
    `📂 <b>${type.toUpperCase()}</b>\n` +
    `🔎 Valor: <code>${queryValue}</code>\n\n` +
    `<i>Selecione o módulo de consulta abaixo:</i>`;

  return { text, keyboard: buttons };
}



// ──────────────────────────────────────────────
// TELEGRAM: handler principal
// ──────────────────────────────────────────────
async function handleTelegram(payload: any, supabase: ReturnType<typeof createClient>) {
  const msg = payload.message;
  const cb = payload.callback_query;

  // Carregar configurações globais
  const { data: settings } = await supabase.from('bot_settings').select('key, value');
  const cfg: Record<string, string> = {};
  settings?.forEach((s: any) => { cfg[s.key] = s.value; });

  const tgToken = cfg['telegram_token'];
  const siteUrl = cfg['site_url'] || 'https://infoseasy.netlify.app';
  const botHandle = cfg['telegram_username'] ? `@${cfg['telegram_username'].replace('@', '')}` : '@InfoEasyBot';

  if (!tgToken) return;

  // VERIFICAÇÃO DE FORCE JOIN
  const userId = cb ? cb.from.id : msg.from.id;
  
  // Registrar interação do bot (não bloqueia execução)
  supabase.from('profiles').update({ last_bot_interaction: new Date().toISOString() }).eq('telegram_id', String(userId)).then();

  const isJoined = await checkForceJoin(tgToken, userId);
  if (!isJoined) {
    const { text: fjText, keyboard: fjKb } = await buildForceJoinMessage();
    if (cb) {
      await tgEdit(tgToken, cb.message.chat.id, cb.message.message_id, fjText, { reply_markup: { inline_keyboard: fjKb } });
    } else {
      await tgSend(tgToken, msg.chat.id, fjText, { reply_markup: { inline_keyboard: fjKb } });
    }
    return;
  }

  // ── Callback (botão inline clicado)
  if (cb) {
    const chatId = cb.message?.chat?.id;
    const msgId = cb.message?.message_id;
    const data = cb.data || '';

    try {
      // Sempre responder ao callback para parar o spinner de carregamento
      await tgAnswer(tgToken, cb.id);

      // Botão Apagar
      if (data.startsWith('delete:')) {
        const ownerId = data.split(':')[1];
        if (String(userId) !== ownerId) {
          await tgAnswer(tgToken, cb.id, '⚠️ Apenas o proprietário pode apagar.', true);
          return;
        }
        await tgDelete(tgToken, chatId, msgId!);
        return;
      }

      const isUserVip = async (uId: number) => {
        const { data: prof } = await supabase
          .from('profiles')
          .select('telegram_expires_at, plan_expires_at')
          .eq('telegram_id', String(uId))
          .maybeSingle();
        const now = new Date();
        const isTgVip = prof?.telegram_expires_at && new Date(prof.telegram_expires_at) > now;
        const isSiteVip = prof?.plan_expires_at && new Date(prof.plan_expires_at) > now;
        return !!(isTgVip || isSiteVip);
      };

      if (data === 'menu:main') {
        const { text, keyboard } = await buildMainMenu(cb.from.first_name);
        await tgEdit(tgToken, chatId, msgId, text, { reply_markup: { inline_keyboard: keyboard } });
        return;
      }

      if (data === 'menu:consultas') {
        const { text, keyboard } = await buildCategoryMenu(supabase);
        await tgEdit(tgToken, chatId, msgId, text, { reply_markup: { inline_keyboard: keyboard } });
        return;
      }

      if (data === 'menu:planos') {
        const { text, keyboard } = await buildPlansMenu(siteUrl);
        await tgEdit(tgToken, chatId, msgId, text, { reply_markup: { inline_keyboard: keyboard } });
        return;
      }

      if (data.startsWith('cat:')) {
        const type = data.split(':')[1];
        
        // VIP CHECK for Category
        const { data: cat } = await supabase.from('api_categories').select('is_vip, name').eq('slug', type).single();
        if (cat?.is_vip) {
          const isVip = await isUserVip(userId);
          if (!isVip) {
            const { text: pText, keyboard: pKb } = await buildPlansMenu(siteUrl);
            await tgEdit(tgToken, chatId, msgId, `⚠️ <b>ACESSO NEGADO - CATEGORIA VIP</b>\n\nA categoria <b>${escapeHtml(cat.name)}</b> é exclusiva para assinantes VIP do Bot.\n\n` + pText, { reply_markup: { inline_keyboard: pKb } });
            return;
          }
        }

        const { text, keyboard } = await buildInstructionPage(type);
        await tgEdit(tgToken, chatId, msgId, text, { reply_markup: { inline_keyboard: keyboard } });
        return;
      }

      if (data.startsWith('query:')) {
        const parts = data.split(':');
        const apiId = parts[1];
        const queryValue = decodeURIComponent(parts.slice(2).join(':'));

        // VIP CHECK for API
        const { data: api } = await supabase.from('apis').select('is_vip, name').eq('id', apiId).single();
        if (api?.is_vip) {
          const isVip = await isUserVip(userId);
          if (!isVip) {
            const { text: pText, keyboard: pKb } = await buildPlansMenu(siteUrl);
            await tgEdit(tgToken, chatId, msgId, `⚠️ <b>ACESSO NEGADO - MÓDULO VIP</b>\n\nO módulo <b>${escapeHtml(api.name)}</b> é restrito a assinantes VIP do Bot.\n\n` + pText, { reply_markup: { inline_keyboard: pKb } });
            return;
          }
        }

        await tgEdit(tgToken, chatId, msgId!, `⏳ <b>Consultando...</b>\n<i>Processando sua solicitação nas bases de inteligência.</i>`);
        const result = await doQuery(apiId, queryValue, supabase, cfg);

        if (!result.success || !result.data) {
          await tgEdit(tgToken, chatId, msgId!, `⚠️ <b>ERRO NA CONSULTA</b>\n\n${result.message || 'Dados não encontrados.'}`, {
            reply_markup: { inline_keyboard: [[{ text: '🗑️ Apagar', callback_data: `delete:${userId}` }, { text: '🔙 Menu', callback_data: 'menu:main' }]] }
          });
          return;
        }

        const userObj = { id: userId, name: cb.from.first_name };
        let formatted = formatProfessionalResponse(result.data, result.apiName!, queryValue, userObj, botHandle);
        const isHeavy = result.apiName?.toLowerCase().includes('isk') || formatted.length > 3000;
        const inline_keyboard: any[][] = [];

        if (isHeavy) {
          const shareToken = await createShareLink(result.apiName!, queryValue, result.data, siteUrl, 'telegram', supabase);
          const shortUrl = `${siteUrl}/share/${shareToken}`;
          inline_keyboard.push([{ text: '🌐 Ver Resultado Completo (Web)', url: shortUrl }]);

          formatted = `🔍 <b>DOSSIÊ DE INTELIGÊNCIA</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `📌 <b>Módulo:</b> <code>${escapeHtml(result.apiName || 'API')}</code>\n` +
            `🔎 <b>Consulta:</b> <code>${escapeHtml(queryValue)}</code>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📦 <b>RESULTADO DISPONÍVEL NO SITE</b>\n\n` +
            `Este módulo contém um volume alto de dados. O resultado completo foi gerado no link abaixo.\n\n` +
            `⏱ <i>O link expira em 15 minutos!</i>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 <b>Usuário:</b> ${mention_html(userId, userObj.name)}\n` +
            `⚡ <b>Bot:</b> ${botHandle}`;
        }

        inline_keyboard.push([{ text: '🗑️ Apagar Resultado', callback_data: `delete:${userId}` }, { text: '🔄 Nova Consulta', callback_data: 'menu:main' }]);

        // Photo check
        let photoUrl: string | null = null;
        const scan = (obj: any) => {
          if (!obj || typeof obj !== 'object' || isHeavy) return;
          for (const [k, v] of Object.entries(obj)) {
            if (typeof v === 'string' && (v.startsWith('data:image') || (v.length > 500 && /^[a-zA-Z0-9+/=]+$/.test(v)))) { photoUrl = v; break; }
            const kl = k.toLowerCase();
            if (['foto', 'image', 'imagem', 'base64', 'avatar'].includes(kl) && typeof v === 'string') { photoUrl = v; break; }
            if (typeof v === 'object') scan(v);
          }
        };
        scan(result.data);

        const sent = await (photoUrl ?
          tgSendPhoto(tgToken, chatId, photoUrl, { caption: formatted.substring(0, 1024), parse_mode: 'HTML', reply_markup: { inline_keyboard } }) :
          tgEdit(tgToken, chatId, msgId!, formatted.substring(0, TELEGRAM_CHAR_LIMIT), { reply_markup: { inline_keyboard } })
        );

        const resData = await sent.json();
        if (cb.message?.chat?.type !== 'private') {
          scheduleDelete(tgToken, chatId!, [resData.result?.message_id || msgId], 60);
        }
      }
    } catch (error) {
      console.error('Error handling callback:', error);
    }
    return;
  }

  // ── Mensagem de texto
  if (!msg?.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const lower = text.toLowerCase();
  const firstName = msg.from.first_name;

  if (lower === '/start' || lower === '/menu') {
    const { text: mText, keyboard } = await buildMainMenu(firstName);
    const welcomeText = mText + `\n\n🆔 <b>Seu ID:</b> <code>${userId}</code> (Copie e vincule no site)`;
    await tgSend(tgToken, chatId, welcomeText, { reply_markup: { inline_keyboard: keyboard } });
    return;
  }

  if (lower === '/id') {
    await tgSend(tgToken, chatId, `🆔 <b>SEU ID DO TELEGRAM</b>\n\n<code>${userId}</code>\n\nCopie este número e cole na aba <b>Perfil</b> no site para vincular sua conta e ativar seu VIP!`);
    return;
  }

  if (lower === '/planos') {
    const { text: pText, keyboard: pKb } = await buildPlansMenu(siteUrl);
    await tgSend(tgToken, chatId, pText, { reply_markup: { inline_keyboard: pKb } });
    return;
  }

  if (lower === '/comandos') {
    const { data: cats } = await supabase.from('api_categories').select('name, slug, icon, is_vip').order('name');
    let cmdList = `📜 <b>LISTA DE COMANDOS — INFOEASY</b>\n━━━━━━━━━━━━━━━━━\n\n`;
    cats?.forEach((c: any) => { cmdList += `${c.icon || '🔍'} <code>/${c.slug} [valor]</code>${c.is_vip ? ' ⭐' : ''}\n`; });
    cmdList += `\n💡 <i>Exemplo: /cpf 12345678901</i>\n✅ Módulos com ⭐ são exclusivos VIP!`;
    await tgSend(tgToken, chatId, cmdList, { reply_markup: { inline_keyboard: [[{ text: '🪪 Abrir Painel', callback_data: 'menu:main' }, { text: '🛒 Assinar VIP', callback_data: 'menu:planos' }]] } });
    return;
  }

  if (lower === '/ajuda' || lower === '/help') {
    await tgSend(tgToken, chatId, `🤖 <b>Central de Ajuda — InfoEasy</b>\n\nPara começar, utilize comandos diretos como <code>/cpf [valor]</code>.\n\n❓ <b>Dúvidas:</b> /comandos\n🏠 <b>Menu:</b> /start\n\n🌐 <b>Web:</b> ${siteUrl}`);
    return;
  }

  // Universal Command Routing
  const genericMatch = text.match(/^\/([\w-]+)(?:@\w+)?(?:\s+(.+))?$/i);
  if (genericMatch) {
    const slug = genericMatch[1].toLowerCase();
    const val = (genericMatch[2] || '').trim();

    const { data: cat } = await supabase.from('api_categories').select('id').eq('slug', slug).single();
    const { data: apis } = await supabase.from('apis').select('id').eq('is_active', true);

    // Check if it exists in categories or if it matches any api's slug or group_name
    const isApiExists = (apis || []).some((a: any) =>
      (a.slug || '').toLowerCase() === slug ||
      (a.group_name || '').toLowerCase() === slug
    );

    if (cat || isApiExists) {
      if (!val) {
        const { text: iText, keyboard: iKb } = await buildInstructionPage(slug);
        await tgSend(tgToken, chatId, iText, { reply_markup: { inline_keyboard: iKb } });
        return;
      }

      // VIP CHECK for direct command slug
      const { data: targetCat } = await supabase.from('api_categories').select('is_vip, name').eq('slug', slug).maybeSingle();
      const { data: targetApi } = await supabase.from('apis').select('is_vip, name').or(`slug.eq.${slug},group_name.eq.${slug}`).eq('is_active', true).limit(1).maybeSingle();

      if (targetCat?.is_vip || targetApi?.is_vip) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('telegram_expires_at, plan_expires_at')
          .eq('telegram_id', String(userId))
          .maybeSingle();

        const now = new Date();
        const isVip = (prof?.telegram_expires_at && new Date(prof.telegram_expires_at) > now) ||
                      (prof?.plan_expires_at && new Date(prof.plan_expires_at) > now);
        
        if (!isVip) {
          const { text: pText, keyboard: pKb } = await buildPlansMenu(siteUrl);
          const name = targetCat?.name || targetApi?.name || slug;
          await tgSend(tgToken, chatId, `⚠️ <b>ACESSO NEGADO - MÓDULO VIP</b>\n\nO acesso ao módulo <b>${escapeHtml(name)}</b> é exclusivo para assinantes VIP do Bot.\n\n` + pText, { reply_markup: { inline_keyboard: pKb } });
          return;
        }
      }

      const { text: aText, keyboard: aKb } = await buildApiMenu(slug, val, supabase);
      const res = await tgSend(tgToken, chatId, aText, { reply_markup: { inline_keyboard: aKb } });
      const resData = await res.json();
      if (msg.chat.type !== 'private') scheduleDelete(tgToken, chatId, [msg.message_id, resData.result?.message_id], 60);
      return;
    }
  }

  // Fallback
  const { text: welcome, keyboard: mainKb } = await buildMainMenu(firstName);
  await tgSend(tgToken, chatId, welcome, { reply_markup: { inline_keyboard: mainKb } });
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
    const signature = req.headers.get('x-signature-ed25519') || '';
    const timestamp = req.headers.get('x-signature-timestamp') || '';
    const message = new TextEncoder().encode(timestamp + body);
    const sigBytes = hexToBytes(signature);
    const keyBytes = hexToBytes(publicKey);

    const key = await crypto.subtle.importKey(
      'raw', keyBytes as any,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false, ['verify']
    );

    return await crypto.subtle.verify({ name: 'Ed25519' }, key, sigBytes as any, message);
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
// DISCORD: Módulos de Interface (Mirrors Telegram)
// ──────────────────────────────────────────────

async function buildMainMenuDiscord(firstName: string, siteUrl: string, applicationId: string) {
  const content =
    `## 👋 Olá, ${firstName}!\n` +
    `**Bem-vindo ao InfoEasy Bot** 🤖\n` +
    `Realize consultas completas com rapidez e total segurança.\n\n` +
    `📋 **Escolha uma opção para começar:**`;

  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: '➕ Adicionar em Servidor', url: `https://discord.com/api/oauth2/authorize?client_id=${applicationId}&permissions=8&scope=bot%20applications.commands` },
        { type: 2, style: 2, label: '🪪 Consultas', custom_id: 'menu:consultas' },
        { type: 2, style: 5, label: '📢 Canal', url: 'https://t.me/infoseasy' }
      ]
    },
    {
      type: 1,
      components: [
        { type: 2, style: 5, label: '🆘 Suporte', url: 'https://t.me/infoseasy' },
        { type: 2, style: 5, label: '🌐 Site Oficial', url: siteUrl }
      ]
    }
  ];

  return { content, components };
}

async function buildCategoryMenuDiscord(supabase: ReturnType<typeof createClient>) {
  const { data: types } = await supabase.from('api_categories').select('name, slug, icon').order('name');
  const options = (types || []).map(t => ({
    label: t.name.toUpperCase(),
    value: `cat:${t.slug}`,
    description: `Consultar por ${t.name}`,
    emoji: { name: t.icon || '📁' }
  }));

  const content = `🪪 **Selecione o tipo de consulta:**\n_Escolha uma categoria abaixo para ver as instruções._`;
  const components = [{
    type: 1,
    components: [{
      type: 3,
      custom_id: 'select_category',
      options: options.slice(0, 25),
      placeholder: 'Escolha uma categoria...'
    }]
  }];

  return { content, components };
}

async function buildInstructionPageDiscord(type: string) {
  const content =
    `⚠️ **${type.toUpperCase()}**\n\n` +
    `Por favor, utilize o comando de barra informando o valor para consultar:\n` +
    `\`/${type} valor:[VALOR]\`\n\n` +
    `**Exemplo:** \`/${type} valor:123456789\``;

  const components = [{
    type: 1,
    components: [{ type: 2, style: 2, label: '↩️ Voltar', custom_id: 'menu:consultas' }]
  }];

  return { content, components };
}

async function buildApiMenuDiscord(
  type: string,
  queryValue: string,
  supabase: ReturnType<typeof createClient>
) {
  const { data: cat } = await supabase.from('api_categories').select('id, name, slug').eq('slug', type).single();
  const { data: allApis } = await supabase.from('apis').select('*').eq('is_active', true);

  let filtered = [];
  if (cat) {
    filtered = (allApis || []).filter(a => a.category_id === cat.id);
  } else {
    filtered = (allApis || []).filter(a =>
      (a.slug || '').toLowerCase() === type ||
      (a.group_name || '').toLowerCase() === type.toLowerCase()
    );
  }

  if (!filtered.length) {
    return { 
      content: `❌ Nenhum módulo ativo para **${type.toUpperCase()}**.`, 
      components: [{ type: 1, components: [{ type: 2, style: 2, label: '↩️ Voltar', custom_id: 'menu:consultas' }] }] 
    };
  }

  const options = filtered.slice(0, 25).map(a => ({
    label: a.name,
    value: `query:${a.id}:${encodeURIComponent(queryValue).substring(0, 50)}`,
    description: `Consultar via ${a.name}`,
    emoji: { name: '📁' }
  }));

  const content =
    `## 📂 ${type.toUpperCase()}\n` +
    `🔎 **Valor:** \`${queryValue}\`\n\n` +
    `_Selecione o módulo de consulta abaixo:_`;

  const components = [
    {
      type: 1,
      components: [{
        type: 3,
        custom_id: 'select_api',
        options,
        placeholder: 'Selecione o módulo...'
      }]
    },
    {
      type: 1,
      components: [{ type: 2, style: 4, label: '❌ Cancelar', custom_id: 'menu:main' }]
    }
  ];

  return { content, components };
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
  if (!isValid) return new Response('Invalid signature', { status: 401 });

  const { type, data, token: interactionToken, application_id, member, user } = body;
  const caller = member?.user || user;
  const callerId = caller?.id;
  const callerName = caller?.global_name || caller?.username || 'Usuário';

  // 1. PING
  if (type === 1) return new Response(JSON.stringify({ type: 1 }), { headers: { 'Content-Type': 'application/json' } });

  // Responder Helpers
  const respond = (payload: any) => new Response(JSON.stringify({ type: 4, data: payload }), { headers: { 'Content-Type': 'application/json' } });
  const defer = () => new Response(JSON.stringify({ type: 5 }), { headers: { 'Content-Type': 'application/json' } });
  const update = (payload: any) => new Response(JSON.stringify({ type: 7, data: payload }), { headers: { 'Content-Type': 'application/json' } });

  // 2. SLASH COMMANDS
  if (type === 2) {
    const cmd = data?.name?.toLowerCase();
    const val = data?.options?.find((o: any) => o.name === 'valor')?.value || '';

    if (cmd === 'start' || cmd === 'menu' || cmd === 'ajuda') {
      const { content, components } = await buildMainMenuDiscord(callerName, siteUrl, application_id);
      return respond({ content, components });
    }

    // Routing universal de comandos baseados em slugs
    const { data: cat } = await supabase.from('api_categories').select('slug').eq('slug', cmd).single();
    const { data: apis } = await supabase.from('apis').select('slug, group_name').eq('is_active', true);

    const isApiExists = (apis || []).some(a => (a.slug || '').toLowerCase() === cmd || (a.group_name || '').toLowerCase() === cmd);

    if (cat || isApiExists) {
      if (!val) {
        const { content, components } = await buildInstructionPageDiscord(cmd);
        return respond({ content, components, flags: 64 });
      }
      const { content, components } = await buildApiMenuDiscord(cmd, String(val), supabase);
      return respond({ content, components });
    }
  }

  // 3. COMPONENT INTERACTIONS
  if (type === 3) {
    const customId = data?.custom_id;

    if (customId === 'menu:main') {
      const { content, components } = await buildMainMenuDiscord(callerName, siteUrl, application_id);
      return update({ content, components });
    }

    if (customId === 'menu:consultas' || customId === 'select_category') {
      const selectedCat = customId === 'select_category' ? data?.values?.[0]?.replace('cat:', '') : null;
      if (selectedCat) {
        const { content, components } = await buildInstructionPageDiscord(selectedCat);
        return update({ content, components });
      }
      const { content, components } = await buildCategoryMenuDiscord(supabase);
      return update({ content, components });
    }

    if (customId === 'select_api') {
      const selected = data?.values?.[0] || '';
      const [action, apiId, queryValue] = selected.split(':'); // Note: Telegram uses query:id:val, Discord select menu passes value

      // Re-fetch category/api info based on selection
      // Wait, Discord value is what we set in buildApiMenuDiscord: `query:${a.id}:${val}`
      if (action === 'query') {
        const qVal = decodeURIComponent(queryValue);
        
        // Deferred response for long-running query
        (async () => {
          const { data: settings } = await supabase.from('bot_settings').select('key, value');
          const cfg: Record<string, string> = {};
          settings?.forEach(s => { cfg[s.key] = s.value; });

          const result = await doQuery(apiId, qVal, supabase, cfg);
          const botHandle = cfg['telegram_username'] || 'InfoEasy Bot';

          let content: string;
          if (!result.success || !result.data) {
            content = `⚠️ **ERRO NA CONSULTA**\n\n${result.message || 'Dados não encontrados.'}`;
          } else {
            const userObj = { id: callerId, name: callerName };
            const formatted = formatProfessionalResponseDiscord(result.data, result.apiName!, qVal, userObj, botHandle);
            
            if (formatted.length <= DISCORD_CHAR_LIMIT) {
              content = formatted;
            } else {
              const shareToken = await createShareLink(result.apiName!, qVal, result.data, siteUrl, 'discord', supabase);
              const shortUrl = `${siteUrl}/share/${shareToken}`;
              content = 
                `## 🔍 DOSSIÊ DE INTELIGÊNCIA\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `📌 **Módulo:** \`${result.apiName}\`\n` +
                `🔎 **Consulta:** \`${qVal}\`\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `📦 **RESULTADO DISPONÍVEL NO SITE**\n\n` +
                `Este módulo contém um volume alto de dados. O resultado completo foi gerado no link abaixo.\n\n` +
                `🔗 **Link:** ${shortUrl}\n\n` +
                `⏱ _O link expira em 15 minutos!_\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `👤 **Usuário:** <@${callerId}>\n` +
                `⚡ **Bot:** ${botHandle}`;
            }
          }

          // Edit the deferred original message
          await fetch(`https://discord.com/api/v10/webhooks/${application_id}/${interactionToken}/messages/@original`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bot ${discordToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              content, 
              components: [{ type: 1, components: [{ type: 2, style: 2, label: '🔄 Nova Consulta', custom_id: 'menu:main' }] }] 
            }),
          });
        })();

        return update({ content: `⏳ **Consultando...**\n_Processando sua solicitação nas bases de inteligência._`, components: [] });
      }
    }
  }

  return respond({ content: '❌ Comando não reconhecido.', flags: 64 });
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

    const siteUrl = cfg['site_url'] || 'https://infoseasy.netlify.app';
    const tgToken = cfg['telegram_token'] || '';
    const discordToken = cfg['discord_token'] || '';
    const discordPubKey = cfg['discord_public_key'] || '';

    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    // Limpeza periódica de links expirados
    supabase.rpc('cleanup_expired_shared_queries').then(() => { }).catch(() => { });

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

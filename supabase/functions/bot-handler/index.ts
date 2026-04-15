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

  const blacklistInternal = [
    'token', 'apikey', 'senha', 'password', 'auth',
    'modulo', 'valor', 'protocolo', 'sucesso', 'usuario',
    'consumo_hoje', 'reset_em', 'total_diario', 'limites',
    'status', 'msg', 'message', 'erro', 'error', 'query_value',
    'cache', 'cached_at', 'cached at', 'conta', 'expiracao', 'expiração',
    'saldo', 'tempo_segundos', 'segundos', 'tempo segundos',
    'data_execucao', 'execucao', 'execução'
  ];

  for (const [key, value] of Object.entries(obj)) {
    const k = key.toLowerCase();

    // Filtro inteligente: Impedir que "valor_veiculo" seja filtrado por causa de "valor"
    // Usamos correspondência exata para nomes comuns que podem ser prefixos legítimos
    const exactInternal = ['valor', 'data', 'status', 'msg', 'message', 'sucesso', 'erro', 'error', 'modulo', 'usuario', 'conta'];
    const isInternal = exactInternal.includes(k) || blacklistInternal.some(b => k === b || (b.length > 5 && k.includes(b)));

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
  } else if (endpointStore.startsWith('tconect:')) {
    const path = endpointStore.split(':')[1];
    const tconectToken = cfg['tconect_api_token'] || "PNSAPIS";
    const tconectBase = cfg['tconect_api_url'] || "http://node.tconect.xyz:1116";
    
    apiUrl = `${tconectBase}${path.startsWith('/') ? '' : '/'}${path}`;
    if (apiUrl.includes('?')) {
      apiUrl = apiUrl.replace('apikey=SeuToken', `apikey=${tconectToken}`).replace('apikey=SUAKEY', `apikey=${tconectToken}`);
      if (!apiUrl.includes('apikey=')) apiUrl += `&apikey=${tconectToken}`;
    } else {
      apiUrl += `?apikey=${tconectToken}`;
    }
    apiUrl = apiUrl.replace('{valor}', encodedValue);
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
  const safe = name.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  return `<a href="tg://user?id=${id}">${safe}</a>`;
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
const QUERY_MAPPING: Record<string, string[]> = {
  cpf: ['CPF', 'SUS', 'Score', 'Duality', 'ISK', 'Situação'],
  cnpj: ['CNPJ', 'Empresa', 'Corporativo'],
  nome: ['Nome', 'Mãe', 'Pai'], // Mae integrada em Nome
  tel: ['Telefone', 'Tel', 'Celular', 'Linha'],
  email: ['Email', 'E-mail', 'Gmail', 'Outlook'],
  placa: ['Placa', 'SESP', 'FIPE', 'Veículo', 'Auto'],
  cep: ['CEP', 'Logradouro', 'Endereço'],
  rg: ['RG', 'Identidade'],
  pis: ['PIS', 'PASEP'],
  score: ['Score', 'Poder Aquisitivo', 'Renda', 'Financeiro'],
  parente: ['Parentes', 'Vínculos', 'Família'],
  endereco: ['Endereço', 'Logradouro', 'Rua'],
  judicial: ['Processos', 'SIEL', 'Credilink', 'Criminal', 'Mandado'],
  pix: ['PIX', 'Conta', 'Banco'],
  ip: ['IP', 'Internet', 'Rede'],
  mac: ['MAC', 'Dispositivo'],
  bin: ['BIN', 'Cartão'],
  fotos: ['Foto', 'Imagem', 'Avatar']
};

async function buildCategoryMenu() {
  const types = [
    { label: '👤 CPF', type: 'cpf' },
    { label: '🏢 CNPJ', type: 'cnpj' },
    { label: '👤 NOME', type: 'nome' },
    { label: '📞 TEL', type: 'tel' },
    { label: '📧 EMAIL', type: 'email' },
    { label: '🚗 PLACA', type: 'placa' },
    { label: '📍 CEP', type: 'cep' },
    { label: '🪪 RG', type: 'rg' },
    { label: '📋 PIS', type: 'pis' },
    { label: '💰 SCORE', type: 'score' },
    { label: '👥 PARENTE', type: 'parente' },
    { label: '📍 ENDEREÇO', type: 'endereco' },
    { label: '⚖️ JUDICIAL', type: 'judicial' },
    { label: '💸 PIX', type: 'pix' },
    { label: '🌐 IP', type: 'ip' },
    { label: '🖥️ MAC', type: 'mac' },
    { label: '💳 BIN', type: 'bin' },
    { label: '📸 FOTOS', type: 'fotos' }
  ];

  const buttons: any[] = [];
  for (let i = 0; i < types.length; i += 2) {
    const row = [
      { text: types[i].label, callback_data: `cat:${types[i].type}` }
    ];
    if (types[i + 1]) {
      row.push({ text: types[i + 1].label, callback_data: `cat:${types[i + 1].type}` });
    }
    buttons.push(row);
  }
  buttons.push([{ text: '↩️ Voltar', callback_data: 'menu:main' }]);

  const text = `🪪 <b>Selecione o tipo de consulta:</b>\n<i>Toque em uma opção para ver o exemplo de uso.</i>`;
  return { text, keyboard: buttons };
}

async function buildInstructionPage(type: string) {
  const examples: Record<string, string> = {
    cpf: '000.000.000-00', cnpj: '00.000.000/0001-00', nome: 'JOAO SILVA',
    tel: '11999999999', email: 'exemplo@gmail.com', placa: 'ABC1234',
    cep: '01001-000', rg: '12.345.678-9', pis: '123.45678.90-1',
    score: '000.000.000-00', parente: '000.000.000-00', endereco: 'Rua Exemplo, 123',
    judicial: '0000000-00.0000.0.00.0000', pix: '000.000.000-00',
    ip: '127.0.0.1', mac: 'AA:BB:CC:DD:EE:FF', bin: '123456',
    fotos: '000.000.000-00'
  };
  const example = examples[type] || 'VALOR';
  const text =
    `⚠️ <b>${type.toUpperCase()}</b>\n\n` +
    `Por favor, utilize o formato correto:\n` +
    `<code>/${type} ${example}</code>`;

  const keyboard = [[{ text: '↩️ Voltar', callback_data: 'menu:consultas' }]];
  return { text, keyboard };
}

async function buildApiMenu(
  type: string,
  queryValue: string,
  supabase: ReturnType<typeof createClient>
) {
  const keywords = QUERY_MAPPING[type] || [type];

  // Construir query OR complexa
  let query = supabase.from('apis').select('*').eq('is_active', true);

  // Filtragem local para simplicidade ou via RPC se ficar complexo
  const { data: allApis } = await query;

  const filtered = allApis?.filter(api => {
    const name = api.name.toLowerCase();
    const desc = (api.description || '').toLowerCase();
    return keywords.some(k => name.includes(k.toLowerCase()) || desc.includes(k.toLowerCase()));
  }) || [];

  if (!filtered.length) {
    return { text: `Nenhum módulo ativo para <b>${type.toUpperCase()}</b>.`, keyboard: [[{ text: '↩️ Voltar', callback_data: 'menu:consultas' }]] };
  }

  const buttons: any[] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    const row = [];
    row.push({
      text: `📁 ${filtered[i].name}`,
      callback_data: `query:${filtered[i].id}:${encodeURIComponent(queryValue).substring(0, 50)}`
    });
    if (filtered[i + 1]) {
      row.push({
        text: `📁 ${filtered[i + 1].name}`,
        callback_data: `query:${filtered[i + 1].id}:${encodeURIComponent(queryValue).substring(0, 50)}`
      });
    }
    buttons.push(row);
  }

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

    await tgAnswer(tgToken, cb.id);

    if (data === 'menu:main') {
      const { text, keyboard } = await buildMainMenu(cb.from.first_name);
      await tgEdit(tgToken, chatId, msgId, text, { reply_markup: { inline_keyboard: keyboard } });
      return;
    }

    if (data === 'menu:consultas') {
      const { text, keyboard } = await buildCategoryMenu();
      await tgEdit(tgToken, chatId, msgId, text, { reply_markup: { inline_keyboard: keyboard } });
      return;
    }

    if (data.startsWith('cat:')) {
      const type = data.split(':')[1];
      const { text, keyboard } = await buildInstructionPage(type);
      await tgEdit(tgToken, chatId, msgId, text, { reply_markup: { inline_keyboard: keyboard } });
      return;
    }

    if (data.startsWith('query:')) {
      const parts = data.split(':');
      const apiId = parts[1];
      const queryValue = decodeURIComponent(parts.slice(2).join(':'));

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
          `📌 <b>Módulo:</b> <code>${result.apiName}</code>\n` +
          `🔎 <b>Consulta:</b> <code>${queryValue}</code>\n` +
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
      return;
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
    await tgSend(tgToken, chatId, mText, { reply_markup: { inline_keyboard: keyboard } });
    return;
  }

  if (lower === '/comandos') {
    const { data: cats } = await supabase.from('api_categories').select('name, slug, icon').order('name');
    let cmdList = `📜 <b>LISTA DE COMANDOS — INFOEASY</b>\n━━━━━━━━━━━━━━━━━\n\n`;
    cats?.forEach((c: any) => { cmdList += `${c.icon || '🔍'} <code>/${c.slug} [valor]</code>\n`; });
    cmdList += `\n💡 <i>Exemplo: /cpf 12345678901</i>\n✅ Mais de 60 APIs integradas!`;
    await tgSend(tgToken, chatId, cmdList, { reply_markup: { inline_keyboard: [[{ text: '🪪 Abrir Painel', callback_data: 'menu:main' }]] } });
    return;
  }

  if (lower === '/ajuda' || lower === '/help') {
    await tgSend(tgToken, chatId, `🤖 <b>Central de Ajuda — InfoEasy</b>\n\nPara começar, utilize comandos diretos como <code>/cpf [valor]</code>.\n\n❓ <b>Dúvidas:</b> /comandos\n🏠 <b>Menu:</b> /start\n\n🌐 <b>Web:</b> ${siteUrl}`);
    return;
  }

  // Universal Command Routing
  const genericMatch = text.match(/^\/(\w+)(?:@\w+)?(?:\s+(.+))?$/i);
  if (genericMatch) {
    const slug = genericMatch[1].toLowerCase();
    const val = (genericMatch[2] || '').trim();
    if (QUERY_MAPPING[slug]) {
      if (!val) {
        const { text: iText, keyboard: iKb } = await buildInstructionPage(slug);
        await tgSend(tgToken, chatId, iText, { reply_markup: { inline_keyboard: iKb } });
        return;
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

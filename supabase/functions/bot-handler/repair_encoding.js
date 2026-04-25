const fs = require('fs');
const path = "c:/Users/diniz/Documents/GitHub/infoeasy2.0/supabase/functions/bot-handler/index.ts";

let content = fs.readFileSync(path);

// Emojis and corrupted sequences
const replacements = [
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x98, 0xc2, 0xa4]), to: '👤' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x9c, 0xc2, 0xa0]), to: '📍' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x91, 0xc2, 0xa5]), to: '👪' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x9c, 0xc2, 0x9e]), to: '📞' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x99, 0xc2, 0xbc]), to: '💼' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x99, 0xc2, 0xb0]), to: '💰' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xc5, 0xa1, 0xe2, 0x80, 0x97]), to: '🚗' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xc2, 0xa0, 0xc2, 0xa5]), to: '🏥' },
  { from: Buffer.from([0xc3, 0xa2, 0xc5, 0xa1, 0xe2, 0x80, 0x93, 0xc3, 0xaf, 0xc2, 0xb8, 0xc2, 0x8f]), to: '⚖️' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xc2, 0xaa, 0xc2, 0xaa]), to: '🚪' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x93, 0xc2, 0xbc]), to: '🖼️' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x9c, 0xc2, 0x8b]), to: '📋' },
  { from: Buffer.from([0xc3, 0xb0, 0xc5, 0xb8, 0xe2, 0x80, 0x9d, 0xc2, 0x8d]), to: '🔍' },
  { from: Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0x9d, 0xc2, 0xba]), to: '▸' },
  { from: Buffer.from([0xc3, 0xa2, 0xe2, 0x82, 0xac, 0xc2, 0xa2]), to: '•' },
  { from: 'nÃ£o', to: 'não' },
  { from: 'MÃ³dulo', to: 'Módulo' },
  { from: 'UsuÃ¡rio', to: 'Usuário' },
  { from: 'usuÃ¡rio', to: 'usuário' },
  { from: 'mÃ³dulo', to: 'módulo' },
  { from: 'InteligÃªncia', to: 'Inteligência' },
  { from: 'inteligÃªncia', to: 'inteligência' }
];

function replaceBuffer(buf, from, to) {
  let fromBuf = Buffer.isBuffer(from) ? from : Buffer.from(from);
  let toBuf = Buffer.from(to);
  let result = [];
  let i = 0;
  while (i < buf.length) {
    if (buf.slice(i, i + fromBuf.length).equals(fromBuf)) {
      result.push(...toBuf);
      i += fromBuf.length;
    } else {
      result.push(buf[i]);
      i++;
    }
  }
  return Buffer.from(result);
}

replacements.forEach(r => {
  content = replaceBuffer(content, r.from, r.to);
});

// Fix logic error from previous tool hallucination if still present
let text = content.toString('utf8');
const search = "return text;\n  text += `—————————————————————`;\n  text += `👤 **Usuário:** <@${user.id}>`;\n  text += `⚡ **Bot:** ${botHandle}`;\n\n  return text;";
if (text.includes(search)) {
    text = text.replace(search, "return text;");
    content = Buffer.from(text, 'utf8');
}

fs.writeFileSync(path, content);
console.log("Repair completed.");

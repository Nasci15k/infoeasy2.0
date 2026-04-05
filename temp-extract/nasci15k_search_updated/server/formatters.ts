/**
 * Response formatters to clean and beautify API responses
 */

const WARNINGS_TO_REMOVE = [
  // Aviso pattern variations
  /Aviso:\s*Sou o dono desta API\.\s*Telegram:\s*@\w+\.\s*Vendo APIs,\s*faço parcerias e possuo databases e sources\.?\n?/gi,
  /Aviso:\s*Sou o dono desta API\.\s*Telegram:\s*@\w+\.\s*Vendo APIs,\s*faço parcerias e possuo databases e sources\.?\r?\n?/gi,
  /Aviso:\s*Sou o dono desta API\.\s*Telegram:\s*@\w+\.\s*Vendo APIs,\s*faço parcerias e possuo databases e sources\.?\s*$/gim,
  /Aviso:\s*Sou o dono desta API\.\s*Telegram:\s*@[\w]+\.\s*Vendo APIs,\s*faço parcerias e possuo databases e sources\.?\s*$/gim,
  /Aviso:\s*Sou o dono desta API\.\s*Telegram:\s*@[\w]+\.\s*Vendo APIs,\s*faço parcerias e possuo databases e sources\.?\s*$/gim,
  
  // Warning emoji variations
  /⚠️.*?Telegram.*?sources\.?\n?/gi,
  /⚠️.*?Telegram.*?sources\.?\s*$/gim,
  /⚠️.*?Telegram.*?sources\.?\s*$/gim,
  /⚠️.*?Telegram.*?sources\.?\s*$/gim,
  
  // Additional variations with different spacing and punctuation
  /Aviso:\s*Sou\s+o\s+dono\s+desta\s+API\.\s*Telegram:\s*@[\w]+\.\s*Vendo\s+APIs,\s*faço\s+parcerias\s+e\s+possuo\s+databases\s+e\s+sources\.?\s*$/gim,
  /Aviso:\s*Sou\s+o\s+dono\s+desta\s+API\.\s*Telegram:\s*@[\w]+\.\s*Vendo\s+APIs,\s*faço\s+parcerias\s+e\s+possuo\s+databases\s+e\s+sources\.?\s*\n/gim,
];

/**
 * Remove known warnings from API responses
 */
export function removeWarnings(text: string): string {
  let cleaned = text;
  for (const pattern of WARNINGS_TO_REMOVE) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}

/**
 * Format object response to readable text
 */
export function formatObjectResponse(data: unknown): string {
  if (typeof data === "string") {
    return removeWarnings(data);
  }

  if (typeof data === "object" && data !== null) {
    return formatObject(data as Record<string, unknown>, 0);
  }

  return String(data);
}

function formatObject(obj: Record<string, unknown>, indent: number = 0): string {
  const spaces = "  ".repeat(indent);
  const nextSpaces = "  ".repeat(indent + 1);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    // Skip null/undefined values
    if (value === null || value === undefined) continue;

    // Format key
    const formattedKey = formatKey(key);

    if (typeof value === "string") {
      const cleanedValue = removeWarnings(value);
      if (cleanedValue) {
        lines.push(`${nextSpaces}${formattedKey}: ${cleanedValue}`);
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      lines.push(`${nextSpaces}${formattedKey}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        lines.push(`${nextSpaces}${formattedKey}:`);
        value.forEach((item, idx) => {
          if (typeof item === "object" && item !== null) {
            lines.push(`${nextSpaces}  [${idx}]:`);
            lines.push(formatObject(item as Record<string, unknown>, indent + 2));
          } else {
            const cleanedItem = typeof item === "string" ? removeWarnings(item) : item;
            if (cleanedItem) {
              lines.push(`${nextSpaces}  [${idx}]: ${cleanedItem}`);
            }
          }
        });
      }
    } else if (typeof value === "object") {
      lines.push(`${nextSpaces}${formattedKey}:`);
      lines.push(formatObject(value as Record<string, unknown>, indent + 1));
    }
  }

  return lines.join("\n");
}

/**
 * Convert snake_case or camelCase keys to readable format
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1") // camelCase to spaces
    .replace(/_/g, " ") // snake_case to spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize each word
    .trim();
}

/**
 * Format IP API response
 */
export function formatIpResponse(data: Record<string, unknown>): string {
  const formatted: Record<string, string> = {};

  const fieldMap: Record<string, string> = {
    query: "Endereço IP",
    status: "Status",
    continent: "Continente",
    continentCode: "Código do Continente",
    country: "País",
    countryCode: "Código do País",
    region: "Região/Estado",
    regionName: "Nome da Região",
    city: "Cidade",
    district: "Distrito",
    zip: "CEP",
    lat: "Latitude",
    lon: "Longitude",
    timezone: "Fuso Horário",
    offset: "Offset",
    currency: "Moeda",
    isp: "Provedor (ISP)",
    org: "Organização",
    as: "Sistema Autônomo",
    asname: "Nome do AS",
    mobile: "É Móvel",
    proxy: "É Proxy",
    hosting: "É Hosting",
  };

  for (const [key, value] of Object.entries(data)) {
    const label = fieldMap[key] || formatKey(key);
    if (value !== null && value !== undefined && value !== "") {
      const cleanedValue = typeof value === "string" ? removeWarnings(String(value)) : String(value);
      if (cleanedValue) {
        formatted[label] = cleanedValue;
      }
    }
  }

  return Object.entries(formatted)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

/**
 * Format MAC Vendor response
 */
export function formatMacResponse(data: unknown): string {
  if (typeof data === "string") {
    const cleaned = removeWarnings(data);
    return `Fabricante: ${cleaned}`;
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.vendorName) {
      const cleaned = removeWarnings(String(obj.vendorName));
      return `Fabricante: ${cleaned}`;
    }
    if (obj.company) {
      const cleaned = removeWarnings(String(obj.company));
      return `Fabricante: ${cleaned}`;
    }
  }

  return removeWarnings(String(data));
}

/**
 * Format Placa response
 */
export function formatPlacaResponse(data: Record<string, unknown>): string {
  const formatted: Record<string, string> = {};

  const fieldMap: Record<string, string> = {
    placa: "Placa",
    modelo: "Modelo",
    marca: "Marca",
    ano: "Ano",
    cor: "Cor",
    combustivel: "Combustível",
    tipo: "Tipo",
    categoria: "Categoria",
    proprietario: "Proprietário",
    endereco: "Endereço",
    cidade: "Cidade",
    estado: "Estado",
    status: "Status",
    renavam: "RENAVAM",
    chassi: "Chassi",
  };

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;
    const label = fieldMap[key] || formatKey(key);
    const cleanedValue = typeof value === "string" ? removeWarnings(String(value)) : String(value);
    if (cleanedValue) {
      formatted[label] = cleanedValue;
    }
  }

  return Object.entries(formatted)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

/**
 * Generic formatter that tries to intelligently format any response
 */
export function formatResponse(data: unknown, type: string = "generic"): string {
  if (typeof data === "string") {
    return removeWarnings(data);
  }

  if (typeof data !== "object" || data === null) {
    return removeWarnings(String(data));
  }

  const obj = data as Record<string, unknown>;

  // Auto-detect type based on fields
  if (type === "generic") {
    if ("query" in obj && "status" in obj) {
      type = "ip";
    } else if ("vendorName" in obj || "company" in obj) {
      type = "mac";
    } else if ("placa" in obj || "modelo" in obj) {
      type = "placa";
    }
  }

  switch (type) {
    case "ip":
      return formatIpResponse(obj);
    case "mac":
      return formatMacResponse(obj);
    case "placa":
      return formatPlacaResponse(obj);
    default:
      return formatObjectResponse(obj);
  }
}

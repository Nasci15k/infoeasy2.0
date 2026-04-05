/**
 * Extended APIs Configuration with new modules
 */

export interface ApiConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  parameterName: string;
  validator: (value: string) => boolean;
  method?: "GET" | "POST";
}

export const ExtendedAPIs: Record<string, ApiConfig[]> = {
  // IP Lookup APIs
  ip: [
    {
      id: "ip-api-com",
      name: "IP-API.com",
      description: "Informações completas de geolocalização por IP",
      category: "ip",
      endpoint: "http://ip-api.com/json/{ip}",
      parameterName: "ip",
      validator: validateIP,
    },
  ],

  // MAC Address APIs
  mac: [
    {
      id: "macvendors",
      name: "MAC Vendors",
      description: "Identificar fabricante do MAC Address",
      category: "mac",
      endpoint: "https://api.macvendors.com/{mac}",
      parameterName: "mac",
      validator: validateMAC,
    },
  ],

  // Placa APIs
  placa: [
    {
      id: "placa-detran",
      name: "Detran (BV)",
      description: "Consulta de placa no Detran",
      category: "placa",
      endpoint: "https://apis-brasil.shop/apis/apiplacabvdetran.php",
      parameterName: "placa",
      validator: validatePlate,
    },
    {
      id: "placa-serpro",
      name: "Placa Serpro (Radar)",
      description: "Consulta de placa via Serpro com dados atualizados",
      category: "placa",
      endpoint: "https://apiradar.onrender.com/api/placa",
      parameterName: "query",
      validator: validatePlate,
      method: "GET",
    },
  ],
};

/**
 * Validators
 */

export function validateIP(ip: string): boolean {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export function validateMAC(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

export function validatePlate(plate: string): boolean {
  const cleaned = plate.replace(/\D/g, "").toUpperCase();
  return cleaned.length === 7;
}

/**
 * Get APIs by category
 */
export function getApisByCategory(category: string): ApiConfig[] {
  return ExtendedAPIs[category] || [];
}

/**
 * Get all categories
 */
export function getAllCategories(): Array<{ id: string; label: string }> {
  return [
    { id: "ip", label: "IP" },
    { id: "mac", label: "MAC Address" },
    { id: "placa", label: "Placa de Veículo" },
  ];
}

/**
 * Get API by ID
 */
export function getApiById(id: string): ApiConfig | undefined {
  for (const apis of Object.values(ExtendedAPIs)) {
    const api = apis.find((a) => a.id === id);
    if (api) return api;
  }
  return undefined;
}

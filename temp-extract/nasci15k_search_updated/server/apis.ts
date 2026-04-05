/**
 * External APIs Configuration
 * All APIs from apis-brasil.shop
 */

export interface ApiConfig {
  name: string;
  description: string;
  category: string;
  endpoint: string;
  parameterName: string;
  validator: (value: string) => boolean;
}

export const APIs: Record<string, ApiConfig[]> = {
  serasa: [
    {
      name: "Serasa - Consulta CPF",
      description: "Consulta completa de CPF na base Serasa",
      category: "serasa",
      endpoint: "https://apis-brasil.shop/apis/apiserasacpf2025.php",
      parameterName: "cpf",
      validator: validateCPF,
    },
    {
      name: "Serasa - Consulta Nome",
      description: "Consulta por nome completo na base Serasa",
      category: "serasa",
      endpoint: "https://apis-brasil.shop/apis/apiserasanome2025.php",
      parameterName: "nome",
      validator: (v) => v.length >= 3,
    },
    {
      name: "Serasa - Consulta Email",
      description: "Consulta por email na base Serasa",
      category: "serasa",
      endpoint: "https://apis-brasil.shop/apis/apiserasaemail2025.php",
      parameterName: "email",
      validator: validateEmail,
    },
  ],
  spc: [
    {
      name: "SPC - Consulta CPF",
      description: "Consulta de CPF na base SPC",
      category: "spc",
      endpoint: "https://apis-brasil.shop/apis/apicpfspc.php",
      parameterName: "doc",
      validator: validateCPF,
    },
    {
      name: "SPC - Consulta CPF v1",
      description: "Consulta de CPF na base SPC - Versão 1",
      category: "spc",
      endpoint: "https://apis-brasil.shop/apis/apicpf1spc.php",
      parameterName: "doc",
      validator: validateCPF,
    },
    {
      name: "SPC - Consulta CPF v2",
      description: "Consulta de CPF na base SPC - Versão 2",
      category: "spc",
      endpoint: "https://apis-brasil.shop/apis/apicpf2spc.php",
      parameterName: "doc",
      validator: validateCPF,
    },
  ],
  detran: [
    {
      name: "Detran - Consulta Placa",
      description: "Consulta de dados de veículo por placa",
      category: "detran",
      endpoint: "https://apis-brasil.shop/apis/apiplacabvdetran.php",
      parameterName: "placa",
      validator: validatePlate,
    },
    {
      name: "Detran - Consulta CPF",
      description: "Consulta de veículos vinculados ao CPF",
      category: "detran",
      endpoint: "https://apis-brasil.shop/apis/apicpfbvdetran.php",
      parameterName: "cpf",
      validator: validateCPF,
    },
  ],
  algar: [
    {
      name: "Algar 45M - Consulta CPF",
      description: "Consulta de CPF na base Algar com 45M registros",
      category: "algar",
      endpoint: "https://apis-brasil.shop/apis/apicpf43malgar.php",
      parameterName: "cpf",
      validator: validateCPF,
    },
    {
      name: "Algar 45M - Consulta CEP",
      description: "Consulta de CEP na base Algar",
      category: "algar",
      endpoint: "https://apis-brasil.shop/apis/apicep43malgar.php",
      parameterName: "cep",
      validator: validateCEP,
    },
    {
      name: "Algar 45M - Consulta Telefone",
      description: "Consulta de telefone na base Algar",
      category: "algar",
      endpoint: "https://apis-brasil.shop/apis/apitel43malgar.php",
      parameterName: "telefone",
      validator: validatePhone,
    },
  ],
  rais: [
    {
      name: "RAIS 35M - Consulta CPF",
      description: "Consulta de CPF na base RAIS 2019",
      category: "rais",
      endpoint: "https://apis-brasil.shop/apis/apicpf35rais2019.php",
      parameterName: "cpf",
      validator: validateCPF,
    },
    {
      name: "RAIS 35M - Consulta CNPJ",
      description: "Consulta de CNPJ na base RAIS 2019",
      category: "rais",
      endpoint: "https://apis-brasil.shop/apis/apicnpj35rais2019.php",
      parameterName: "cnpj",
      validator: validateCNPJ,
    },
  ],
  photos: [
    {
      name: "MA - Consulta Foto por CPF",
      description: "Consulta de foto 3x4 por CPF",
      category: "photos",
      endpoint: "https://apis-brasil.shop/apis/apicpffotoma.php",
      parameterName: "cpf",
      validator: validateCPF,
    },
    {
      name: "Foto Nacional - Consulta CPF",
      description: "Consulta de foto por CPF na base nacional",
      category: "photos",
      endpoint: "https://apis-brasil.shop/apis/apifotonacional.php",
      parameterName: "cpf",
      validator: validateCPF,
    },
  ],
  health: [
    {
      name: "Datasus - Consulta CPF",
      description: "Consulta de dados de saúde no Datasus",
      category: "health",
      endpoint: "https://apis-brasil.shop/apis/apicpfdatasus.php",
      parameterName: "cpf",
      validator: validateCPF,
    },
    {
      name: "Cadsus - Consulta CPF",
      description: "Consulta de dados do SUS",
      category: "health",
      endpoint: "https://apis-brasil.shop/apis/apicpfcadsus.php",
      parameterName: "cpf",
      validator: validateCPF,
    },
  ],
  telecom: [
    {
      name: "Telefone Oi",
      description: "Consulta de telefone Oi",
      category: "telecom",
      endpoint: "https://apis-brasil.shop/apis/consulta_telefone_oi.php",
      parameterName: "telefone",
      validator: validatePhone,
    },
    {
      name: "Telefone Vivo",
      description: "Consulta de telefone Vivo",
      category: "telecom",
      endpoint: "https://apis-brasil.shop/apis/api_consulta_telefone_vivo28x_.php",
      parameterName: "telefone",
      validator: validatePhone,
    },
    {
      name: "Telefone Tim",
      description: "Consulta de telefone Tim",
      category: "telecom",
      endpoint: "https://apis-brasil.shop/apis/api_telefone_tim_operadora.php",
      parameterName: "telefone",
      validator: validatePhone,
    },
    {
      name: "Telefone Claro",
      description: "Consulta de telefone Claro",
      category: "telecom",
      endpoint: "https://apis-brasil.shop/apis/api_consulta_telefone_claro.php",
      parameterName: "telefone",
      validator: validatePhone,
    },
  ],
};

/**
 * Validators
 */

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.length === 11 && /^\d+$/.test(cleaned);
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.length === 14 && /^\d+$/.test(cleaned);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 11;
}

export function validatePlate(plate: string): boolean {
  const cleaned = plate.replace(/\D/g, "").toUpperCase();
  // Brazilian plate format: 3 letters + 4 numbers or 2 letters + 3 numbers + 2 letters
  return cleaned.length === 7;
}

export function validateCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, "");
  return cleaned.length === 8;
}

/**
 * Get all available search types
 */
export function getSearchTypes() {
  return [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Telefone" },
    { value: "plate", label: "Placa de Veículo" },
    { value: "cep", label: "CEP" },
    { value: "name", label: "Nome" },
  ];
}

/**
 * Get APIs by search type
 */
export function getApisBySearchType(searchType: string): ApiConfig[] {
  const allApis = Object.values(APIs).flat();
  
  switch (searchType) {
    case "cpf":
      return allApis.filter(api => 
        api.parameterName === "cpf" || api.parameterName === "doc"
      );
    case "cnpj":
      return allApis.filter(api => api.parameterName === "cnpj");
    case "email":
      return allApis.filter(api => api.parameterName === "email");
    case "phone":
    case "telefone":
      return allApis.filter(api => 
        api.parameterName === "telefone" || api.parameterName === "ddd"
      );
    case "plate":
    case "placa":
      return allApis.filter(api => api.parameterName === "placa");
    case "cep":
      return allApis.filter(api => api.parameterName === "cep");
    case "name":
    case "nome":
      return allApis.filter(api => api.parameterName === "nome");
    default:
      return [];
  }
}

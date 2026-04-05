import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download, ChevronDown, ChevronUp, Image as ImageIcon, User, MapPin, Phone, CreditCard, FileText, Briefcase, Heart, Info, Users, Activity, ShieldCheck, Printer, Syringe, Landmark, Stethoscope, Scale, Globe, GraduationCap, Car, ShoppingCart, Zap, FileSearch, History, UserCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageDisplay } from '@/components/ImageDisplay';
import { useState, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ApiResponseProps {
  data: any;
  apiName: string;
}

export function ApiResponse({ data, apiName }: ApiResponseProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personal', 'images', 'documents', 'relationship', 'address']));

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isBase64Image = (value: any) => {
    if (typeof value !== 'string') return false;
    return value.startsWith('data:image') || 
           (value.length > 200 && /^[A-Za-z0-9+/=]+$/.test(value.substring(0, 100)));
  };

  // Helper to find all images with context (Name - Relationship)
  const findImagesWithContext = (obj: any, parentKey = '', context: any = {}): { key: string; value: string; label: string }[] => {
    let images: { key: string; value: string; label: string }[] = [];
    if (!obj || typeof obj !== 'object') return images;

    const currentContext = { ...context };
    if (obj.nome) currentContext.name = obj.nome;
    if (obj.parentesco || obj.tipoRelacao || obj.vinculo || obj.relacao) {
      currentContext.rel = obj.parentesco || obj.tipoRelacao || obj.vinculo || obj.relacao;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        images = [...images, ...findImagesWithContext(item, parentKey || `Item ${index + 1}`, currentContext)];
      });
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (isBase64Image(value) || (typeof value === 'string' && value.startsWith('http'))) {
          const parts = [];
          if (currentContext.name) parts.push(String(currentContext.name).toUpperCase());
          if (currentContext.rel) parts.push(String(currentContext.rel).toUpperCase());
          let label = parts.length > 0 ? parts.join(' - ') : key;
          images.push({ key, value: value as string, label: String(label) });
        } else if (typeof value === 'object') {
          images = [...images, ...findImagesWithContext(value, key, currentContext)];
        }
      }
    }
    return images;
  };

  const displayData = useMemo(() => {
    if (!data) return null;
    let metadata: any = { saldo: data.saldo || 'N/A', tempo: data.tempo_segundos || '0.00s' };

    const unwrap = (obj: any): any => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      if (obj.cached_at) metadata.cached_at = obj.cached_at;
      if (obj.cache !== undefined) metadata.cache = obj.cache;
      if (obj.conta) metadata.conta = obj.conta;

      const entries = Object.entries(obj);
      const containerEntry = entries.find(([k]) => ['data', 'dados', 'content', 'resultado', 'payload'].includes(k.toLowerCase()));
      // Se o container tem muitos dados (unwrapping profundo), mergulhamos
      if (entries.length <= 6 && containerEntry) return unwrap(containerEntry[1]);
      return obj;
    };

    const unwrapped = unwrap(data);
    return { ...unwrapped, _metadata: metadata };
  }, [data]);

  const isValidValue = (v: any): boolean => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') {
      const low = v.toLowerCase().trim();
      return !(low === '' || low === 'não informado' || low === '---' || low === 'não encontrado' || low === 'não' || low === 'undefined' || low === 'false');
    }
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return true;
  };

  const formatFieldName = (key: string): string => {
    const specials: Record<string, string> = {
      'cns': 'CNS', 'cpf': 'CPF', 'cnpj': 'CNPJ', 'rg': 'RG', 'uf': 'UF', 'pis': 'PIS', 'cep': 'CEP',
      'mae': 'Mãe', 'pai': 'Pai', 'nasc': 'Nascimento', 'dataNasc': 'D. Nasc.', 'social': 'Nome Social',
      'situacao': 'Situação', 'logradouro': 'Rua/Av', 'bairro': 'Bairro', 'cidade': 'Cidade', 'municipio': 'Cidade',
      'ddd': 'DDD', 'celular': 'Celular', 'email': 'E-mail', 'vinculo': 'Vínculo', 'sexo': 'Gênero'
    };
    const cleanKey = key.split(' > ').pop() || key;
    if (specials[cleanKey]) return specials[cleanKey];
    if (specials[cleanKey.toLowerCase()]) return specials[cleanKey.toLowerCase()];
    return cleanKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderValue = (v: any): string => {
    if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
    if (v === 'F' || v === 'f') return 'Feminino';
    if (v === 'M' || v === 'm') return 'Masculino';
    return String(v);
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) newExpanded.delete(sectionKey);
    else newExpanded.add(sectionKey);
    setExpandedSections(newExpanded);
  };

  const downloadAsTxt = () => {
    const buildString = (obj: any, indent = ''): string => {
      let str = '';
      if (!obj || typeof obj !== 'object') return isValidValue(obj) ? String(obj) + '\n' : '';
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_metadata' || key === 'raw' || isBase64Image(value) || !isValidValue(value)) continue;
        if (Array.isArray(value)) {
          str += `${indent}${formatFieldName(key)}:\n`;
          value.forEach((v, i) => { str += `${indent}  #${i + 1}:\n${buildString(v, indent + '    ')}`; });
        } else if (typeof value === 'object' && value !== null) {
          str += `${indent}${formatFieldName(key)}:\n${buildString(value, indent + '  ')}`;
        } else {
          str += `${indent}${formatFieldName(key)}: ${renderValue(value)}\n`;
        }
      }
      return str;
    };
    const reportContent = `=== INFOEASY 2.0 - RELATÓRIO OFICIAL ===\nAPI: ${apiName.toUpperCase()}\nDATA: ${new Date().toLocaleString('pt-BR')}\n========================================\n\n${buildString(displayData)}`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Consulta_${apiName}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderEntriesRecursive = (obj: any, depth = 0): JSX.Element | null => {
    if (!obj || typeof obj !== 'object') return null;
    const entries = Object.entries(obj).filter(([k, v]) => k !== '_metadata' && k !== 'raw' && k !== 'base64' && !isBase64Image(v) && isValidValue(v));
    if (entries.length === 0) return null;

    return (
      <div className={cn("grid gap-4", depth === 0 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 mt-3 ml-2 pl-4 border-l-2 border-slate-100")}>
        {entries.map(([key, value]) => {
          const isObj = typeof value === 'object' && value !== null;
          const isArr = Array.isArray(value);

          return (
            <div key={key} className={cn("flex flex-col gap-1 group/field pb-2 border-b border-slate-50 last:border-0", (isObj || isArr || String(value).length > 50) && "md:col-span-2 lg:col-span-2")}>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{formatFieldName(key)}</span>
                 {!isObj && !isArr && (
                   <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover/field:opacity-100" onClick={() => copyToClipboard(String(value), key)}>
                     <Copy className="h-2.5 w-2.5 text-slate-300" />
                   </Button>
                 )}
              </div>
              {!isObj && !isArr ? (
                <div className="text-[13px] font-bold text-slate-800 break-words line-clamp-3">{renderValue(value)}</div>
              ) : isArr ? (
                <div className="space-y-3 mt-2">
                  {value.map((item: any, i: number) => (
                    <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 relative pt-7">
                      <div className="absolute top-2 left-3 px-2 py-0.5 bg-slate-200 text-[8px] font-black text-slate-500 rounded-full uppercase">Registro #{i+1}</div>
                      {typeof item === 'object' ? renderEntriesRecursive(item, depth + 1) : <span className="text-xs font-bold text-slate-700">{renderValue(item)}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                renderEntriesRecursive(value, depth + 1)
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getCategoryTheme = (key: string) => {
    const k = key.toLowerCase();
    const map: Record<string, { label: string; icon: any }> = {
      'personal': { label: 'Dados de Identificação', icon: <User className="text-blue-500" /> },
      'images': { label: 'Galeria de Fotos', icon: <ImageIcon className="text-purple-500" /> },
      'vacinas': { label: 'Vacinação (SUS)', icon: <Syringe className="text-rose-500" /> },
      'beneficos': { label: 'Benefícios Sociais', icon: <Landmark className="text-amber-500" /> },
      'bolsafamilia': { label: 'Bolsa Família', icon: <Landmark className="text-orange-500" /> },
      'enderecos': { label: 'Localização / Endereços', icon: <MapPin className="text-red-500" /> },
      'parentes': { label: 'Vínculos Familiares', icon: <Users className="text-pink-500" /> },
      'filiacao': { label: 'Dados de Filiação', icon: <Users className="text-indigo-500" /> },
      'certidoes': { label: 'Cartório / Registros Civil', icon: <FileText className="text-slate-500" /> },
      'documents': { label: 'Documentação Oficial', icon: <ShieldCheck className="text-emerald-500" /> },
      'cedulas': { label: 'Histórico de Cédulas (RG)', icon: <IdCard className="text-cyan-500" /> },
      'situacaocadastral': { label: 'Situação na RFB', icon: <UserCheck className="text-blue-600" /> },
      'contatos': { label: 'Canais de Contato', icon: <Phone className="text-green-500" /> },
      'trabalho': { label: 'Vida Profissional', icon: <Briefcase className="text-slate-700" /> },
      'saude': { label: 'Saúde e Assistência', icon: <Heart className="text-rose-400" /> },
      'processos': { label: 'Processos Judiciais', icon: <Scale className="text-slate-900" /> },
      'escolaridade': { label: 'Educação / Escolas', icon: <GraduationCap className="text-blue-400" /> },
      'veiculos': { label: 'Veículos / Trânsito', icon: <Car className="text-slate-600" /> },
      'internet': { label: 'Presença Digital', icon: <Globe className="text-sky-500" /> },
      'consumo': { label: 'Perfil de Consumo', icon: <ShoppingCart className="text-orange-400" /> },
      'energia': { label: 'Contas de Energia', icon: <Zap className="text-yellow-500" /> },
      'antecedentes': { label: 'Antecedentes Criminais', icon: <AlertTriangle className="text-red-700" /> },
      'mandados': { label: 'Mandados de Prisão', icon: <AlertTriangle className="text-red-900" /> },
      'historico': { label: 'Histórico Registrado', icon: <History className="text-slate-400" /> },
      'busca': { label: 'Registros de Busca', icon: <FileSearch className="text-slate-500" /> }
    };

    // Smart lookup by keyword
    for (const [keyWord, theme] of Object.entries(map)) {
      if (k.includes(keyWord)) return theme;
    }
    return null;
  };

  const catData = useMemo(() => {
    if (!displayData) return [];
    const categories: Record<string, { label: string; icon: any; data: any }> = {
      images: { label: 'Galeria de Fotos', icon: <ImageIcon className="h-5 w-5 text-purple-500" />, data: [] },
      personal: { label: 'Identificação Principal', icon: <User className="h-5 w-5 text-blue-500" />, data: {} }
    };

    categories.images.data = findImagesWithContext(displayData);

    const process = (obj: any) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (key === '_metadata' || key === 'raw' || isBase64Image(value) || !isValidValue(value)) return;
        
        const theme = getCategoryTheme(key);
        if (theme) {
          const catId = key.toLowerCase();
          if (!categories[catId]) {
            categories[catId] = { label: theme.label, icon: theme.icon, data: {} };
          }
          categories[catId].data[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          // Se for um objeto sem categoria óbvia, mergulhamos
          process(value);
        } else {
          // Se for um dado solto, vai para Identificação se não tiver categoria
          categories.personal.data[key] = value;
        }
      });
    };

    process(displayData);

    // Clean empty categories and sort
    return Object.entries(categories)
      .filter(([_, c]) => (Array.isArray(c.data) ? c.data.length > 0 : Object.keys(c.data).length > 0))
      .sort((a, b) => {
        const order = ['images', 'personal', 'dadosbasicos', 'situacaocadastral', 'filiacao', 'enderecos', 'parentesnovos', 'contatos'];
        const ax = order.indexOf(a[0]);
        const bx = order.indexOf(b[0]);
        return (ax === -1 ? 99 : ax) - (bx === -1 ? 99 : bx);
      });
  }, [displayData]);

  if (!displayData) return null;

  return (
    <Card className="mt-8 border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <CardHeader className="p-8 md:p-10 bg-slate-50/50 border-b border-slate-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Relatório Consolidado</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className="bg-blue-600 text-white border-none rounded-md font-bold text-[9px] px-2 py-0.5">{apiName}</Badge>
                {displayData._metadata?.cached_at && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{displayData._metadata.cached_at}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadAsTxt} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl gap-2">
              <Download className="h-4 w-4" /> Relatório TXT
            </Button>
            <Button variant="ghost" onClick={() => window.print()} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 md:p-10 space-y-10">
        {catData.map(([ck, cat]) => (
          <Collapsible key={ck} open={expandedSections.has(ck)} onOpenChange={() => toggleSection(ck)} className="group/section">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer py-2 group-hover/section:translate-x-1 transition-transform">
                <div className="flex items-center gap-4">
                   <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover/section:bg-white group-hover/section:shadow-sm transition-all">
                     {cat.icon}
                   </div>
                   <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">{cat.label}</h3>
                </div>
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100", expandedSections.has(ck) && "bg-blue-50 border-blue-100")}>
                  {expandedSections.has(ck) ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4 px-2">
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                {ck === 'images' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {cat.data.map((img: any, i: number) => (
                      <div key={i} className="group/img space-y-3">
                        <div className="aspect-[3/4] relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm transition-all duration-500 group-hover/img:shadow-md group-hover/img:-translate-y-1">
                          <ImageDisplay imageData={isBase64Image(img.value) ? img.value : undefined} imageUrl={img.value.startsWith('http') ? img.value : undefined} name={img.label} />
                        </div>
                        <div className="text-[9px] text-center font-bold text-slate-500 uppercase tracking-tighter truncate px-1">
                          {img.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderEntriesRecursive(cat.data)
                )}
              </div>
            </CollapsibleContent>
            <div className="h-px bg-slate-50 mt-10 w-full last:hidden" />
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}

function IdCard(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 10h2" />
      <path d="M16 14h2" />
      <rect width="18" height="14" x="3" y="5" rx="2" />
      <path d="M7 15h.01" />
      <path d="M11 15h2" />
      <path d="M8 11h2" />
    </svg>
  )
}

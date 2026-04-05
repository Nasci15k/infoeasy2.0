import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download, ChevronDown, ChevronUp, Image as ImageIcon, User, MapPin, Phone, CreditCard, FileText, Briefcase, Heart, Info, Users, Activity, ShieldCheck, Printer, Syringe, Landmark, Stethoscope } from 'lucide-react';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['images', 'personal', 'documents', 'relationship', 'address', 'contact', 'health', 'financial']));

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

  // Improved context discovery for gallery labels (Name - Relationship)
  const findImagesWithContext = (obj: any, parentKey = '', context: any = {}): { key: string; value: string; label: string }[] => {
    let images: { key: string; value: string; label: string }[] = [];
    if (!obj || typeof obj !== 'object') return images;

    const currentContext = { ...context };
    if (obj.nome) currentContext.name = obj.nome;
    if (obj.parentesco || obj.tipoRelacao || obj.vinculo || obj.relacao) {
      currentContext.rel = obj.parentesco || obj.tipoRelacao || obj.vinculo || obj.relacao;
    }
    if (obj.tipo && String(obj.tipo).length < 20) currentContext.type = obj.tipo;

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
          
          let label = parts.length > 0 ? parts.join(' - ') : (currentContext.type || key);
          if (label === key && (key.toLowerCase() === 'base64' || key.toLowerCase() === 'data')) {
            label = parentKey || 'Imagem';
          }
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
    let metadata: any = { saldo: data.saldo || 'N/A', tempo: data.tempo_segundos || '0s' };

    const unwrap = (obj: any): any => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      if (obj.cached_at) metadata.cached_at = obj.cached_at;
      if (obj.cache !== undefined) metadata.cache = obj.cache;
      if (obj.conta) metadata.conta = obj.conta;

      const entries = Object.entries(obj);
      const containerEntry = entries.find(([k]) => ['data', 'dados', 'content', 'resultado', 'payload'].includes(k.toLowerCase()));
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
      if (low === '' || low === 'não informado' || low === '---' || low === 'não encontrado' || low === 'não' || low === 'undefined') return false;
    }
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === 'object' && Object.keys(v).length === 0) return false;
    return true;
  };

  const formatFieldName = (key: string): string => {
    const specials: Record<string, string> = {
      'cns': 'CNS', 'cpf': 'CPF', 'cnpj': 'CNPJ', 'rg': 'RG', 'uf': 'UF', 'pis': 'PIS', 'cep': 'CEP',
      'mae': 'Mãe', 'pai': 'Pai', 'nasc': 'Nascimento', 'dataNasc': 'D. Nasc.', 'social': 'Nome Social',
      'situacao': 'Status', 'logradouro': 'Endereço', 'cidade': 'Cidade', 'municipio': 'Cidade',
      'telefone': 'Telefone', 'ddd': 'DDD', 'celular': 'Celular', 'email': 'E-mail',
      'parentesco': 'Parentesco', 'vinculo': 'Vínculo', 'relacao': 'Relação', 'sexo': 'Gênero'
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
    if (v === 'F') return 'Feminino';
    if (v === 'M') return 'Masculino';
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
          value.forEach((v, i) => { str += `${indent}  [${i + 1}]:\n${buildString(v, indent + '    ')}`; });
        } else if (typeof value === 'object' && value !== null) {
          str += `${indent}${formatFieldName(key)}:\n${buildString(value, indent + '  ')}`;
        } else {
          str += `${indent}${formatFieldName(key)}: ${renderValue(value)}\n`;
        }
      }
      return str;
    };
    const reportContent = `=== INFOEASY 2.0 - CONSULTA EXECUTIVA ===\nAPI: ${apiName.toUpperCase()}\nDATA: ${new Date().toLocaleString('pt-BR')}\n==========================================\n\n${buildString(displayData)}`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_${apiName}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Relatório Baixado' });
  };

  const renderEntriesRecursive = (obj: any, depth = 0): JSX.Element | null => {
    if (!obj || typeof obj !== 'object') return null;

    const entries = Object.entries(obj).filter(([k, v]) => k !== '_metadata' && k !== 'raw' && k !== 'base64' && !isBase64Image(v) && isValidValue(v));
    if (entries.length === 0) return null;

    return (
      <div className={cn("grid gap-4", depth === 0 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 mt-2 ml-4 pl-4 border-l-2 border-primary/10")}>
        {entries.map(([key, value]) => {
          const isObj = typeof value === 'object' && value !== null;
          const isArr = Array.isArray(value);

          return (
            <div key={key} className={cn("flex flex-col gap-1 group/field pb-2 border-b border-white/5", (isObj || isArr || String(value).length > 60) && "md:col-span-2 lg:col-span-2")}>
              <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{formatFieldName(key)}</span>
                 {!isObj && !isArr && (
                   <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover/field:opacity-100 transition-opacity" onClick={() => copyToClipboard(String(value), key)}>
                     <Copy className="h-2.5 w-2.5" />
                   </Button>
                 )}
              </div>
              
              {!isObj && !isArr ? (
                <div className="text-sm font-bold text-foreground/90 break-words line-clamp-3">{renderValue(value)}</div>
              ) : isArr ? (
                <div className="space-y-3 mt-1">
                  {value.map((item: any, i: number) => (
                    <div key={i} className="bg-white/[0.03] p-3 rounded-2xl border border-white/5 shadow-inner relative pt-6">
                      <div className="absolute top-2 left-3 px-2 py-0.5 bg-primary/20 text-[7px] font-black text-primary rounded-full uppercase tracking-tighter">Item {i+1}</div>
                      {typeof item === 'object' ? renderEntriesRecursive(item, depth + 1) : <span className="text-xs font-bold">{renderValue(item)}</span>}
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

  const categorizeSmart = (obj: any) => {
    const categories: Record<string, { label: string; icon: any; data: any }> = {
      images: { label: 'Galeria de Fotos', icon: <ImageIcon className="h-5 w-5 text-purple-400" />, data: [] },
      personal: { label: 'Identidade e Dados Pessoais', icon: <User className="h-5 w-5 text-blue-400" />, data: {} },
      documents: { label: 'Documentação / Identificação', icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />, data: {} },
      address: { label: 'Localização / Endereços', icon: <MapPin className="h-5 w-5 text-red-400" />, data: {} },
      relationship: { label: 'Parentesco e Filição', icon: <Users className="h-5 w-5 text-pink-400" />, data: {} },
      contact: { label: 'Contatos / Canais', icon: <Phone className="h-5 w-5 text-green-400" />, data: {} },
      health: { label: 'Saúde / Vacinação / SUS', icon: <Syringe className="h-5 w-5 text-rose-400" />, data: {} },
      financial: { label: 'Finanças / Benefícios / Renda', icon: <Landmark className="h-5 w-5 text-orange-400" />, data: {} },
      work: { label: 'Vida Profissional / CTPS', icon: <Briefcase className="h-5 w-5 text-slate-400" />, data: {} },
      other: { label: 'Outros Registros Identificados', icon: <Info className="h-5 w-5 text-sky-400" />, data: {} },
    };

    if (!obj || typeof obj !== 'object') return [];

    categories.images.data = findImagesWithContext(obj);

    const processRecursive = (current: any) => {
      Object.entries(current).forEach(([key, value]) => {
        if (key === '_metadata' || key === 'raw' || isBase64Image(value) || !isValidValue(value)) return;
        
        const k = key.toLowerCase();
        let cat = 'other';

        if (['nome', 'nasc', 'idade', 'sexo', 'natural', 'nacio', 'genero', 'civil', 'obito', 'social', 'raca', 'etnia'].some(t => k.includes(t))) cat = 'personal';
        else if (['cpf', 'cnpj', 'rg', 'cnh', 'titul', 'pis', 'ctps', 'passa', 'docum', 'identi', 'cns', 'cedula', 'protocolo'].some(t => k.includes(t))) cat = 'documents';
        else if (['enderc', 'addres', 'rua', 'bairr', 'cidad', 'estad', 'cep', 'uf', 'logra', 'municip', 'residenc'].some(t => k.includes(t))) cat = 'address';
        else if (['telef', 'phone', 'celul', 'email', 'whats', 'contat', 'tel', 'fone', 'ddd', 'numero'].some(t => k.includes(t))) cat = 'contact';
        else if (['renda', 'salar', 'scor', 'credit', 'divid', 'valor', 'financ', 'banc', 'pagam', 'auxil', 'benefic', 'venciment'].some(t => k.includes(t))) cat = 'financial';
        else if (['parent', 'vincul', 'mae', 'pai', 'irmao', 'filho', 'conju', 'filiac', 'relac'].some(t => k.includes(t))) cat = 'relationship';
        else if (['empres', 'trabal', 'empreg', 'carg', 'func', 'admis', 'meis', 'escola', 'facul', 'univer', 'curric'].some(t => k.includes(t))) cat = 'work';
        else if (['saude', 'medic', 'hospit', 'unimed', 'vacin', 'inss', 'loas', 'dose', 'lote', 'aplic', 'stetho', 'prontuario'].some(t => k.includes(t))) cat = 'health';

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
           // Se o objeto pai já é o dado real (ex: Enderecos), processamos os filhos mas mantemos a estrutura
           categories[cat].data[key] = value;
        } else {
          categories[cat].data[key] = value;
        }
      });
    };

    processRecursive(obj);

    // Prioridade de exibição para Dados Pessoais e Imagens
    const order = ['images', 'personal', 'documents', 'address', 'relationship', 'contact', 'health', 'financial', 'work', 'other'];
    return Object.entries(categories)
      .filter(([_, c]) => (Array.isArray(c.data) ? c.data.length > 0 : Object.keys(c.data).length > 0))
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  };

  const catData = useMemo(() => categorizeSmart(displayData), [displayData]);
  if (!displayData) return null;

  return (
    <Card className="mt-8 border-none bg-[#0a0a0b]/80 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,1)] ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-500 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 md:p-12 bg-gradient-to-br from-primary/20 via-transparent to-transparent border-b border-white/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.3)] relative">
              <ShieldCheck className="h-10 w-10 text-primary" />
              <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-[#0a0a0b]">
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight text-white mb-2 uppercase">Relatório Master</h2>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                  {apiName}
                </Badge>
                {displayData._metadata?.cached_at && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 uppercase tracking-widest">
                    <Activity className="h-3 w-3 text-emerald-400" /> {displayData._metadata.cached_at}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={downloadAsTxt} className="flex-1 md:flex-none h-12 px-6 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-[11px] uppercase tracking-widest gap-2 transition-all active:scale-95 shadow-xl">
              <Download className="h-4 w-4" /> Relatório Executivo
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="h-12 w-12 md:w-auto md:px-6 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 font-black text-[11px] uppercase tracking-widest gap-2 transition-all">
              <Printer className="h-4 w-4" /> <span className="hidden md:inline">Imprimir</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 md:p-12 space-y-12">
        {catData.map(([ck, cat]) => (
          <Collapsible key={ck} open={expandedSections.has(ck)} onOpenChange={() => toggleSection(ck)} className="group/section space-y-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer group-hover/section:translate-x-1 transition-transform">
                <div className="flex items-center gap-4">
                   <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover/section:bg-primary/20 group-hover/section:border-primary/30 transition-all">
                     {cat.icon}
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-white/90 uppercase tracking-widest">{cat.label}</h3>
                     <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Mapeamento Completo</span>
                   </div>
                </div>
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 transition-all", expandedSections.has(ck) && "bg-primary/10 border-primary/20")}>
                  {expandedSections.has(ck) ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-white/30" />}
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-2">
              <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                {ck === 'images' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                    {cat.data.map((img: any, i: number) => (
                      <div key={i} className="group/img space-y-4 animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="aspect-[3/4] relative rounded-[1.5rem] overflow-hidden border border-white/10 bg-black shadow-2xl transition-all duration-700 group-hover/img:scale-105 group-hover/img:ring-4 ring-primary/20 group-hover/img:border-primary/40">
                          <ImageDisplay imageData={isBase64Image(img.value) ? img.value : undefined} imageUrl={img.value.startsWith('http') ? img.value : undefined} name={img.label} />
                        </div>
                        <div className="text-[10px] text-center font-black text-white/40 uppercase tracking-tighter bg-white/5 py-2 px-3 rounded-xl border border-white/5 group-hover/img:text-primary transition-colors">
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
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}

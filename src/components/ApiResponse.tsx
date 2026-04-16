import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download, ChevronDown, ChevronUp, Image as ImageIcon, User, MapPin, Phone, CreditCard, FileText, Briefcase, Heart, Info, Users, Activity, ShieldCheck, Printer, Syringe, Landmark, Stethoscope, Scale, Globe, GraduationCap, Car, ShoppingCart, Zap, FileSearch, History, UserCheck, AlertTriangle, Fingerprint, FileBadge, Cpu, Scan, LayoutGrid, FileDown } from 'lucide-react';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['IDENTIFICAÇÃO PRINCIPAL', 'GALERIA DE FOTOS', 'DOCUMENTAÇÃO OFICIAL', 'LOCALIZAÇÃO / ENDEREÇOS', 'DIVERSOS / CONSULTA']));

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: 'Copiado!', description: `${field} copiado com sucesso.`, duration: 2000 });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isBase64Image = (value: any) => {
    if (typeof value !== 'string') return false;
    return value.startsWith('data:image') || (value.length > 200 && /^[A-Za-z0-9+/=]+$/.test(value.substring(0, 100)));
  };

  const findImagesWithContext = (obj: any, context: any = {}): { key: string; value: string; label: string }[] => {
    let images: { key: string; value: string; label: string }[] = [];
    if (!obj || typeof obj !== 'object') return images;

    const currentContext = { ...context };
    if (obj.nome) currentContext.name = obj.nome;
    if (obj.parentesco || obj.tipoRelacao || obj.vinculo || obj.relacao) {
      currentContext.rel = obj.parentesco || obj.tipoRelacao || obj.vinculo || obj.relacao;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item) => images = [...images, ...findImagesWithContext(item, currentContext)]);
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (isBase64Image(value) || (typeof value === 'string' && value.startsWith('http'))) {
          const parts = [];
          if (currentContext.name) parts.push(String(currentContext.name).toUpperCase());
          if (currentContext.rel) parts.push(String(currentContext.rel).toUpperCase());
          let label = parts.length > 0 ? parts.join(' - ') : key;
          images.push({ key, value: String(value), label: String(label) });
        } else if (typeof value === 'object') {
          images = [...images, ...findImagesWithContext(value, currentContext)];
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
      const entries = Object.entries(obj);
      const containerEntry = entries.find(([k]) => ['data', 'dados', 'content', 'resultado', 'payload'].includes(k.toLowerCase()));
      if (entries.length <= 8 && containerEntry) return unwrap(containerEntry[1]);
      return obj;
    };

    const unwrapped = unwrap(data);
    return { ...unwrapped, _metadata: metadata };
  }, [data]);

  const isValidValue = (v: any): boolean => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') {
      const low = v.toLowerCase().trim();
      return !(low === '' || low === 'undefined' || low === 'null');
    }
    return true;
  };

  const formatFieldName = (key: string): string => {
    const specials: Record<string, string> = {
      'cns': 'CNS', 'cpf': 'CPF', 'cnpj': 'CNPJ', 'rg': 'RG', 'uf': 'UF', 'pis': 'PIS', 'cep': 'CEP',
      'mae': 'Mãe', 'pai': 'Pai', 'nasc': 'Nascimento', 'social': 'Nome Social', 'ddd': 'DDD', 'vinculo': 'Vínculo',
      'sexo': 'Sexo', 'logradouro': 'Endereço', 'obito': 'Óbito', 'situacao': 'Situação', 'restricao': 'Restrição',
      'nacionalidade': 'Nacionalidade', 'naturalidade': 'Naturalidade', 'idade': 'Idade', 'profissao': 'Profissão'
    };
    const cleanKey = key.split(' > ').pop() || key;
    if (specials[cleanKey.toLowerCase()]) return specials[cleanKey.toLowerCase()];
    return cleanKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderValue = (v: any): string => {
    if (typeof v === 'boolean') return v ? 'SIM' : 'NÃO';
    if (v === 'F' || v === 'f') return 'FEMININO';
    if (v === 'M' || v === 'm') return 'MASCULINO';
    if (!isValidValue(v) || String(v).toLowerCase().trim() === 'nan') return 'NÃO CONSTA / SEM REGISTRO';
    return String(v).toUpperCase();
  };

  const toggleSection = (sectionLabel: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionLabel)) newExpanded.delete(sectionLabel);
    else newExpanded.add(sectionLabel);
    setExpandedSections(newExpanded);
  };

  const getCategoryTheme = (key: string) => {
    const k = key.toLowerCase();
    const themes: Record<string, { label: string; icon: any; color: string }> = {
      'images': { label: 'GALERIA DE FOTOS', icon: <ImageIcon className="h-5 w-5" />, color: 'text-blue-600' },
      'personal': { label: 'IDENTIFICAÇÃO PRINCIPAL', icon: <User className="h-5 w-5" />, color: 'text-blue-600' },
      'vacina': { label: 'SAÚDE E VACINAÇÃO', icon: <Syringe className="h-5 w-5" />, color: 'text-rose-600' },
      'financeir': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="h-5 w-5" />, color: 'text-emerald-600' },
      'renda': { label: 'RENDA E PATRIMÔNIO', icon: <CreditCard className="h-5 w-5" />, color: 'text-blue-600' },
      'rfb': { label: 'SITUAÇÃO NA RECEITA FEDERAL', icon: <UserCheck className="h-5 w-5" />, color: 'text-indigo-600' },
      'ender': { label: 'LOCALIZAÇÃO / ENDEREÇOS', icon: <MapPin className="h-5 w-5" />, color: 'text-rose-600' },
      'contat': { label: 'CANAIS DE CONTATO', icon: <Phone className="h-5 w-5" />, color: 'text-emerald-600' },
      'empresa': { label: 'PARTICIPAÇÕES SOCIETÁRIAS', icon: <Users className="h-5 w-5" />, color: 'text-blue-600' },
      'processo': { label: 'DIREITO E PROCESSOS', icon: <Scale className="h-5 w-5" />, color: 'text-slate-600' },
      'veicul': { label: 'VEÍCULOS E TRÂNSITO', icon: <Car className="h-5 w-5" />, color: 'text-amber-600' }
    };
    for (const [keyWord, theme] of Object.entries(themes)) {
      if (k.includes(keyWord)) return theme;
    }
    return { label: 'DIVERSOS / CONSULTA', icon: <Activity className="h-5 w-5" />, color: 'text-blue-600' };
  };

  const catData = useMemo(() => {
    if (!displayData) return [];
    const categories: Record<string, { label: string; icon: any; color: string; data: any }> = {};
    const images = findImagesWithContext(displayData);
    if (images.length > 0) {
      categories['GALERIA DE FOTOS'] = { label: 'GALERIA DE FOTOS', icon: <ImageIcon className="h-5 w-5" />, color: 'text-blue-600', data: { _images: images } };
    }
    Object.entries(displayData).forEach(([key, value]) => {
      if (key === '_metadata' || key === 'raw' || isBase64Image(value)) return;
      const theme = getCategoryTheme(key);
      const label = theme.label;
      if (!categories[label]) categories[label] = { label, icon: theme.icon, color: theme.color, data: {} };
      categories[label].data[key] = value;
    });
    return Object.entries(categories).sort((a,b) => a[0].localeCompare(b[0]));
  }, [displayData]);

  const renderRecursive = (obj: any, depth = 0): JSX.Element | null => {
    if (!obj || typeof obj !== 'object') return null;
    const entries = Object.entries(obj).filter(([k, v]) => k !== '_images' && !isBase64Image(v));
    if (entries.length === 0) return null;

    return (
      <div className={cn("grid gap-4 w-full", depth === 0 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 border-l-2 border-slate-100 ml-2 pl-4 mt-4")}>
        {entries.map(([key, value]) => {
          const isObj = typeof value === 'object' && value !== null;
          const isArr = Array.isArray(value);

          return (
            <div key={key} className={cn("group/field flex flex-col p-5 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-blue-200 transition-all shadow-sm", (isObj || isArr || String(value).length > 25) && "sm:col-span-2")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatFieldName(key)}</span>
                {!isObj && !isArr && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/field:opacity-100 hover:bg-blue-50 transition-all" onClick={() => copyToClipboard(String(value), key)}>
                    <Copy className="h-3 w-3 text-blue-600" />
                  </Button>
                )}
              </div>
              <div className="flex-1 w-full">
                {!isObj && !isArr ? (
                  <span className="text-[13px] font-black text-slate-900 break-words leading-tight">{renderValue(value)}</span>
                ) : isArr ? (
                  <div className="space-y-4 mt-2">
                    {value.map((item: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 relative">
                        <Badge variant="outline" className="text-[9px] mb-3 border-slate-200 text-slate-400 font-black uppercase">Item #{i + 1}</Badge>
                        {typeof item === 'object' ? renderRecursive(item, depth + 1) : <span className="text-[13px] font-black text-blue-600">{renderValue(item)}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  renderRecursive(value, depth + 1)
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const downloadAsTxt = () => {
    const build = (obj: any, indent = ''): string => {
      let str = '';
      if (!obj || typeof obj !== 'object') return isValidValue(obj) ? String(obj) : 'SEM REGISTRO';
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_metadata' || isBase64Image(value)) continue;
        if (Array.isArray(value)) {
          str += `${indent}${formatFieldName(key).toUpperCase()}:\n`;
          value.forEach((v, i) => { str += `${indent}  [#${i + 1}]:\n${build(v, indent + '    ')}\n`; });
        } else if (typeof value === 'object' && value !== null) {
          str += `${indent}${formatFieldName(key).toUpperCase()}:\n${build(value, indent + '  ')}\n`;
        } else {
          str += `${indent}${formatFieldName(key)}: ${renderValue(value)}\n`;
        }
      }
      return str;
    };
    const report = `INFOEASY 2.0 - DOSSIE DE INTELIGENCIA\nIDENTIFICADOR: ${apiName.toUpperCase()}\nDATA EMISSAO: ${new Date().toLocaleString()}\n============================================\n\n${build(displayData)}`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `InfoEasy_Relatorio_${Date.now()}.txt`; a.click();
  };

  if (!displayData) return null;

  return (
    <Card id="relatorio-master" className="mt-8 bg-white border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <CardHeader className="p-10 md:p-14 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="h-20 w-20 rounded-[2rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20 relative group">
               <Scan className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-50 text-blue-600 border-blue-100 py-0.5 px-3 text-[10px] font-black uppercase tracking-widest">{apiName}</Badge>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Dossiê de <span className="text-blue-600">Busca</span></h2>
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Ref: #{Math.random().toString(36).substring(7).toUpperCase()}</span>
                <span>•</span>
                <span>Data: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button onClick={downloadAsTxt} className="h-14 flex-1 md:flex-none px-8 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest gap-3 transition-all border border-slate-200">
              <FileDown className="h-5 w-5 text-blue-600" /> DOWNLOAD TXT
            </Button>
            <Button variant="ghost" onClick={() => window.print()} className="h-14 w-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200">
              <Printer className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-10 md:p-14 space-y-12">
        {catData.map(([label, cat]) => (
          <Collapsible key={label} open={expandedSections.has(label)} onOpenChange={() => toggleSection(label)} className="group">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer border-b border-slate-100 pb-8 hover:border-blue-300 transition-all">
                <div className="flex items-center gap-6">
                  <div className={cn("p-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 group-hover:bg-blue-50 transition-all", cat.color)}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{cat.label}</h3>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{Object.keys(cat.data).length} REGISTROS DISPONÍVEIS</span>
                  </div>
                </div>
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 transition-all", expandedSections.has(label) && "bg-blue-600 border-blue-600")}>
                  {expandedSections.has(label) ? <ChevronUp className="h-6 w-6 text-white" /> : <ChevronDown className="h-6 w-6 text-slate-400" />}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-10 animate-in slide-in-from-top-4 duration-500">
              {label === 'GALERIA DE FOTOS' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                  {cat.data._images.map((img: any, i: number) => (
                    <div key={i} className="group/img space-y-4">
                      <div className="aspect-[3/4] relative rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-100 transition-all duration-700 group-hover/img:scale-105 group-hover/img:ring-4 ring-blue-100">
                        <ImageDisplay imageData={img.value} name={img.label} />
                      </div>
                      <div className="text-[10px] text-center font-black text-slate-400 uppercase leading-tight px-1 group-hover/img:text-blue-600 transition-colors">
                        {img.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                renderRecursive(cat.data)
              )}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
      
      <div className="p-10 bg-slate-50 text-center border-t border-slate-100">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">System generated dars &bull; infoeasy intelligence</p>
      </div>
    </Card>
  );
}

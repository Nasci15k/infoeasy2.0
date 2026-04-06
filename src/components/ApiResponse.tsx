import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download, ChevronDown, ChevronUp, Image as ImageIcon, User, MapPin, Phone, CreditCard, FileText, Briefcase, Heart, Info, Users, Activity, ShieldCheck, Printer, Syringe, Landmark, Stethoscope, Scale, Globe, GraduationCap, Car, ShoppingCart, Zap, FileSearch, History, UserCheck, AlertTriangle, Fingerprint, FileBadge } from 'lucide-react';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['IDENTIFICAÇÃO PRINCIPAL', 'GALERIA DE FOTOS', 'DOCUMENTAÇÃO OFICIAL', 'LOCALIZAÇÃO / ENDEREÇOS']));

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
      if (obj.cache !== undefined) metadata.cache = obj.cache;
      if (obj.conta) metadata.conta = obj.conta;

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
      return !(low === '' || low === 'undefined');
    }
    if (Array.isArray(v)) return true;
    return true;
  };

  const formatFieldName = (key: string): string => {
    const specials: Record<string, string> = {
      'cns': 'CNS', 'cpf': 'CPF', 'cnpj': 'CNPJ', 'rg': 'RG', 'uf': 'UF', 'pis': 'PIS', 'cep': 'CEP',
      'mae': 'Mãe', 'pai': 'Pai', 'nasc': 'Nascimento', 'social': 'Nome Social', 'ddd': 'DDD', 'vinculo': 'Vínculo',
      'sexo': 'Sexo', 'logradouro': 'Endereço', 'obito': 'Óbito', 'situacao': 'Situação', 'restricao': 'Restrição Judicial',
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
    if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
    if (v === 'F' || v === 'f') return 'Feminino';
    if (v === 'M' || v === 'm') return 'Masculino';
    if (!v || String(v).toLowerCase().trim() === 'nan' || String(v).toLowerCase().trim() === 'null' || String(v).toLowerCase().trim() === 'não informado') return 'Sem / Não Encontrado';
    return String(v);
  };

  const toggleSection = (sectionLabel: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionLabel)) newExpanded.delete(sectionLabel);
    else newExpanded.add(sectionLabel);
    setExpandedSections(newExpanded);
  };

  const getCategoryTheme = (key: string) => {
    const k = key.toLowerCase();
    const themes: Record<string, { label: string; icon: any }> = {
      'images': { label: 'GALERIA DE FOTOS', icon: <ImageIcon className="text-purple-600" /> },
      'personal': { label: 'IDENTIFICAÇÃO PRINCIPAL', icon: <User className="text-blue-700" /> },
      'identificacao': { label: 'IDENTIFICAÇÃO PRINCIPAL', icon: <User className="text-blue-700" /> },
      'basicos': { label: 'IDENTIFICAÇÃO PRINCIPAL', icon: <User className="text-blue-700" /> },
      'vacina': { label: 'SAÚDE E VACINAÇÃO', icon: <Syringe className="text-rose-600" /> },
      'saude': { label: 'SAÚDE E ASSISTÊNCIA', icon: <Heart className="text-red-500" /> },
      'doenca': { label: 'SAÚDE E ASSISTÊNCIA', icon: <Heart className="text-red-500" /> },
      'deficiencia': { label: 'SAÚDE E ASSISTÊNCIA', icon: <Heart className="text-red-500" /> },
      'prontuario': { label: 'SAÚDE E ASSISTÊNCIA', icon: <Heart className="text-red-500" /> },
      'benefic': { label: 'BENEFÍCIOS SOCIAIS', icon: <Landmark className="text-amber-600" /> },
      'financeir': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'banco': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'cartao': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'pix': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'cheque': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'conta': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'divida': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'bacen': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'emprestim': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'fgts': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'previdenc': { label: 'FINANÇAS E BANCÁRIO', icon: <Landmark className="text-emerald-700" /> },
      'renda': { label: 'RENDA E PATRIMÔNIO', icon: <CreditCard className="text-slate-700" /> },
      'salario': { label: 'RENDA E PATRIMÔNIO', icon: <CreditCard className="text-slate-700" /> },
      'aquisicao': { label: 'RENDA E PATRIMÔNIO', icon: <CreditCard className="text-slate-700" /> },
      'irpf': { label: 'RENDA E PATRIMÔNIO', icon: <CreditCard className="text-slate-700" /> },
      'poder_aquisitivo': { label: 'RENDA E PATRIMÔNIO', icon: <CreditCard className="text-slate-700" /> },
      'imoveis': { label: 'RENDA E PATRIMÔNIO', icon: <CreditCard className="text-slate-700" /> },
      'receita': { label: 'SITUAÇÃO NA RECEITA FEDERAL', icon: <UserCheck className="text-indigo-600" /> },
      'ender': { label: 'LOCALIZAÇÃO / ENDEREÇOS', icon: <MapPin className="text-red-600" /> },
      'localizac': { label: 'LOCALIZAÇÃO / ENDEREÇOS', icon: <MapPin className="text-red-600" /> },
      'residente': { label: 'LOCALIZAÇÃO / ENDEREÇOS', icon: <MapPin className="text-red-600" /> },
      'parent': { label: 'VÍNCULOS FAMILIARES', icon: <Users className="text-pink-600" /> },
      'filiacao': { label: 'VÍNCULOS FAMILIARES', icon: <Users className="text-pink-600" /> },
      'certida': { label: 'CARTÓRIO E REGISTRO CIVIL', icon: <FileText className="text-slate-600" /> },
      'cartorio': { label: 'CARTÓRIO E REGISTRO CIVIL', icon: <FileText className="text-slate-600" /> },
      'document': { label: 'DOCUMENTAÇÃO OFICIAL', icon: <ShieldCheck className="text-blue-600" /> },
      'cnh': { label: 'DOCUMENTAÇÃO OFICIAL', icon: <ShieldCheck className="text-blue-600" /> },
      'habilitacao': { label: 'DOCUMENTAÇÃO OFICIAL', icon: <ShieldCheck className="text-blue-600" /> },
      'ctps': { label: 'DOCUMENTAÇÃO OFICIAL', icon: <ShieldCheck className="text-blue-600" /> },
      'titulo': { label: 'DOCUMENTAÇÃO OFICIAL', icon: <ShieldCheck className="text-blue-600" /> },
      'alistamento': { label: 'DOCUMENTAÇÃO OFICIAL', icon: <ShieldCheck className="text-blue-600" /> },
      'cedula': { label: 'HISTÓRICO DE CÉDULAS (RG)', icon: <FileBadge className="text-cyan-600" /> },
      'rfb': { label: 'SITUAÇÃO NA RECEITA FEDERAL', icon: <UserCheck className="text-indigo-600" /> },
      'contat': { label: 'CANAIS DE CONTATO', icon: <Phone className="text-emerald-600" /> },
      'email': { label: 'CANAIS DE CONTATO', icon: <Phone className="text-emerald-600" /> },
      'telefone': { label: 'CANAIS DE CONTATO', icon: <Phone className="text-emerald-600" /> },
      'trabalh': { label: 'HISTÓRICO PROFISSIONAL', icon: <Briefcase className="text-slate-800" /> },
      'empreg': { label: 'HISTÓRICO PROFISSIONAL', icon: <Briefcase className="text-slate-800" /> },
      'colegas': { label: 'HISTÓRICO PROFISSIONAL', icon: <Briefcase className="text-slate-800" /> },
      'curriculo': { label: 'HISTÓRICO PROFISSIONAL', icon: <Briefcase className="text-slate-800" /> },
      'conselho': { label: 'HISTÓRICO PROFISSIONAL', icon: <Briefcase className="text-slate-800" /> },
      'empresa': { label: 'PARTICIPAÇÕES SOCIETÁRIAS', icon: <Users className="text-blue-900" /> },
      'socio': { label: 'PARTICIPAÇÕES SOCIETÁRIAS', icon: <Users className="text-blue-900" /> },
      'processo': { label: 'DIREITO E PROCESSOS', icon: <Scale className="text-slate-950" /> },
      'judicial': { label: 'DIREITO E PROCESSOS', icon: <Scale className="text-slate-950" /> },
      'restricao': { label: 'DIREITO E PROCESSOS', icon: <Scale className="text-slate-950" /> },
      'veicul': { label: 'VEÍCULOS E TRÂNSITO', icon: <Car className="text-slate-700" /> },
      'detran': { label: 'VEÍCULOS E TRÂNSITO', icon: <Car className="text-slate-700" /> },
      'internet': { label: 'PRESENÇA DIGITAL', icon: <Globe className="text-sky-600" /> },
      'digital': { label: 'PRESENÇA DIGITAL', icon: <Globe className="text-sky-600" /> },
      'site': { label: 'PRESENÇA DIGITAL', icon: <Globe className="text-sky-600" /> },
      'consumo': { label: 'PERFIL DE CONSUMO', icon: <ShoppingCart className="text-orange-500" /> },
      'interess': { label: 'PERFIL DE CONSUMO', icon: <ShoppingCart className="text-orange-500" /> },
      'compras': { label: 'PERFIL DE CONSUMO', icon: <ShoppingCart className="text-orange-500" /> },
      'mosaic': { label: 'PERFIL DE CONSUMO', icon: <ShoppingCart className="text-orange-500" /> },
      'opiniao': { label: 'PERFIL DE CONSUMO', icon: <ShoppingCart className="text-orange-500" /> },
      'energia': { label: 'CONTAS DE ENERGIA', icon: <Zap className="text-yellow-600" /> },
      'antecedente': { label: 'ANTECEDENTES E REGISTROS', icon: <FileSearch className="text-red-800" /> },
      'crimina': { label: 'ANTECEDENTES E REGISTROS', icon: <FileSearch className="text-red-800" /> },
      'mandado': { label: 'ANTECEDENTES E REGISTROS', icon: <AlertTriangle className="text-red-950" /> },
      'histori': { label: 'HISTÓRICO REGISTRADO', icon: <History className="text-slate-500" /> },
      'moviment': { label: 'HISTÓRICO REGISTRADO', icon: <History className="text-slate-500" /> },
      'ficha': { label: 'HISTÓRICO REGISTRADO', icon: <History className="text-slate-500" /> },
      'protocolo': { label: 'HISTÓRICO REGISTRADO', icon: <History className="text-slate-500" /> },
      'biometria': { label: 'DADOS BIOMÉTRICOS', icon: <Fingerprint className="text-blue-500" /> },
      'digitais': { label: 'DADOS BIOMÉTRICOS', icon: <Fingerprint className="text-blue-500" /> },
      'escolar': { label: 'EDUCAÇÃO E FORMAÇÃO', icon: <GraduationCap className="text-blue-600" /> },
      'faculdade': { label: 'EDUCAÇÃO E FORMAÇÃO', icon: <GraduationCap className="text-blue-600" /> },
      'universit': { label: 'EDUCAÇÃO E FORMAÇÃO', icon: <GraduationCap className="text-blue-600" /> },
      'matricula': { label: 'EDUCAÇÃO E FORMAÇÃO', icon: <GraduationCap className="text-blue-600" /> }
    };

    for (const [keyWord, theme] of Object.entries(themes)) {
      if (k.includes(keyWord)) return theme;
    }
    return { label: 'OUTROS REGISTROS ENCONTRADOS', icon: <Info className="text-slate-400" /> };
  };

  const catData = useMemo(() => {
    if (!displayData) return [];

    const categories: Record<string, { label: string; icon: any; data: any }> = {};

    const images = findImagesWithContext(displayData);
    if (images.length > 0) {
      categories['GALERIA DE FOTOS'] = { label: 'GALERIA DE FOTOS', icon: <ImageIcon className="h-5 w-5 text-purple-600" />, data: { _images: images } };
    }

    const process = (obj: any) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (key === '_metadata' || key === 'raw' || isBase64Image(value) || !isValidValue(value)) return;

        const theme = getCategoryTheme(key);
        const label = theme.label;

        if (!categories[label]) {
          categories[label] = { label, icon: theme.icon, data: {} };
        }
        categories[label].data[key] = value;
      });
    };

    process(displayData);

    const order = [
      'GALERIA DE FOTOS', 'IDENTIFICAÇÃO PRINCIPAL', 'HISTÓRICO REGISTRADO', 'DADOS BIOMÉTRICOS',
      'SITUAÇÃO NA RECEITA FEDERAL', 'VÍNCULOS FAMILIARES', 'LOCALIZAÇÃO / ENDEREÇOS',
      'CANAIS DE CONTATO', 'DOCUMENTAÇÃO OFICIAL', 'HISTÓRICO DE CÉDULAS (RG)',
      'CARTÓRIO E REGISTRO CIVIL', 'DIREITO E PROCESSOS', 'ANTECEDENTES E REGISTROS',
      'SAÚDE E VACINAÇÃO', 'SAÚDE E ASSISTÊNCIA', 'FINANÇAS E BANCÁRIO',
      'RENDA E PATRIMÔNIO', 'BENEFÍCIOS SOCIAIS', 'HISTÓRICO PROFISSIONAL',
      'PARTICIPAÇÕES SOCIETÁRIAS', 'EDUCAÇÃO E FORMAÇÃO', 'PERFIL DE CONSUMO', 'VEÍCULOS E TRÂNSITO'
    ];

    const categoriesWithData = Object.entries(categories).filter(([_, cat]) => {
      if (cat.data._images && cat.data._images.length > 0) return true;
      const dataKeys = Object.keys(cat.data).filter(k => k !== '_images');
      return dataKeys.length > 0;
    });

    return categoriesWithData
      .sort((a, b) => {
        const ax = order.indexOf(a[0]);
        const bx = order.indexOf(b[0]);
        return (ax === -1 ? 99 : ax) - (bx === -1 ? 99 : bx);
      });
  }, [displayData]);

  const renderRecursive = (obj: any, depth = 0): JSX.Element | null => {
    if (!obj || typeof obj !== 'object') return null;
    const entries = Object.entries(obj).filter(([k, v]) => k !== '_images' && !isBase64Image(v));
    if (entries.length === 0) return null;

    return (
      <div className={cn("grid gap-y-1 gap-x-4", depth === 0 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 border-l border-slate-100 ml-2 pl-4 py-1")}>
        {entries.map(([key, value]) => {
          const isObj = typeof value === 'object' && value !== null;
          const isArr = Array.isArray(value);

          return (
            <div key={key} className={cn("flex items-baseline py-1.5 border-b border-slate-50 last:border-0", (isObj || isArr || String(value).length > 40) && "md:col-span-2 lg:col-span-2")}>
              <div className="min-w-[120px] text-[11px] font-bold text-slate-500 uppercase tracking-tighter mr-3">
                {formatFieldName(key)}
              </div>
              <div className="flex-1">
                {!isObj && !isArr ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900 break-words">{renderValue(value)}</span>
                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(String(value), key)}>
                      <Copy className="h-2.5 w-2.5 text-slate-300" />
                    </Button>
                  </div>
                ) : isArr ? (
                  <div className="space-y-4 mt-2">
                    {value.map((item: any, i: number) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative mb-4">
                        <div className="absolute -top-2 left-2 px-2 py-0.5 bg-slate-200 text-[8px] font-black text-slate-600 rounded uppercase">Item #{i + 1}</div>
                        {typeof item === 'object' ? renderRecursive(item, depth + 1) : <span className="text-xs font-bold text-slate-800">{renderValue(item)}</span>}
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
      if (!obj || typeof obj !== 'object') return isValidValue(obj) ? String(obj) : '';
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_metadata' || isBase64Image(value)) continue;
        if (Array.isArray(value)) {
          str += `${indent}${formatFieldName(key).toUpperCase()}:\n`;
          value.forEach((v, i) => { str += `${indent}  #${i + 1}:\n${build(v, indent + '    ')}\n`; });
        } else if (typeof value === 'object' && value !== null) {
          str += `${indent}${formatFieldName(key).toUpperCase()}:\n${build(value, indent + '  ')}\n`;
        } else {
          str += `${indent}${formatFieldName(key)}: ${renderValue(value)}\n`;
        }
      }
      return str;
    };
    const report = `=== RELATÓRIO OFICIAL INFOEASY 2.0 ===\nAPI: ${apiName.toUpperCase()}\nDATA: ${new Date().toLocaleString()}\n====================================\n\n${build(displayData)}`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Laudo_${apiName}_${Date.now()}.txt`; a.click();
  };

  if (!displayData) return null;

  return (
    <Card id="relatorio-master" className="mt-8 border border-slate-200 bg-white shadow-xl rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
      <CardHeader className="p-8 md:p-12 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-blue-800" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase mb-1">Dossiê de Inteligência</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-slate-900 text-white border-none py-1 px-3 text-[10px] font-black">{apiName}</Badge>
                {displayData._metadata?.cached_at && <span className="text-[10px] font-bold text-slate-400 uppercase">{displayData._metadata.cached_at}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button onClick={downloadAsTxt} className="h-12 flex-1 md:flex-none px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest gap-2 transition-transform active:scale-95 shadow-md">
              <Download className="h-4 w-4" /> Baixar Dossiê (TXT)
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="h-12 w-12 md:w-auto md:px-6 rounded-2xl border-slate-200 hover:bg-slate-100 font-black text-[11px] uppercase tracking-widest gap-2">
              <Printer className="h-4 w-4" /> <span className="hidden md:inline">Imprimir</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 md:p-12 space-y-12">
        {catData.map(([label, cat]) => (
          <Collapsible key={label} open={expandedSections.has(label)} onOpenChange={() => toggleSection(label)} className="group space-y-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer border-b border-slate-200 pb-4 group-hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                    {cat.icon}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{cat.label}</h3>
                </div>
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200 transition-all", expandedSections.has(label) && "bg-blue-100 border-blue-200")}>
                  {expandedSections.has(label) ? <ChevronUp className="h-5 w-5 text-blue-700" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-2 pt-2">
                {label === 'GALERIA DE FOTOS' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {cat.data._images.map((img: any, i: number) => (
                      <div key={i} className="group/img space-y-3">
                        <div className="aspect-[3/4] relative rounded-[1.5rem] overflow-hidden border border-slate-200 bg-slate-100 shadow-sm transition-all duration-700 group-hover/img:scale-105 group-hover/img:ring-4 ring-blue-50 group-hover/img:shadow-xl">
                          <ImageDisplay imageData={img.value} name={img.label} />
                        </div>
                        <div className="text-[10px] text-center font-black text-slate-500 uppercase leading-tight px-1">
                          {img.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderRecursive(cat.data)
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Download, ChevronDown, ChevronUp, Image as ImageIcon, User, MapPin, Phone, CreditCard, FileText, Briefcase, Heart, Info, Users, Activity, ShieldCheck, Printer } from 'lucide-react';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personal', 'images', 'documents', 'relationship', 'address', 'contact']));

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

  // Helper to find all images with their proper context (Name or Relationship)
  const findImagesWithContext = (obj: any, parentKey = '', context: any = {}): { key: string; value: string; label: string }[] => {
    let images: { key: string; value: string; label: string }[] = [];
    if (!obj || typeof obj !== 'object') return images;

    // Capture context from current level (names, relationships)
    const currentContext = { ...context };
    if (obj.nome) currentContext.name = obj.nome;
    if (obj.parentesco) currentContext.rel = obj.parentesco;
    if (obj.tipo && obj.tipo.length < 30) currentContext.type = obj.tipo;
    if (obj.vinculo) currentContext.rel = obj.vinculo;
    if (obj.relacao) currentContext.rel = obj.relacao;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        images = [...images, ...findImagesWithContext(item, parentKey || `Item ${index + 1}`, currentContext)];
      });
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (isBase64Image(value) || (typeof value === 'string' && value.startsWith('http'))) {
          // Determine best label
          let label = currentContext.name || currentContext.rel || currentContext.type || key;
          if (label === key && (key.toLowerCase() === 'base64' || key.toLowerCase() === 'data')) {
            label = parentKey || 'Imagem';
          }
          images.push({ key, value: value as string, label: String(label).toUpperCase() });
        } else if (typeof value === 'object') {
          images = [...images, ...findImagesWithContext(value, key, currentContext)];
        }
      }
    }
    return images;
  };

  // Deep Unwrap: Digs through layers like Data > Dados > Data until it finds the payload
  const displayData = useMemo(() => {
    if (!data) return null;
    let metadata: any = {
      saldo: data.saldo || 'N/A',
      tempo: data.tempo_segundos || '0s'
    };

    const unwrap = (obj: any): any => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
      if (obj.cached_at) metadata.cached_at = obj.cached_at;
      if (obj.cache !== undefined) metadata.cache = obj.cache;
      if (obj.conta) metadata.conta = obj.conta;

      const entries = Object.entries(obj);
      const containerEntry = entries.find(([k]) => 
        ['data', 'dados', 'content', 'resultado', 'payload'].includes(k.toLowerCase())
      );

      if (entries.length <= 5 && containerEntry) {
        return unwrap(containerEntry[1]);
      }
      return obj;
    };

    const unwrapped = unwrap(data);
    return { ...unwrapped, _metadata: metadata };
  }, [data]);

  const formatFieldName = (key: string): string => {
    const specials: Record<string, string> = {
      'cns': 'CNS', 'cpf': 'CPF', 'cnpj': 'CNPJ', 'rg': 'RG', 'uf': 'UF', 'pis': 'PIS',
      'ctps': 'CTPS', 'ddd': 'DDD', 'cep': 'CEP', 'nis': 'NIS', 'mae': 'Mãe',
      'pai': 'Pai', 'nasc': 'Nascimento', 'dataNasc': 'Data Nasc.',
      'siglaUf': 'UF', 'logradouro': 'Endereço', 'bairro': 'Bairro', 
      'dataSit': 'Data Situação', 'descricaoSit': 'Situação', 'municipioResidencia': 'Cidade',
      'paisResidencia': 'País', 'tipoLogradouro': 'Logradouro', 'municipioNascimento': 'Naturalidade'
    };

    const cleanKey = key.split(' > ').pop() || key;
    if (specials[cleanKey]) return specials[cleanKey];
    if (specials[cleanKey.toLowerCase()]) return specials[cleanKey.toLowerCase()];

    return cleanKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderValue = (v: any): string => {
    if (v === null || v === undefined) return '---';
    if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
    if (v === 'F') return 'Feminino';
    if (v === 'M') return 'Masculino';
    if (typeof v === 'string' && (v.trim() === '' || v.toLowerCase() === 'não encontrado')) return '---';
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
      if (!obj || typeof obj !== 'object') return String(obj) + '\n';
      
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_metadata' || key === 'raw' || isBase64Image(value)) continue;
        
        if (Array.isArray(value)) {
          str += `${indent}${formatFieldName(key)}:\n`;
          value.forEach((v, i) => {
            str += `${indent}  [${i + 1}]:\n${buildString(v, indent + '    ')}`;
          });
        } else if (typeof value === 'object' && value !== null) {
          str += `${indent}${formatFieldName(key)}:\n${buildString(value, indent + '  ')}`;
        } else {
          str += `${indent}${formatFieldName(key)}: ${renderValue(value)}\n`;
        }
      }
      return str;
    };

    const reportContent = `=== INFOEASY 2.0 - RELATÓRIO DE CONSULTA ===\n` +
      `API: ${apiName.toUpperCase()}\n` +
      `DATA: ${new Date().toLocaleString('pt-BR')}\n` +
      `==========================================\n\n` +
      buildString(displayData);

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_${apiName}_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Relatório Gerado', description: 'O arquivo TXT foi baixado com sucesso.' });
  };

  // Full Recursive Renderer (Fidelity 1:1)
  const renderEntries = (obj: any, depth = 0): JSX.Element | null => {
    if (!obj || typeof obj !== 'object') return null;

    return (
      <div className={cn("grid grid-cols-1 gap-3", depth > 0 && "mt-2 ml-4 pl-3 border-l-2 border-primary/10")}>
        {Object.entries(obj).map(([key, value]) => {
          if (key === '_metadata' || key === 'raw' || key === 'base64' || isBase64Image(value)) return null;

          const isObj = typeof value === 'object' && value !== null;
          const isArr = Array.isArray(value);

          return (
            <div key={key} className="flex flex-col gap-1.5 animate-in fade-in duration-300">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 min-w-[100px] mt-1">
                  {formatFieldName(key)}:
                </span>
                {!isObj && !isArr ? (
                  <div className="group flex items-center gap-2 flex-1">
                    <span className="text-sm font-semibold text-foreground break-words">{renderValue(value)}</span>
                    {value && String(value).length < 100 && (
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(String(value), key)}>
                        {copiedField === key ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
              
              {isArr ? (
                <div className="space-y-3 mt-1">
                  {value.map((item: any, i: number) => (
                    <div key={i} className="bg-muted/30 p-3 rounded-lg border border-border/40 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary/10 text-[8px] font-bold text-primary rounded-bl-md">#{i+1}</div>
                      {typeof item === 'object' ? renderEntries(item, depth + 1) : <span className="text-sm">{renderValue(item)}</span>}
                    </div>
                  ))}
                </div>
              ) : isObj ? (
                renderEntries(value, depth + 1)
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  const categorizeExhaustively = (obj: any) => {
    const categories: Record<string, { label: string; icon: any; data: any }> = {
      images: { label: 'Galeria de Fotos', icon: <ImageIcon className="h-5 w-5 text-purple-500" />, data: [] },
      personal: { label: 'Dados Cadastrais', icon: <User className="h-5 w-5 text-blue-500" />, data: {} },
      documents: { label: 'Documentação', icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />, data: {} },
      address: { label: 'Localização', icon: <MapPin className="h-5 w-5 text-red-500" />, data: {} },
      relationship: { label: 'Filição / Parentesco', icon: <Users className="h-5 w-5 text-pink-500" />, data: {} },
      contact: { label: 'Contatos', icon: <Phone className="h-5 w-5 text-green-500" />, data: {} },
      financial: { label: 'Finanças / Benefícios', icon: <CreditCard className="h-5 w-5 text-orange-500" />, data: {} },
      work: { label: 'Trabalho', icon: <Briefcase className="h-5 w-5 text-slate-500" />, data: {} },
      health: { label: 'Saúde', icon: <Heart className="h-5 w-5 text-rose-500" />, data: {} },
      other: { label: 'Informações Adicionais', icon: <Info className="h-5 w-5 text-slate-400" />, data: {} },
    };

    if (!obj || typeof obj !== 'object') return [];

    // 1. Photo Context Extraction
    categories.images.data = findImagesWithContext(obj);

    // 2. Exhaustive Mapping
    Object.entries(obj).forEach(([key, value]) => {
      if (key === '_metadata' || key === 'raw' || isBase64Image(value)) return;
      
      const k = key.toLowerCase();
      let cat = 'other';

      if (['nome', 'nasc', 'idade', 'sexo', 'natural', 'nacio', 'genero', 'civil', 'obito', 'social', 'raca'].some(t => k.includes(t))) cat = 'personal';
      else if (['cpf', 'cnpj', 'rg', 'cnh', 'titul', 'pis', 'ctps', 'passa', 'docum', 'identi', 'cns', 'situa'].some(t => k.includes(t))) cat = 'documents';
      else if (['enderc', 'addres', 'rua', 'bairr', 'cidad', 'estad', 'cep', 'uf', 'logra', 'municip', 'residenc'].some(t => k.includes(t))) cat = 'address';
      else if (['telef', 'phone', 'celul', 'email', 'whats', 'contat', 'tel', 'fone', 'ddd', 'numero'].some(t => k.includes(t))) cat = 'contact';
      else if (['renda', 'salar', 'scor', 'credit', 'divid', 'valor', 'financ', 'banc', 'pagam', 'auxil', 'benefic'].some(t => k.includes(t))) cat = 'financial';
      else if (['parent', 'vincul', 'mae', 'pai', 'irmao', 'filho', 'conju', 'filiac'].some(t => k.includes(t))) cat = 'relationship';
      else if (['empres', 'trabal', 'empreg', 'carg', 'func', 'admis', 'meis'].some(t => k.includes(t))) cat = 'work';
      else if (['saude', 'medic', 'hospit', 'unimed', 'vacin', 'inss', 'loas'].some(t => k.includes(t))) cat = 'health';

      categories[cat].data[key] = value;
    });

    return Object.entries(categories).filter(([_, c]) => (Array.isArray(c.data) ? c.data.length > 0 : Object.keys(c.data).length > 0));
  };

  const catData = useMemo(() => categorizeExhaustively(displayData), [displayData]);
  if (!displayData) return null;

  return (
    <Card className="mt-8 shadow-2xl border-none overflow-hidden bg-card/40 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700 ring-1 ring-white/10">
      <CardHeader className="relative bg-gradient-to-br from-primary/20 via-background to-background border-b border-white/5 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <CardTitle className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/30 shadow-lg glow-primary">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tighter text-foreground uppercase drop-shadow-md">Resultado da Consulta</div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-black uppercase text-[9px] tracking-widest">
                  {apiName}
                </Badge>
                {displayData._metadata?.cached_at && (
                  <Badge variant="outline" className="text-[9px] bg-sky-500/5 text-sky-400 border-sky-400/20 gap-1 font-mono uppercase">
                    <Activity className="h-3 w-3" /> Atualizado: {displayData._metadata.cached_at}
                  </Badge>
                )}
              </div>
            </div>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadAsTxt} className="bg-background/50 hover:bg-primary/10 border-primary/20 text-primary font-bold text-[10px] uppercase tracking-widest gap-2">
              <Download className="h-3.5 w-3.5" /> Baixar TXT
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-widest gap-2">
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-8 pb-12 px-4 md:px-8 space-y-8">
        {catData.map(([ck, cat]) => (
          <Collapsible key={ck} open={expandedSections.has(ck)} onOpenChange={() => toggleSection(ck)} className="group/section border border-white/5 rounded-3xl overflow-hidden shadow-2xl bg-white/5 transition-all hover:bg-white/[0.07] hover:border-primary/20">
            <CollapsibleTrigger asChild>
              <div className={cn("w-full flex items-center justify-between cursor-pointer px-6 py-5 transition-all text-left", expandedSections.has(ck) ? "bg-primary/5 border-b border-white/5" : "")}>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-background/50 shadow-inner border border-white/5">{cat.icon}</div>
                  <div>
                    <span className="text-xs font-black tracking-widest uppercase text-foreground/80">{cat.label}</span>
                    <div className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-tighter">
                      {Array.isArray(cat.data) ? cat.data.length : Object.keys(cat.data).length} REGISTROS
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-background/50 border border-white/5 shadow-sm group-hover/section:scale-110 transition-transform">
                  {expandedSections.has(ck) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-6 md:p-8">
                {ck === 'images' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {cat.data.map((img: any, i: number) => (
                      <div key={i} className="group/img space-y-3">
                        <div className="aspect-[4/5] relative rounded-2xl overflow-hidden border border-white/5 bg-black/20 shadow-2xl group-hover/img:scale-105 transition-all duration-500 group-hover/img:ring-4 ring-primary/20">
                          <ImageDisplay 
                            imageData={isBase64Image(img.value) ? img.value : undefined} 
                            imageUrl={img.value.startsWith('http') ? img.value : undefined} 
                            name={img.label} 
                          />
                        </div>
                        <div className="text-[9px] text-center font-black text-muted-foreground/90 uppercase tracking-tighter bg-white/5 py-1.5 rounded-lg px-2 border border-white/5 truncate">
                          {img.label}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {renderEntries(cat.data)}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}

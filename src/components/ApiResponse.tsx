import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Copy, Check, Download, ChevronDown, ChevronUp, Image as ImageIcon, User, MapPin, Phone, CreditCard, FileText, Briefcase, Car, Heart, Info, Users, Activity } from 'lucide-react';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personal', 'images', 'documents']));

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isBase64Image = (value: any) => {
    if (typeof value !== 'string') return false;
    return value.startsWith('data:image') || 
           (value.length > 500 && /^[A-Za-z0-9+/=]+$/.test(value.substring(0, 100)));
  };

  const isImageField = (key: string) => {
    const k = key.toLowerCase();
    return k.includes('foto') || k.includes('imagem') || k.includes('image') || k.includes('picture') || k.includes('biometria');
  };

  // Helper to find all images in an object recursively
  const findImages = (obj: any, currentKey = ''): { key: string; value: string }[] => {
    let images: { key: string; value: string }[] = [];
    
    if (!obj || typeof obj !== 'object') return images;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        images = [...images, ...findImages(item, `${currentKey}[${index}]`)];
      });
    } else {
      for (const [key, value] of Object.entries(obj)) {
        if (isBase64Image(value) || (typeof value === 'string' && value.startsWith('http'))) {
          images.push({ key: key, value: value as string });
        } else if (typeof value === 'object') {
          images = [...images, ...findImages(value, key)];
        }
      }
    }
    return images;
  };

  // Smart Unwrap: Find the most relevant data part
  const displayData = useMemo(() => {
    if (!data) return null;
    let current = data;
    
    // Se a resposta tiver sucesso: true e data: {...}, entra no data
    if (current.success === true && current.data) {
      current = current.data;
    }
    
    // Se houver um wrapper "data" dentro do objeto principal (comum em APIs de consulta)
    if (current && typeof current === 'object' && current.data && !Array.isArray(current.data) && Object.keys(current).length < 5) {
      const { data: nestedData, ...metadata } = current;
      return { ...nestedData, _metadata: metadata };
    }
    
    return current;
  }, [data]);

  const downloadAsTxt = () => {
    const formatDataForTxt = (obj: any, indent = 0): string => {
      const spaces = '  '.repeat(indent);
      let result = '';
      
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'raw' || key === 'message' || key === '_metadata') continue;
        
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (value === null || value === undefined) {
          result += `${spaces}${formattedKey}: N/A\n`;
        } else if (typeof value === 'boolean') {
          result += `${spaces}${formattedKey}: ${value ? 'Sim' : 'Não'}\n`;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          result += `${spaces}${formattedKey}:\n`;
          result += formatDataForTxt(value, indent + 1);
        } else if (Array.isArray(value)) {
          result += `${spaces}${formattedKey}:\n`;
          value.forEach((item, i) => {
            if (typeof item === 'object') {
              result += `${spaces}  [${i + 1}]:\n`;
              result += formatDataForTxt(item, indent + 2);
            } else {
              result += `${spaces}  - ${item}\n`;
            }
          });
        } else {
          const strValue = String(value);
          if (strValue.length > 100 && isBase64Image(value)) {
            result += `${spaces}${formattedKey}: [IMAGEM BASE64]\n`;
          } else {
            result += `${spaces}${formattedKey}: ${strValue}\n`;
          }
        }
      }
      return result;
    };

    const header = `=== INFOEASY 2.0 - RESULTADO DA CONSULTA ===\nAPI: ${apiName}\nData: ${new Date().toLocaleString('pt-BR')}\n${'='.repeat(40)}\n\n`;
    const content = header + formatDataForTxt(displayData);
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infoeasy_${apiName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download realizado',
      description: 'O relatório foi salvo com sucesso.',
    });
  };

  const formatFieldName = (key: string): string => {
    const specials: Record<string, string> = {
      'cns': 'CNS',
      'cpf': 'CPF',
      'cnpj': 'CNPJ',
      'rg': 'RG',
      'uf': 'UF',
      'pis': 'PIS',
      'ctps': 'CTPS',
      'ddd': 'DDD',
      'cep': 'CEP',
      'nis': 'NIS',
      'mae': 'Nome da Mãe',
      'pai': 'Nome do Pai',
      'nasc': 'Nascimento',
      'dataNasc': 'Data de Nascimento',
    };

    if (specials[key]) return specials[key];
    if (specials[key.toLowerCase()]) return specials[key.toLowerCase()];

    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'Não Informado';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'string' && value.trim() === '') return 'Não Informado';
    return String(value);
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const categorizeData = (obj: any) => {
    const categories: Record<string, { label: string; icon: any; fields: [string, any][] }> = {
      images: { label: 'Galeria de Fotos', icon: <ImageIcon className="h-5 w-5 text-purple-500" />, fields: [] },
      personal: { label: 'Dados Cadastrais', icon: <User className="h-5 w-5 text-blue-500" />, fields: [] },
      documents: { label: 'Documentação', icon: <FileText className="h-5 w-5 text-orange-500" />, fields: [] },
      address: { label: 'Endereços e Localização', icon: <MapPin className="h-5 w-5 text-red-500" />, fields: [] },
      relationship: { label: 'Parentesco e Vínculos', icon: <Users className="h-5 w-5 text-pink-500" />, fields: [] },
      contact: { label: 'Informações de Contato', icon: <Phone className="h-5 w-5 text-green-500" />, fields: [] },
      financial: { label: 'Dados Financeiros / Score', icon: <CreditCard className="h-5 w-5 text-emerald-500" />, fields: [] },
      work: { label: 'Vínculos Profissionais', icon: <Briefcase className="h-5 w-5 text-slate-500" />, fields: [] },
      vehicle: { label: 'Veículos / Condutor', icon: <Car className="h-5 w-5 text-indigo-500" />, fields: [] },
      health: { label: 'Saúde / Benefícios', icon: <Heart className="h-5 w-5 text-rose-500" />, fields: [] },
      history: { label: 'Histórico e Antecedentes', icon: <Activity className="h-5 w-5 text-cyan-500" />, fields: [] },
      other: { label: 'Informações Adicionais', icon: <Info className="h-5 w-5 text-slate-400" />, fields: [] },
    };

    if (!obj || typeof obj !== 'object') return [];

    const allImages = findImages(obj);
    allImages.forEach(img => {
      categories.images.fields.push([img.key, img.value]);
    });

    const processEntries = (currentObj: any, prefix = '') => {
      Object.entries(currentObj).forEach(([key, value]) => {
        if (key === 'raw' || key === 'message' || key === '_metadata') return;
        if (isBase64Image(value)) return;

        const lowerKey = key.toLowerCase();
        let targetCategory = 'other';

        if (['nome', 'nasc', 'idade', 'sexo', 'filiacao', 'mae', 'pai', 'natural', 'nacio', 'genero', 'civil', 'obito'].some(t => lowerKey.includes(t))) targetCategory = 'personal';
        else if (['cpf', 'cnpj', 'rg', 'cnh', 'titulo', 'pis', 'ctps', 'passaporte', 'documento', 'certidao', 'nis', 'cns', 'identidade'].some(t => lowerKey.includes(t))) targetCategory = 'documents';
        else if (['endereco', 'address', 'rua', 'bairro', 'cidade', 'estado', 'cep', 'uf', 'logradouro', 'numero', 'municipio', 'localidade'].some(t => lowerKey.includes(t))) targetCategory = 'address';
        else if (['telefone', 'phone', 'celular', 'email', 'whatsapp', 'contato', 'tel', 'fone', 'ddd'].some(t => lowerKey.includes(t))) targetCategory = 'contact';
        else if (['renda', 'salario', 'score', 'credit', 'divida', 'valor', 'financ', 'banco', 'consu', 'pagam', 'serasa', 'spc'].some(t => lowerKey.includes(t))) targetCategory = 'financial';
        else if (['parent', 'vinculo', 'socio', 'irmao', 'filho', 'conjuge'].some(t => lowerKey.includes(t))) targetCategory = 'relationship';
        else if (['empresa', 'trabalho', 'emprego', 'cargo', 'funcao', 'admis', 'demis', 'cnae', 'razao', 'fantasia', 'mei'].some(t => lowerKey.includes(t))) targetCategory = 'work';
        else if (['placa', 'veiculo', 'carro', 'moto', 'renavam', 'chassi', 'marca', 'modelo', 'ano', 'cor', 'motor', 'fipe'].some(t => lowerKey.includes(t))) targetCategory = 'vehicle';
        else if (['saude', 'medic', 'hospi', 'unimed', 'benefic', 'vacina', 'inss', 'loas', 'bolsa', 'auxilio'].some(t => lowerKey.includes(t))) targetCategory = 'health';
        else if (['hist', 'antece', 'militar', 'polic', 'penal', 'judic'].some(t => lowerKey.includes(t))) targetCategory = 'history';

        if (typeof value === 'object' && value !== null && !Array.isArray(value) && targetCategory !== 'other') {
          processEntries(value, `${prefix}${formatFieldName(key)} > `);
          return;
        }

        categories[targetCategory].fields.push([prefix + key, value]);
      });
    };

    processEntries(obj);

    return Object.entries(categories).filter(([_, cat]) => cat.fields.length > 0);
  };

  const renderFieldValue = (key: string, value: any) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground italic text-sm">Nenhum registro encontrado</span>;
      
      return (
        <div className="mt-2 space-y-2">
          {value.map((item, index) => (
            <div key={index} className="bg-muted/30 border border-border/40 p-3 rounded-lg text-sm shadow-sm">
              {typeof item === 'object' ? (
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(item).map(([subKey, subValue]) => (
                    <div key={subKey} className="flex items-start gap-2 border-b border-border/10 pb-1 last:border-0 last:pb-0">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground min-w-[80px]">
                        {formatFieldName(subKey)}:
                      </span>
                      <div className="flex-1">
                        {isBase64Image(subValue) ? (
                          <div className="w-16 h-16 mt-1">
                            <ImageDisplay imageData={subValue as string} name={subKey} />
                          </div>
                        ) : (
                          <span className="text-foreground leading-tight">{renderValue(subValue)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-foreground">{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="mt-2 grid grid-cols-1 gap-1.5 pl-3 border-l-2 border-primary/10">
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} className="flex items-baseline gap-2">
              <span className="text-[11px] font-bold text-muted-foreground/80 min-w-[90px]">
                {formatFieldName(nestedKey)}:
              </span>
              <span className="text-sm text-foreground/90 break-words flex-1">
                {typeof nestedValue === 'object' ? '...' : renderValue(nestedValue)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="group flex items-center justify-between gap-2 bg-muted/20 hover:bg-muted/40 transition-colors px-3 py-2 rounded-md border border-transparent hover:border-border/40">
        <span className="text-sm text-foreground font-medium break-all flex-1">
          {renderValue(value)}
        </span>
        {value && String(value).length < 500 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => copyToClipboard(String(value), key)}
          >
            {copiedField === key ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    );
  };

  const categorizedData = useMemo(() => categorizeData(displayData), [displayData]);

  if (!displayData) return null;

  return (
    <Card className="mt-8 shadow-2xl border-border/40 overflow-hidden bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border/30 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <CardTitle className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Dados Recuperados
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/5 font-mono uppercase text-[10px] tracking-widest px-2 py-0.5">
                  {apiName}
                </Badge>
                {displayData._metadata?.cached_at && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Cache: {displayData._metadata.cached_at}
                  </span>
                )}
              </div>
            </div>
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={downloadAsTxt}
              className="gap-2 bg-background/50 hover:bg-primary/5 border-border/50 hover:border-primary/30 transition-all font-semibold"
            >
              <Download className="h-4 w-4" />
              Relatório Geral
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-8 px-4 md:px-8">
        <div className="grid gap-6">
          {categorizedData.map(([categoryKey, category]) => (
            <Collapsible
              key={categoryKey}
              open={expandedSections.has(categoryKey)}
              onOpenChange={() => toggleSection(categoryKey)}
              className="group/section border border-border/20 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-background/30"
            >
              <CollapsibleTrigger asChild>
                <div className={cn(
                  "w-full flex items-center justify-between cursor-pointer px-4 py-4 transition-colors",
                  expandedSections.has(categoryKey) ? "bg-muted/40" : "hover:bg-muted/20"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background shadow-sm border border-border/10">
                      {category.icon}
                    </div>
                    <div>
                      <span className="text-sm font-bold tracking-wide uppercase text-foreground/80">
                        {category.label}
                      </span>
                      <Badge variant="outline" className="ml-2 bg-background/40 font-mono text-[10px]">
                        {category.fields.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-background/50 border border-border/10 group-hover/section:scale-110 transition-transform">
                      {expandedSections.has(categoryKey) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-5 bg-background/10">
                  {categoryKey === 'images' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {category.fields.map(([key, value], idx) => (
                        <div key={idx} className="group/img space-y-2">
                          <div className="aspect-square relative rounded-xl overflow-hidden border border-border/30 bg-muted/40 shadow-inner group-hover/img:border-primary/40 transition-colors">
                            <ImageDisplay 
                              imageData={isBase64Image(value) ? value as string : undefined}
                              imageUrl={typeof value === 'string' && value.startsWith('http') ? value : undefined}
                              name={key}
                            />
                          </div>
                          <div className="text-[10px] text-center font-bold text-muted-foreground truncate uppercase px-1">
                            {formatFieldName(key)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn(
                      "grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
                      category.fields.some(([_, v]) => Array.isArray(v) || typeof v === 'object') && "lg:grid-cols-1 xl:grid-cols-2"
                    )}>
                      {category.fields.map(([key, value], idx) => (
                        <div key={idx} className={cn(
                          "space-y-1.5",
                          (Array.isArray(value) || (typeof value === 'object' && value !== null)) && "md:col-span-2 lg:col-span-1"
                        )}>
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              {formatFieldName(key.split(' > ').pop() || key)}
                            </span>
                            {key.includes(' > ') && (
                              <Badge variant="outline" className="text-[8px] h-3 px-1 leading-none uppercase text-muted-foreground/40 font-normal">
                                {key.split(' > ')[0]}
                              </Badge>
                            )}
                          </div>
                          {renderFieldValue(key, value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

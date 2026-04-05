import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Copy, Check, Download, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageDisplay } from '@/components/ImageDisplay';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

interface ApiResponseProps {
  data: any;
  apiName: string;
}

export function ApiResponse({ data, apiName }: ApiResponseProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadAsTxt = () => {
    const formatDataForTxt = (obj: any, indent = 0): string => {
      const spaces = '  '.repeat(indent);
      let result = '';
      
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'raw' || key === 'message') continue;
        
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
            result += `${spaces}${formattedKey}: [Imagem Base64]\n`;
          } else {
            result += `${spaces}${formattedKey}: ${strValue}\n`;
          }
        }
      }
      
      return result;
    };

    const header = `=== ${apiName} ===\nData: ${new Date().toLocaleString('pt-BR')}\n${'='.repeat(40)}\n\n`;
    const content = header + formatDataForTxt(data);
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consulta_${apiName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download iniciado',
      description: 'O arquivo foi baixado com sucesso.',
    });
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const isImageField = (key: string) => {
    return key.toLowerCase().includes('foto') || 
           key.toLowerCase().includes('imagem') || 
           key.toLowerCase().includes('image') ||
           key.toLowerCase().includes('picture');
  };

  const isBase64Image = (value: any) => {
    if (typeof value !== 'string') return false;
    return value.startsWith('data:image') || 
           (value.length > 100 && /^[A-Za-z0-9+/=]+$/.test(value.substring(0, 100)));
  };

  const formatFieldName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
    const categories: Record<string, { label: string; icon: string; fields: [string, any][] }> = {
      images: { label: 'Imagens', icon: '🖼️', fields: [] },
      personal: { label: 'Dados Pessoais', icon: '👤', fields: [] },
      address: { label: 'Endereço', icon: '📍', fields: [] },
      contact: { label: 'Contato', icon: '📞', fields: [] },
      financial: { label: 'Dados Financeiros', icon: '💰', fields: [] },
      documents: { label: 'Documentos', icon: '📄', fields: [] },
      vehicle: { label: 'Veículo', icon: '🚗', fields: [] },
      work: { label: 'Trabalho', icon: '💼', fields: [] },
      other: { label: 'Outras Informações', icon: '📋', fields: [] },
    };

    if (!obj || typeof obj !== 'object') {
      categories.other.fields.push(['Resposta', obj]);
      return Object.entries(categories).filter(([_, cat]) => cat.fields.length > 0);
    }

    const entries = Object.entries(obj).filter(([key]) => key !== 'raw' && key !== 'message');

    entries.forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      
      if (isImageField(key) || isBase64Image(value)) {
        categories.images.fields.push([key, value]);
      } else if (['nome', 'name', 'nascimento', 'idade', 'sexo', 'mae', 'pai', 'obito', 'data_nascimento', 'datanascimento', 'nacionalidade', 'naturalidade', 'filiacao', 'genero', 'estadocivil', 'estado_civil'].some(t => lowerKey.includes(t))) {
        categories.personal.fields.push([key, value]);
      } else if (['endereco', 'address', 'rua', 'bairro', 'cidade', 'estado', 'cep', 'uf', 'logradouro', 'complemento', 'numero', 'municipio', 'localidade'].some(t => lowerKey.includes(t))) {
        categories.address.fields.push([key, value]);
      } else if (['telefone', 'phone', 'celular', 'email', 'whatsapp', 'contato', 'tel', 'fone', 'ddd'].some(t => lowerKey.includes(t))) {
        categories.contact.fields.push([key, value]);
      } else if (['renda', 'salario', 'score', 'credito', 'spc', 'serasa', 'divida', 'valor', 'financeiro', 'pagamento', 'beneficio', 'banco', 'agencia', 'conta'].some(t => lowerKey.includes(t))) {
        categories.financial.fields.push([key, value]);
      } else if (['cpf', 'cnpj', 'rg', 'cnh', 'titulo', 'pis', 'ctps', 'passaporte', 'documento', 'certidao', 'nis'].some(t => lowerKey.includes(t))) {
        categories.documents.fields.push([key, value]);
      } else if (['placa', 'veiculo', 'carro', 'moto', 'renavam', 'chassi', 'marca', 'modelo', 'ano', 'cor', 'combustivel'].some(t => lowerKey.includes(t))) {
        categories.vehicle.fields.push([key, value]);
      } else if (['empresa', 'trabalho', 'emprego', 'cargo', 'funcao', 'admissao', 'demissao', 'cnae', 'razao_social', 'fantasia', 'socio', 'capital', 'situacao_cadastral'].some(t => lowerKey.includes(t))) {
        categories.work.fields.push([key, value]);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested objects go to other
        categories.other.fields.push([key, value]);
      } else {
        categories.other.fields.push([key, value]);
      }
    });

    return Object.entries(categories).filter(([_, cat]) => cat.fields.length > 0);
  };

  const renderFieldValue = (key: string, value: any, isNested = false) => {
    // Image rendering
    if (isImageField(key) && (isBase64Image(value) || (typeof value === 'string' && value.startsWith('http')))) {
      return (
        <div className="mt-2">
          <ImageDisplay 
            imageData={isBase64Image(value) ? value as string : undefined}
            imageUrl={typeof value === 'string' && value.startsWith('http') ? value : undefined}
            name={key}
          />
        </div>
      );
    }

    // Nested object rendering
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-primary/20">
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} className="flex items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground min-w-[100px]">
                {formatFieldName(nestedKey)}:
              </span>
              <span className="text-sm text-foreground break-words flex-1">
                {typeof nestedValue === 'object' ? JSON.stringify(nestedValue) : renderValue(nestedValue)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Array rendering
    if (Array.isArray(value)) {
      return (
        <div className="mt-2 space-y-1">
          {value.map((item, index) => (
            <div key={index} className="text-sm bg-muted/30 px-2 py-1 rounded">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </div>
          ))}
        </div>
      );
    }

    // Simple value rendering
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-foreground break-words flex-1 bg-muted/30 px-3 py-1.5 rounded">
          {renderValue(value)}
        </span>
        {String(value).length < 200 && value !== null && value !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-muted shrink-0"
            onClick={() => copyToClipboard(String(value), key)}
          >
            {copiedField === key ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    );
  };

  const categorizedData = categorizeData(data);

  return (
    <Card className="mt-6 shadow-lg border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/30 pb-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center border border-success/20">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-lg font-semibold">Resultado da Consulta</div>
              <div className="text-sm text-muted-foreground font-normal mt-0.5">
                Dados retornados pela API
              </div>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAsTxt}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar .txt
            </Button>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
              {apiName}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-6">
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {categorizedData.map(([categoryKey, category]) => (
            <Collapsible
              key={categoryKey}
              open={expandedSections.has(categoryKey)}
              onOpenChange={() => toggleSection(categoryKey)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between hover:bg-muted/50 px-3 py-2 h-auto"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="text-lg">{category.icon}</span>
                    {category.label}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.fields.length}
                    </Badge>
                  </span>
                  {expandedSections.has(categoryKey) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-3 pt-2 pb-3 px-3">
                  {categoryKey === 'images' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {category.fields.map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatFieldName(key)}
                          </span>
                          <ImageDisplay 
                            imageData={isBase64Image(value) ? value as string : undefined}
                            imageUrl={typeof value === 'string' && value.startsWith('http') ? value : undefined}
                            name={key}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {category.fields.map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatFieldName(key)}
                          </span>
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

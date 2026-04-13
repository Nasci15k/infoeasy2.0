import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search as SearchIcon, Share2, Copy, Check, Clock, X, ExternalLink } from 'lucide-react';
import { ApiResponse } from '@/components/ApiResponse';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface CategoryModuleProps {
  category: any;
  apis: any[];
  limits: any;
}

export function CategoryModule({ category, apis, limits }: CategoryModuleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [selectedApi, setSelectedApi] = useState('');
  const [queryValue, setQueryValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline' | 'slow'>('checking');

  // Share link state
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareExpiry, setShareExpiry] = useState<Date | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareTimeLeft, setShareTimeLeft] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedApi || !queryValue) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione uma API e insira um valor para consulta.',
        variant: 'destructive',
      });
      return;
    }

    if (limits && limits.daily_count >= limits.daily_limit) {
      toast({
        title: 'Limite diário atingido',
        description: 'Você atingiu o limite de consultas diárias.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setApiResult(null);
    setApiStatus('checking');

    const startTime = Date.now();

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('query-api', {
        body: {
          apiId: selectedApi,
          queryValue: queryValue,
        },
      });

      const responseTime = Date.now() - startTime;

      if (responseTime > 5000) {
        setApiStatus('slow');
      } else {
        setApiStatus('online');
      }

      if (functionError) {
        setApiStatus('offline');
        throw functionError;
      }

      if (functionData.error) {
        setApiStatus('offline');
        toast({
          title: 'Erro na API',
          description: functionData.message || 'A API retornou um erro.',
          variant: 'destructive',
        });
        setIsSearching(false);
        return;
      }

      if (functionData.notFound) {
        toast({
          title: 'Dados não encontrados',
          description: functionData.message || 'Nenhum dado foi encontrado para esta consulta.',
          variant: 'default',
        });
        setIsSearching(false);
        return;
      }

      setApiResult(functionData);

      // Invalidar o cache dos limites para atualizar na UI
      await queryClient.invalidateQueries({ queryKey: ['user-limits', profile?.id] });

      toast({
        title: 'Consulta realizada',
        description: 'Os dados foram recuperados com sucesso.',
      });

    } catch (error: any) {
      setApiStatus('offline');
      toast({
        title: 'Erro na consulta',
        description: error.message || 'Não foi possível realizar a consulta.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Gerar link compartilhável
  const handleShare = async () => {
    if (!apiResult?.data || !apiResult?.api) return;
    setIsSharing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: {
          apiName: apiResult.api,
          queryValue: queryValue,
          responseData: apiResult.data,
        },
      });
      if (error || !data?.url) throw error || new Error('Falha ao gerar link');
      setShareLink(data.url);
      setShareExpiry(new Date(data.expiresAt));
      setShowShareModal(true);
    } catch (err: any) {
      toast({
        title: 'Erro ao compartilhar',
        description: err?.message || 'Não foi possível gerar o link.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Countdown do link compartilhável
  useEffect(() => {
    if (!shareExpiry) return;
    const update = () => {
      const diff = shareExpiry.getTime() - Date.now();
      if (diff <= 0) { setShareTimeLeft('Expirado'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setShareTimeLeft(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [shareExpiry]);

  const getStatusIndicator = () => {
    if (apiStatus === 'checking') return <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />;
    if (apiStatus === 'online') return <div className="w-2 h-2 rounded-full bg-success" />;
    if (apiStatus === 'slow') return <div className="w-2 h-2 rounded-full bg-warning" />;
    return <div className="w-2 h-2 rounded-full bg-destructive" />;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between mb-2 md:mb-4 px-1">
        <p className="text-xs md:text-sm text-muted-foreground mr-4 leading-tight">{category.description}</p>
        {selectedApi && getStatusIndicator()}
      </div>
        <form onSubmit={handleSearch} className="space-y-3 md:space-y-4 bg-muted/20 p-3 md:p-6 rounded-2xl border border-muted/30">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor={`api-${category.id}`} className="text-[11px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground">Módulo de Consulta</Label>
            <Select value={selectedApi} onValueChange={setSelectedApi}>
              <SelectTrigger id={`api-${category.id}`}>
                <SelectValue placeholder="Selecione uma API" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  apis.reduce((acc: any, api) => {
                    const group = api.group_name || 'Geral';
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(api);
                    return acc;
                  }, {})
                ).map(([group, groupApis]: [string, any]) => (
                  <div key={group}>
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground bg-muted/20 uppercase tracking-widest border-b border-t border-muted/30">
                      {group}
                    </div>
                    {groupApis.map((api: any) => (
                      <SelectItem key={api.id} value={api.id}>
                        {api.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {selectedApi && (
              <p className="text-sm text-muted-foreground">
                {apis.find(a => a.id === selectedApi)?.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor={`query-${category.id}`} className="text-[11px] md:text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {selectedApi && apis.find(a => a.id === selectedApi)?.requirement 
                ? `Valor da Consulta (${apis.find(a => a.id === selectedApi)?.requirement})` 
                : 'Valor da Consulta'}
            </Label>
            <Input
              id={`query-${category.id}`}
              placeholder={selectedApi && apis.find(a => a.id === selectedApi)?.requirement 
                ? `Digite o formato esperado: ${apis.find(a => a.id === selectedApi)?.requirement}` 
                : "Selecione uma API primeiro..."}
              className="h-11 md:h-12 text-sm md:text-base bg-white border-muted/50 focus:ring-primary shadow-sm"
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              disabled={!selectedApi}
            />
          </div>

          <Button type="submit" className="w-full h-11 md:h-12 font-bold text-sm md:text-base shadow-md transition-all active:scale-[0.98]" disabled={isSearching || !selectedApi || !queryValue}>
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <SearchIcon className="mr-2 h-4 w-4" />
                Consultar
              </>
            )}
          </Button>
        </form>

      {apiResult && (
        <div className="mt-4 space-y-4">
          {/* Botão Compartilhar */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={isSharing}
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-semibold"
            >
              {isSharing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gerando link...</>
              ) : (
                <><Share2 className="h-4 w-4" /> Compartilhar resultado</>
              )}
            </Button>
          </div>

          {/* Modal de compartilhamento */}
          {showShareModal && shareLink && (
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 md:p-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-blue-100 text-blue-400 hover:text-blue-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-md">
                  <Share2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-blue-900 text-xs md:text-sm">Link Público Ativado</h3>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-white border border-amber-100 px-2.5 py-1 rounded-lg">
                  <Clock className="h-3 w-3" />
                  {shareTimeLeft}
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-blue-600/80 mb-4 font-medium italic border-l-2 border-blue-200 pl-2">Acesso livre sem login — Expira em instantes.</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareLink}
                  className="flex-1 text-xs bg-white border-blue-200 font-mono text-slate-700 h-9"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className={`h-9 px-3 gap-1.5 font-bold text-xs transition-all ${
                    copied ? 'bg-green-600 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copiado!</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(shareLink, '_blank')}
                  className="h-9 px-3 border-blue-200 hover:bg-blue-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <ApiResponse data={apiResult.data} apiName={apiResult.api} />
        </div>
      )}
    </div>
  );
}

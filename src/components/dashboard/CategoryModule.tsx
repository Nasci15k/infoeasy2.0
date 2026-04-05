import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search as SearchIcon } from 'lucide-react';
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

  const getStatusIndicator = () => {
    if (apiStatus === 'checking') return <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />;
    if (apiStatus === 'online') return <div className="w-2 h-2 rounded-full bg-success" />;
    if (apiStatus === 'slow') return <div className="w-2 h-2 rounded-full bg-warning" />;
    return <div className="w-2 h-2 rounded-full bg-destructive" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{category.description}</p>
        {selectedApi && getStatusIndicator()}
      </div>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`api-${category.id}`}>API</Label>
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
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30 uppercase tracking-wider">
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

          <div className="space-y-2">
            <Label htmlFor={`query-${category.id}`}>Valor da Consulta</Label>
            <Input
              id={`query-${category.id}`}
              placeholder="Ex: CPF, CNPJ, Placa..."
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              disabled={!selectedApi}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSearching || !selectedApi || !queryValue}>
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
        <div className="mt-4">
          <ApiResponse data={apiResult.data} apiName={apiResult.api} />
        </div>
      )}
    </div>
  );
}

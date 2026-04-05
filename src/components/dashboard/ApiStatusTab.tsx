import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ApiStatusTab() {
  const { toast } = useToast();
  
  const { data: categories, refetch } = useQuery({
    queryKey: ['categories-with-apis'],
    queryFn: async () => {
      const { data: cats, error: catsError } = await supabase
        .from('api_categories')
        .select('*')
        .order('name');
      
      if (catsError) throw catsError;

      const { data: apis, error: apisError } = await supabase
        .from('apis')
        .select('*')
        .order('name');
      
      if (apisError) throw apisError;

      return cats.map(cat => ({
        ...cat,
        apis: apis.filter(api => api.category_id === cat.id),
      }));
    },
  });

  const handleCheckStatus = async () => {
    try {
      toast({
        title: 'Verificando APIs...',
        description: 'Aguarde enquanto verificamos o status de todas as APIs.',
      });

      const { error } = await supabase.functions.invoke('check-api-status');
      
      if (error) throw error;

      await refetch();
      
      toast({
        title: 'Status atualizado!',
        description: 'O status de todas as APIs foi verificado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao verificar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (api: any) => {
    const lastCheck = api.last_status_check ? new Date(api.last_status_check) : null;
    const isRecent = lastCheck && (Date.now() - lastCheck.getTime()) < 300000; // 5 minutos
    
    if (api.is_active) {
      return (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <Badge variant="outline" className="text-success border-success/20">Online</Badge>
          </div>
          {api.status_response_time && (
            <span className="text-xs text-muted-foreground">{api.status_response_time}ms</span>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <Badge variant="outline" className="text-destructive border-destructive/20">Offline</Badge>
        </div>
        {!isRecent && (
          <span className="text-xs text-warning">Não verificado</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Verificação automática de status das APIs
        </p>
        <Button onClick={handleCheckStatus} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Verificar Status
        </Button>
      </div>
      
      {categories?.map((category) => (
        <Card key={category.id} className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              {category.name}
              <Badge variant="secondary" className="ml-auto">
                {category.apis.length} APIs
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>API</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.apis.map((api: any) => (
                  <TableRow key={api.id}>
                    <TableCell className="font-medium">{api.name}</TableCell>
                    <TableCell className="text-muted-foreground">{api.description || '-'}</TableCell>
                    <TableCell className="text-right">{getStatusBadge(api)}</TableCell>
                  </TableRow>
                ))}
                {category.apis.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhuma API nesta categoria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

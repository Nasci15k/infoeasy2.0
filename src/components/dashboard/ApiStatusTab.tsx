import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ApiStatusTab() {
  const { toast } = useToast();
  
  const { data: categories, refetch, isRefetching } = useQuery({
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
        title: 'Monitoramento Global',
        description: 'Sincronizando status de todos os clusters de API.',
      });

      const { error } = await supabase.functions.invoke('check-api-status');
      if (error) throw error;
      await refetch();
      toast({ title: 'Sincronização Finalizada', description: 'Todos os módulos operacionais foram auditados.' });
    } catch (error: any) {
      toast({ title: 'Erro de Auditoria', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (api: any) => {
    if (api.is_active) {
      return (
        <div className="flex items-center justify-end gap-3">
           <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Operacional</span>
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse-soft" />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{api.status_response_time || '45'}ms latency</span>
           </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-end gap-3">
         <div className="text-right">
            <div className="flex items-center justify-end gap-2">
               <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Offline</span>
               <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Esgotado / Manutenção</span>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
           <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">System <span className="text-blue-600">Health</span></h2>
           <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-1">Status em tempo real da infraestrutura de dados</p>
        </div>
        <Button onClick={handleCheckStatus} className="h-14 px-10 bg-white border border-slate-100 shadow-sm rounded-2xl text-blue-600 font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-blue-50 transition-all active:scale-[0.98]">
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar Diagnóstico
        </Button>
      </div>
      
      <div className="grid gap-10">
        {categories?.map((category) => (
          <Card key={category.id} className="bg-white border-white shadow-card rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 px-10 py-8">
              <CardTitle className="flex items-center gap-4">
                <span className="text-3xl">{category.icon}</span>
                <span className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{category.name}</span>
                <Badge className="ml-auto bg-blue-600 text-white font-black uppercase text-[9px] px-3">
                  {category.apis.length} Motores Ativos
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-slate-50 hover:bg-transparent">
                    <TableHead className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Motor de Busca</TableHead>
                    <TableHead className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo / Grupo</TableHead>
                    <TableHead className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Status Rede</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.apis.map((api: any) => (
                    <TableRow key={api.id} className="border-slate-50 hover:bg-slate-50/50 transition-all">
                      <TableCell className="px-10 py-6">
                         <div className="font-black text-slate-800 uppercase italic tracking-tight">{api.name}</div>
                         <div className="text-[10px] font-bold text-slate-400 mt-0.5">{api.description || 'Varredura de dados oficiais.'}</div>
                      </TableCell>
                      <TableCell className="px-10 py-6">
                         <Badge variant="outline" className="border-slate-200 text-slate-500 font-black uppercase text-[9px] px-2">
                            {api.group_name || 'Geral'}
                         </Badge>
                      </TableCell>
                      <TableCell className="px-10 py-6 text-right">{getStatusBadge(api)}</TableCell>
                    </TableRow>
                  ))}
                  {category.apis.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                           <AlertCircle className="h-8 w-8 text-slate-200" />
                           <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhuma API mapeada nesta categoria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, X, Loader2, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function QuickApiManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['admin-quick-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: apis, isLoading: loadingApis } = useQuery({
    queryKey: ['admin-quick-apis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('apis').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const moveApiMutation = useMutation({
    mutationFn: async ({ apiId, categoryId }: { apiId: string, categoryId: string | null }) => {
      const { error } = await supabase.from('apis').update({ category_id: categoryId }).eq('id', apiId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quick-apis'] });
      toast({ title: 'Mapeamento Atualizado' });
    }
  });

  if (loadingCats || loadingApis) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Mapeamento Rápido</h2>
          <p className="text-slate-400 font-bold text-sm mt-2">Arraste e organize as APIs entre as categorias do site e do bot.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map(category => {
          const categoryApis = apis?.filter(a => a.category_id === category.id) || [];
          const currentSearch = searchTerms[category.id] || '';
          
          return (
            <Card key={category.id} className="border-slate-100 shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">{category.name}</CardTitle>
                  </div>
                  <Badge className="bg-slate-900 text-white font-black text-[10px]">{categoryApis.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="min-h-[100px] max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {categoryApis.map(api => (
                      <div key={api.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[10px] font-black text-slate-700 uppercase truncate">{api.name}</span>
                          <span className="text-[8px] font-mono text-slate-400 truncate">{api.endpoint}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-rose-500 hover:bg-rose-50 shrink-0"
                          onClick={() => moveApiMutation.mutate({ apiId: api.id, categoryId: null })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <Input 
                      placeholder="Adicionar API..."
                      className="h-10 pl-9 text-[10px] font-bold uppercase rounded-xl"
                      value={currentSearch}
                      onChange={(e) => setSearchTerms({ ...searchTerms, [category.id]: e.target.value })}
                    />
                    
                    {currentSearch && (
                      <div className="absolute z-20 left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                        {apis?.filter(a => a.category_id !== category.id && (a.name.toLowerCase().includes(currentSearch.toLowerCase())))
                          .slice(0, 5).map(api => (
                          <div 
                            key={api.id}
                            className="p-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer border-b last:border-0"
                            onClick={() => {
                              moveApiMutation.mutate({ apiId: api.id, categoryId: category.id });
                              setSearchTerms({ ...searchTerms, [category.id]: '' });
                            }}
                          >
                            <span className="text-[9px] font-black uppercase text-slate-600">{api.name}</span>
                            <Plus className="h-3 w-3 text-blue-500" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

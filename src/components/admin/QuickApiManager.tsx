import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, X, Loader2, Edit2, Check, Move } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function QuickApiManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['admin-quick-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: apis, isLoading: loadingApis, refetch } = useQuery({
    queryKey: ['admin-quick-apis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('apis').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const updateApiMutation = useMutation({
    mutationFn: async ({ id, categoryId, name }: { id: string, categoryId?: string | null, name?: string }) => {
      const updates: any = {};
      if (categoryId !== undefined) updates.category_id = categoryId;
      if (name !== undefined) updates.name = name;
      
      const { error } = await supabase.from('apis').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalida e força o refetch imediato
      queryClient.invalidateQueries({ queryKey: ['admin-quick-apis'] });
      refetch(); 
      setEditingId(null);
      toast({ title: 'Sincronizado com o banco!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  });

  if (loadingCats || loadingApis) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-8 pb-32">
      <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Gestão Dinâmica</h2>
          <p className="text-blue-100 font-bold text-sm mt-2">Arraste as APIs (metaforicamente) e renomeie-as instantaneamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map(category => {
          const categoryApis = apis?.filter(a => a.category_id === category.id) || [];
          const currentSearch = searchTerms[category.id] || '';
          
          return (
            <Card key={category.id} className="border-slate-100 shadow-xl rounded-[2rem] overflow-hidden bg-white flex flex-col">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">{category.name}</CardTitle>
                  </div>
                  <Badge className="bg-blue-600 text-white font-black text-[10px]">{categoryApis.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col gap-4">
                {/* Lista de APIs */}
                <div className="min-h-[150px] max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {categoryApis.map(api => (
                    <div key={api.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl group hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex-1 mr-2 overflow-hidden">
                        {editingId === api.id ? (
                          <div className="flex items-center gap-1">
                            <Input 
                              className="h-8 text-[10px] font-black uppercase" 
                              value={tempName} 
                              onChange={e => setTempName(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && updateApiMutation.mutate({ id: api.id, name: tempName })}
                            />
                            <Button size="icon" className="h-8 w-8 bg-green-500" onClick={() => updateApiMutation.mutate({ id: api.id, name: tempName })}>
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col cursor-pointer" onClick={() => { setEditingId(api.id); setTempName(api.name); }}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-700 uppercase truncate">{api.name}</span>
                              <Edit2 className="h-2.5 w-2.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                            </div>
                            <span className="text-[8px] font-mono text-slate-400 truncate tracking-tight">{api.endpoint}</span>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-xl shrink-0"
                        onClick={() => updateApiMutation.mutate({ id: api.id, category_id: null })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {categoryApis.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-3xl text-slate-200">
                      <span className="text-[10px] font-black uppercase">Módulo Vazio</span>
                    </div>
                  )}
                </div>

                {/* Busca Global */}
                <div className="relative mt-auto">
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Puxar API p/ este módulo..."
                    className="h-10 pl-9 text-[10px] font-bold uppercase rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-200 transition-all"
                    value={currentSearch}
                    onChange={(e) => setSearchTerms({ ...searchTerms, [category.id]: e.target.value })}
                  />
                  
                  {currentSearch && (
                    <div className="absolute z-30 left-0 w-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl max-h-64 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b mb-1">Resultados Globais</div>
                      {apis?.filter(a => a.category_id !== category.id && (a.name.toLowerCase().includes(currentSearch.toLowerCase()) || a.endpoint.toLowerCase().includes(currentSearch.toLowerCase())))
                        .slice(0, 20).map(api => {
                          const otherCat = categories?.find(c => c.id === api.category_id);
                          return (
                            <div 
                              key={api.id}
                              className="p-3 hover:bg-blue-50 rounded-xl flex items-center justify-between cursor-pointer group/search mb-1"
                              onClick={() => {
                                updateApiMutation.mutate({ id: api.id, category_id: category.id });
                                setSearchTerms({ ...searchTerms, [category.id]: '' });
                              }}
                            >
                              <div className="flex flex-col overflow-hidden">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase text-slate-700">{api.name}</span>
                                  {otherCat && <Badge className="bg-slate-100 text-slate-400 text-[7px] font-black px-1 h-3">{otherCat.icon} {otherCat.name}</Badge>}
                                </div>
                                <span className="text-[8px] font-mono text-slate-300 truncate">{api.endpoint}</span>
                              </div>
                              <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover/search:bg-blue-600 group-hover/search:text-white transition-all">
                                <Plus className="h-4 w-4" />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

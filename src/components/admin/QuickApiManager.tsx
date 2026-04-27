import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, X, Loader2, Edit2, Check } from 'lucide-react';
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
      queryClient.invalidateQueries({ queryKey: ['admin-quick-apis'] });
      refetch(); 
      setEditingId(null);
      toast({ title: 'Atualizado!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: 'Verifique se rodou o comando SQL no banco!', variant: 'destructive' });
    }
  });

  if (loadingCats || loadingApis) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-8 pb-40">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Mapeamento Direto</h2>
        <p className="text-slate-400 font-bold text-sm mt-2">Clique no nome para renomear. Use a busca para mover APIs entre blocos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories?.map(category => {
          const categoryApis = apis?.filter(a => a.category_id === category.id) || [];
          const currentSearch = searchTerms[category.id] || '';
          
          return (
            <Card key={category.id} className="border-slate-100 shadow-xl rounded-[2.5rem] bg-white flex flex-col overflow-visible">
              <CardHeader className="bg-slate-50 border-b p-6 rounded-t-[2.5rem]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <CardTitle className="text-xs font-black uppercase tracking-widest">{category.name}</CardTitle>
                  </div>
                  <Badge className="bg-slate-900 text-white font-black text-[10px]">{categoryApis.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-visible">
                <div className="min-h-[150px] max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {categoryApis.map(api => (
                    <div key={api.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl group hover:border-blue-500 transition-all border border-transparent">
                      <div className="flex-1 mr-2 overflow-hidden">
                        {editingId === api.id ? (
                          <div className="flex items-center gap-1">
                            <Input className="h-7 text-[10px] font-black uppercase" value={tempName} onChange={e => setTempName(e.target.value)} autoFocus />
                            <Button size="icon" className="h-7 w-7 bg-green-500" onClick={() => updateApiMutation.mutate({ id: api.id, name: tempName })}><Check className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <div className="flex flex-col cursor-pointer" onClick={() => { setEditingId(api.id); setTempName(api.name); }}>
                            <span className="text-[10px] font-black text-slate-700 uppercase truncate">{api.name}</span>
                            <span className="text-[8px] font-mono text-slate-400 truncate">{api.endpoint}</span>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-100 rounded-xl" onClick={() => updateApiMutation.mutate({ id: api.id, category_id: null })}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>

                <div className="relative mt-auto">
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Pesquisar p/ adicionar..."
                    className="h-10 pl-9 text-[10px] font-bold uppercase rounded-xl border-slate-200"
                    value={currentSearch}
                    onChange={(e) => setSearchTerms({ ...searchTerms, [category.id]: e.target.value })}
                  />
                  
                  {currentSearch && (
                    <div className="absolute z-[999] left-0 w-full mt-2 bg-white border-2 border-slate-200 rounded-3xl shadow-2xl max-h-60 overflow-y-auto p-2">
                      {apis?.filter(a => a.category_id !== category.id && (a.name.toLowerCase().includes(currentSearch.toLowerCase())))
                        .slice(0, 20).map(api => (
                          <div 
                            key={api.id}
                            className="p-3 hover:bg-blue-600 hover:text-white rounded-2xl flex items-center justify-between cursor-pointer group mb-1 transition-colors"
                            onClick={() => {
                              updateApiMutation.mutate({ id: api.id, category_id: category.id });
                              setSearchTerms({ ...searchTerms, [category.id]: '' });
                            }}
                          >
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[10px] font-black uppercase truncate">{api.name}</span>
                              <span className="text-[8px] font-mono opacity-60 truncate">{api.endpoint}</span>
                            </div>
                            <Plus className="h-4 w-4" />
                          </div>
                        ))}
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

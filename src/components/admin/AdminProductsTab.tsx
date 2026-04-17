import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Database, Loader2, Image as ImageIcon, Terminal, ShieldCheck, Box } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminProductsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---------- APIS CRUD STATE ----------
  const [isApiOpen, setIsApiOpen] = useState(false);
  const [editingApiId, setEditingApiId] = useState<string | null>(null);
  const [apiForm, setApiForm] = useState({
    name: '',
    endpoint: '',
    slug: '',
    group_name: '',
    price_vip: 0,
    is_active: true,
  });

  const { data: apis, isLoading: loadingApis } = useQuery({
    queryKey: ['admin-apis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('apis').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const upsertApiMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingApiId) {
        const { error } = await supabase.from('apis').update(data).eq('id', editingApiId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('apis').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apis'] });
      toast({ title: editingApiId ? 'API Atualizada' : 'API Criada' });
      setIsApiOpen(false);
      resetApiForm();
    },
    onError: (error: any) => toast({ title: 'Erro', description: error.message, variant: 'destructive' })
  });

  const deleteApiMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('apis').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apis'] });
      toast({ title: 'API Removida' });
    }
  });

  const resetApiForm = () => {
    setApiForm({ name: '', endpoint: '', slug: '', group_name: '', price_vip: 0, is_active: true });
    setEditingApiId(null);
  };

  const handleEditApi = (api: any) => {
    setApiForm({
      name: api.name || '',
      endpoint: api.endpoint || '',
      slug: api.slug || '',
      group_name: api.group_name || '',
      price_vip: api.price_vip || 0,
      is_active: api.is_active !== false,
    });
    setEditingApiId(api.id);
    setIsApiOpen(true);
  };

  // ---------- DATABASES CRUD STATE ----------
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [editingDbId, setEditingDbId] = useState<string | null>(null);
  const [dbForm, setDbForm] = useState({
    name: '',
    description: '',
    price: 0,
    photo_url: '',
    database_url: ''
  });

  const { data: databases, isLoading: loadingDbs } = useQuery({
    queryKey: ['admin-databases'],
    queryFn: async () => {
      const { data, error } = await supabase.from('databases').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const upsertDbMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingDbId) {
        const { error } = await supabase.from('databases').update(data).eq('id', editingDbId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('databases').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-databases'] });
      toast({ title: editingDbId ? 'Base atualizada' : 'Base criada' });
      setIsDbOpen(false);
      resetDbForm();
    },
    onError: (error: any) => toast({ title: 'Erro', description: error.message, variant: 'destructive' })
  });

  const deleteDbMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('databases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-databases'] });
      toast({ title: 'Base Removida' });
    }
  });

  const resetDbForm = () => {
    setDbForm({ name: '', description: '', price: 0, photo_url: '', database_url: '' });
    setEditingDbId(null);
  };

  const handleEditDb = (db: any) => {
    setDbForm({
      name: db.name || '',
      description: db.description || '',
      price: db.price || 0,
      photo_url: db.photo_url || '',
      database_url: db.database_url || ''
    });
    setEditingDbId(db.id);
    setIsDbOpen(true);
  };

  if (loadingApis || loadingDbs) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  const apisGrouped = apis?.filter(a => a.group_name !== 'Checkers' && a.group_name !== 'SERPRO' && a.group_name !== 'SINESP' && a.group_name !== 'DATASUS' && a.group_name !== 'SISREG') || [];
  const checkersGrouped = apis?.filter(a => ['Checkers', 'SERPRO', 'SINESP', 'DATASUS', 'SISREG'].includes(a.group_name)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center">
             <Box className="h-7 w-7 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Catálogo de Produtos</h3>
            <p className="text-xs font-bold text-slate-400">Gerencie todos os módulos disponíveis no painel e bot.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="apis" className="space-y-8">
        <TabsList className="bg-white border p-1 rounded-2xl h-auto">
          <TabsTrigger value="apis" className="rounded-xl px-6 py-3 font-bold text-xs uppercase data-[state=active]:bg-orange-600 data-[state=active]:text-white"><Terminal className="h-4 w-4 mr-2" /> Módulos API</TabsTrigger>
          <TabsTrigger value="checkers" className="rounded-xl px-6 py-3 font-bold text-xs uppercase data-[state=active]:bg-indigo-600 data-[state=active]:text-white"><ShieldCheck className="h-4 w-4 mr-2" /> Checkers</TabsTrigger>
          <TabsTrigger value="databases" className="rounded-xl px-6 py-3 font-bold text-xs uppercase data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Database className="h-4 w-4 mr-2" /> Bases de Dados</TabsTrigger>
        </TabsList>

        {/* --- ABA APIS & CHECKERS COMUM --- */}
        {['apis', 'checkers'].map(tabValue => {
          const isCheckerTab = tabValue === 'checkers';
          const list = isCheckerTab ? checkersGrouped : apisGrouped;
          const bgTheme = isCheckerTab ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-600 hover:bg-orange-700';

          return (
            <TabsContent key={tabValue} value={tabValue} className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isApiOpen} onOpenChange={(v) => { setIsApiOpen(v); if (!v) resetApiForm(); }}>
                  <DialogTrigger asChild>
                    <Button className={`${bgTheme} text-white gap-2 rounded-xl h-11 font-bold uppercase text-[10px]`}>
                      <Plus className="h-4 w-4" /> {isCheckerTab ? 'Novo Checker' : 'Nova API'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white text-slate-900 border max-w-lg rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingApiId ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Nome Público</Label>
                          <Input value={apiForm.name} onChange={e => setApiForm({...apiForm, name: e.target.value})} className="bg-slate-50 border-slate-200 font-bold rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Slug / Comando</Label>
                          <Input value={apiForm.slug} onChange={e => setApiForm({...apiForm, slug: e.target.value.toLowerCase()})} className="bg-slate-50 border-slate-200 font-mono text-xs rounded-xl" placeholder="ex: cpf-plus" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Endpoint Real (URL ou Roteamento)</Label>
                        <Input value={apiForm.endpoint} onChange={e => setApiForm({...apiForm, endpoint: e.target.value})} className="bg-slate-50 border-slate-200 font-mono text-xs rounded-xl" placeholder="tconect:/consulta?..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Grupo / Categoria</Label>
                          <Input value={apiForm.group_name} onChange={e => setApiForm({...apiForm, group_name: e.target.value})} className="bg-slate-50 border-slate-200 rounded-xl" placeholder="Ex: IDENTIFICAÇÃO" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Status</Label>
                          <Select value={apiForm.is_active ? '1' : '0'} onValueChange={v => setApiForm({...apiForm, is_active: v === '1'})}>
                            <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Ativo (Online)</SelectItem>
                              <SelectItem value="0">Inativo (Manutenção)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={() => upsertApiMutation.mutate(apiForm)} disabled={upsertApiMutation.isPending} className={`w-full ${bgTheme} text-white h-12 rounded-xl font-black uppercase tracking-widest mt-4`}>
                        {upsertApiMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Salvar Módulo'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest px-6">Módulo / Slug</TableHead>
                      <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Endpoint Routing</TableHead>
                      <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Grupo</TableHead>
                      <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-right px-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map(api => (
                      <TableRow key={api.id} className="hover:bg-slate-50/50">
                        <TableCell className="px-6 py-4">
                          <div className="font-bold text-slate-800">{api.name}</div>
                          <Badge variant="outline" className="text-[9px] mt-1 uppercase bg-slate-100">{api.slug || 'SEM SLUG'}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-mono">{String(api.endpoint).substring(0, 40)}{String(api.endpoint).length > 40 && '...'}</code>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-[9px] uppercase border-none">{api.group_name || 'GERAL'}</Badge>
                        </TableCell>
                        <TableCell className="text-right px-6 space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditApi(api)} className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Excluir módulo permanentemente?')) deleteApiMutation.mutate(api.id); }} className="h-8 w-8 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 font-bold text-slate-400">Nenhum módulo cadastrado.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          );
        })}

        {/* --- ABA BASES DE DADOS --- */}
        <TabsContent value="databases" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isDbOpen} onOpenChange={(v) => { setIsDbOpen(v); if (!v) resetDbForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-11 font-bold uppercase text-[10px]">
                  <Plus className="h-4 w-4" /> Nova Base de Dados
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white text-slate-900 border max-w-md rounded-3xl">
                 <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingDbId ? 'Editar Base' : 'Cadastrar Nova Base'}</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Nome da Base</Label>
                       <Input value={dbForm.name} onChange={e => setDbForm({...dbForm, name: e.target.value})} className="bg-slate-50 border-slate-200 rounded-xl" placeholder="Ex: Base Nacional Completa" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Descrição</Label>
                       <Textarea value={dbForm.description} onChange={e => setDbForm({...dbForm, description: e.target.value})} className="bg-slate-50 border-slate-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Preço R$</Label>
                          <Input type="number" value={dbForm.price} onChange={e => setDbForm({...dbForm, price: Number(e.target.value)})} className="bg-slate-50 border-slate-200 rounded-xl" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">URL da Imagem</Label>
                          <Input value={dbForm.photo_url} onChange={e => setDbForm({...dbForm, photo_url: e.target.value})} className="bg-slate-50 border-slate-200 rounded-xl" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Link do Arquivo VIP</Label>
                       <Input value={dbForm.database_url} onChange={e => setDbForm({...dbForm, database_url: e.target.value})} className="bg-slate-50 border-slate-200 rounded-xl" />
                    </div>
                    <Button onClick={() => upsertDbMutation.mutate(dbForm)} disabled={upsertDbMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-black uppercase tracking-widest mt-4">
                       {upsertDbMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Salvar Base'}
                    </Button>
                 </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                 <TableRow>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest px-6">Preview</TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Detalhes</TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest">Valor</TableHead>
                    <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-right px-6">Ações</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {databases?.map(db => (
                    <TableRow key={db.id} className="hover:bg-slate-50/50">
                       <TableCell className="px-6 py-4">
                          {db.photo_url ? (
                             <img src={db.photo_url} alt={db.name} className="h-10 w-10 rounded-lg object-cover border" />
                          ) : (
                             <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-emerald-600" />
                             </div>
                          )}
                       </TableCell>
                       <TableCell>
                          <div className="font-bold text-slate-800">{db.name}</div>
                          <div className="text-[10px] text-slate-400 max-w-[250px] truncate">{db.description}</div>
                       </TableCell>
                       <TableCell><span className="font-black text-emerald-600 text-sm">R$ {db.price.toFixed(2)}</span></TableCell>
                       <TableCell className="text-right px-6 space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditDb(db)} className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Excluir base?')) deleteDbMutation.mutate(db.id); }} className="h-8 w-8 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
                       </TableCell>
                    </TableRow>
                 ))}
                 {databases?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 font-bold text-slate-400">Nenhuma base cadastrada.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

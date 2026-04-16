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
import { Plus, Pencil, Trash2, Database, Loader2, Image as ImageIcon } from 'lucide-react';

export function DatabasesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    photo_url: '',
    database_url: ''
  });

  const { data: databases, isLoading } = useQuery({
    queryKey: ['admin-databases'],
    queryFn: async () => {
      const { data, error } = await supabase.from('databases').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        const { error } = await supabase.from('databases').update(data).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('databases').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-databases'] });
      toast({ title: editingId ? 'Base atualizada' : 'Base criada' });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('databases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-databases'] });
      toast({ title: 'Base removida com sucesso' });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0, photo_url: '', database_url: '' });
    setEditingId(null);
  };

  const handleEdit = (db: any) => {
    setFormData({
      name: db.name,
      description: db.description,
      price: db.price,
      photo_url: db.photo_url,
      database_url: db.database_url
    });
    setEditingId(db.id);
    setIsOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Gerenciamento de Bases</h3>
          <p className="text-sm text-slate-400">Adicione ou edite as bases de dados disponíveis para compra.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-xl h-11 font-bold">
              <Plus className="h-4 w-4" /> Nova Base de Dados
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1C1A2E] border-white/10 text-white max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {editingId ? 'Editar Base' : 'Cadastrar Nova Base'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Nome da Base</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="bg-white/5 border-white/10 rounded-xl"
                  placeholder="Ex: Base CPF 2024"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Descrição</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="bg-white/5 border-white/10 rounded-xl min-h-[100px]"
                  placeholder="Breve descrição da base..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Preço (R$)</Label>
                  <Input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    className="bg-white/5 border-white/10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">URL da Imagem</Label>
                  <Input 
                    value={formData.photo_url} 
                    onChange={e => setFormData({...formData, photo_url: e.target.value})} 
                    className="bg-white/5 border-white/10 rounded-xl"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">URL/Link de Acesso (Privado)</Label>
                <Input 
                  value={formData.database_url} 
                  onChange={e => setFormData({...formData, database_url: e.target.value})} 
                  className="bg-white/5 border-white/10 rounded-xl"
                  placeholder="Link Mega/Drive/API..."
                />
              </div>
              <Button 
                onClick={() => upsertMutation.mutate(formData)} 
                className="w-full bg-primary hover:bg-primary/90 h-12 rounded-xl font-black uppercase tracking-widest mt-4"
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : (editingId ? 'Salvar Alterações' : 'Criar Base')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden overflow-x-auto shadow-2xl backdrop-blur-xl">
        <Table>
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-5">Preview</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-5">Nome</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-5">Preço</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-5 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {databases?.map((db) => (
              <TableRow key={db.id} className="border-white/5 hover:bg-white/[0.01] transition-colors">
                <TableCell>
                  {db.photo_url ? (
                    <img src={db.photo_url} alt={db.name} className="h-10 w-10 rounded-lg object-cover border border-white/10 shadow-lg" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-slate-600" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-bold text-white text-sm">{db.name}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{db.description}</div>
                </TableCell>
                <TableCell>
                  <span className="font-black text-emerald-400 text-sm">R$ {db.price.toFixed(2)}</span>
                </TableCell>
                <TableCell className="text-right py-4 space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(db)} className="h-9 w-9 p-0 hover:bg-white/10 rounded-lg text-primary">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { if(confirm('Tem certeza?')) deleteMutation.mutate(db.id); }} 
                    className="h-9 w-9 p-0 hover:bg-rose-500/10 rounded-lg text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {databases?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-slate-600 font-medium">Nenhuma base cadastrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

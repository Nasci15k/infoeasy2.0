import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Zap, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function ApiPlansTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_weekly: 0,
    price_monthly: 0,
    daily_limit: 10,
    is_active: true
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-api-plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_plans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        const { error } = await supabase.from('api_plans').update(data).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('api_plans').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-plans'] });
      toast({ title: editingId ? 'Plano atualizado' : 'Plano criado' });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-plans'] });
      toast({ title: 'Plano removido' });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price_weekly: 0, price_monthly: 0, daily_limit: 10, is_active: true });
    setEditingId(null);
  };

  const handleEdit = (plan: any) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price_weekly: plan.price_weekly,
      price_monthly: plan.price_monthly,
      daily_limit: plan.daily_limit,
      is_active: plan.is_active
    });
    setEditingId(plan.id);
    setIsOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Planos de API</h3>
          <p className="text-sm text-slate-400">Gerencie os pacotes de acesso do site.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2 rounded-xl h-11 font-bold italic">
              <Zap className="h-4 w-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1C1A2E] border-white/10 text-white max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight italic">
                {editingId ? 'Editar Plano' : 'Novo Plano de Acesso'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Título do Plano</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10 rounded-xl" placeholder="Ex: Plano Ultra" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Semanal (R$)</Label>
                  <Input type="number" value={formData.price_weekly} onChange={e => setFormData({...formData, price_weekly: Number(e.target.value)})} className="bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Mensal (R$)</Label>
                  <Input type="number" value={formData.price_monthly} onChange={e => setFormData({...formData, price_monthly: Number(e.target.value)})} className="bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Limite Diário (Consultas)</Label>
                <Input type="number" value={formData.daily_limit} onChange={e => setFormData({...formData, daily_limit: Number(e.target.value)})} className="bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Plano Ativo</span>
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({...formData, is_active: v})} />
              </div>
              <Button onClick={() => upsertMutation.mutate(formData)} className="w-full bg-primary hover:bg-primary/90 h-12 rounded-xl font-black uppercase tracking-widest mt-4 italic" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : (editingId ? 'Confirmar Edição' : 'Lançar Plano')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <Table>
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="border-white/5">
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-5">Nome</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-5">Limite</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-5">Semanal / Mensal</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-500 py-5 text-right">Status / Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map((plan) => (
              <TableRow key={plan.id} className="border-white/5 hover:bg-white/[0.01]">
                <TableCell className="font-black text-white italic">{plan.name}</TableCell>
                <TableCell className="text-slate-400 font-bold">{plan.daily_limit} con/dia</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <span className="text-[11px] font-black text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-lg">R$ {plan.price_weekly}</span>
                    <span className="text-[11px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded-lg">R$ {plan.price_monthly}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md mr-2 ${plan.is_active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                    {plan.is_active ? 'ATIVO' : 'INATIVO'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)} className="h-9 w-9 p-0 hover:bg-white/10 rounded-lg text-primary">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { if(confirm('Excluir plano?')) deleteMutation.mutate(plan.id); }} className="h-9 w-9 p-0 hover:bg-rose-500/10 rounded-lg text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

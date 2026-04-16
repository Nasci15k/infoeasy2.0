import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, ShieldCheck, UserPlus, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (planType: string, role: string, expiresAt: Date) => void;
  userName: string;
}

export function ApprovalDialog({ isOpen, onClose, onApprove, userName }: ApprovalDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [role, setRole] = useState<string>('usuario');
  const [daysToAdd, setDaysToAdd] = useState(30);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['available-plans-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_plans').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  const handleApprove = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);
    
    // Find plan name from ID
    const plan = plans?.find(p => p.id === selectedPlanId);
    const planName = plan ? plan.name : 'free';
    
    onApprove(planName, role, expiresAt);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-100 rounded-[2.5rem] max-w-lg p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-10 bg-slate-50 border-b border-slate-100">
           <div className="flex items-center gap-4 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                 <UserPlus className="h-6 w-6" />
              </div>
              <div>
                 <DialogTitle className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Aprovação de <span className="text-blue-600">Acesso</span></DialogTitle>
                 <DialogDescription className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mt-1">
                    Liberando credenciais para: {userName}
                 </DialogDescription>
              </div>
           </div>
        </DialogHeader>
        
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                 <ShieldCheck className="h-3 w-3 text-blue-600" /> Nível de Acesso
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-14 bg-white border-slate-100 rounded-xl font-bold text-slate-900 shadow-sm focus:ring-blue-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-100 rounded-xl shadow-xl">
                  <SelectItem value="teste" className="font-bold">Modo Teste (10/dia)</SelectItem>
                  <SelectItem value="usuario" className="font-bold">Usuário Standard</SelectItem>
                  <SelectItem value="usuario_premium" className="font-bold text-blue-600 italic">Premium VIP</SelectItem>
                  <SelectItem value="revendedor" className="font-bold text-emerald-600 italic">Revendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                 <Clock className="h-3 w-3 text-blue-600" /> Plano de Acesso
              </Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="h-14 bg-white border-slate-100 rounded-xl font-bold text-slate-900 shadow-sm focus:ring-blue-600">
                  <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione..."} />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-100 rounded-xl shadow-xl">
                  <SelectItem value="free" className="font-bold">Plano FREE</SelectItem>
                  {plans?.map(p => (
                    <SelectItem key={p.id} value={p.id} className="font-bold">
                       {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
               <Calendar className="h-3 w-3 text-blue-600" /> Período de Validade (Dias)
            </Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={daysToAdd}
                onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 1)}
                min={1}
                className="h-16 bg-slate-50 border-slate-100 rounded-xl font-black text-2xl text-slate-900 focus:ring-blue-600 text-center"
              />
              <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col justify-center">
                 <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest leading-none">Vencimento Programado</p>
                 <p className="text-sm font-black text-blue-600 italic mt-1">
                    {new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                 </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 sm:justify-center">
          <Button variant="ghost" onClick={onClose} className="h-14 px-8 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600">
            Descartar
          </Button>
          <Button onClick={handleApprove} className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
            Validar Operação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

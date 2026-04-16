import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, CreditCard, History, Loader2, Copy, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../ui/badge';

export function WalletTab() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);

  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ['wallet-transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const handleAddCredit = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 1) {
      toast({ title: 'Valor inválido', description: 'O mínimo para recarga é R$ 1,00', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('c7-create-payment', {
        body: { type: 'wallet', amount: val }
      });

      if (error) throw error;
      setPixData(data);
      toast({ title: 'Pix Gerado', description: 'Realize o pagamento para creditar seu saldo.' });
    } catch (err: any) {
      toast({ title: 'Erro ao gerar Pix', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (pixData?.pixCopiaECola) {
      navigator.clipboard.writeText(pixData.pixCopiaECola);
      toast({ title: 'Copiado!', description: 'Código Pix copiado.' });
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Balance Card */}
        <Card className="lg:col-span-2 bg-white border-white shadow-card rounded-[3rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
             <TrendingUp className="h-48 w-48 text-blue-600" />
          </div>
          <CardContent className="p-12 relative">
            <div className="flex items-center justify-between mb-10">
               <div className="h-16 w-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <Wallet className="h-8 w-8 text-white" />
               </div>
               <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black uppercase tracking-widest text-[9px] px-4 py-1.5 rounded-full">Sistema de Pagamentos Ativo</Badge>
            </div>
            
            <div className="space-y-2">
               <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Capital Disponível</p>
               <h2 className="text-7xl font-black text-slate-900 italic tracking-tighter">
                  R$ <span className="text-blue-600">{(profile?.balance || 0).toFixed(2)}</span>
               </h2>
            </div>

            <div className="mt-12 flex flex-wrap gap-4">
               <div className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse-soft" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recargas instantâneas via PIX 24/7</span>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card className="bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/20 rounded-[3rem] p-10 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10 pointer-events-none" />
          <CardContent className="p-0 space-y-8 relative">
            <div className="space-y-2 text-center">
               <h3 className="text-2xl font-black uppercase text-white italic tracking-tighter">Inserir Crédito</h3>
               <p className="text-[10px] text-blue-100 font-black uppercase tracking-widest">Sem taxas de processamento</p>
            </div>

            {!pixData ? (
              <div className="space-y-5">
                <div className="relative group">
                   <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-white/50 text-xl">R$</span>
                   <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="bg-white/10 border-white/20 h-20 pl-16 text-3xl font-black rounded-[1.5rem] focus:ring-white/40 focus:border-white/50 text-white placeholder:text-white/30 text-center"
                   />
                </div>
                <Button 
                   onClick={handleAddCredit}
                   disabled={loading || !amount}
                   className="w-full h-16 bg-white hover:bg-slate-50 text-blue-600 rounded-[1.5rem] font-black uppercase tracking-widest italic text-sm shadow-xl active:scale-[0.98] transition-all"
                >
                   {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Gerar QR Code"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                 <div className="bg-white p-5 rounded-[2rem] mx-auto w-fit shadow-2xl">
                    <img src={pixData.pixQrCode} alt="QR Code" className="w-48 h-48" />
                 </div>
                 <div className="space-y-3">
                    <Button 
                       variant="ghost" 
                       onClick={copyPix}
                       className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                    >
                       <Copy className="h-4 w-4 mr-2" /> Copiar Pix
                    </Button>
                    <Button 
                       variant="ghost" 
                       onClick={() => setPixData(null)}
                       className="text-blue-100 text-[9px] uppercase font-black tracking-widest hover:text-white"
                    >
                       Tentar Outro Valor
                    </Button>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-8">
         <div className="flex items-center justify-between px-2">
            <div>
               <h3 className="text-xl font-black uppercase text-slate-900 italic tracking-tighter">Extrato de <span className="text-blue-600">Fluxo</span></h3>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Últimas 10 movimentações</p>
            </div>
         </div>

         <div className="grid gap-4">
            {loadingTx ? (
              <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
            ) : (
              transactions?.map((tx: any) => (
                <div key={tx.id} className="p-8 rounded-[2rem] bg-white border border-white shadow-card flex items-center justify-between group hover:border-blue-100 transition-all duration-300">
                   <div className="flex items-center gap-6">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-colors ${
                        tx.amount > 0 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-rose-50 border-rose-100 text-rose-600'
                      }`}>
                         {tx.amount > 0 ? <Plus className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                      </div>
                      <div className="space-y-1">
                         <p className="text-base font-black text-slate-900 uppercase italic tracking-tight">
                            {tx.type === 'topup' ? 'Recarga de Saldo' : tx.description || 'Consulta VIP'}
                         </p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {format(new Date(tx.created_at), "dd 'DE' MMMM - HH:mm", { locale: ptBR })}
                         </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-2xl font-black italic tracking-tighter ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                         {tx.amount > 0 ? `+ R$ ${tx.amount.toFixed(2)}` : `- R$ ${Math.abs(tx.amount).toFixed(2)}`}
                      </p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                         <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Liquidado</span>
                      </div>
                   </div>
                </div>
              ))
            )}
            {transactions?.length === 0 && !loadingTx && (
              <div className="text-center py-24 bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
                 <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-xs underline underline-offset-8">Sem movimentação financeira</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

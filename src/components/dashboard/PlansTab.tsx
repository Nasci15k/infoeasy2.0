import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Zap, Check, ShieldCheck, Loader2, Sparkles, Clock, Star, Trophy } from 'lucide-react';

export function PlansTab() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [pixData, setPixData] = useState<any>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['available-plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_plans').select('*').eq('is_active', true).order('price_monthly', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const handlePurchase = async (planId: string, type: 'weekly' | 'monthly') => {
    setLoading(`${planId}-${type}`);
    try {
      const { data, error } = await supabase.functions.invoke('c7-create-payment', {
        body: { type: 'plan', planId, period: type }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar pagamento');
      setPixData(data.payment); // payment object from C7 response
    } catch (err: any) {
      toast({ title: 'Erro ao gerar Pix', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  if (pixData) {
    return (
      <div className="max-w-md mx-auto space-y-10 p-12 bg-white border border-slate-100 shadow-card rounded-[3rem] text-center animate-in zoom-in-95 duration-500">
        <div>
          <h3 className="text-3xl font-black uppercase text-slate-900 italic tracking-tighter">Ativação de <span className="text-blue-600">Plano</span></h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Acesso instantâneo após confirmação</p>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] mx-auto w-fit shadow-lg border border-slate-100">
           {(pixData.qrCodeBase64 || pixData.pixQrCode || pixData.qr_code_url) ? (
             <img src={pixData.qrCodeBase64 || pixData.pixQrCode || pixData.qr_code_url} alt="QR Code PIX" className="w-64 h-64" />
           ) : (
             <div className="w-64 h-64 bg-slate-50 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-100">
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest text-center">QR Code em breve</p>
               <p className="text-[10px] text-slate-300 font-bold uppercase text-center">Use o Copia e Cola abaixo</p>
             </div>
           )}
        </div>

        <div className="space-y-4">
           <Button 
              onClick={() => {
                navigator.clipboard.writeText(pixData.pixCopiaECola);
                toast({ title: 'Copiado!', description: 'Código Pix copiado!' });
              }}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-500/20"
           >
              Copiar Pix
           </Button>
           <Button variant="ghost" onClick={() => setPixData(null)} className="w-full h-12 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600">
              Escolher Outro Plano
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
         <h2 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Power <span className="text-blue-600">Access</span></h2>
         <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] max-w-xl mx-auto">Alta performance, consultas ilimitadas e precisão de dados em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-12">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`bg-white border-white relative rounded-[3rem] overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)] hover:-translate-y-3 transition-all duration-500 flex flex-col border-t-8 ${plan.name.toLowerCase().includes('premium') ? 'border-t-blue-600' : 'border-t-slate-100'}`}>
            {plan.name.toLowerCase().includes('premium') && (
              <div className="absolute top-6 right-8 px-4 py-2 bg-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest italic text-white shadow-xl z-20 animate-pulse-soft">
                Alta Demanda
              </div>
            )}
            
            <div className="p-10 space-y-10 flex-1">
               <div className="space-y-4">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                     {plan.name.toLowerCase().includes('start') ? <Clock className="h-8 w-8" /> : <Trophy className="h-8 w-8" />}
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">{plan.name}</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{plan.description || 'Ecossistema completo de inteligência empresarial.'}</p>
               </div>

               <div className="space-y-8">
                  <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-slate-900 italic">R$ {plan.price}</span>
                     <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">/ Período</span>
                  </div>
                  
                  <div className="space-y-5">
                    {[
                      `${plan.daily_limit} Varreduras Diárias`,
                      'Tempo de Resposta Premium',
                      'Suporte via Telegram VIP',
                      'Acesso Total aos Módulos',
                      'Dossis com Fotos HD'
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-4">
                         <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
                            <Check className="h-3.5 w-3.5 text-blue-600" />
                         </div>
                         <span className="text-[11px] font-black uppercase text-slate-500 tracking-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-4">
               <div className="flex flex-col gap-3">
                  {plan.price_weekly > 0 && (
                     <Button 
                        onClick={() => handlePurchase(plan.id, 'weekly')}
                        disabled={!!loading}
                        className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest italic shadow-xl shadow-emerald-500/10 active:scale-[0.98] transition-all"
                     >
                        {loading === `${plan.id}-weekly` ? <Loader2 className="animate-spin h-5 w-5" /> : `Semanal: R$ ${plan.price_weekly.toFixed(2)}`}
                     </Button>
                  )}
                  
                  {plan.price_monthly > 0 && (
                     <Button 
                        onClick={() => handlePurchase(plan.id, 'monthly')}
                        disabled={!!loading}
                        className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest italic shadow-xl shadow-blue-500/10 active:scale-[0.98] transition-all"
                     >
                        {loading === `${plan.id}-monthly` ? <Loader2 className="animate-spin h-5 w-5" /> : `Mensal: R$ ${plan.price_monthly.toFixed(2)}`}
                     </Button>
                  )}
               </div>
               <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest">Ativação instantânea via PIX</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

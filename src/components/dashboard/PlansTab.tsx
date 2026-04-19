import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Zap, Check, ShieldCheck, Loader2, Sparkles, Clock, Star, Trophy } from 'lucide-react';

  const [tab, setTab] = useState<'site' | 'telegram'>('site');

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans', tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_plans')
        .select('*')
        .eq('plan_type', tab)
        .eq('is_active', true)
        .order('duration_days', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handlePurchase = async (planId: string) => {
    setLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('miuse-create-payment', {
        body: { type: 'plan', planId }
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar pagamento');
      setPixData(data.payment); 
    } catch (err: any) {
      toast({ title: 'Erro ao gerar Pix', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const checkStatus = async () => {
    if (!pixData?.miuse_id || isVerifying) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('miuse-check-payment', {
        body: { payment_id: pixData.miuse_id }
      });
      
      if (data?.success && data?.status === 'paid') {
        toast({ title: 'Sucesso!', description: 'Pagamento confirmado! Seu acesso foi liberado.' });
        setPixData(null);
        setTimeout(() => window.location.reload(), 2000);
      } else if (data?.success) {
        toast({ title: 'Aguardando...', description: 'Ainda não identificamos o pagamento.' });
      }
    } catch (err: any) {
      console.error("Check error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Polling automático
  useEffect(() => {
    if (pixData) {
      const interval = setInterval(checkStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [pixData]);

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  if (pixData) {
    return (
      <div className="max-w-md mx-auto space-y-10 p-12 bg-white border border-slate-100 shadow-card rounded-[3rem] text-center animate-in zoom-in-95 duration-500">
        <div>
          <h3 className="text-3xl font-black uppercase text-slate-900 italic tracking-tighter">Ativação de <span className="text-blue-600">Plano</span></h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Acesso instantâneo após confirmação</p>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] mx-auto w-fit shadow-lg border border-slate-100">
           {pixData.pix_code ? (
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.pix_code)}`} 
               alt="QR Code PIX" 
               className="w-64 h-64" 
             />
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
                navigator.clipboard.writeText(pixData.pix_code);
                toast({ title: 'Copiado!', description: 'Código Pix copiado!' });
              }}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-500/20"
           >
              Copiar Pix
           </Button>
           
           <Button 
              onClick={checkStatus}
              disabled={isVerifying}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest gap-2"
           >
              {isVerifying ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              Já Paguei / Verificar
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
      <div className="text-center space-y-6">
         <h2 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Power <span className="text-blue-600">Access</span></h2>
         
         <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto border border-white/50 backdrop-blur-sm shadow-inner">
            <button 
              onClick={() => setTab('site')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'site' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Site + Bot
            </button>
            <button 
              onClick={() => setTab('telegram')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'telegram' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Bot Telegram VIP
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-12">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`bg-white border-white relative rounded-[3rem] overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.15)] hover:-translate-y-3 transition-all duration-500 flex flex-col border-t-8 ${tab === 'telegram' ? 'border-t-orange-600' : 'border-t-blue-600'}`}>
            <div className="p-10 space-y-10 flex-1">
               <div className="space-y-4">
                  <div className={`h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-${tab === 'telegram' ? 'orange' : 'blue'}-600 group-hover:text-white`}>
                     {plan.duration_days === 1 ? <Clock className="h-8 w-8" /> : (plan.duration_days <= 7 ? <Zap className="h-8 w-8" /> : <Trophy className="h-8 w-8" />)}
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">{plan.name}</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{plan.duration_days} dia(s) de acesso full.</p>
               </div>

               <div className="space-y-8">
                  <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-slate-900 italic">R$ {plan.price}</span>
                     <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">/ {plan.name}</span>
                  </div>
                  
                  <div className="space-y-5">
                    {(Array.isArray(plan.benefits) && plan.benefits.length > 0 ? plan.benefits : [
                      `${plan.daily_limit} Varreduras Diárias`,
                      'Tempo de Resposta Premium',
                      'Suporte via Telegram VIP',
                      'Acesso Total aos Módulos'
                    ]).map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-4">
                         <div className={`h-6 w-6 rounded-lg bg-${tab === 'telegram' ? 'orange' : 'blue'}-50 flex items-center justify-center border border-${tab === 'telegram' ? 'orange' : 'blue'}-100 transition-colors`}>
                            <Check className={`h-3.5 w-3.5 text-${tab === 'telegram' ? 'orange' : 'blue'}-600`} />
                         </div>
                         <span className="text-[11px] font-black uppercase text-slate-500 tracking-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100">
               <Button 
                  onClick={() => handlePurchase(plan.id)}
                  disabled={!!loading}
                  className={`w-full h-16 ${tab === 'telegram' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-2xl font-black uppercase tracking-widest italic shadow-xl active:scale-[0.98] transition-all`}
               >
                  {loading === plan.id ? <Loader2 className="animate-spin h-5 w-5" /> : `Assinar Agora`}
               </Button>
               <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest mt-4">Ativação instantânea via PIX</p>
            </div>
          </Card>
        ))}
        {plans?.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
             <Star className="h-12 w-12 text-slate-200 mx-auto" />
             <h3 className="text-xl font-black text-slate-300 uppercase italic">Novos planos em breve</h3>
          </div>
        )}
      </div>
    </div>
  );
}
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PLANS = [
  { id: 'diario', name: 'Plano Rápido (Diário)', price: 'R$ 9,90', limit: '50', days: 1, color: 'bg-zinc-800' },
  { id: 'semanal', name: 'Plano Plus (Semanal)', price: 'R$ 24,90', limit: '100 por dia', days: 7, color: 'bg-primary' },
  { id: 'mensal', name: 'Plano Pro (Mensal)', price: 'R$ 59,90', limit: 'Ilimitado', days: 30, color: 'bg-gradient-brand' }
];

export function CheckoutPlans() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pixData, setPixData] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
 
  const handleBuy = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Sessão inválida');

      // Mapping for legacy CheckoutPlans IDs to period
      const period = planId === 'semanal' ? 'weekly' : 'monthly';
      // We assume there's a default plan or we look up by id if it matches
      
      const { data, error } = await supabase.functions.invoke('miuse-create-payment', {
        body: { type: 'plan', planId: planId, period: period }
      });

      if (error || !data.success) {
        throw new Error(error?.message || data?.error || 'Erro ao gerar pagamento');
      }

      setPixData(data.payment);
      toast({ title: 'PIX Gerado', description: 'Escaneie o QR Code ou copie o código PIX para liberar seu acesso.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const checkStatus = async () => {
    if (!pixData?.miuse_id || isVerifying) return;
    setIsVerifying(true);
    try {
      const { data } = await supabase.functions.invoke('miuse-check-payment', {
        body: { payment_id: pixData.miuse_id }
      });
      
      if (data?.success && data?.status === 'paid') {
        toast({ title: 'Sucesso!', description: 'Pagamento confirmado! Sua conta foi ativada.' });
        window.location.reload(); 
      } else {
        toast({ title: 'Aguardando...', description: 'Pagamento ainda não identificado.' });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (pixData) {
      interval = setInterval(checkStatus, 10000);
    }
    return () => clearInterval(interval);
  }, [pixData]);

  if (pixData) {
    return (
      <Card className="max-w-md mx-auto shadow-primary border-primary/50 text-center">
        <CardHeader>
          <CardTitle>Pagamento PIX</CardTitle>
          <CardDescription>Escaneie o QR Code abaixo pelo app do seu banco. A liberação é imediata!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col items-center">
          <div className="bg-white p-2 rounded-xl border-2 border-slate-100">
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.pix_code)}`} 
               alt="QR Code PIX" 
               className="w-48 h-48" 
             />
          </div>
          <div className="w-full space-y-3">
            <p className="text-sm text-left mb-2 font-semibold">Copia e Cola:</p>
            <textarea 
              readOnly 
              className="w-full bg-muted p-2 rounded-md text-xs font-mono h-20 resize-none" 
              value={pixData.pix_code} 
              onClick={(e) => { (e.target as HTMLTextAreaElement).select(); navigator.clipboard.writeText(pixData.pix_code); toast({description: 'Copiado!'})}}
            />
            
            <Button 
               onClick={checkStatus}
               disabled={isVerifying}
               className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
               {isVerifying ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
               Já Paguei / Verificar Agora
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
           <Button variant="ghost" onClick={() => setPixData(null)}>Escolher Outro Plano</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTitle className="text-warning text-lg pb-2">Liberar Acesso Instantâneo</AlertTitle>
        <AlertDescription className="text-warning-foreground">
          Sua conta será ativada automaticamente assim que o pagamento for confirmado via PIX.
        </AlertDescription>
      </Alert>
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card key={plan.id} className="relative flex flex-col">
            <CardHeader className={`${plan.color} text-white rounded-t-xl pb-6`}>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold mt-2">{plan.price}</div>
            </CardHeader>
            <CardContent className="flex-1 pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>{plan.limit} Consultas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Validade de {plan.days} dia(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Tudo Desbloqueado</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleBuy(plan.id)}
                disabled={!!loadingPlan}
              >
                {loadingPlan === plan.id ? <Loader2 className="animate-spin h-5 w-5" /> : <><QrCode className="mr-2 h-5 w-5" /> Pagar com PIX</>}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Database, Search, ShoppingBag, Loader2, Lock, Unlock, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function DatabasesTab() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: databases, isLoading } = useQuery({
    queryKey: ['available-databases'],
    queryFn: async () => {
      const { data, error } = await supabase.from('databases').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: purchased, isLoading: loadingPurchased } = useQuery({
    queryKey: ['purchased-databases', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase.from('purchased_databases').select('database_id').eq('user_id', profile?.id);
      if (error) throw error;
      return data.map(p => p.database_id);
    },
    enabled: !!profile?.id
  });

  const handlePurchase = async (databaseId: string) => {
    setLoading(databaseId);
    try {
      const { data, error } = await supabase.functions.invoke('miuse-create-payment', {
        body: { type: 'database', dbId: databaseId }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar pagamento');
      setPixData(data.payment);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
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
        toast({ title: 'Sucesso!', description: 'Pagamento confirmado! Base de dados desbloqueada.' });
        setPixData(null);
        window.location.reload(); 
      } else if (data?.success) {
        toast({ title: 'Aguardando...', description: 'Ainda não identificamos o pagamento.' });
      }
    } catch (err: any) {
      console.error("Check error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredDatabases = databases?.filter(db => 
    db.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    db.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || loadingPurchased) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  if (pixData) {
    return (
      <div className="max-w-md mx-auto space-y-10 p-12 bg-white border border-slate-100 shadow-card rounded-[3rem] text-center animate-in zoom-in-95 duration-500">
        <div>
          <h3 className="text-3xl font-black uppercase text-slate-900 italic tracking-tighter">Confirmar <span className="text-blue-600">Aquisição</span></h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Acesso vitalício à base de dados selecionada</p>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] mx-auto w-fit shadow-lg border border-slate-100">
           {pixData.pix_code ? (
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.pix_code)}`} 
               alt="QR Code" 
               className="w-64 h-64" 
             />
           ) : (
             <div className="w-64 h-64 bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
             </div>
           )}
        </div>

        <div className="space-y-4">
           <Button 
              onClick={() => {
                navigator.clipboard.writeText(pixData.pix_code);
                toast({ title: 'Copiado!', description: 'Código Pix copiado com sucesso.' });
              }}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-500/20"
           >
              Copiar Pix (Copia e Cola)
           </Button>

           <Button 
              onClick={checkStatus}
              disabled={isVerifying}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest gap-2 shadow-lg"
           >
              {isVerifying ? <Loader2 className="animate-spin h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              Já Paguei / Desbloquear
           </Button>

           <Button variant="ghost" onClick={() => setPixData(null)} className="w-full h-12 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600">
              Cancelar e Escolher Outra
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="space-y-1 text-center md:text-left">
            <h2 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter">Database <span className="text-blue-600 italic">HUB</span></h2>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Repositórios de dados segmentados de alta fidelidade</p>
         </div>
         
         <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            <Input 
              placeholder="Pesquisar repositórios..." 
              className="pl-14 h-16 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-blue-600 font-bold text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredDatabases?.map((db) => {
          const isOwned = purchased?.includes(db.id);
          return (
            <Card key={db.id} className="bg-white border-white shadow-card rounded-[3rem] overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.12)] hover:-translate-y-3 transition-all duration-500 border-t-4 border-t-transparent hover:border-t-blue-600">
              <div className="relative h-56 overflow-hidden">
                 {db.photo_url ? (
                   <img src={db.photo_url} alt={db.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                 ) : (
                   <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                      <Database className="h-20 w-20 text-slate-100" />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                 
                 <div className="absolute bottom-6 left-8 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${isOwned ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'}`}>
                       {isOwned ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Status</p>
                       <p className={`text-xs font-black uppercase mt-1 ${isOwned ? 'text-emerald-600' : 'text-slate-900'}`}>{isOwned ? 'Desbloqueado' : 'Disponível'}</p>
                    </div>
                 </div>
              </div>

              <CardContent className="p-10 space-y-8">
                 <div className="space-y-3">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{db.name}</h3>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed line-clamp-3">{db.description || 'Base de dados otimizada para integração via API e downloads em massa.'}</p>
                 </div>

                 <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Investimento Único</p>
                       <p className="text-3xl font-black text-slate-900 italic tracking-tighter">R$ {db.price.toFixed(2)}</p>
                    </div>
                    
                    {isOwned ? (
                      <Button className="bg-slate-100 hover:bg-slate-200 h-14 rounded-2xl px-8 gap-3 font-black uppercase text-[10px] tracking-widest text-slate-900" asChild>
                         <a href={db.database_url} target="_blank" rel="noopener noreferrer">
                            Acessar <ExternalLink className="h-4 w-4 text-blue-600" />
                         </a>
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handlePurchase(db.id)}
                        disabled={!!loading}
                        className="bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl px-8 gap-3 font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-blue-500/20"
                      >
                         {loading === db.id ? <Loader2 className="animate-spin h-5 w-5" /> : <><ShoppingBag className="h-4 w-4" /> Adquirir</>}
                      </Button>
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

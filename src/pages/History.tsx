import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Database, Search, ArrowLeft, Clock, History as HistoryIcon, ChevronRight, Activity } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function History() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: history, isLoading } = useQuery({
    queryKey: ['query-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('query_history')
        .select(`
          *,
          apis (name, description, icon)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 py-20 max-w-5xl relative">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.02] pointer-events-none" />
        
        {/* Background Accents */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-100/30 blur-[100px] -z-10 rounded-full" />

        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 relative">
           <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="h-16 w-16 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:bg-slate-50 text-blue-600 transition-all active:scale-[0.95]"
              >
                 <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                 <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900">Histórico de <span className="text-blue-600">Buscas</span></h1>
                 <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Registro auditável de inteligência</p>
              </div>
           </div>
           
           <div className="px-8 py-4 bg-white border border-slate-100 rounded-[2rem] flex items-center gap-4 shadow-sm group hover:border-blue-200 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                 <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 italic tracking-tight leading-none block">{history?.length || 0}</span>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Total de Registros</span>
              </div>
           </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6 animate-in fade-in duration-500">
               <div className="h-16 w-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
               <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Indexando memória de busca...</p>
            </div>
          ) : history && history.length > 0 ? (
            <div className="grid gap-6">
              {history.map((item: any) => (
                <Card 
                  key={item.id} 
                  className="group relative bg-white border-white hover:border-blue-200 shadow-card hover:shadow-[0_20px_40px_-5px_rgba(37,99,235,0.08)] rounded-[2.5rem] overflow-hidden transition-all duration-500 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                   <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="h-20 w-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-105 transition-all duration-500">
                         <span className="text-4xl group-hover:rotate-6 transition-transform">{item.apis?.icon || '🔍'}</span>
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-3">
                           <span className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">{item.apis?.name}</span>
                           <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">Sucesso</Badge>
                         </div>
                         <div className="flex items-center gap-2.5 text-slate-400 font-bold">
                            <Search className="h-3.5 w-3.5" />
                            <span className="text-xs font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 group-hover:text-blue-600 transition-colors uppercase">{item.query_value}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Clock className="h-4 w-4 text-blue-600" />
                         <span className="text-[10px] font-black uppercase tracking-widest">
                            {format(new Date(item.created_at), "dd 'DE' MMM, HH:mm", { locale: ptBR })}
                         </span>
                      </div>
                      <Button variant="ghost" className="h-12 px-8 bg-slate-50 rounded-2xl text-blue-600 font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-[0.95]">
                         Rever Dossis <ChevronRight className="h-4 w-4" />
                      </Button>
                   </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] space-y-6">
               <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                 <HistoryIcon className="h-10 w-10 text-slate-200" />
               </div>
               <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic italic tracking-tighter">Histórico Vazio</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Você ainda não realizou varreduras<br />no ecossistema InfoEasy.</p>
               </div>
               <Button onClick={() => navigate('/')} className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] italic shadow-xl shadow-blue-500/20 active:scale-[0.98]">Navegar nos Módulos</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

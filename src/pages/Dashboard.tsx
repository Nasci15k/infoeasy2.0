import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, History, Shield, BarChart3, Search, Database, Zap, Wallet, 
  Activity, ArrowUpRight, TrendingUp, Users, Layout, Filter, X, Package
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiStatusTab } from '@/components/dashboard/ApiStatusTab';
import { WalletTab } from '@/components/dashboard/WalletTab';
import { PlansTab } from '@/components/dashboard/PlansTab';
import { ProductsTab } from '@/components/dashboard/ProductsTab';
import { ProfileTab } from '@/components/dashboard/ProfileTab';
import { TermsReminderModal } from '@/components/TermsReminderModal';
import { User as UserIcon } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [catSearch, setCatSearch] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('api_categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { count: apiCount } = await supabase.from('apis').select('*', { count: 'exact', head: true });
      const { count: catCount } = await supabase.from('api_categories').select('*', { count: 'exact', head: true });
      return { apis: apiCount || 0, modules: catCount || 0 };
    }
  });

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!catSearch) return categories;
    return categories.filter(c => 
      c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
      c.slug.toLowerCase().includes(catSearch.toLowerCase())
    );
  }, [categories, catSearch]);

  const getColorClasses = (group: string) => {
    switch (group) {
      case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600';
      case 'emerald': return 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600';
      case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600';
      case 'rose': return 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600';
      case 'purple': return 'bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600';
      case 'orange': return 'bg-orange-50 text-orange-600 border-orange-100 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600';
      case 'cyan': return 'bg-cyan-50 text-cyan-600 border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-600';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-slate-600 group-hover:text-white group-hover:border-slate-600';
    }
  };

  const getCardBorder = (group: string) => {
    switch (group) {
      case 'blue': return 'hover:border-t-blue-600';
      case 'emerald': return 'hover:border-t-emerald-600';
      case 'amber': return 'hover:border-t-amber-600';
      case 'rose': return 'hover:border-t-rose-600';
      case 'purple': return 'hover:border-t-purple-600';
      case 'orange': return 'hover:border-t-orange-600';
      case 'cyan': return 'hover:border-t-cyan-600';
      default: return 'hover:border-t-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 py-20 max-w-7xl relative">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.02] pointer-events-none" />
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10 mb-16 relative">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <Badge className="bg-blue-600 text-white border-blue-600 uppercase text-[10px] font-black tracking-widest px-3 py-1 rounded-full italic shadow-lg shadow-blue-500/20">Infraestrutura Ativa</Badge>
                 <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">InfoEasy Intelligence v2.0</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-slate-900 italic tracking-tighter uppercase leading-[0.8]">
                 Painel de <span className="text-blue-600">Inteligência</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-lg text-lg">Seja bem-vindo, <span className="text-slate-900 font-black">{profile?.full_name?.split(' ')[0]}</span>. Qual motor deseja iniciar hoje?</p>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
              {[
                { label: 'Saldo Wallet', val: `R$ ${(profile?.balance || 0).toFixed(2)}`, accent: 'slate' },
                { label: 'Plano Atual', val: profile?.plan_type || 'FREE', accent: 'blue' },
                { label: 'Motores Ativos', val: `+${stats?.apis || 0}`, accent: 'slate' },
                { label: 'Micro-Módulos', val: `+${stats?.modules || 0}`, accent: 'slate' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-card border border-blue-50/50 hover:border-blue-200 transition-all group">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{s.label}</p>
                   <h3 className={`text-2xl font-black italic uppercase ${s.accent === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>{s.val}</h3>
                </div>
              ))}
           </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="consultas" className="space-y-12">
          <TabsList className="bg-white/80 backdrop-blur-md p-2 rounded-[2.5rem] h-auto flex flex-wrap gap-2 w-fit border border-slate-200 shadow-xl mx-auto lg:mx-0">
            {[
              { value: 'consultas', label: 'Motores', icon: Search },
              { value: 'produtos', label: 'Produtos', icon: Package },
              { value: 'planos', label: 'Planos', icon: Zap },
              { value: 'carteira', label: 'Carteira', icon: Wallet },
              { value: 'perfil', label: 'Perfil', icon: UserIcon },
              { value: 'histórico', label: 'Histórico', icon: History, action: () => navigate('/history') },
              { value: 'status', label: 'Status', icon: Activity },
            ].map(tab => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                onClick={tab.action}
                className="data-[state=active]:bg-blue-600 h-14 px-8 rounded-[2rem] text-slate-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all gap-3 flex items-center shadow-none active:scale-[0.97]"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="consultas" className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
             {/* Module Search Bar */}
             <div className="relative max-w-2xl mx-auto lg:mx-0">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input 
                   placeholder="Pesquisar motor de inteligência (ex: CPF, Mãe, Placa)..."
                   className="h-16 pl-16 pr-14 bg-white border-white shadow-xl rounded-2xl font-bold text-slate-700 text-lg focus:ring-4 focus:ring-blue-100 transition-all"
                   value={catSearch}
                   onChange={(e) => setCatSearch(e.target.value)}
                />
                {catSearch && (
                  <button onClick={() => setCatSearch('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                )}
             </div>

             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCategories.map((cat) => (
                  <Link key={cat.id} to={`/${cat.slug}`} className="group relative block h-full">
                    <Card className={`bg-white border-white shadow-card rounded-[2.5rem] p-8 h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative border-t-4 border-t-transparent ${getCardBorder(cat.color_group)}`}>
                       <div className="flex items-center gap-6">
                          <div className={`h-16 w-16 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${getColorClasses(cat.color_group)}`}>
                             <span className="text-3xl">{cat.icon}</span>
                          </div>
                          
                          <div className="space-y-1">
                             <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">{cat.name}</h3>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acessar Varredura</p>
                          </div>
                       </div>
                       <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                          <ArrowUpRight className="h-12 w-12 text-blue-600" />
                       </div>
                    </Card>
                  </Link>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-4">
                     <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="h-10 w-10 text-slate-200" />
                     </div>
                     <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Nenhum motor encontrado</h3>
                     <p className="text-slate-400 font-bold">Tente outros termos como "CPF", "CNH" ou "Nome".</p>
                  </div>
                )}
             </div>
          </TabsContent>

          <TabsContent value="produtos" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
             <ProductsTab />
          </TabsContent>
          <TabsContent value="planos" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
             <PlansTab />
          </TabsContent>
          <TabsContent value="carteira" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
             <WalletTab />
          </TabsContent>
          <TabsContent value="status" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
             <ApiStatusTab />
          </TabsContent>
          <TabsContent value="perfil" className="animate-in fade-in slide-in-from-bottom-6 duration-700">
             <ProfileTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Terms reminder modal — shown on first access */}
      <TermsReminderModal />
    </div>
  );
}

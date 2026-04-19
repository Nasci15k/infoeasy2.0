import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  Database, Search, ShoppingBag, Loader2, Lock, Unlock, ExternalLink,
  Cpu, Shield, ChevronRight, Zap, Package
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── APIs Catalog ────────────────────────────────────────────────────
function ApisCatalog() {
  const [search, setSearch] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['apis-catalog-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_categories')
        .select('id, name, slug, icon, color_group')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: apis } = useQuery({
    queryKey: ['all-apis-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apis')
        .select('id, name, category_id, group_name, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const filteredCategories = categories?.filter((cat) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const catApis = apis?.filter((a) => a.category_id === cat.id) || [];
    return (
      cat.name.toLowerCase().includes(s) ||
      catApis.some((a) => a.name.toLowerCase().includes(s))
    );
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );

  return (
    <div className="space-y-10">
      <div className="relative max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
        <Input
          placeholder="Buscar API por nome ou categoria..."
          className="pl-14 h-14 bg-white border-slate-100 rounded-2xl shadow-sm font-bold text-slate-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {filteredCategories?.map((cat) => {
          const catApis = apis?.filter((a) => a.category_id === cat.id) || [];
          if (catApis.length === 0) return null;
          return (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">
                  {cat.name}
                </h3>
                <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black text-[10px] uppercase tracking-widest">
                  {catApis.length} APIs
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catApis.map((api) => (
                  <div
                    key={api.id}
                    className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <Cpu className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight truncate">
                        {api.name}
                      </p>
                      {api.group_name && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {api.group_name}
                        </p>
                      )}
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" title="Ativo" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Databases (with purchase flow) ──────────────────────────────────
function DatabasesSection() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePurchase = async (databaseId: string) => {
    setLoading(databaseId);
    try {
      const { data, error } = await supabase.functions.invoke('miuse-create-payment', {
        body: { type: 'database', dbId: databaseId },
      });
      if (error) throw new Error(error.message);
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
      const { data } = await supabase.functions.invoke('miuse-check-payment', {
        body: { payment_id: pixData.miuse_id }
      });
      if (data?.success && data?.status === 'paid') {
        toast({ title: 'Sucesso!', description: 'Pagamento confirmado! Base desbloqueada.' });
        window.location.reload(); 
      } else {
        toast({ title: 'Aguardando...', description: 'Pagamento não identificado.' });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredDatabases = databases?.filter(
    (db) =>
      db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (db.description || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );

  if (pixData) {
    return (
      <div className="max-w-md mx-auto space-y-10 p-12 bg-white border border-slate-100 shadow-card rounded-[3rem] text-center animate-in zoom-in-95 duration-500">
        <div>
          <h3 className="text-3xl font-black uppercase text-slate-900 italic tracking-tighter">
            Confirmar <span className="text-blue-600">Aquisição</span>
          </h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            Acesso vitalício à base de dados selecionada
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] mx-auto w-fit shadow-lg border border-slate-100">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.pix_code)}`} 
            alt="QR Code" 
            className="w-64 h-64" 
          />
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
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest gap-2"
          >
            {isVerifying ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            Confirmar Pagamento
          </Button>

          <Button
            variant="ghost"
            onClick={() => setPixData(null)}
            className="w-full h-12 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600"
          >
            Cancelar e Escolher Outra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="relative max-w-2xl group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
        <Input
          placeholder="Pesquisar repositórios..."
          className="pl-14 h-14 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-blue-600 font-bold text-slate-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {(!filteredDatabases || filteredDatabases.length === 0) ? (
        <div className="text-center py-20 space-y-4">
          <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-100">
            <Database className="h-10 w-10 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">
            Nenhuma base disponível
          </h3>
          <p className="text-slate-400 font-bold text-sm">
            Novas bases serão adicionadas em breve. Fique atento!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredDatabases?.map((db) => {
            const isOwned = purchased?.includes(db.id);
            return (
              <Card
                key={db.id}
                className="bg-white border-white shadow-card rounded-[3rem] overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.12)] hover:-translate-y-3 transition-all duration-500 border-t-4 border-t-transparent hover:border-t-blue-600"
              >
                <div className="relative h-48 overflow-hidden">
                  {db.photo_url ? (
                    <img
                      src={db.photo_url}
                      alt={db.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                      <Database className="h-16 w-16 text-slate-100" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                  <div className="absolute bottom-4 left-6 flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${isOwned ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
                    >
                      {isOwned ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <p
                      className={`text-xs font-black uppercase ${isOwned ? 'text-emerald-600' : 'text-slate-900'}`}
                    >
                      {isOwned ? 'Desbloqueado' : 'Disponível'}
                    </p>
                  </div>
                </div>

                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                      {db.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed line-clamp-3">
                      {db.description || 'Base de dados otimizada para integração via API.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Investimento Único
                      </p>
                      <p className="text-2xl font-black text-slate-900 italic tracking-tighter">
                        R$ {db.price.toFixed(2)}
                      </p>
                    </div>
                    {isOwned ? (
                      <Button
                        className="bg-slate-100 hover:bg-slate-200 h-12 rounded-2xl px-6 gap-2 font-black uppercase text-[10px] tracking-widest text-slate-900"
                        asChild
                      >
                        <a href={db.database_url} target="_blank" rel="noopener noreferrer">
                          Acessar <ExternalLink className="h-4 w-4 text-blue-600" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePurchase(db.id)}
                        disabled={!!loading}
                        className="bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl px-6 gap-2 font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-blue-500/20"
                      >
                        {loading === db.id ? (
                          <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4" /> Adquirir
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckersSection() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePurchase = async (checkerId: string) => {
    setLoading(checkerId);
    try {
      const { data, error } = await supabase.functions.invoke('miuse-create-payment', {
        body: { type: 'checker', dbId: checkerId },
      });
      if (error) throw new Error(error.message);
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
      const { data } = await supabase.functions.invoke('miuse-check-payment', {
        body: { payment_id: pixData.miuse_id }
      });
      if (data?.success && data?.status === 'paid') {
        toast({ title: 'Sucesso!', description: 'Pagamento confirmado! Módulo ativado.' });
        window.location.reload(); 
      } else {
        toast({ title: 'Aguardando...', description: 'Pagamento não identificado.' });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredCheckers = checkers?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
      </div>
    );

  if (pixData) {
    return (
      <div className="max-w-md mx-auto space-y-10 p-12 bg-white border border-slate-100 shadow-card rounded-[3rem] text-center animate-in zoom-in-95 duration-500">
        <div>
          <h3 className="text-3xl font-black uppercase text-indigo-900 italic tracking-tighter">
            Ativar <span className="text-indigo-600">Checker</span>
          </h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            Acesso vitalício ao módulo de verificação
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] mx-auto w-fit shadow-lg border border-slate-100">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.pix_code)}`} 
            alt="QR Code" 
            className="w-64 h-64" 
          />
        </div>
        <div className="space-y-4">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(pixData.pix_code);
              toast({ title: 'Copiado!', description: 'Código Pix copiado com sucesso.' });
            }}
            className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-indigo-500/20"
          >
            Copiar Pix (Copia e Cola)
          </Button>

          <Button
            onClick={checkStatus}
            disabled={isVerifying}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest gap-2"
          >
            {isVerifying ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            Confirmar Ativação
          </Button>

          <Button
            variant="ghost"
            onClick={() => setPixData(null)}
            className="w-full h-12 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600"
          >
            Cancelar e Escolher Outro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="relative max-w-2xl group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
        <Input
          placeholder="Pesquisar verificadores (Checkers)..."
          className="pl-14 h-14 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-indigo-600 font-bold text-slate-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {(!filteredCheckers || filteredCheckers.length === 0) ? (
        <div className="text-center py-20 space-y-4">
          <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-100">
            <Shield className="h-10 w-10 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">
            Nenhum checker disponível
          </h3>
          <p className="text-slate-400 font-bold text-sm">
            Novos módulos governamentais em breve.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCheckers?.map((c) => {
            const isOwned = purchased?.includes(c.id);
            return (
              <Card
                key={c.id}
                className="bg-white border-white shadow-card rounded-[3rem] overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.12)] hover:-translate-y-3 transition-all duration-500 border-t-4 border-t-transparent hover:border-t-indigo-600"
              >
                <div className="relative h-48 overflow-hidden">
                  {c.photo_url ? (
                    <img
                      src={c.photo_url}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                      <Shield className="h-16 w-16 text-indigo-100" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                  <div className="absolute bottom-4 left-6 flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${isOwned ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/20'}`}
                    >
                      {isOwned ? <Unlock className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] uppercase tracking-widest">
                       {isOwned ? 'Ativado' : 'Premium'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed line-clamp-3">
                      {c.description || 'Módulo de verificação em tempo real com alta precisão.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Ativação Vitalícia
                      </p>
                      <p className="text-2xl font-black text-slate-900 italic tracking-tighter">
                        R$ {c.price.toFixed(2)}
                      </p>
                    </div>
                    {isOwned ? (
                      <Button
                        className="bg-indigo-50 hover:bg-indigo-100 h-12 rounded-2xl px-6 gap-2 font-black uppercase text-[10px] tracking-widest text-indigo-700"
                        asChild
                      >
                        <a href={c.database_url} target="_blank" rel="noopener noreferrer">
                          Acessar <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePurchase(c.id)}
                        disabled={!!loading}
                        className="bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl px-6 gap-2 font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-indigo-500/20"
                      >
                        {loading === c.id ? (
                          <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                          <>
                            <Zap className="h-4 w-4" /> Ativar Agora
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ProductsTab ─────────────────────────────────────────────────
export function ProductsTab() {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h2 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
          Produtos & <span className="text-blue-600">Serviços</span>
        </h2>
        <p className="text-slate-400 font-black uppercase tracking-[0.15em] text-[10px]">
          APIs de consulta · Bases de dados · Checkers governamentais
        </p>
      </div>

      <Tabs defaultValue="apis" className="space-y-8">
        <TabsList className="bg-white/80 backdrop-blur-md p-2 rounded-[2rem] h-auto flex gap-2 w-fit border border-slate-200 shadow-xl">
          {[
            { value: 'apis', label: 'APIs', icon: Cpu },
            { value: 'databases', label: 'Databases', icon: Database },
            { value: 'checkers', label: 'Checkers', icon: Shield },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-blue-600 h-12 px-6 rounded-[1.5rem] text-slate-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all gap-2 flex items-center"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="apis" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ApisCatalog />
        </TabsContent>
        <TabsContent value="databases" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DatabasesSection />
        </TabsContent>
        <TabsContent value="checkers" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CheckersSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

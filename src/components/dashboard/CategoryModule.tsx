import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search as SearchIcon, Share2, Wallet, Info, Zap, ShieldCheck, Activity, Globe, Database, Filter } from 'lucide-react';
import { ApiResponse } from '@/components/ApiResponse';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface CategoryModuleProps {
  category: any;
  apis: any[];
  limits: any;
}

export function CategoryModule({ category, apis, limits }: CategoryModuleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [selectedApiId, setSelectedApiId] = useState('');
  const [queryValue, setQueryValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [apiResult, setApiResult] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline' | 'slow'>('checking');

  // Share link state
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareExpiry, setShareExpiry] = useState<Date | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareTimeLeft, setShareTimeLeft] = useState('');

  const selectedApi = apis.find(a => a.id === selectedApiId);

  // Filtered APIs
  const filteredApis = useMemo(() => {
    if (!searchTerm) return apis;
    return apis.filter(api => 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (api.group_name && api.group_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [apis, searchTerm]);

  const getPlaceholder = () => {
    if (!selectedApi) return "Selecione o motor de busca abaixo...";
    const req = (selectedApi.requirement || '').toLowerCase();
    if (req.includes('cpf')) return "Insira o CPF (Somente números)";
    if (req.includes('placa')) return "Insira a Placa (Ex: ABC1D23)";
    if (req.includes('cnpj')) return "Insira o CNPJ (Somente números)";
    if (req.includes('nome')) return "Insira o Nome Completo";
    if (req.includes('telefone')) return "Insira o Telefone com DDD";
    return `Insira o valor para ${selectedApi.requirement || 'busca'}...`;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApiId || !queryValue) {
      toast({ title: 'Campos obrigatórios', description: 'Selecione uma API e insira o valor.', variant: 'destructive' });
      return;
    }

    const planExpires = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
    const isPlanExpired = planExpires && planExpires < new Date();
    if (!profile?.plan_type || profile.plan_type === 'free' || isPlanExpired) {
      toast({ title: 'Plano Necessário', description: 'Ative um plano para realizar consultas.', variant: 'destructive' });
      return;
    }

    if (selectedApi?.is_web_vip) {
      const price = selectedApi.vip_price || 0;
      if (Number(profile?.balance || 0) < price) {
        toast({ title: 'Saldo Insuficiente', description: 'Recarregue sua carteira para esta consulta VIP.', variant: 'destructive' });
        return;
      }
    }

    setIsSearching(true);
    setApiResult(null);
    setApiStatus('checking');
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('query-api', {
        body: { apiId: selectedApiId, queryValue: queryValue },
      });

      const responseTime = Date.now() - startTime;
      setApiStatus(responseTime > 10000 ? 'slow' : 'online');

      if (error || data.error) {
        setApiStatus('offline');
        throw new Error(data?.message || error?.message || 'Falha na varredura');
      }

      setApiResult(data);
      await queryClient.invalidateQueries({ queryKey: ['user-limits'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({ title: 'Operação Concluída', description: 'Registros recuperados do banco de dados.' });
    } catch (err: any) {
      setApiStatus('offline');
      toast({ title: 'Erro de Varredura', description: err.message, variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleShare = async () => {
    if (!apiResult?.data) return;
    setIsSharing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-share-link', {
        body: { apiName: apiResult.api, queryValue, responseData: apiResult.data },
      });
      if (error) throw error;
      setShareLink(data.url);
      setShareExpiry(new Date(data.expiresAt));
      setShowShareModal(true);
    } catch (err: any) {
      toast({ title: 'Erro de Compartilhamento', description: 'Não foi possível gerar o link temporário.', variant: 'destructive' });
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    if (!shareExpiry) return;
    const update = () => {
      const diff = shareExpiry.getTime() - Date.now();
      if (diff <= 0) { setShareTimeLeft('Expirado'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setShareTimeLeft(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [shareExpiry]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <span className="text-3xl">{category.icon}</span>
               <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{category.name}</h2>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none">Inteligência de varredura avançada</p>
         </div>
         {selectedApi && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white shadow-sm ${
               apiStatus === 'online' ? 'border-emerald-100 text-emerald-600' :
               apiStatus === 'slow' ? 'border-amber-100 text-amber-600' :
               'border-rose-100 text-rose-600'
            }`}>
               <Activity className={`h-3 w-3 ${apiStatus === 'online' ? 'animate-pulse' : ''}`} />
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  Status Provedor: {apiStatus.toUpperCase()}
               </span>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* API Selection Sidebar */}
         <div className="lg:col-span-4 space-y-6">
            <div className="relative group">
               <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
               <Input 
                  placeholder="Pesquisar módulo..." 
                  className="h-12 pl-11 bg-white border-slate-100 rounded-xl font-bold text-slate-900 shadow-sm focus:ring-blue-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
               {filteredApis.map((api) => (
                  <Card 
                     key={api.id}
                     onClick={() => {
                        setSelectedApiId(api.id);
                        setApiResult(null);
                        setQueryValue('');
                     }}
                     className={`p-4 cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group ${
                        selectedApiId === api.id 
                           ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/20 translate-x-1' 
                           : 'bg-white border-white hover:border-blue-100 hover:bg-slate-50 shadow-sm'
                     }`}
                  >
                     <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                           <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                              selectedApiId === api.id ? 'text-blue-200' : 'text-slate-400'
                           }`}>
                              {api.group_name || 'Geral'}
                           </p>
                           <h4 className={`text-sm font-black uppercase italic tracking-tighter ${
                              selectedApiId === api.id ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'
                           }`}>
                              {api.name}
                           </h4>
                        </div>
                        {api.is_web_vip && (
                           <Badge className={`h-5 text-[9px] font-black ${
                              selectedApiId === api.id ? 'bg-white text-blue-600' : 'bg-amber-100 text-amber-600'
                           }`}>VIP</Badge>
                        )}
                     </div>
                     <div className={`mt-3 pt-3 border-t flex items-center justify-between ${
                        selectedApiId === api.id ? 'border-white/10' : 'border-slate-50'
                     }`}>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                           selectedApiId === api.id ? 'text-blue-300' : 'text-slate-300'
                        }`}>Requisição: {api.requirement || 'Vários'}</span>
                        <Zap className={`h-3 w-3 ${selectedApiId === api.id ? 'text-white' : 'text-blue-100'}`} />
                     </div>
                  </Card>
               ))}
               {filteredApis.length === 0 && (
                  <div className="p-10 text-center space-y-3">
                     <Database className="h-10 w-10 text-slate-100 mx-auto" />
                     <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Nenhum módulo encontrado</p>
                  </div>
               )}
            </div>
         </div>

         {/* Search & Results Area */}
         <div className="lg:col-span-8 space-y-8">
            <Card className="bg-white border-white shadow-card rounded-[2.5rem] p-10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20" />
               <form onSubmit={handleSearch} className="space-y-8">
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Parâmetro de Entrada</Label>
                        {selectedApi && (
                           <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50 border-slate-100 text-slate-400">
                              Módulo Ativo: {selectedApi.name}
                           </Badge>
                        )}
                     </div>
                     <div className="relative group">
                        <Input
                           placeholder={getPlaceholder()}
                           value={queryValue}
                           onChange={(e) => setQueryValue(e.target.value)}
                           disabled={!selectedApiId || isSearching}
                           className="h-20 bg-slate-50 border-none text-2xl font-black text-slate-900 rounded-2xl pl-16 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-200"
                        />
                        <Zap className={`absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 transition-colors ${
                           selectedApiId ? 'text-blue-600' : 'text-slate-200'
                        }`} />
                     </div>
                  </div>

                  <Button 
                     type="submit"
                     disabled={!selectedApiId || !queryValue || isSearching}
                     className={`w-full h-20 rounded-2xl font-black uppercase tracking-widest text-lg shadow-2xl transition-all active:scale-[0.98] ${
                        isSearching 
                           ? 'bg-slate-100 text-slate-300' 
                           : selectedApi?.is_web_vip
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                     }`}
                  >
                     {isSearching ? (
                        <div className="flex items-center gap-4">
                           <Loader2 className="h-6 w-6 animate-spin" />
                           <span>Processando Varredura...</span>
                        </div>
                     ) : (
                        <div className="flex items-center gap-4">
                           {selectedApi?.is_web_vip ? <Wallet className="h-6 w-6" /> : <SearchIcon className="h-6 w-6" />}
                           <span>{selectedApi?.is_web_vip ? `Pagar e Varrer (R$ ${selectedApi.vip_price?.toFixed(2)})` : 'Iniciar Varredura'}</span>
                        </div>
                     )}
                  </Button>
               </form>
            </Card>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-start gap-4">
               <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                  <ShieldCheck className="h-5 w-5 text-white" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest leading-none">Security Protocol Active</p>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                     As consultas são auditadas em tempo real. Certifique-se de que os dados inseridos estão corretos para garantir a fidelidade do relatório final.
                  </p>
               </div>
            </div>

            {apiResult && (
               <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-top-10 duration-1000">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                     <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Relatório Consolidado</h3>
                     </div>
                     <Button variant="ghost" onClick={handleShare} disabled={isSharing} className="h-10 gap-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <Share2 className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Partilhar</span>
                     </Button>
                  </div>
                  <ApiResponse data={apiResult.data} apiName={apiResult.api} />
               </div>
            )}
         </div>
      </div>

      {/* Simplified Share Modal Overlay */}
      {showShareModal && shareLink && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <Card className="w-full max-w-xl bg-slate-900 border-slate-800 rounded-[3rem] p-12 shadow-3xl text-white relative overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Globe className="h-64 w-64" />
               </div>
               <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                     <h4 className="text-3xl font-black italic uppercase tracking-tighter">Link de <span className="text-blue-500">Acesso</span></h4>
                     <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Expira em: {shareTimeLeft}</span>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <Input readOnly value={shareLink} className="h-16 bg-white/5 border-white/10 text-slate-300 font-bold rounded-2xl" />
                     <Button onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                     }} className="h-16 px-8 bg-blue-600 font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-500/20">
                        {copied ? 'Copiado!' : 'Copiar'}
                     </Button>
                  </div>
                  <Button variant="ghost" onClick={() => setShowShareModal(false)} className="w-full h-14 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest">Fechar Janela</Button>
               </div>
            </Card>
         </div>
      )}
    </div>
  );
}

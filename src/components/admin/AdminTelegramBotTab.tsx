import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Save, Eye, EyeOff, MessageSquareText, Shield, Bot, Pencil, Trash2 } from 'lucide-react';

export function AdminTelegramBotTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'config' | 'broadcast' | 'modules' | 'plans'>('config');

  // --- CONFIG STATE ---
  const [botSettings, setBotSettings] = useState({ telegram_token: '', discord_token: '', discord_app_id: '', discord_public_key: '', external_api_token: '', external_api_url: '' });
  const [showToken, setShowToken] = useState(false);
  const [botProfile, setBotProfile] = useState({ name: '', description: '', short_description: '' });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isRegisteringTg, setIsRegisteringTg] = useState(false);
  const [isRegisteringDc, setIsRegisteringDc] = useState(false);

  // --- BROADCAST STATE ---
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastDays, setBroadcastDays] = useState('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // --- PLANS STATE ---
  const [planForm, setPlanForm] = useState({ id: null as string | null, name: '', price: 0, duration_days: 30, daily_limit: 100, is_active: true, benefits: '' });

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('bot_settings').select('key, value');
      if (data) {
        const cfg: Record<string, string> = {};
        data.forEach((s: any) => { cfg[s.key] = s.value; });
        setBotSettings({ ...botSettings, ...cfg });
      }
    };
    loadSettings();
  }, []);

  const { data: apis } = useQuery({
    queryKey: ['admin-apis-vip'],
    queryFn: async () => {
      const { data } = await supabase.from('apis').select('*').order('name');
      return data || [];
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories-vip'],
    queryFn: async () => {
      const { data } = await supabase.from('api_categories').select('*').order('name');
      return data || [];
    }
  });

  const { data: botPlans } = useQuery({
    queryKey: ['admin-bot-plans'],
    queryFn: async () => {
      const { data } = await supabase.from('site_plans').select('*').eq('plan_type', 'telegram').order('price');
      return data || [];
    }
  });

  // --- HANDLERS: CONFIG ---
  const handleSaveSettings = async () => {
    setIsSavingConfig(true);
    try {
      await supabase.functions.invoke('register-bots', { body: { action: 'save_settings', settings: botSettings } });
      toast({ title: 'Configurações de infraestrutura salvas!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleUpdateBotProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-bots', {
        body: { action: 'update_bot_info', name: botProfile.name, description: botProfile.description, short_description: botProfile.short_description }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.message || data.error);
      toast({ title: 'Perfil do bot atualizado no Telegram!' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar perfil', description: err.message, variant: 'destructive' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRegisterTelegram = async () => {
    setIsRegisteringTg(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-bots', { body: { action: 'register_telegram' } });
      if (error) throw error;
      toast({ title: data.success ? 'Webhook configurado!' : 'Atenção', description: data.message });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsRegisteringTg(false);
    }
  };

  const handleRegisterDiscord = async () => {
    setIsRegisteringDc(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-bots', { body: { action: 'register_discord' } });
      if (error) throw error;
      toast({ title: data.success ? 'Discord configurado!' : 'Atenção', description: data.message });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsRegisteringDc(false);
    }
  };

  // --- HANDLERS: BROADCAST ---
  const handleBroadcast = async () => {
    if (!broadcastMsg) return toast({ title: 'Campo vazio', variant: 'destructive' });
    setIsBroadcasting(true);
    try {
      const days = broadcastDays === 'all' ? null : parseInt(broadcastDays);
      const { data, error } = await supabase.functions.invoke('register-bots', {
        body: { action: 'send_broadcast', message: broadcastMsg, days_ago: days }
      });
      if (error) throw error;
      toast({ title: 'Broadcast Iniciado!', description: data.message });
      setBroadcastMsg('');
    } catch (err: any) {
      toast({ title: 'Erro no disparo', description: err.message, variant: 'destructive' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // --- HANDLERS: MODULES ---
  const toggleApiVip = async (apiId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('apis').update({ is_vip: !currentStatus }).eq('id', apiId);
    if (!error) {
      toast({ title: 'Status VIP da consulta alterado.' });
      queryClient.invalidateQueries({ queryKey: ['admin-apis-vip'] });
    }
  };

  const toggleCategoryVip = async (catId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('api_categories').update({ is_vip: !currentStatus }).eq('id', catId);
    if (!error) {
      toast({ title: 'Status VIP do módulo completo alterado.' });
      queryClient.invalidateQueries({ queryKey: ['admin-categories-vip'] });
    }
  };

  // --- HANDLERS: PLANS ---
  const handleSavePlan = async () => {
    const pData = {
       name: planForm.name, price: planForm.price, duration_days: planForm.duration_days, 
       daily_limit: planForm.daily_limit, is_active: planForm.is_active, plan_type: 'telegram',
       benefits: planForm.benefits.split(',').map(s => s.trim()).filter(Boolean)
    };
    if (planForm.id) {
       await supabase.from('site_plans').update(pData).eq('id', planForm.id);
    } else {
       await supabase.from('site_plans').insert([pData]);
    }
    toast({ title: 'Plano Bot Salvo!' });
    setPlanForm({ id: null, name: '', price: 0, duration_days: 30, daily_limit: 100, is_active: true, benefits: '' });
    queryClient.invalidateQueries({ queryKey: ['admin-bot-plans'] });
  };
  
  const handleDeletePlan = async (id: string) => {
    if(!confirm('Excluir plano de Bot?')) return;
    await supabase.from('site_plans').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-bot-plans'] });
    toast({ title: 'Plano deletado' });
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Mini Nav within Bot Tab */}
      <div className="flex gap-4 p-2 bg-white/5 backdrop-blur-md rounded-2xl w-fit border border-slate-200">
        <Button variant={activeTab === 'config' ? 'default' : 'ghost'} onClick={() => setActiveTab('config')} className={activeTab === 'config' ? 'bg-blue-600' : 'text-slate-500'}>Configurações</Button>
        <Button variant={activeTab === 'broadcast' ? 'default' : 'ghost'} onClick={() => setActiveTab('broadcast')} className={activeTab === 'broadcast' ? 'bg-blue-600' : 'text-slate-500'}>Disparo (Broadcast)</Button>
        <Button variant={activeTab === 'modules' ? 'default' : 'ghost'} onClick={() => setActiveTab('modules')} className={activeTab === 'modules' ? 'bg-blue-600' : 'text-slate-500'}>Módulos VIP</Button>
        <Button variant={activeTab === 'plans' ? 'default' : 'ghost'} onClick={() => setActiveTab('plans')} className={activeTab === 'plans' ? 'bg-blue-600' : 'text-slate-500'}>Planos VIP</Button>
      </div>

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 space-y-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] border-white">
            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2"><Bot className="text-blue-600" /> Infraestrutura BOT</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Telegram Master Token</Label>
                <div className="relative">
                  <Input type={showToken ? 'text' : 'password'} value={botSettings.telegram_token} onChange={(e) => setBotSettings({...botSettings, telegram_token: e.target.value})} className="h-12 bg-slate-50 border-slate-100 rounded-xl font-mono text-sm" />
                  <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowToken(!showToken)}>{showToken ? <EyeOff className="h-4 w-4 text-slate-400"/> : <Eye className="h-4 w-4 text-slate-400"/>}</Button>
                </div>
              </div>
              <Button onClick={handleRegisterTelegram} disabled={isRegisteringTg} className="w-full h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold">
                {isRegisteringTg ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sincronizar Webhook Telegram'}
              </Button>
              
              <div className="space-y-2 pt-4 border-t border-slate-50">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Discord App ID</Label>
                <Input value={botSettings.discord_app_id} onChange={(e) => setBotSettings({...botSettings, discord_app_id: e.target.value})} className="h-12 bg-slate-50 border-slate-100 rounded-xl font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Discord Token</Label>
                <Input type="password" value={botSettings.discord_token} onChange={(e) => setBotSettings({...botSettings, discord_token: e.target.value})} className="h-12 bg-slate-50 border-slate-100 rounded-xl font-mono text-sm" />
              </div>
              <Button onClick={handleRegisterDiscord} disabled={isRegisteringDc} className="w-full h-12 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold">
                {isRegisteringDc ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sincronizar Comandos Discord'}
              </Button>

              <Button onClick={handleSaveSettings} disabled={isSavingConfig} className="w-full h-12 mt-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg">
                {isSavingConfig ? <Loader2 className="animate-spin h-5 w-5" /> : 'Salvar Todos os Tokens'}
              </Button>
            </div>
          </Card>

          <Card className="p-8 space-y-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] border-white">
            <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2"><Pencil className="text-blue-600" /> Identidade Visual</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Nome Oficial do Bot</Label>
                <Input placeholder="Ex: InfoEasy Bot Oficial" value={botProfile.name} onChange={(e) => setBotProfile({...botProfile, name: e.target.value})} className="h-12 bg-slate-50 border-slate-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Breve Descrição (Short)</Label>
                <Input placeholder="Escreva uma frase de efeito rápida." value={botProfile.short_description} onChange={(e) => setBotProfile({...botProfile, short_description: e.target.value})} className="h-12 bg-slate-50 border-slate-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Descrição Completa</Label>
                <Textarea placeholder="Mensagem completa sobre as maravilhas do Bot." value={botProfile.description} onChange={(e) => setBotProfile({...botProfile, description: e.target.value})} className="bg-slate-50 border-slate-100 rounded-xl" />
              </div>
              <Button onClick={handleUpdateBotProfile} disabled={isUpdatingProfile} className="w-full h-12 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-600">
                {isUpdatingProfile ? <Loader2 className="animate-spin h-5 w-5" /> : 'Atualizar Perfil no Telegram'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <Card className="p-8 max-w-4xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] border-white space-y-6">
           <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2"><MessageSquareText className="text-blue-600" /> Disparo em Massa (Broadcast)</h3>
           <p className="text-sm text-slate-500 font-medium">Use essa ferramenta com moderação para não cair no anti-spam do Telegram. Envie novidades, promoções e cupons para usuários que já iniciaram o bot.</p>
           
           <div className="space-y-4">
              <div className="space-y-2">
                 <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Público Alvo (Última Interação)</Label>
                 <Select value={broadcastDays} onValueChange={setBroadcastDays}>
                    <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-xl font-bold max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Todos os usuários registrados</SelectItem>
                       <SelectItem value="30">Últimos 30 Dias</SelectItem>
                       <SelectItem value="15">Últimos 15 Dias</SelectItem>
                       <SelectItem value="5">Últimos 5 Dias (Mais Ativos)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Mensagem (Permite marcação HTML como &lt;b&gt;, &lt;i&gt;)</Label>
                <Textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Ex: Olá! Temos novos módulos de consultas..." className="h-40 bg-slate-50 border-slate-100 rounded-xl resize-none text-base p-4" />
              </div>
              <Button onClick={handleBroadcast} disabled={isBroadcasting} className="h-16 px-10 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/30">
                 {isBroadcasting ? <><Loader2 className="animate-spin h-5 w-5 mr-3" /> Enviando Background...</> : <><Send className="h-5 w-5 mr-3" /> Disparar Mensagem Telegram</>}
              </Button>
           </div>
        </Card>
      )}

      {activeTab === 'modules' && (
        <Card className="p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] border-white space-y-10">
           <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-amber-500" />
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Gestão de Restrições Telegran</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Defina o que é bloqueado para usuários gratuitos no bot.</p>
              </div>
           </div>
           
           <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                 <Bot className="h-4 w-4 text-blue-600" />
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">1. Módulos Inteiros (Categorias)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {categories?.map(cat => (
                    <div key={cat.id} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-colors ${cat.is_vip ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                       <div className="flex flex-col truncate pr-2">
                          <span className="text-sm font-bold text-slate-800 truncate">{cat.icon} {cat.name}</span>
                          <span className="text-[9px] font-black tracking-widest uppercase text-amber-600">Categoria Completa</span>
                       </div>
                       <Switch checked={cat.is_vip} onCheckedChange={() => toggleCategoryVip(cat.id, cat.is_vip)} className="data-[state=checked]:bg-amber-500" />
                    </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                 <Shield className="h-4 w-4 text-blue-600" />
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">2. Consultas Avulsas (APIs Específicas)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {apis?.map(api => (
                    <div key={api.id} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-colors ${api.is_vip ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}>
                       <div className="flex flex-col truncate pr-2">
                          <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">{api.group_name || 'Diversos'}</span>
                          <span className="text-sm font-bold text-slate-800 truncate">{api.name}</span>
                       </div>
                       <Switch checked={api.is_vip} onCheckedChange={() => toggleApiVip(api.id, api.is_vip)} className="data-[state=checked]:bg-blue-600" />
                    </div>
                 ))}
              </div>
           </div>
        </Card>
      )}

      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <Card className="lg:col-span-4 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] border-white space-y-6 bg-[#0F172A] text-white">
              <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">{planForm.id ? 'Editar Plano' : 'Criar Novo Plano BOT'}</h3>
              <div className="space-y-4">
                 <div>
                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nome do Plano</Label>
                    <Input value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} className="bg-white/10 border-white/10 text-white" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Preço (R$)</Label>
                      <Input type="number" value={planForm.price} onChange={e => setPlanForm({...planForm, price: parseFloat(e.target.value)})} className="bg-white/10 border-white/10 text-white" />
                   </div>
                   <div>
                      <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Duração (Dias)</Label>
                      <Input type="number" value={planForm.duration_days} onChange={e => setPlanForm({...planForm, duration_days: parseInt(e.target.value)})} className="bg-white/10 border-white/10 text-white" />
                   </div>
                 </div>
                 <div>
                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Benefícios (sep. por vírgula)</Label>
                    <Textarea value={planForm.benefits} onChange={e => setPlanForm({...planForm, benefits: e.target.value})} className="bg-white/10 border-white/10 text-white text-xs h-20" />
                 </div>
                 <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-xs font-bold text-slate-300">Status Ativo</span>
                    <Switch checked={planForm.is_active} onCheckedChange={(v) => setPlanForm({...planForm, is_active: v})} />
                 </div>
                 <Button onClick={handleSavePlan} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-14 rounded-xl">Salvar Plano</Button>
                 {planForm.id && <Button variant="ghost" onClick={() => setPlanForm({ id: null, name: '', price: 0, duration_days: 30, daily_limit: 100, is_active: true, benefits: '' })} className="w-full text-slate-400 text-xs">Cancelar Edição</Button>}
              </div>
           </Card>

           <div className="lg:col-span-8 flex flex-col gap-4">
              {botPlans?.map(p => (
                 <Card key={p.id} className="p-6 rounded-2xl flex items-center justify-between border-slate-100 hover:border-blue-100 transition-colors shadow-sm">
                    <div className="flex flex-col">
                       <span className="text-xl font-black text-slate-900 italic uppercase">{p.name}</span>
                       <span className="text-xs font-bold text-emerald-600 tracking-wider">R$ {p.price.toFixed(2)} — {p.duration_days} Dias</span>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => setPlanForm({...p, benefits: p.benefits?.join(', ') || ''})} className="text-blue-600"><Pencil className="h-4 w-4" /></Button>
                       <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(p.id)} className="text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                 </Card>
              ))}
              {botPlans?.length === 0 && <div className="text-center p-10 text-slate-400 font-bold uppercase text-xs">Nenhum plano cadastrado.</div>}
           </div>
        </div>
      )}

    </div>
  );
}

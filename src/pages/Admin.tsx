import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCheck, UserX, Settings, BarChart2, Store, Bot, Save, Loader2, Send, Terminal, Globe, Eye, EyeOff, Database, Zap, Sparkles, Users, LayoutDashboard, Search } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminStats } from '@/components/admin/AdminStats';
import { ApprovalDialog } from '@/components/admin/ApprovalDialog';
import { SellersTab } from '@/components/admin/SellersTab';
import { ApiTokensTab } from '@/components/admin/ApiTokensTab';
import { AdminProductsTab } from '@/components/admin/AdminProductsTab';
import { ApiPlansTab } from '@/components/admin/ApiPlansTab';
import { AdminTelegramBotTab } from '@/components/admin/AdminTelegramBotTab';
import { QuickApiManager } from '@/components/admin/QuickApiManager';
import { useUserRole } from '@/hooks/useUserRole';

export default function Admin() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [editingLimits, setEditingLimits] = useState<string | null>(null);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [monthlyLimit, setMonthlyLimit] = useState(300);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Bot settings state
  const [botSettings, setBotSettings] = useState({
    telegram_token: '',
    discord_token: '',
    discord_app_id: '',
    discord_public_key: '',
    site_url: '',
    external_api_token: '',
    external_api_url: '',
  });

  const [savingBots, setSavingBots] = useState(false);
  const [registeringTg, setRegisteringTg] = useState(false);
  const [registeringDc, setRegisteringDc] = useState(false);
  const [registerResult, setRegisterResult] = useState<{ type: 'telegram' | 'discord'; message: string; success: boolean } | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!profile || !isAdmin) {
      navigate('/');
      toast({ title: 'Acesso restrito', description: 'Área exclusiva para administradores.', variant: 'destructive' });
    }
  }, [profile, isAdmin, loading, roleLoading, navigate, toast]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadBotSettings = async () => {
      const { data, error } = await (supabase as any).from('bot_settings').select('key, value');
      if (error || !data) return;
      const cfg: Record<string, string> = {};
      data.forEach((s: any) => { cfg[s.key] = s.value; });
      setBotSettings({
        telegram_token: cfg['telegram_token'] || '',
        discord_token: cfg['discord_token'] || '',
        discord_app_id: cfg['discord_app_id'] || '',
        discord_public_key: cfg['discord_public_key'] || '',
        site_url: cfg['site_url'] || 'https://infoeasy.com.br',
        external_api_token: cfg['external_api_token'] || '5d3En20IijT73XWENEKbtfw6cTnd3Inq_v3ZUQB4PC8',
        external_api_url: cfg['external_api_url'] || 'http://23.81.118.36:7070/',
      });
    };
    loadBotSettings();
  }, [isAdmin]);

  const handleSaveBotSettings = async () => {
    setSavingBots(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-bots', {
        body: { action: 'save_settings', settings: botSettings },
      });
      if (error) throw error;
      toast({ title: 'Configurações Salvas' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'destructive' });
    } finally {
      setSavingBots(false);
    }
  };

  const handleRegisterTelegram = async () => {
    setRegisteringTg(true);
    setRegisterResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('register-bots', {
        body: { action: 'register_telegram' },
      });
      if (error) throw error;
      setRegisterResult({ type: 'telegram', message: data?.message || 'Webhook configurado!', success: !!data?.success });
    } catch (err: any) {
      setRegisterResult({ type: 'telegram', message: err?.message, success: false });
    } finally {
      setRegisteringTg(false);
    }
  };

  const handleRegisterDiscord = async () => {
    setRegisteringDc(true);
    setRegisterResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('register-bots', {
        body: { action: 'register_discord' },
      });
      if (error) throw error;
      setRegisterResult({ type: 'discord', message: data?.message || 'Comandos registrados!', success: !!data?.success });
    } catch (err: any) {
      setRegisterResult({ type: 'discord', message: err?.message, success: false });
    } finally {
      setRegisteringDc(false);
    }
  };

  const toggleShowToken = (key: string) => setShowTokens(prev => ({ ...prev, [key]: !prev[key] }));

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profilesError) throw profilesError;
      const { data: limits, error: limitsError } = await supabase.from('user_limits').select('*');
      if (limitsError) throw limitsError;
      return profiles.map(profile => ({
        ...profile,
        limits: limits.find(l => l.user_id === profile.id),
        user_role: profile.role || 'user'
      }));
    },
    enabled: !!isAdmin,
  });

  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveUser = async (userId: string, planType: string, role: string, expiresAt: Date) => {
    try {
      const { data: oldProfile } = await supabase.from('profiles').select('plan_type').eq('id', userId).single();
      
      const { error } = await supabase.from('profiles').update({ 
        status: 'approved', 
        plan_type: planType, 
        role: role,
        plan_expires_at: expiresAt.toISOString(), 
        updated_at: new Date().toISOString() 
      }).eq('id', userId);
      
      if (error) throw error;

      // Log assignment history
      await supabase.from('admin_assignment_logs').insert({
        user_id: userId,
        admin_id: profile?.id,
        plan_name: planType,
        prev_plan: oldProfile?.plan_type || 'none',
        new_expires_at: expiresAt.toISOString()
      });

      await refetchUsers();
      toast({ title: 'Acesso Atualizado', description: `Plano ${planType} atribuído com sucesso.` });
    } catch (error: any) {
      toast({ title: 'Erro na operação', description: error.message, variant: 'destructive' });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw error;
      await refetchUsers();
      toast({ title: 'Usuários Suspenso' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const updateLimitsMutation = useMutation({
    mutationFn: async ({ userId, daily, monthly }: { userId: string; daily: number; monthly: number }) => {
      const { error } = await supabase.from('user_limits').update({ daily_limit: daily, monthly_limit: monthly }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({ title: 'Limites Atualizados' });
      setEditingLimits(null);
    }
  });

  if (loading || roleLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;
  if (!profile || !isAdmin) return null;

  const pendingUsers = filteredUsers?.filter(u => u.status === 'pending') || [];
  const approvedUsers = filteredUsers?.filter(u => u.status === 'approved') || [];
  const suspendedUsers = filteredUsers?.filter(u => u.status === 'suspended') || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 py-20 max-w-7xl relative">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.02] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 relative">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[2.5rem] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
               <Shield className="h-10 w-10 text-white" />
            </div>
            <div>
               <h1 className="text-5xl font-black tracking-tighter uppercase italic text-slate-900">Admin <span className="text-blue-600">Authority</span></h1>
               <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-1">Gestão Central de Infraestrutura</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input 
              placeholder="Pesquisar usuários..." 
              className="pl-14 h-16 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-blue-600 group text-slate-900 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-12">
          <TabsList className="bg-white/80 backdrop-blur-md p-2 rounded-[2.5rem] h-auto flex flex-wrap gap-2 w-fit border border-slate-200 shadow-xl mx-auto lg:mx-0">
            {[
              { value: 'stats', label: 'Dashboard', icon: LayoutDashboard },
              { value: 'pending', label: `Pendentes (${pendingUsers.length})`, icon: UserCheck },
              { value: 'approved', label: 'Usuários', icon: Users },
              { value: 'products', label: 'Produtos', icon: Database },
              { value: 'plans', label: 'Planos Consultas', icon: Sparkles },
              { value: 'bots', label: 'Configuração Bots', icon: Bot },
              { value: 'proxy', label: 'Gestão APIs', icon: Terminal },
              { value: 'mapping', label: 'Mapeamento', icon: Layers },
            ].map(tab => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="data-[state=active]:bg-blue-600 h-14 px-8 rounded-[2rem] text-slate-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all gap-3 flex items-center shadow-none active:scale-[0.97]"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="stats" className="animate-in fade-in zoom-in-95 duration-700">
            <AdminStats />
          </TabsContent>

          <TabsContent value="pending" className="animate-in slide-in-from-bottom-8 duration-700">
             <Card className="bg-white border-white shadow-card rounded-[3rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-black uppercase text-[10px] py-6 px-10">Identificação</TableHead>
                      <TableHead className="text-slate-400 font-black uppercase text-[10px] py-6 px-10">Vendedor</TableHead>
                      <TableHead className="text-right text-slate-400 font-black uppercase text-[10px] py-6 px-10">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map(user => (
                      <TableRow key={user.id} className="border-slate-50 hover:bg-slate-50/50 transition-all">
                        <TableCell className="py-6 px-10">
                          <div className="font-black text-slate-900 uppercase italic tracking-tighter">{user.full_name || 'Usuário Sem Nome'}</div>
                          <div className="text-xs font-bold text-slate-400">{user.email}</div>
                        </TableCell>
                        <TableCell className="px-10">
                          <Badge variant="outline" className="border-blue-100 text-blue-600 bg-blue-50 font-black uppercase px-3">{user.seller_code || 'DIRETO'}</Badge>
                        </TableCell>
                        <TableCell className="text-right px-10 space-x-3">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl px-6 h-10 shadow-lg shadow-blue-500/20" onClick={() => { setSelectedUser(user); setApprovalDialogOpen(true); }}>Aprovar</Button>
                          <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest rounded-xl px-6 h-10" onClick={() => handleSuspendUser(user.id)}>Recusar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </Card>
          </TabsContent>

          <TabsContent value="approved" className="animate-in slide-in-from-bottom-8 duration-700">
             <Card className="bg-white border-white shadow-card rounded-[3rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-black uppercase text-[10px] py-6 px-10">Usuário</TableHead>
                      <TableHead className="text-slate-400 font-black uppercase text-[10px] py-6 px-10">Escopo / Validade</TableHead>
                      <TableHead className="text-slate-400 font-black uppercase text-[10px] py-6 px-10">Carteira</TableHead>
                      <TableHead className="text-right text-slate-400 font-black uppercase text-[10px] py-6 px-10">Gestão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map(user => (
                      <TableRow key={user.id} className="border-slate-50 hover:bg-slate-50/50 transition-all">
                        <TableCell className="py-6 px-10">
                          <div className="font-black text-slate-900 uppercase italic tracking-tighter">{user.full_name || '-'}</div>
                          <div className="text-xs font-bold text-slate-400">{user.email}</div>
                        </TableCell>
                        <TableCell className="px-10">
                          <div className="flex gap-2 mb-1.5">
                            <Badge className="bg-emerald-500 text-white font-black uppercase text-[9px] px-2">{user.plan_type || 'free'}</Badge>
                            <Badge variant="outline" className="text-[9px] font-black uppercase">{user.role}</Badge>
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             Expira: {user.plan_expires_at ? new Date(user.plan_expires_at).toLocaleDateString() : 'NUNCA'}
                          </div>
                        </TableCell>
                        <TableCell className="px-10">
                           <span className="font-black text-emerald-600 text-lg italic">R$ {(user.balance || 0).toFixed(2)}</span>
                        </TableCell>
                         <TableCell className="text-right px-10 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setApprovalDialogOpen(true); }} className="text-blue-600 border-blue-100 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest rounded-xl px-4 h-10">
                               Plano
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleSuspendUser(user.id)} className="text-rose-500 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest rounded-xl px-4 h-10">Banir</Button>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </Card>
          </TabsContent>

          <TabsContent value="products" className="animate-in slide-in-from-bottom-8 duration-700">
             <AdminProductsTab />
          </TabsContent>

          <TabsContent value="plans" className="animate-in slide-in-from-bottom-8 duration-700">
             <ApiPlansTab />
          </TabsContent>

          <TabsContent value="bots" className="animate-in slide-in-from-bottom-8 duration-700">
             <AdminTelegramBotTab />
          </TabsContent>

          <TabsContent value="proxy" className="animate-in slide-in-from-bottom-8 duration-700">
             <ApiTokensTab />
          </TabsContent>

          <TabsContent value="mapping" className="animate-in slide-in-from-bottom-8 duration-700">
             <QuickApiManager />
          </TabsContent>
        </Tabs>
      </main>

      <ApprovalDialog
        isOpen={approvalDialogOpen}
        onClose={() => { setApprovalDialogOpen(false); setSelectedUser(null); }}
        onApprove={(planType, role, expiresAt) => { if (selectedUser) handleApproveUser(selectedUser.id, planType, role, expiresAt); }}
        userName={selectedUser?.full_name || selectedUser?.email || ''}
      />
    </div>
  );
}

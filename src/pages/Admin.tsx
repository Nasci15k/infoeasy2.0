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
import { Shield, UserCheck, UserX, Settings, BarChart2, Store, Bot, Save, Loader2, Send, Terminal, Globe, Eye, EyeOff } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminStats } from '@/components/admin/AdminStats';
import { ApprovalDialog } from '@/components/admin/ApprovalDialog';
import { SellersTab } from '@/components/admin/SellersTab';
import { ApiTokensTab } from '@/components/admin/ApiTokensTab';
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
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
    }
  }, [profile, isAdmin, loading, roleLoading, navigate, toast]);

  // Carregar configurações dos bots
  useEffect(() => {
    if (!isAdmin) return;
    const loadBotSettings = async () => {
      const { data, error } = await (supabase as any).from('bot_settings').select('key, value');
      if (error || !data) return;
      const cfg: Record<string, string> = {};
      data.forEach((s: any) => { cfg[s.key] = s.value; });
      setBotSettings({
        telegram_token:    cfg['telegram_token']    || '',
        discord_token:     cfg['discord_token']     || '',
        discord_app_id:    cfg['discord_app_id']    || '',
        discord_public_key: cfg['discord_public_key'] || '',
        site_url:          cfg['site_url']          || 'https://infoseasy.netlify.app',
        external_api_token: cfg['external_api_token'] || '',
        external_api_url:   cfg['external_api_url']   || 'http://45.190.208.48:7070/consulta',
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
      toast({ title: '✅ Salvo!', description: data?.message || 'Configurações atualizadas.' });
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
      setRegisterResult({ type: 'telegram', message: data?.message || 'Feito!', success: !!data?.success });
    } catch (err: any) {
      setRegisterResult({ type: 'telegram', message: err?.message || 'Erro desconhecido', success: false });
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
      setRegisterResult({ type: 'discord', message: data?.message || 'Feito!', success: !!data?.success });
    } catch (err: any) {
      setRegisterResult({ type: 'discord', message: err?.message || 'Erro desconhecido', success: false });
    } finally {
      setRegisteringDc(false);
    }
  };

  const toggleShowToken = (key: string) =>
    setShowTokens(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || !isAdmin) {
    return null;
  }

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      const { data: limits, error: limitsError } = await supabase
        .from('user_limits')
        .select('*');
      
      if (limitsError) throw limitsError;

      return profiles.map(profile => ({
        ...profile,
        limits: limits.find(l => l.user_id === profile.id),
        user_role: profile.role || 'teste'
      }));
    },
    enabled: isAdmin,
  });

  const handleApproveUser = async (
    userId: string,
    planType: 'daily' | 'weekly' | 'monthly',
    role: string,
    expiresAt: Date
  ) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'approved',
          plan_type: planType,
          plan_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // No role update needed here as it's already in profiles
      // If we wanted to update role, it would be in the profile update above.
      
      await refetchUsers();

      toast({
        title: 'Usuário aprovado',
        description: `Usuário aprovado como ${role} com plano ${planType}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      await refetchUsers();

      toast({
        title: 'Usuário suspenso',
        description: 'O usuário foi suspenso com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao suspender usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateLimitsMutation = useMutation({
    mutationFn: async ({ userId, daily, monthly }: { userId: string; daily: number; monthly: number }) => {
      const { error } = await supabase
        .from('user_limits')
        .update({ daily_limit: daily, monthly_limit: monthly })
        .eq('user_id', userId);
      if (error) {
        console.error('Update limits error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({ 
        title: 'Limites atualizados',
        description: 'Os limites do usuário foram atualizados com sucesso.'
      });
      setEditingLimits(null);
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({
        title: 'Erro ao atualizar limites',
        description: error.message || 'Não foi possível atualizar os limites.',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateLimits = (userId: string) => {
    updateLimitsMutation.mutate({ userId, daily: dailyLimit, monthly: monthlyLimit });
  };

  if (!profile || !isAdmin) {
    return null;
  }

  const pendingUsers = users?.filter(u => u.status === 'pending') || [];
  const approvedUsers = users?.filter(u => u.status === 'approved') || [];
  const suspendedUsers = users?.filter(u => u.status === 'suspended') || [];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Painel Administrativo
            </CardTitle>
            <CardDescription>
              Gerencie usuários, aprovações e limitações da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="stats">
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="stats">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Estatísticas
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendentes ({pendingUsers.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Aprovados ({approvedUsers.length})
                </TabsTrigger>
                <TabsTrigger value="suspended">
                  Suspensos ({suspendedUsers.length})
                </TabsTrigger>
                <TabsTrigger value="sellers">
                  <Store className="h-4 w-4 mr-2" />
                  Vendedores
                </TabsTrigger>
                <TabsTrigger value="bots">
                  <Bot className="h-4 w-4 mr-2" />
                  Bots
                </TabsTrigger>
                <TabsTrigger value="proxy">
                  <Terminal className="h-4 w-4 mr-2" />
                  Vender Proxy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats">
                <AdminStats />
              </TabsContent>

              <TabsContent value="pending">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Código Vendedor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.seller_code ? (
                            <span className="font-mono text-primary font-bold">{user.seller_code}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90"
                            onClick={() => {
                              setSelectedUser(user);
                              setApprovalDialogOpen(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSuspendUser(user.id)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Recusar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum usuário pendente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="approved">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Limites</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.user_role}</Badge>
                        </TableCell>
                        <TableCell>
                          {user.plan_type ? (
                            <Badge>{user.plan_type}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.plan_expires_at ? (
                            <span className="text-sm">
                              {new Date(user.plan_expires_at).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingLimits === user.id ? (
                            <div className="flex gap-2 items-center">
                              <div className="space-y-1">
                                <Label className="text-xs">Diário</Label>
                                <Input
                                  type="number"
                                  className="w-20 h-8"
                                  value={dailyLimit}
                                  onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Mensal</Label>
                                <Input
                                  type="number"
                                  className="w-20 h-8"
                                  value={monthlyLimit}
                                  onChange={(e) => setMonthlyLimit(parseInt(e.target.value))}
                                />
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="font-mono">
                              {user.limits?.daily_limit || 10}/{user.limits?.monthly_limit || 300}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {editingLimits === user.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateLimits(user.id)}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingLimits(null)}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingLimits(user.id);
                                  setDailyLimit(user.limits?.daily_limit || 10);
                                  setMonthlyLimit(user.limits?.monthly_limit || 300);
                                }}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Ajustar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                Suspender
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="suspended">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspendedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.user_role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90"
                            onClick={() => {
                              setSelectedUser(user);
                              setApprovalDialogOpen(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Reativar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="sellers">
                <SellersTab />
              </TabsContent>

              <TabsContent value="proxy">
                <ApiTokensTab />
              </TabsContent>

              <TabsContent value="bots">
                <div className="space-y-8">
                  {/* Header */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Configuração dos Bots</h3>
                      <p className="text-sm text-muted-foreground">Cole os tokens dos bots e registre os webhooks com um clique.</p>
                    </div>
                  </div>

                  {/* Site URL */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4 text-slate-500" />
                        URL do Site
                      </CardTitle>
                      <CardDescription>URL base usada para gerar links compartilháveis. Altere quando trocar o domínio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Input
                        value={botSettings.site_url}
                        onChange={e => setBotSettings(p => ({ ...p, site_url: e.target.value }))}
                        placeholder="https://infoseasy.netlify.app"
                        className="font-mono text-sm"
                      />
                    </CardContent>
                  </Card>

                  {/* Telegram */}
                  <Card className="border-blue-100 bg-blue-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Send className="h-4 w-4 text-blue-500" />
                        Bot do Telegram
                      </CardTitle>
                      <CardDescription>Crie o bot no @BotFather e cole o token abaixo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Token do Bot</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showTokens['telegram_token'] ? 'text' : 'password'}
                            value={botSettings.telegram_token}
                            onChange={e => setBotSettings(p => ({ ...p, telegram_token: e.target.value }))}
                            placeholder="1234567890:ABCDefghIJKlmNoPQRsTUVwxyZ"
                            className="font-mono text-xs flex-1"
                          />
                          <Button variant="ghost" size="sm" className="px-2" onClick={() => toggleShowToken('telegram_token')}>
                            {showTokens['telegram_token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button
                        onClick={handleRegisterTelegram}
                        disabled={registeringTg || !botSettings.telegram_token}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        {registeringTg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Terminal className="h-3.5 w-3.5" />}
                        Registrar Webhook Telegram
                      </Button>
                      {registerResult?.type === 'telegram' && (
                        <div className={`text-xs font-mono p-3 rounded-xl border ${
                          registerResult.success
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          {registerResult.message}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Discord */}
                  <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Bot className="h-4 w-4 text-indigo-500" />
                        Bot do Discord
                      </CardTitle>
                      <CardDescription>Crie o app em discord.com/developers e preencha os dados abaixo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { key: 'discord_token',      label: 'Bot Token',            placeholder: 'MTIzNDU2Nzg5...' },
                        { key: 'discord_app_id',     label: 'Application ID',       placeholder: '1234567890123456789' },
                        { key: 'discord_public_key', label: 'Public Key (Ed25519)',  placeholder: 'a1b2c3d4e5f6...' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</Label>
                          <div className="flex gap-2">
                            <Input
                              type={showTokens[key] ? 'text' : 'password'}
                              value={(botSettings as any)[key]}
                              onChange={e => setBotSettings(p => ({ ...p, [key]: e.target.value }))}
                              placeholder={placeholder}
                              className="font-mono text-xs flex-1"
                            />
                            <Button variant="ghost" size="sm" className="px-2" onClick={() => toggleShowToken(key)}>
                              {showTokens[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={handleRegisterDiscord}
                        disabled={registeringDc || !botSettings.discord_token || !botSettings.discord_app_id}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        size="sm"
                      >
                        {registeringDc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Terminal className="h-3.5 w-3.5" />}
                        Registrar Comandos Discord
                      </Button>
                      {registerResult?.type === 'discord' && (
                        <div className={`text-xs font-mono p-3 rounded-xl border whitespace-pre-wrap break-all ${
                          registerResult.success
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          {registerResult.message}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* External API Proxy */}
                  <Card className="border-amber-100 bg-amber-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-amber-600" />
                        Provedor de APIs Externas (Painel)
                      </CardTitle>
                      <CardDescription>Configure o Token e a URL do servidor de APIs principal (45.190.208.48).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">API Token (Panel)</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showTokens['external_api_token'] ? 'text' : 'password'}
                            value={botSettings.external_api_token}
                            onChange={e => setBotSettings(p => ({ ...p, external_api_token: e.target.value }))}
                            placeholder="PvhdVpk8zw4PRjIyzpUlpS2ztYB54FmdxWtxTSJAjyk"
                            className="font-mono text-xs flex-1"
                          />
                          <Button variant="ghost" size="sm" className="px-2" onClick={() => toggleShowToken('external_api_token')}>
                            {showTokens['external_api_token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">URL de Consulta</Label>
                        <Input
                          value={botSettings.external_api_url}
                          onChange={e => setBotSettings(p => ({ ...p, external_api_url: e.target.value }))}
                          placeholder="http://45.190.208.48:7070/consulta"
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="p-3 bg-white/50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed italic">
                        ⚠️ <b>Atenção:</b> Estes dados são usados mundialmente pelo bot e pelo site para as APIs do tipo "panel:". Mantenha o token sempre atualizado para evitar erros 500.
                      </div>
                    </CardContent>
                  </Card>

                  {/* Botão Salvar global */}

                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      onClick={handleSaveBotSettings}
                      disabled={savingBots}
                      className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8"
                    >
                      {savingBots ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar todas as configurações
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <ApprovalDialog
        isOpen={approvalDialogOpen}
        onClose={() => {
          setApprovalDialogOpen(false);
          setSelectedUser(null);
        }}
        onApprove={(planType, role, expiresAt) => {
          if (selectedUser) {
            handleApproveUser(selectedUser.id, planType, role, expiresAt);
          }
        }}
        userName={selectedUser?.full_name || selectedUser?.email || ''}
      />
    </div>
  );
}

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
import { Shield, UserCheck, UserX, Settings, BarChart2, Store } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AdminStats } from '@/components/admin/AdminStats';
import { ApprovalDialog } from '@/components/admin/ApprovalDialog';
import { SellersTab } from '@/components/admin/SellersTab';
import { useUserRole } from '@/hooks/useUserRole';

export default function Admin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const [editingLimits, setEditingLimits] = useState<string | null>(null);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [monthlyLimit, setMonthlyLimit] = useState(300);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (profile && !isAdmin) {
      navigate('/');
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
    }
  }, [profile, isAdmin, navigate, toast]);

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

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      return profiles.map(profile => ({
        ...profile,
        limits: limits.find(l => l.user_id === profile.id),
        user_role: roles.find(r => r.user_id === profile.id)?.role || 'teste'
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

      // Update or create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: userId, role: role as any },
          { onConflict: 'user_id' }
        );

      if (roleError) throw roleError;

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
              <TabsList className="grid w-full grid-cols-5 mb-6">
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

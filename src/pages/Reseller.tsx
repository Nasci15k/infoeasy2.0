import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, Calendar, Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';

export default function Reseller() {
  const { user, loading: authLoading } = useAuth();
  const { isRevendedor, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading && (!user || !isRevendedor)) {
      navigate('/');
    }
  }, [user, authLoading, isRevendedor, roleLoading, navigate]);

  const { data: sellerData } = useQuery({
    queryKey: ['seller-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('sellers')
        .select('seller_code')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && isRevendedor,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['reseller-stats', sellerData?.seller_code],
    queryFn: async () => {
      if (!sellerData?.seller_code) return null;

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, status, plan_type, plan_expires_at')
        .eq('seller_code', sellerData.seller_code);

      if (usersError) throw usersError;

      const userIds = users?.map(u => u.id) || [];
      
      const { count: queriesCount } = await supabase
        .from('query_history')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds);

      const now = new Date();
      const activeUsers = users?.filter(u => {
        if (u.status !== 'approved') return false;
        if (!u.plan_expires_at) return true;
        return new Date(u.plan_expires_at) > now;
      }).length || 0;

      const pendingUsers = users?.filter(u => u.status === 'pending').length || 0;
      const expiredUsers = users?.filter(u => {
        if (u.status !== 'approved') return false;
        if (!u.plan_expires_at) return false;
        return new Date(u.plan_expires_at) <= now;
      }).length || 0;

      const totalUsers = users?.length || 0;

      return {
        totalUsers,
        activeUsers,
        pendingUsers,
        expiredUsers,
        totalQueries: queriesCount || 0,
        users: users || [],
      };
    },
    enabled: !!sellerData?.seller_code,
  });

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isRevendedor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            Painel do Revendedor
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe as estatísticas dos seus clientes
          </p>
          {sellerData && (
            <p className="text-sm text-muted-foreground mt-1">
              Código do Vendedor: <span className="font-mono font-bold">{sellerData.seller_code}</span>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats?.activeUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats?.pendingUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Planos Expirados</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{stats?.expiredUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalQueries || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Meus Clientes</CardTitle>
                <CardDescription>
                  Lista de todos os usuários que se cadastraram com seu código
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.users && stats.users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Nome</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Plano</th>
                          <th className="text-left p-2">Expira em</th>
                          <th className="text-left p-2">Status do Plano</th>
                          <th className="text-left p-2">Data de Cadastro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.users.map((user) => {
                          const now = new Date();
                          const expiresAt = user.plan_expires_at ? new Date(user.plan_expires_at) : null;
                          const isExpired = expiresAt && expiresAt <= now;
                          const isPlanActive = user.status === 'approved' && (!expiresAt || expiresAt > now);

                          return (
                            <tr key={user.id} className="border-b">
                              <td className="p-2">{user.full_name || 'N/A'}</td>
                              <td className="p-2">{user.email}</td>
                              <td className="p-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    user.status === 'approved'
                                      ? 'bg-green-500/10 text-green-500'
                                      : user.status === 'suspended'
                                      ? 'bg-red-500/10 text-red-500'
                                      : 'bg-yellow-500/10 text-yellow-500'
                                  }
                                >
                                  {user.status === 'approved' ? 'Aprovado' : user.status === 'pending' ? 'Pendente' : 'Suspenso'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {user.plan_type ? (
                                  <Badge variant="outline">{user.plan_type}</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="p-2">
                                {expiresAt ? (
                                  <span className={`text-sm ${isExpired ? 'text-red-500 font-semibold' : ''}`}>
                                    {expiresAt.toLocaleDateString('pt-BR')}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="p-2">
                                {user.status === 'pending' ? (
                                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                                    Aguardando Aprovação
                                  </Badge>
                                ) : isPlanActive ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                    Ativo
                                  </Badge>
                                ) : isExpired ? (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-500">
                                    Expirado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
                                    Sem Plano
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2 text-sm">
                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cliente cadastrado com seu código ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

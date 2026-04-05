import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Database, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SellerDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sellerCode: string;
  sellerName: string;
}

export function SellerDetailsDialog({
  isOpen,
  onClose,
  sellerCode,
  sellerName,
}: SellerDetailsDialogProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['seller-details', sellerCode],
    queryFn: async () => {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, status, plan_type, plan_expires_at')
        .eq('seller_code', sellerCode);

      if (usersError) throw usersError;

      const userIds = users?.map(u => u.id) || [];
      
      const { count: queriesCount } = await supabase
        .from('query_history')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds);

      const activeUsers = users?.filter(u => u.status === 'approved').length || 0;
      const pendingUsers = users?.filter(u => u.status === 'pending').length || 0;
      const totalUsers = users?.length || 0;

      return {
        totalUsers,
        activeUsers,
        pendingUsers,
        totalQueries: queriesCount || 0,
        users: users || [],
      };
    },
    enabled: isOpen && !!sellerCode,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estatísticas do Vendedor</DialogTitle>
          <DialogDescription>
            {sellerName} - Código: <span className="font-mono font-bold">{sellerCode}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats?.activeUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Calendar className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats?.pendingUsers || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consultas</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalQueries || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Clientes do Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.users && stats.users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm">Nome</th>
                          <th className="text-left p-2 text-sm">Email</th>
                          <th className="text-left p-2 text-sm">Status</th>
                          <th className="text-left p-2 text-sm">Plano</th>
                          <th className="text-left p-2 text-sm">Expira em</th>
                          <th className="text-left p-2 text-sm">Cadastro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.users.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-2 text-sm">{user.full_name || 'N/A'}</td>
                            <td className="p-2 text-sm">{user.email}</td>
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
                                {user.status}
                              </Badge>
                            </td>
                            <td className="p-2 text-sm">
                              {user.plan_type ? (
                                <Badge variant="outline">{user.plan_type}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-2 text-sm">
                              {user.plan_expires_at ? (
                                new Date(user.plan_expires_at).toLocaleDateString('pt-BR')
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-2 text-sm">
                              {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cliente encontrado.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

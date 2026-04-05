import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserX, Clock, Shield, Activity, TrendingUp, Database, Edit2, Save, X, DollarSign, Zap, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function AdminStats() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profiles, limits, queries, apis, overrides] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('user_limits').select('*'),
        supabase.from('query_history').select('*').gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('apis').select('*'),
        supabase.from('admin_stats_override').select('*'),
      ]);

      const overrideMap = overrides.data?.reduce((acc: any, override: any) => {
        acc[override.stat_key] = override.override_value;
        return acc;
      }, {}) || {};

      const approved = profiles.data?.filter(p => p.status === 'approved').length || 0;
      const pending = profiles.data?.filter(p => p.status === 'pending').length || 0;
      const suspended = profiles.data?.filter(p => p.status === 'suspended').length || 0;
      
      const admins = profiles.data?.filter(p => p.role === 'admin').length || 0;
      const premium = profiles.data?.filter(p => p.role === 'usuario_premium').length || 0;
      const revendedor = profiles.data?.filter(p => p.role === 'revendedor').length || 0;
      const teste = profiles.data?.filter(p => p.role === 'teste').length || 0;
      const queriesToday = queries.data?.length || 0;
      const activeApis = apis.data?.filter(a => a.is_active).length || 0;
      
      // Calcular queries totais (mês)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: monthQueries } = await supabase
        .from('query_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth);

      return {
        totalUsers: overrideMap['totalUsers'] || profiles.data?.length || 0,
        approved: overrideMap['approved'] || approved,
        pending: overrideMap['pending'] || pending,
        suspended: overrideMap['suspended'] || suspended,
        admins: overrideMap['admins'] || admins,
        premium: overrideMap['premium'] || premium,
        revendedor: overrideMap['revendedor'] || revendedor,
        teste: overrideMap['teste'] || teste,
        queriesToday: overrideMap['queriesToday'] || queriesToday,
        queriesMonth: overrideMap['queriesMonth'] || 0,
        totalApis: overrideMap['totalApis'] || apis.data?.length || 0,
        activeApis: overrideMap['activeApis'] || activeApis,
      };
    },
  });

  const updateStatMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      const { error } = await supabase
        .from('admin_stats_override')
        .upsert({ stat_key: key, override_value: value }, { onConflict: 'stat_key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: 'Estatística atualizada',
        description: 'O valor foi atualizado com sucesso.',
      });
      setEditingKey(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (key: string, currentValue: number) => {
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleSave = (key: string) => {
    updateStatMutation.mutate({ key, value: editValue });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue(0);
  };

  const statCards = [
    { title: 'Total de Usuários', key: 'totalUsers', value: stats?.totalUsers || 0, icon: Users, color: 'text-primary', category: 'usuarios' },
    { title: 'Aprovados', key: 'approved', value: stats?.approved || 0, icon: UserCheck, color: 'text-success', category: 'usuarios' },
    { title: 'Pendentes', key: 'pending', value: stats?.pending || 0, icon: Clock, color: 'text-warning', category: 'usuarios' },
    { title: 'Suspensos', key: 'suspended', value: stats?.suspended || 0, icon: UserX, color: 'text-destructive', category: 'usuarios' },
    { title: 'Administradores', key: 'admins', value: stats?.admins || 0, icon: Shield, color: 'text-accent', category: 'roles' },
    { title: 'Usuários Premium', key: 'premium', value: stats?.premium || 0, icon: Star, color: 'text-warning', category: 'roles' },
    { title: 'Revendedores', key: 'revendedor', value: stats?.revendedor || 0, icon: DollarSign, color: 'text-success', category: 'roles' },
    { title: 'Em Teste', key: 'teste', value: stats?.teste || 0, icon: Zap, color: 'text-muted-foreground', category: 'roles' },
    { title: 'Consultas Hoje', key: 'queriesToday', value: stats?.queriesToday || 0, icon: TrendingUp, color: 'text-primary', category: 'consultas' },
    { title: 'Consultas Este Mês', key: 'queriesMonth', value: stats?.queriesMonth || 0, icon: Activity, color: 'text-secondary', category: 'consultas' },
    { title: 'Total de APIs', key: 'totalApis', value: stats?.totalApis || 0, icon: Database, color: 'text-accent', category: 'apis' },
    { title: 'APIs Online', key: 'activeApis', value: stats?.activeApis || 0, icon: Activity, color: 'text-success', category: 'apis' },
  ];

  const categories = {
    usuarios: statCards.filter(s => s.category === 'usuarios'),
    roles: statCards.filter(s => s.category === 'roles'),
    consultas: statCards.filter(s => s.category === 'consultas'),
    apis: statCards.filter(s => s.category === 'apis'),
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Estatísticas de Usuários
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.usuarios.map((stat) => (
              <Card key={stat.title} className="shadow-card hover:shadow-primary transition-all group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  {editingKey === stat.key ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        className="h-8 w-24"
                      />
                      <Button size="sm" onClick={() => handleSave(stat.key)} className="h-8 w-8 p-0">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEdit(stat.key, stat.value)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Classes de Usuários
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.roles.map((stat) => (
              <Card key={stat.title} className="shadow-card hover:shadow-primary transition-all group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  {editingKey === stat.key ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        className="h-8 w-24"
                      />
                      <Button size="sm" onClick={() => handleSave(stat.key)} className="h-8 w-8 p-0">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEdit(stat.key, stat.value)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Estatísticas de Consultas
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.consultas.map((stat) => (
              <Card key={stat.title} className="shadow-card hover:shadow-primary transition-all group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  {editingKey === stat.key ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        className="h-8 w-24"
                      />
                      <Button size="sm" onClick={() => handleSave(stat.key)} className="h-8 w-8 p-0">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEdit(stat.key, stat.value)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            Estatísticas de APIs
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.apis.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-primary transition-all group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {editingKey === stat.key ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                    className="h-8 w-24"
                  />
                  <Button size="sm" onClick={() => handleSave(stat.key)} className="h-8 w-8 p-0">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEdit(stat.key, stat.value)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

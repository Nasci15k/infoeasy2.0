import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserX, Clock, Shield, Activity, TrendingUp, Database, Edit2, Save, X, DollarSign, Zap, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
        supabase.from('query_history').select('*, apis(name, group_name)').gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
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
      
      const apiUsage = queries.data?.reduce((acc: any, q: any) => {
        const apiName = q.apis?.name || q.api_id;
        acc[apiName] = (acc[apiName] || 0) + 1;
        return acc;
      }, {}) || {};
      
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
        apiUsage
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
      toast({ title: 'Estatística Override', description: 'Valor atualizado com sucesso.' });
      setEditingKey(null);
    },
  });

  const handleEdit = (key: string, currentValue: number) => {
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleSave = (key: string) => {
    updateStatMutation.mutate({ key, value: editValue });
  };

  const statCards = [
    { title: 'Usuários Totais', key: 'totalUsers', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600', category: 'usuarios' },
    { title: 'Contas Ativas', key: 'approved', value: stats?.approved || 0, icon: UserCheck, color: 'text-emerald-600', category: 'usuarios' },
    { title: 'Aguardando', key: 'pending', value: stats?.pending || 0, icon: Clock, color: 'text-amber-500', category: 'usuarios' },
    { title: 'Classes Premium', key: 'premium', value: stats?.premium || 0, icon: Star, color: 'text-blue-600', category: 'roles' },
    { title: 'Consultas Hoje', key: 'queriesToday', value: stats?.queriesToday || 0, icon: TrendingUp, color: 'text-blue-600', category: 'consultas' },
    { title: 'Infraestrutura', key: 'activeApis', value: stats?.activeApis || 0, icon: Activity, color: 'text-emerald-600', category: 'apis' },
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {statCards.map((stat) => (
          <Card key={stat.key} className="bg-white border-white shadow-card rounded-[2.5rem] p-8 group hover:border-blue-200 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-4 p-0">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <stat.icon className="h-5 w-5" />
                 </div>
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.title}</span>
              </div>
              {!editingKey && (
                 <Button variant="ghost" size="sm" onClick={() => handleEdit(stat.key, stat.value)} className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-600">
                    <Edit2 className="h-3.5 w-3.5" />
                 </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 mt-4">
              {editingKey === stat.key ? (
                <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                    className="h-12 bg-slate-50 border-slate-100 rounded-xl font-black text-slate-900"
                  />
                  <Button onClick={() => handleSave(stat.key)} className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingKey(null)} className="h-12 text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 italic tracking-tighter">{stat.value}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Unidades</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white border-white shadow-card rounded-[2.5rem] p-8 overflow-hidden">
        <CardHeader className="p-0 pb-8">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                 <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Utilização por API (Hoje)</CardTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monitoramento de Limites diários</p>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(stats?.apiUsage || {}).map(([api, count]: [string, any]) => {
              const isHigh = count >= 800;
              const isLimit = count >= 1000;
              return (
                <div key={api} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest truncate">{api}</span>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-3xl font-black italic tracking-tighter", isLimit ? "text-red-600" : isHigh ? "text-amber-500" : "text-slate-900")}>
                        {count}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">/ 1000</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", isLimit ? "bg-red-600" : isHigh ? "bg-amber-500" : "bg-blue-600")}
                        style={{ width: `${Math.min((count / 1000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {Object.keys(stats?.apiUsage || {}).length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhuma requisição registrada hoje</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

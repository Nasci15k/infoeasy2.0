import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, History, Shield, BarChart3 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PlanExpirationCountdown } from '@/components/PlanExpirationCountdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiStatusTab } from '@/components/dashboard/ApiStatusTab';
import { CheckoutPlans } from '@/components/CheckoutPlans';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: limits } = useQuery({
    queryKey: ['user-limits', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const isApproved = profile?.status === 'approved';
  const isPending = profile?.status === 'pending';
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        
        {isPending && (
          <div className="mb-8">
            <CheckoutPlans />
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {isApproved && profile?.plan_expires_at && (
            <PlanExpirationCountdown />
          )}

          <Card className="shadow-card hover:shadow-primary transition-all duration-300 cursor-pointer" onClick={() => navigate('/history')}>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <History className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Histórico</CardTitle>
              <CardDescription>
                Visualize suas consultas anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-accent/20 hover:bg-accent/5">
                <History className="mr-2 h-4 w-4" />
                Ver Histórico
              </Button>
            </CardContent>
          </Card>

          {isApproved && limits && (
            <Card className="shadow-card border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-xl">Limites de Uso</CardTitle>
                <CardDescription>
                  Acompanhe seu consumo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Diário</span>
                    <Badge variant="outline" className="font-mono">
                      {limits.daily_count}/{limits.daily_limit}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-brand transition-all"
                      style={{ width: `${(limits.daily_count / limits.daily_limit) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Mensal</span>
                    <Badge variant="outline" className="font-mono">
                      {limits.monthly_count}/{limits.monthly_limit}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-accent to-primary transition-all"
                      style={{ width: `${(limits.monthly_count / limits.monthly_limit) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card className="shadow-card hover:shadow-primary transition-all duration-300 cursor-pointer border-primary/20" onClick={() => navigate('/admin')}>
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-xl">Painel Admin</CardTitle>
                <CardDescription>
                  Gerencie usuários e configurações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-destructive/20 hover:bg-destructive/5">
                  <Shield className="mr-2 h-4 w-4" />
                  Acessar Painel
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {isApproved && (
          <Tabs defaultValue="consultas" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consultas">Categorias de Consulta</TabsTrigger>
              <TabsTrigger value="status">Status das APIs</TabsTrigger>
            </TabsList>

            <TabsContent value="consultas" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories?.map((category) => (
                  <Link key={category.id} to={`/${category.slug}`}>
                    <Card className="shadow-card hover:shadow-primary transition-all duration-300 h-full">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                        <CardTitle className="text-xl">{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">
                          Consultar
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="status">
              <ApiStatusTab />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

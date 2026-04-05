import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Database } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function History() {
  const { profile } = useAuth();

  const { data: history, isLoading } = useQuery({
    queryKey: ['query-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('query_history')
        .select(`
          *,
          apis (name, description)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Consultas
            </CardTitle>
            <CardDescription>
              Visualize suas últimas 50 consultas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando histórico...
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{item.apis?.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Consulta: <span className="font-mono">{item.query_value}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {item.response_data?.status || 'Concluída'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma consulta realizada ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

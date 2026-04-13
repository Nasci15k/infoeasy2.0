import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Key, Copy, Check, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ApiTokensTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form states
  const [userId, setUserId] = useState('');
  const [label, setLabel] = useState('');
  const [dailyLimit, setDailyLimit] = useState(100);
  const [isCreating, setIsCreating] = useState(false);

  // Carregar todos os usuários para o Select
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, full_name, nome').order('email');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['admin-api-tokens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !label) throw new Error('Preencha os campos obrigatórios (Usuário e Rótulo)');
      
      const tokenHash = 'tk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const { data, error } = await supabase
        .from('api_tokens')
        .insert({
          user_id: userId,
          token_hash: tokenHash,
          label: label,
          daily_limit: dailyLimit,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Token Gerado', description: 'A chave da API foi criada com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['admin-api-tokens'] });
      setUserId('');
      setLabel('');
      setIsCreating(false);
    },
    onError: (error: any) => {
      console.error(error);
      toast({ title: 'Erro', description: error.message || 'Falha ao criar token.', variant: 'destructive' });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from('api_tokens')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-tokens'] });
      toast({ title: 'Status atualizado' });
    }
  });

  const deleteTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_tokens').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-api-tokens'] });
      toast({ title: 'Token Deletado', description: 'O token de revenda foi permanente revogado.' });
    }
  });

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-primary">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Vender Acesso a URLs (APIs)
          </CardTitle>
          <CardDescription>
            Crie chaves virtuais para usuários e estipule os limites diários. Com esta chave, qualquer sistema conectado baterá nas suas tabelas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreating ? (
            <form 
              className="space-y-4 max-w-xl bg-orange-50/50 dark:bg-orange-950/20 p-5 rounded-xl border border-orange-200 dark:border-orange-900"
              onSubmit={(e) => { e.preventDefault(); generateTokenMutation.mutate(); }}
            >
              <div className="space-y-2">
                <Label htmlFor="userId">Selecione o Cliente (E-mail)</Label>
                <Select value={userId} onValueChange={setUserId} required>
                  <SelectTrigger className="bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Busque o usuário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingUsers ? <SelectItem value="loading" disabled>Carregando...</SelectItem> : 
                      users?.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.email} {u.full_name || u.nome ? `(${u.full_name || u.nome})` : ''}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Apelido na Tabela</Label>
                  <Input 
                    id="label" 
                    placeholder="Ex: Empresa Zap" 
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Limite Diário</Label>
                  <Input 
                    id="dailyLimit" 
                    type="number" 
                    min={1}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    required
                    className="bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <Button type="submit" disabled={generateTokenMutation.isPending} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8">
                  {generateTokenMutation.isPending ? 'Gerando...' : 'Criar Nova Chave'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setIsCreating(true)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
              <Key className="mr-2 h-4 w-4" /> Vender Nova API
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chaves Ativas</CardTitle>
          <CardDescription>Monitore seus clientes de API.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Chave Gerada</TableHead>
                  <TableHead>Cliente Atrelado</TableHead>
                  <TableHead>Uso Diário</TableHead>
                  <TableHead>Status API</TableHead>
                  <TableHead className="text-right">Apagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>
                ) : !tokens || tokens.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum plano vendido ainda.</TableCell></TableRow>
                ) : (
                  tokens.map((token: any) => {
                    const user = users?.find(u => u.id === token.user_id);
                    return (
                      <TableRow key={token.id}>
                        <TableCell className="font-bold text-orange-700 dark:text-orange-400">{token.label}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono font-medium">{token.token_hash}</code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 hover:bg-slate-200"
                              onClick={() => handleCopy(token.token_hash)}
                            >
                              {copiedToken === token.token_hash ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user?.email || 'Desconhecido'}<br/>
                        </TableCell>
                        <TableCell>
                          <Badge variant={token.requests_made >= token.daily_limit ? 'destructive' : 'secondary'} className="font-mono">
                            {token.requests_made} / {token.daily_limit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={token.is_active} 
                            onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: token.id, is_active: checked })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive transition-colors"
                            onClick={() => {
                              if (window.confirm(`Tem certeza que vai cortar o acesso de API deste token?`)) {
                                deleteTokenMutation.mutate(token.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

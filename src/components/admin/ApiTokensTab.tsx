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
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Key, Copy, Check, Trash2, ShieldAlert } from 'lucide-react';
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

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['admin-api-tokens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_tokens')
        .select(`
          *,
          user:user_id(email, nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !label) throw new Error('Preencha os campos obrigatórios');
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) throw new Error('ID do usuário deve ser um UUID válido');

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
      toast({ title: 'Token Gerado', description: 'O token API foi criado com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['admin-api-tokens'] });
      setUserId('');
      setLabel('');
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
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
            Gerador de Tokens (Proxy Intermediário)
          </CardTitle>
          <CardDescription>
            Crie tokens únicos para clientes. Com este token eles podem conectar no seu IP e consumir suas cotas atreladas à API Intermediária.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreating ? (
            <form 
              className="space-y-4 max-w-xl bg-muted/20 p-4 rounded-xl border border-muted"
              onSubmit={(e) => { e.preventDefault(); generateTokenMutation.mutate(); }}
            >
              <div className="space-y-2">
                <Label htmlFor="userId">UUID do Usuário Cliente</Label>
                <Input 
                  id="userId" 
                  placeholder="Ex: 123e4567-e89b-12d3..." 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Rótulo / Identificação</Label>
                  <Input 
                    id="label" 
                    placeholder="Ex: Empresa X" 
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Limite Diário (Requisições)</Label>
                  <Input 
                    id="dailyLimit" 
                    type="number" 
                    min={1}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={generateTokenMutation.isPending}>
                  {generateTokenMutation.isPending ? 'Gerando...' : 'Criar Token API'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setIsCreating(true)}>
              <Key className="mr-2 h-4 w-4" /> Novo Token
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tokens Ativos</CardTitle>
          <CardDescription>Gerencie os limites e status dos clientes conectados na sua Proxy.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rótulo</TableHead>
                  <TableHead>Chave (Hash)</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Consumo Diário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Carregando tokens...</TableCell></TableRow>
                ) : !tokens || tokens.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum token foi criado ainda.</TableCell></TableRow>
                ) : (
                  tokens.map((token: any) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-medium">{token.label}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs">{token.token_hash}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleCopy(token.token_hash)}
                          >
                            {copiedToken === token.token_hash ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {token.user?.nome || 'N/A'}<br/>
                        <span className="text-xs text-muted-foreground">{token.user?.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={token.requests_made >= token.daily_limit ? 'destructive' : 'secondary'}>
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
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja apagar este acesso para o cliente? Ele começará a receber Erros de Proxy bloqueado.')) {
                              deleteTokenMutation.mutate(token.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

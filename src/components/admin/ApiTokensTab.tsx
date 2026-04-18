import { useState, useMemo } from 'react';
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
import { Key, Copy, Check, Trash2, ShieldCheck, Globe, Info, Search, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

export function ApiTokensTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form states
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('external');
  const [clientName, setClientName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [label, setLabel] = useState('');
  const [dailyLimit, setDailyLimit] = useState(100);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // APIs Selection
  const [selectedApis, setSelectedApis] = useState<string[]>([]);

  // Carregar todos os usuários para o Select
  const { data: users } = useQuery({
    queryKey: ['admin-profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, full_name, nome').order('email');
      if (error) throw error;
      return data || [];
    }
  });

  // Carregar lista de APIs disponíveis para o Checkbox
  const { data: availableApis } = useQuery({
    queryKey: ['admin-available-apis-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('apis').select('id, name, endpoint, slug').order('name');
      if (error) throw error;
      
      return data.map(api => ({
        ...api,
        modulo: api.slug || (api.endpoint.includes(':') ? api.endpoint.split(':')[1] : api.endpoint)
      }));
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

  const filteredApis = useMemo(() => {
    if (!availableApis) return [];
    return availableApis.filter(api => 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      api.modulo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableApis, searchTerm]);

  const upsertTokenMutation = useMutation({
    mutationFn: async () => {
      if (!label || (userId === 'external' && !clientName)) {
        throw new Error('Preencha o Rótulo e o Nome do Cliente');
      }
      
      if (selectedApis.length === 0) {
        throw new Error('Selecione ao menos 1 API para este token.');
      }

      const payload = {
        user_id: userId === 'external' ? null : userId,
        label: label,
        client_name: userId === 'external' ? clientName : (users?.find(u => u.id === userId)?.full_name || ''),
        contact_info: contactInfo,
        daily_limit: dailyLimit,
        allowed_apis: selectedApis,
        is_active: true
      };

      if (editingTokenId) {
        const { data, error } = await supabase
          .from('api_tokens')
          .update(payload)
          .eq('id', editingTokenId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const tokenHash = 'tk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const { data, error } = await supabase
          .from('api_tokens')
          .insert({ ...payload, token_hash: tokenHash })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({ 
        title: editingTokenId ? 'Acesso Atualizado' : 'Token Gerado', 
        description: editingTokenId ? 'As permissões foram sincronizadas.' : 'A chave da API foi criada com sucesso.' 
      });
      queryClient.invalidateQueries({ queryKey: ['admin-api-tokens'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Falha na operação.', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setUserId('external');
    setClientName('');
    setContactInfo('');
    setLabel('');
    setSelectedApis([]);
    setEditingTokenId(null);
    setIsCreating(false);
  };

  const handleEdit = (token: any) => {
    setEditingTokenId(token.id);
    setUserId(token.user_id || 'external');
    setClientName(token.client_name || '');
    setContactInfo(token.contact_info || '');
    setLabel(token.label || '');
    setDailyLimit(token.daily_limit || 100);
    setSelectedApis(token.allowed_apis || []);
    setIsCreating(true);
  };

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
      toast({ title: 'Token Deletado', description: 'O acesso foi revogado permanentemente.' });
    }
  });

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyUrl = (hash: string) => {
    // Agora usando a rota curta redirecionada pelo Netlify
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/api?token=${hash}&modulo=[MODULO]&valor=[BUSCA]`;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: 'URL Curta Copiada', description: 'Link mestre /api copiado com sucesso.' });
  };

  const toggleApi = (modulo: string) => {
    setSelectedApis(prev => 
      prev.includes(modulo) ? prev.filter(a => a !== modulo) : [...prev, modulo]
    );
  };

  const selectAll = () => {
    if (availableApis) {
      setSelectedApis(availableApis.map(a => a.modulo));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-600" />
              {editingTokenId ? 'Editar Acesso API' : 'Vender Acesso APIs (Proxy Externo)'}
            </div>
            {editingTokenId && <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[9px] uppercase">Modo Edição</Badge>}
          </CardTitle>
          <CardDescription>
            Gerencie chaves de acesso para clientes externos. Você pode escolher exatamente quais APIs eles podem consultar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreating ? (
            <div className="space-y-6 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lado Esquerdo: Info Cliente */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Tipo de Cliente</Label>
                    <Select value={userId} onValueChange={setUserId}>
                      <SelectTrigger className="bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">Cliente Externo (Sem Conta)</SelectItem>
                        {users?.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {userId === 'external' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500">Nome do Cliente / Empresa</Label>
                      <Input 
                        placeholder="Ex: Pedro Henrique" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="bg-white dark:bg-slate-900"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500">Rótulo da Conta</Label>
                    <Input 
                      placeholder="Ex: Plano Bronze 500" 
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500">Limite Diário</Label>
                      <Input 
                        type="number" 
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500">Contato (WhatsApp)</Label>
                      <Input 
                        placeholder="(11) 9..." 
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        className="bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Seleção de APIs */}
                <div className="flex flex-col h-[300px] border rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="p-3 border-b bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <div className="relative flex-1 mr-2">
                      <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input 
                        placeholder="Filtrar APIs..." 
                        className="h-8 pl-8 text-xs" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={selectAll}>Tudo</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedApis([])}>Limpar</Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 grid grid-cols-1 gap-1">
                      {filteredApis.map(api => (
                        <div 
                          key={api.id} 
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedApis.includes(api.modulo) ? 'bg-orange-50 dark:bg-orange-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          onClick={() => toggleApi(api.modulo)}
                        >
                          <Checkbox checked={selectedApis.includes(api.modulo)} onCheckedChange={() => toggleApi(api.modulo)} />
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="text-xs font-bold truncate">{api.name}</span>
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="text-[9px] text-orange-600 font-mono font-bold shrink-0">{api.modulo}</span>
                              <span className="text-[8px] text-slate-400 font-mono truncate border-l pl-1.5">{api.endpoint}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Selecionadas</span>
                    <Badge variant="outline" className="text-orange-600 font-bold">{selectedApis.length}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => upsertTokenMutation.mutate()} 
                  disabled={upsertTokenMutation.isPending} 
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 px-8"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {upsertTokenMutation.isPending ? 'Gravando...' : (editingTokenId ? 'SALVAR ALTERAÇÕES' : 'GERAR CHAVE DE ACESSO')}
                </Button>
                <Button variant="ghost" className="h-11" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/10 rounded-xl border border-orange-200 dark:border-orange-900/30">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Pronto para vender?</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Gere uma chave Hash para entregar ao seu cliente e escolha quais categorias liberar.</p>
                </div>
              </div>
              <Button onClick={() => setIsCreating(true)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
                <Key className="mr-2 h-4 w-4" /> Nova Venda de API
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clientes de API</CardTitle>
            <CardDescription>Lista completa de tokens de revenda ativos.</CardDescription>
          </div>
          <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
            {tokens?.length || 0} Licenças Ativas
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900 font-bold">
                <TableRow>
                  <TableHead>Identificação / Rótulo</TableHead>
                  <TableHead>Token Hash</TableHead>
                  <TableHead>Configuração</TableHead>
                  <TableHead>Uso Real-Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10">Sincronizando Banco...</TableCell></TableRow>
                ) : !tokens || tokens.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">Nenhuma chave de revenda encontrada.</TableCell></TableRow>
                ) : (
                  tokens.map((token: any) => (
                    <TableRow key={token.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{token.label}</span>
                          <span className="text-[11px] text-muted-foreground">{token.client_name || 'Externo'} • {token.contact_info || 'S/ Contato'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 ">
                          <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono font-bold text-orange-600">{token.token_hash}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleCopy(token.token_hash)}
                            title="Copiar Hash"
                          >
                            {copiedToken === token.token_hash ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          <Badge variant="secondary" className="text-[9px] h-4">Limit: {token.daily_limit}</Badge>
                          <Badge className="text-[9px] h-4 bg-blue-100 text-blue-800 border-none">{token.allowed_apis?.length || 0} APIs</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] mb-1 font-bold">
                            <span>{token.requests_made}</span>
                            <span>{Math.round((token.requests_made / token.daily_limit) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${token.requests_made >= token.daily_limit ? 'bg-red-500' : 'bg-green-500'}`} 
                              style={{ width: `${Math.min((token.requests_made / token.daily_limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={token.is_active} 
                          onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: token.id, is_active: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-orange-50 border-orange-100"
                            onClick={() => handleCopyUrl(token.token_hash)}
                            title="Copiar URL do Proxy"
                          >
                            <Globe className="h-4 w-4 text-orange-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100"
                            onClick={() => handleEdit(token)}
                            title="Editar Módulos e Limites"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                            onClick={() => {
                              if (window.confirm(`Revogar permanentemente o acesso "${token.label}"?`)) {
                                deleteTokenMutation.mutate(token.id);
                              }
                            }}
                            title="Deletar Chave"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl flex gap-3 text-slate-500">
        <Info className="h-5 w-5 shrink-0" />
        <p className="text-xs leading-relaxed">
          <b>Documentação Base:</b> Para usar a Proxy, seu cliente deve bater em 
          <code className="mx-1 px-1 bg-white border rounded">/api</code> 
          passando os parâmetros <code className="mx-1 px-1 bg-white border rounded">token</code>, 
          <code className="mx-1 px-1 bg-white border rounded">modulo</code> e 
          <code className="mx-1 px-1 bg-white border rounded">valor</code>. 
          O parâmetro <code className="italic">modulo</code> agora utiliza o <b>slug profissional</b> (ex: cpf-ultra).
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Store, Plus, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SellerDetailsDialog } from './SellerDetailsDialog';

export function SellersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [sellerCode, setSellerCode] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<{ code: string; name: string } | null>(null);

  const { data: sellers } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles-for-sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, status')
        .eq('status', 'approved');

      if (error) throw error;
      return data;
    },
  });

  const { data: resellerUsers } = useQuery({
    queryKey: ['reseller-users', sellers],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, status')
        .eq('status', 'approved');

      if (profilesError) throw profilesError;
      
      // Filter out users that already have seller codes
      const sellerUserIds = sellers?.map(s => s.user_id) || [];
      
      return profiles.filter((p: any) => !sellerUserIds.includes(p.id));
    },
  });

  const createSellerMutation = useMutation({
    mutationFn: async ({ userId, code }: { userId: string; code: string }) => {
      const { error } = await supabase
        .from('sellers')
        .insert({ user_id: userId, seller_code: code });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast({
        title: 'Vendedor cadastrado',
        description: 'O vendedor foi cadastrado com sucesso.',
      });
      setIsAdding(false);
      setSelectedUserId('');
      setSellerCode('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cadastrar vendedor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteSellerMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      const { error } = await supabase
        .from('sellers')
        .delete()
        .eq('id', sellerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast({
        title: 'Vendedor removido',
        description: 'O vendedor foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover vendedor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateSeller = () => {
    if (!selectedUserId || !sellerCode) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione um usuário e defina um código.',
        variant: 'destructive',
      });
      return;
    }
    createSellerMutation.mutate({ userId: selectedUserId, code: sellerCode });
  };

  return (
    <div className="space-y-6">
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Novo Vendedor</CardTitle>
            <CardDescription>
              Associe um usuário revendedor a um código de vendedor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Usuário Revendedor</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {resellerUsers?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código do Vendedor</Label>
              <Input
                id="code"
                value={sellerCode}
                onChange={(e) => setSellerCode(e.target.value.toUpperCase())}
                placeholder="Ex: VEND001"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateSeller} disabled={createSellerMutation.isPending}>
                Cadastrar
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Vendedor
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Vendedores Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers?.map((seller: any) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-mono font-bold">{seller.seller_code}</TableCell>
                  <TableCell>{allProfiles?.find((p: any) => p.id === seller.user_id)?.full_name || '-'}</TableCell>
                  <TableCell>{allProfiles?.find((p: any) => p.id === seller.user_id)?.email || '-'}</TableCell>
                  <TableCell>{new Date(seller.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const sellerProfile = allProfiles?.find((p: any) => p.id === seller.user_id);
                        setSelectedSeller({
                          code: seller.seller_code,
                          name: sellerProfile?.full_name || sellerProfile?.email || 'Vendedor',
                        });
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Estatísticas
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSellerMutation.mutate(seller.id)}
                      disabled={deleteSellerMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!sellers || sellers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum vendedor cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedSeller && (
        <SellerDetailsDialog
          isOpen={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setSelectedSeller(null);
          }}
          sellerCode={selectedSeller.code}
          sellerName={selectedSeller.name}
        />
      )}
    </div>
  );
}

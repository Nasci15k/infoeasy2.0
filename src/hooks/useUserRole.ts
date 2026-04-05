import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'teste' | 'usuario' | 'usuario_premium' | 'revendedor' | 'admin';

export function useUserRole() {
  const { user } = useAuth();

  const { data: roleData, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return {
    role: roleData?.role as UserRole | null,
    isLoading,
    isAdmin: roleData?.role === 'admin',
    isPremium: roleData?.role === 'usuario_premium' || roleData?.role === 'revendedor' || roleData?.role === 'admin',
    isRevendedor: roleData?.role === 'revendedor' || roleData?.role === 'admin',
  };
}

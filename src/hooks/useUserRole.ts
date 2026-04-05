import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'teste' | 'usuario' | 'usuario_premium' | 'revendedor' | 'admin';

export function useUserRole() {
  const { profile, loading: authLoading } = useAuth();

  return {
    role: profile?.role as UserRole | null,
    isLoading: authLoading,
    isAdmin: profile?.role === 'admin',
    isPremium: profile?.role === 'admin', // Simplificado para o novo projeto
    isRevendedor: profile?.role === 'admin', // No momento apenas admins gerenciam
    status: profile?.status,
    isApproved: profile?.status === 'approved'
  };
}

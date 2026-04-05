import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user' | 'usuario' | 'usuario_premium' | 'revendedor' | 'teste';
  status: 'pending' | 'approved' | 'suspended';
  seller_code?: string | null;
  plan_type?: 'daily' | 'weekly' | 'monthly' | null;
  plan_expires_at?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // Profile does not exist yet: ensure it's created via backend function
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (accessToken) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ensure-profile`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!response.ok) {
            console.error('Failed to ensure profile:', await response.text());
            throw new Error('Não foi possível criar o perfil do usuário.');
          }

          const body = await response.json();
          if (body.profile) {
            data = body.profile;
          } else {
            const { data: refetched, error: refetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();

            if (refetchError) throw refetchError;
            data = refetched;
          }
        } else {
          throw new Error('Sessão inválida ao buscar perfil.');
        }
      }

      const profileData = data as Profile;

      // Check if plan has expired
      if (profileData?.plan_expires_at) {
        const expiresAt = new Date(profileData.plan_expires_at);
        const now = new Date();
        
        if (expiresAt < now && profileData.status === 'approved') {
          // Show expiration message and sign out
          toast({
            title: 'Plano Expirado',
            description: 'Seu plano expirou. Entre em contato com seu vendedor para renovar.',
            variant: 'destructive',
          });
          await supabase.auth.signOut();
          setProfile(null);
          setUser(null);
          setSession(null);
          navigate('/auth');
          return null;
        }
      }
      
      setProfile(profileData);
      return profileData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      navigate('/auth');
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

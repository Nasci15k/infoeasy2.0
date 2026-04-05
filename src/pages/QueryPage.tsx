import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { CategoryModule } from '@/components/dashboard/CategoryModule';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

export default function QueryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    if (profile.status !== 'approved') {
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: async () => {
      if (!categorySlug) throw new Error('No category slug');
      const { data, error } = await supabase
        .from('api_categories')
        .select('*')
        .eq('slug', categorySlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!categorySlug,
  });

  const { data: apis } = useQuery({
    queryKey: ['apis', category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      const { data, error } = await supabase
        .from('apis')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
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

  if (categoryLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Módulos
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              {category.icon && <span className="text-4xl">{category.icon}</span>}
              <div>
                <CardTitle className="text-2xl">{category.name}</CardTitle>
                {category.description && (
                  <CardDescription className="text-base mt-1">
                    {category.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {category && apis && (
          <CategoryModule 
            category={category} 
            apis={apis || []} 
            limits={limits} 
          />
        )}
      </div>
    </div>
  );
}

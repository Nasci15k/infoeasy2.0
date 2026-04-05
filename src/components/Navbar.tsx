import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, History, Home, Menu, X, Store, Mail } from 'lucide-react';
import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin, isRevendedor } = useUserRole();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/10 bg-card/95 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-primary group-hover:shadow-lg transition-shadow">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-brand bg-clip-text text-transparent">Info Easy</h1>
                <p className="text-xs text-muted-foreground font-medium">Consultoria</p>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>

              {profile?.status === 'approved' && (
                <Button
                  variant={isActive('/history') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/history')}
                >
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
              )}

              {profile?.role === 'admin' && (
                <Button
                  variant={isActive('/admin') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              
              {isRevendedor && (
                <Button
                  variant={isActive('/reseller') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/reseller')}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Revendedor
                </Button>
              )}

              {profile?.status === 'approved' && (
                <Button
                  variant={isActive('/tempmail') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/tempmail')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  TempMail
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-medium text-foreground">{profile?.full_name || profile?.email}</p>
              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${profile?.status === 'approved' ? 'bg-success' : 'bg-warning'}`}></span>
                {profile?.role} • {profile?.status === 'approved' ? 'Aprovado' : 'Pendente'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            <div className="px-3 py-2 mb-2 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground">{profile?.full_name || profile?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {profile?.role} • {profile?.status === 'approved' ? 'Aprovado' : 'Pendente'}
              </p>
            </div>
            
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            {profile?.status === 'approved' && (
              <Button
                variant={isActive('/history') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  navigate('/history');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            )}

            {profile?.role === 'admin' && (
              <Button
                variant={isActive('/admin') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  navigate('/admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            
            {isRevendedor && (
              <Button
                variant={isActive('/reseller') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  navigate('/reseller');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Store className="h-4 w-4 mr-2" />
                Revendedor
              </Button>
            )}

            {profile?.status === 'approved' && (
              <Button
                variant={isActive('/tempmail') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  navigate('/tempmail');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                TempMail
              </Button>
            )}

            <Button
              variant="outline" 
              size="sm" 
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

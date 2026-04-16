import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, History, Home, Menu, X, Store, Mail, User, Wallet as WalletIcon, Zap } from 'lucide-react';
import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from './ui/badge';

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
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] px-8 py-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)]">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-10">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-4 group transition-all"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-black italic text-slate-900 leading-tight tracking-tighter uppercase">InfoEasy <span className="text-blue-600 italic">2.0</span></h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Intelligence Hub</p>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-2">
              {[
                { label: 'Dashboard', path: '/', icon: Home },
                { label: 'Admin', path: '/admin', icon: Shield, show: isAdmin },
                { label: 'Revenda', path: '/reseller', icon: Store, show: isRevendedor },
                { label: 'TempMail', path: '/tempmail', icon: Mail, show: profile?.status === 'approved' },
              ].map(link => (link.show !== false && (
                <Button
                  key={link.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(link.path)}
                  className={`h-11 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2.5 transition-all ${isActive(link.path) ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              )))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-5 pr-6 border-r border-slate-100">
              <div className="text-right">
                 <p className="text-sm font-black text-slate-900 italic uppercase leading-none">{profile?.full_name?.split(' ')[0]}</p>
                 <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse-soft" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {profile?.plan_type || 'FREE'} • R$ {(profile?.balance || 0).toFixed(2)}
                    </p>
                 </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                 <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <Button 
               variant="ghost" 
               size="sm" 
               onClick={handleLogout} 
               className="h-11 w-11 lg:w-auto lg:px-6 rounded-2xl border border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 gap-2.5 font-black uppercase text-[10px] tracking-widest"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Sair</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-6 pt-6 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
            {[
              { label: 'Dashboard', path: '/', icon: Home },
              { label: 'Histórico', path: '/history', icon: History, show: profile?.status === 'approved' },
              { label: 'Admin', path: '/admin', icon: Shield, show: isAdmin },
              { label: 'Revenda', path: '/reseller', icon: Store, show: isRevendedor },
            ].map(link => (link.show !== false && (
              <Button
                key={link.path}
                variant="ghost"
                onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                className={`w-full justify-start h-14 rounded-2xl font-black uppercase text-xs tracking-widest gap-4 ${isActive(link.path) ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Button>
            )))}
          </div>
        )}
      </div>
    </nav>
  );
}

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading, signOut } = useAuth();

  // While loading auth state, show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not logged in → redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is pending approval → show waiting screen
  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-100/40 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-md w-full bg-white border border-slate-100 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black italic text-slate-900 tracking-tighter uppercase">InfoEasy <span className="text-blue-600">2.0</span></h1>
          </div>

          <div className="h-24 w-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-100/50 shadow-inner">
            <Clock className="h-10 w-10 text-blue-600" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">
              Conta em <span className="text-blue-600">Análise</span>
            </h2>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              Seu acesso está aguardando <span className="font-black text-blue-600">autorização manual</span> de um administrador.
              Você será notificado assim que sua conta for liberada.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Status Atual</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs font-black text-amber-600 uppercase italic">Aguardando Aprovação</p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500"
          >
            Sair da Conta
          </Button>
        </div>
      </div>
    );
  }

  // User is suspended → sign out and redirect
  if (profile?.status === 'suspended') {
    signOut();
    return <Navigate to="/auth" replace />;
  }

  // Admin-only route check
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

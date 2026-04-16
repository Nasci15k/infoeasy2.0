import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Search, Database, Mail, Activity, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [sellerCode, setSellerCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { count: apiCount } = await supabase.from('apis').select('*', { count: 'exact', head: true });
      const { count: catCount } = await supabase.from('api_categories').select('*', { count: 'exact', head: true });
      return { apis: apiCount || 0, modules: catCount || 0 };
    }
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: isSignUp ? {
            full_name: fullName,
            seller_code: sellerCode || null,
          } : {},
          shouldCreateUser: isSignUp,
        },
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: 'Código enviado!',
        description: 'Verifique seu e-mail para o código de segurança.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o código.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      if (data.user) {
        // Check profile status
        const { data: profileData } = await supabase.from('profiles').select('status').eq('id', data.user.id).single();
        
        if (profileData?.status === 'pending') {
          setIsWaitingApproval(true);
          toast({
            title: 'Cadastro em análise',
            description: 'Aguardando autorização de um administrador.',
          });
        } else {
          toast({
            title: 'Acesso liberado!',
            description: 'Bem-vindo ao InfoEasy.',
          });
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro na verificação',
        description: error.message || 'Código inválido ou expirado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.03] pointer-events-none" />

      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-100/40 rounded-full blur-[120px]" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Branding & Marketing Section */}
        <div className="hidden lg:flex flex-col space-y-10 pr-12">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">InfoEasy <span className="text-blue-600">2.0</span></h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-6xl font-black text-slate-900 italic tracking-tighter uppercase leading-[0.9]">
              Inteligência de <br /><span className="text-blue-600">Alta Performance</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-md">
              O ecossistema definitivo para consultas de dados, análise de risco e inteligência corporativa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-[2rem] bg-white shadow-card border border-blue-50/50">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de APIs</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">+{stats?.apis || 120}</h3>
              <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Fontes Reais & Ativas</p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white shadow-card border border-blue-50/50">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Módulos</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">+{stats?.modules || 52}</h3>
              <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Categorias de Busca</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">U{i}</div>)}
            </div>
            <p className="text-xs font-bold text-slate-500 italic flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Junte-se a centenas de agências e profissionais.
            </p>
          </div>
        </div>

        {/* Auth Card Section */}
        <Card className="w-full max-w-md bg-white border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden">
          <CardHeader className="text-center space-y-2 pt-10 pb-6 lg:hidden">
            <h1 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">InfoEasy <span className="text-blue-600">2.0</span></h1>
          </CardHeader>

          <CardHeader className="text-center space-y-2 lg:pt-10">
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {isSignUp ? 'Crie sua conta profissional' : 'Identifique-se para entrar'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10 space-y-6">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isSignUp ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    onClick={() => setIsSignUp(false)}
                  >
                    Entrar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSignUp ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    onClick={() => setIsSignUp(true)}
                  >
                    Cadastrar
                  </Button>
                </div>

                {isSignUp && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</Label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-slate-50 border-slate-100 h-14 rounded-2xl focus:ring-blue-600 focus:border-blue-600 text-slate-900 font-bold"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail Corporativo</Label>
                  <Input
                    type="email"
                    placeholder="exemplo@infoeasy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-50 border-slate-100 h-14 rounded-2xl focus:ring-blue-600 focus:border-blue-600 text-slate-900 font-bold"
                  />
                </div>

                {isSignUp && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código Promocional</Label>
                    <Input
                      type="text"
                      placeholder="Opcional"
                      value={sellerCode}
                      onChange={(e) => setSellerCode(e.target.value)}
                      className="bg-slate-50 border-slate-100 h-14 rounded-2xl text-slate-900 font-bold"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : isSignUp ? 'Solicitar Acesso' : 'Receber Código'}
                </Button>

                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Autenticação segura via OTP. <br />
                  Seu acesso será liberado instantaneamente.
                </p>
              </form>
            ) : isWaitingApproval ? (
              <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center py-6">
                <div className="h-24 w-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-100/50 shadow-inner">
                   <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <div className="space-y-4">
                   <h3 className="text-3xl font-black text-slate-900 italic uppercase italic tracking-tighter">Conta em <span className="text-blue-600">Análise</span></h3>
                   <p className="text-sm font-bold text-slate-500 leading-relaxed px-4">
                      Seu acesso está aguardando <span className="text-blue-600">autorização manual</span> de um administrador. 
                      Você será notificado assim que o sistema for liberado para você.
                   </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mt-6">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Status Atual</p>
                   <p className="text-xs font-black text-blue-600 uppercase mt-2 italic">Aguardando Aprovação...</p>
                </div>
                <Button 
                   variant="ghost" 
                   className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 mt-4"
                   onClick={() => { setOtpSent(false); setIsWaitingApproval(false); }}
                >
                   Voltar ao Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100/50">
                    <Mail className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 italic uppercase">Verificação</h3>
                  <p className="text-xs font-bold text-slate-500 lowercase tracking-normal">Código enviado para <span className="text-blue-600">{email}</span></p>
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="00000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={8}
                    required
                    className="bg-slate-50 border-slate-200 text-center text-4xl font-black tracking-[0.3em] h-20 rounded-3xl focus:ring-blue-600 placeholder:text-slate-200"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-16 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/20"
                  disabled={isLoading || otp.length < 8}
                >
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Desbloquear Sistema'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                  onClick={() => setOtpSent(false)}
                >
                  Corrigir E-mail
                </Button>
              </form>
            )}

            <div className="pt-6">
              <Separator className="bg-slate-100" />
              <p className="text-[9px] text-center text-slate-400 mt-6 font-black uppercase tracking-[0.2em] italic">
                InfoEasy Intelligence Hub &copy; 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

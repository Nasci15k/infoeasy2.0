import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Search, Database, Mail, Phone } from 'lucide-react';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { Separator } from '@/components/ui/separator';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [sellerCode, setSellerCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [turnstileToken, setTurnstileToken] = useState<string | null>('bypassed'); // BYPASS TEMPORÁRIO
  const [turnstileError, setTurnstileError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    return true; // Cloudflare removido temporariamente
    
    if (token.startsWith('dev-mode-token-')) {
      return true;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token },
      });
      
      if (error) {
        console.error('Turnstile verification error:', error);
        return false;
      }
      
      return data?.success === true;
    } catch (error) {
      console.error('Turnstile verification failed:', error);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      toast({
        title: 'Verificação necessária',
        description: 'Complete a verificação de segurança antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        toast({
          title: 'Verificação falhou',
          description: 'A verificação de segurança falhou. Tente novamente.',
          variant: 'destructive',
        });
        setTurnstileToken(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: 'Login realizado',
          description: 'Bem-vindo de volta!',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message || 'Credenciais inválidas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      toast({
        title: 'Verificação necessária',
        description: 'Complete a verificação de segurança antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        toast({
          title: 'Verificação falhou',
          description: 'A verificação de segurança falhou. Tente novamente.',
          variant: 'destructive',
        });
        setTurnstileToken(null);
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            seller_code: sellerCode || null,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: 'Cadastro realizado',
          description: 'Sua conta foi criada e está aguardando aprovação do administrador.',
        });
        setEmail('');
        setPassword('');
        setFullName('');
        setSellerCode('');
        setTurnstileToken(null);
      }
    } catch (error: any) {
      toast({
        title: 'Erro no cadastro',
        description: error.message || 'Não foi possível criar a conta.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!turnstileToken) {
      toast({
        title: 'Verificação necessária',
        description: 'Complete a verificação de segurança antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        toast({
          title: 'Verificação falhou',
          description: 'A verificação de segurança falhou. Tente novamente.',
          variant: 'destructive',
        });
        setTurnstileToken(null);
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível conectar com o Google.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Telefone obrigatório',
        description: 'Insira um número de telefone válido.',
        variant: 'destructive',
      });
      return;
    }

    if (!turnstileToken) {
      toast({
        title: 'Verificação necessária',
        description: 'Complete a verificação de segurança antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        toast({
          title: 'Verificação falhou',
          description: 'A verificação de segurança falhou. Tente novamente.',
          variant: 'destructive',
        });
        setTurnstileToken(null);
        setIsLoading(false);
        return;
      }

      // Format phone number to E.164
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+55${phoneNumber.replace(/\D/g, '')}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: 'Código enviado',
        description: 'Verifique seu telefone e insira o código recebido.',
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

  const handleVerifyPhoneOtp = async () => {
    if (!otp) {
      toast({
        title: 'Código obrigatório',
        description: 'Insira o código recebido por SMS.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+55${phoneNumber.replace(/\D/g, '')}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: 'Login realizado',
          description: 'Bem-vindo!',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Código inválido.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setTurnstileError(false);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setTurnstileError(true);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <Card className="w-full max-w-md shadow-primary border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="flex justify-center mb-3">
            <div className="p-4 bg-gradient-brand rounded-2xl shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            Info Easy Consultoria
          </CardTitle>
          <CardDescription className="text-base">
            Acesso completo a APIs de dados brasileiros
          </CardDescription>
          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>60+ APIs</span>
            </div>
            <div className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              <span>Consultas Ilimitadas*</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>100% Seguro</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="space-y-4 mt-4">
                {/* Auth Method Selector */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={authMethod === 'email' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => { setAuthMethod('email'); setOtpSent(false); }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={authMethod === 'phone' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => { setAuthMethod('phone'); setOtpSent(false); }}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Telefone
                  </Button>
                </div>

                {authMethod === 'email' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    {/* Turnstile removido temporariamente
                    <TurnstileWidget
                      onVerify={handleTurnstileVerify}
                      onError={handleTurnstileError}
                      onExpire={handleTurnstileExpire}
                    />
                    
                    {turnstileError && (
                      <p className="text-sm text-destructive text-center">
                        Erro na verificação. Recarregue a página e tente novamente.
                      </p>
                    )}
                    */}
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || !turnstileToken}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={otpSent}
                      />
                    </div>

                    {otpSent && (
                      <div className="space-y-2">
                        <Label htmlFor="otp">Código de Verificação</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                        />
                      </div>
                    )}

                    {/* Turnstile removido temporariamente
                    <TurnstileWidget
                      onVerify={handleTurnstileVerify}
                      onError={handleTurnstileError}
                      onExpire={handleTurnstileExpire}
                    />
                    
                    {turnstileError && (
                      <p className="text-sm text-destructive text-center">
                        Erro na verificação. Recarregue a página e tente novamente.
                      </p>
                    )}
                    */}

                    {!otpSent ? (
                      <Button 
                        type="button"
                        className="w-full" 
                        disabled={isLoading || !turnstileToken || !phoneNumber}
                        onClick={handleSendPhoneOtp}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          'Enviar Código SMS'
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button 
                          type="button"
                          className="w-full" 
                          disabled={isLoading || !otp}
                          onClick={handleVerifyPhoneOtp}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verificando...
                            </>
                          ) : (
                            'Verificar Código'
                          )}
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost"
                          className="w-full text-sm" 
                          onClick={() => setOtpSent(false)}
                        >
                          Alterar número
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    ou continue com
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || !turnstileToken}
                  onClick={handleGoogleLogin}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-seller-code">Código do Vendedor (opcional)</Label>
                  <Input
                    id="signup-seller-code"
                    type="text"
                    placeholder="Digite o código se tiver"
                    value={sellerCode}
                    onChange={(e) => setSellerCode(e.target.value)}
                  />
                </div>
                {/* Turnstile removido temporariamente
                <TurnstileWidget
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                />
                
                {turnstileError && (
                  <p className="text-sm text-destructive text-center">
                    Erro na verificação. Recarregue a página e tente novamente.
                  </p>
                )}
                */}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !turnstileToken}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Após o cadastro, sua conta precisará ser aprovada por um administrador.
                </p>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    ou cadastre-se com
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || !turnstileToken}
                  onClick={handleGoogleLogin}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Cadastrar com Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

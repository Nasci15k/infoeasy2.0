import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  RefreshCw, 
  Copy, 
  Check, 
  Inbox, 
  Clock, 
  Trash2, 
  ExternalLink,
  Loader2,
  MailOpen,
  Calendar,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Email {
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  date: number;
}

interface Inbox {
  address: string;
  token: string;
}

export default function TempMail() {
  const { toast } = useToast();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set());

  const createInbox = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tempmail?action=create`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (!response.ok) throw new Error('Falha ao criar caixa de entrada');
      
      const data = await response.json();
      setInbox(data);
      setEmails([]);
      setTimeLeft(3600);
      localStorage.setItem('tempmail_inbox', JSON.stringify(data));
      localStorage.setItem('tempmail_created', Date.now().toString());
      
      toast({
        title: 'Email temporário criado!',
        description: data.address,
      });
    } catch (error) {
      console.error('Error creating inbox:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o email temporário.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const fetchEmails = useCallback(async () => {
    if (!inbox?.token) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tempmail?action=fetch&token=${inbox.token}`
      );
      
      if (!response.ok) throw new Error('Falha ao buscar emails');
      
      const data = await response.json();
      
      if (data.expired) {
        toast({
          title: 'Email expirado',
          description: 'Seu email temporário expirou. Crie um novo.',
          variant: 'destructive',
        });
        setInbox(null);
        localStorage.removeItem('tempmail_inbox');
        localStorage.removeItem('tempmail_created');
        return;
      }
      
      const newEmails = data.emails || [];
      if (newEmails.length > emails.length) {
        toast({
          title: 'Novo email recebido!',
          description: `Você recebeu ${newEmails.length - emails.length} novo(s) email(s).`,
        });
      }
      setEmails(newEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [inbox?.token, emails.length, toast]);

  const copyEmail = () => {
    if (inbox?.address) {
      navigator.clipboard.writeText(inbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copiado!',
        description: 'Email copiado para a área de transferência.',
      });
    }
  };

  const deleteInbox = () => {
    setInbox(null);
    setEmails([]);
    localStorage.removeItem('tempmail_inbox');
    localStorage.removeItem('tempmail_created');
    toast({
      title: 'Email descartado',
      description: 'Seu email temporário foi removido.',
    });
  };

  const openEmail = (email: Email) => {
    setSelectedEmail(email);
    setDialogOpen(true);
  };

  const toggleEmailExpand = (index: number) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEmails(newExpanded);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load saved inbox on mount
  useEffect(() => {
    const savedInbox = localStorage.getItem('tempmail_inbox');
    const createdAt = localStorage.getItem('tempmail_created');
    
    if (savedInbox && createdAt) {
      const elapsed = Math.floor((Date.now() - parseInt(createdAt)) / 1000);
      if (elapsed < 3600) {
        setInbox(JSON.parse(savedInbox));
        setTimeLeft(3600 - elapsed);
      } else {
        localStorage.removeItem('tempmail_inbox');
        localStorage.removeItem('tempmail_created');
      }
    }
  }, []);

  // Auto refresh emails
  useEffect(() => {
    if (!inbox || !autoRefresh) return;
    
    fetchEmails();
    const interval = setInterval(fetchEmails, 10000); // every 10 seconds
    
    return () => clearInterval(interval);
  }, [inbox, autoRefresh, fetchEmails]);

  // Countdown timer
  useEffect(() => {
    if (!inbox || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setInbox(null);
          localStorage.removeItem('tempmail_inbox');
          localStorage.removeItem('tempmail_created');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [inbox, timeLeft]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-brand rounded-2xl shadow-primary mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              TempMail
            </h1>
            <p className="text-muted-foreground">
              Email temporário seguro e descartável
            </p>
          </div>

          {/* Email Creation / Display */}
          <Card className="shadow-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                Sua Caixa de Entrada
              </CardTitle>
              <CardDescription>
                {inbox ? 'Use este email para receber mensagens temporárias' : 'Crie um email temporário para começar'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!inbox ? (
                <Button 
                  onClick={createInbox} 
                  className="w-full" 
                  size="lg"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Criar Email Temporário
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Email Address */}
                  <div className="flex items-center gap-2">
                    <Input 
                      value={inbox.address} 
                      readOnly 
                      className="font-mono text-lg bg-muted/50"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={copyEmail}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Status Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expira em: {formatTimeLeft(timeLeft)}
                      </Badge>
                      <Badge variant={autoRefresh ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setAutoRefresh(!autoRefresh)}>
                        {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchEmails}
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Atualizar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={deleteInbox}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Descartar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emails List */}
          {inbox && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MailOpen className="h-5 w-5 text-primary" />
                    Emails Recebidos
                  </span>
                  <Badge variant="secondary">{emails.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Nenhum email ainda</p>
                    <p className="text-sm">Os emails aparecerão aqui automaticamente</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {emails.map((email, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:shadow-md transition-all border-border/50 hover:border-primary/30"
                        >
                          <CardContent className="p-4">
                            <div 
                              className="flex items-start justify-between gap-4"
                              onClick={() => openEmail(email)}
                            >
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="font-medium truncate">{email.from}</span>
                                </div>
                                <p className="font-semibold text-foreground truncate">
                                  {email.subject || '(Sem assunto)'}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {email.body?.substring(0, 150) || 'Clique para ver o conteúdo'}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(email.date)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEmailExpand(index);
                                  }}
                                >
                                  {expandedEmails.has(index) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {/* Expanded Content */}
                            {expandedEmails.has(index) && (
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  {email.html ? (
                                    <div 
                                      className="email-html-content p-4 bg-muted/30 rounded-lg overflow-auto max-h-[300px] text-sm"
                                      dangerouslySetInnerHTML={{ __html: email.html }}
                                    />
                                  ) : (
                                    <pre className="whitespace-pre-wrap font-sans text-sm p-4 bg-muted/30 rounded-lg">
                                      {email.body}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}

          {/* Features Info */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">1 Hora de Validade</h3>
                <p className="text-sm text-muted-foreground">Email expira automaticamente</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-center">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Auto-Atualização</h3>
                <p className="text-sm text-muted-foreground">Receba emails em tempo real</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4 text-center">
                <Trash2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Sem Rastros</h3>
                <p className="text-sm text-muted-foreground">Nenhum dado é armazenado</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Email Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="pr-8">{selectedEmail?.subject || '(Sem assunto)'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-auto flex-1">
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>De: {selectedEmail?.from}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {selectedEmail && formatDate(selectedEmail.date)}
              </div>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {selectedEmail?.html ? (
                <div 
                  className="email-html-content bg-card p-4 rounded-lg border"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans bg-card p-4 rounded-lg border">
                  {selectedEmail?.body}
                </pre>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

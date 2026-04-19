import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Send, Calendar, ShieldCheck, Loader2, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProfileTab() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [telegramId, setTelegramId] = useState('');

  useEffect(() => {
    if (profile?.telegram_id) {
      setTelegramId(profile.telegram_id);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ telegram_id: telegramId })
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: 'Perfil Atualizado', description: 'Seu ID do Telegram foi vinculado com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isVip = (profile?.plan_expires_at && new Date(profile.plan_expires_at) > new Date()) || 
               ((profile as any)?.telegram_expires_at && new Date((profile as any).telegram_expires_at) > new Date());

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-white border-white shadow-card rounded-[2.5rem] p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
            <div className="h-24 w-24 rounded-3xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center mx-auto mb-6">
              <User className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">{profile?.full_name?.split(' ')[0]}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{profile?.role}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
               <div className="flex items-center justify-between text-left">
                  <div className="flex items-center gap-2 text-slate-400">
                     <ShieldCheck className="h-4 w-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
                  </div>
                  <Badge className="bg-blue-600 text-white border-none text-[10px] uppercase font-black tracking-widest">{profile?.status}</Badge>
               </div>
               <div className="flex items-center justify-between text-left">
                  <div className="flex items-center gap-2 text-slate-400">
                     <Calendar className="h-4 w-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Plano</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest border-slate-200">{profile?.plan_type || 'FREE'}</Badge>
               </div>
            </div>
          </Card>

          <Card className="bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20 rounded-[2rem] p-8 text-white">
             <div className="flex items-center gap-3 mb-4">
                <Send className="h-5 w-5" />
                <h4 className="font-black uppercase italic tracking-tighter text-lg">Telegram VIP</h4>
             </div>
             <p className="text-blue-100 text-xs font-medium leading-relaxed">
                Vincule seu ID do Telegram para liberar consultas avançadas e acesso exclusivo no nosso bot oficial.
             </p>
             {isVip && (
               <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/10 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">⭐</div>
                  <div className="text-[10px] font-black uppercase tracking-widest">Assinatura Ativa</div>
               </div>
             )}
          </Card>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <Card className="bg-white border-white shadow-card rounded-[2.5rem] p-10 space-y-8">
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Minha Conta</h3>
               <p className="text-sm text-slate-400 font-medium">Gerencie suas informações e vinculação com o Telegram.</p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                   <User className="h-3 w-3" /> Nome Completo
                </Label>
                <Input value={profile?.full_name || ''} disabled className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold text-slate-900 opacity-60" />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                   <Mail className="h-3 w-3" /> E-mail de Acesso
                </Label>
                <Input value={profile?.email || ''} disabled className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold text-slate-900 opacity-60" />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                   <Link2 className="h-3 w-3" /> ID do Telegram
                </Label>
                <div className="relative">
                  <Input 
                    value={telegramId} 
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="Ex: 589230123" 
                    className="h-14 bg-white border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 transition-all pl-12" 
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Send className="h-3 w-3 text-blue-600" />
                  </div>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                  Obtenha seu ID enviando /id para o nosso bot.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleUpdateProfile} 
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest italic flex items-center justify-center gap-3"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, CheckCircle2, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TermsReminderModal() {
  const { profile } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `terms_reminded_${profile?.id}`;
    const alreadyReminded = localStorage.getItem(key);
    if (!alreadyReminded && profile?.id) {
      // Small delay so dashboard loads first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [profile?.id]);

  const handleDismiss = () => {
    const key = `terms_reminded_${profile?.id}`;
    localStorage.setItem(key, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const acceptedAt = (profile as any)?.terms_accepted_at
    ? new Date((profile as any).terms_accepted_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-400">
        
        {/* Header */}
        <div className="bg-blue-600 p-10 text-white text-center relative">
          <button
            onClick={handleDismiss}
            className="absolute top-6 right-6 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="h-20 w-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
            Lembrete de<br />
            <span className="text-blue-200">Responsabilidade</span>
          </h2>
        </div>

        {/* Body */}
        <div className="p-10 space-y-8">
          <div className="space-y-4">
            {acceptedAt && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <p className="text-xs font-bold text-emerald-700">
                  Você concordou com os nossos Termos de Serviço em{' '}
                  <span className="text-emerald-900">{acceptedAt}</span>.
                </p>
              </div>
            )}

            <p className="text-sm font-bold text-slate-600 leading-relaxed">
              Ao acessar e utilizar a plataforma <span className="text-blue-600">InfoEasy</span>, você confirma que:
            </p>

            <ul className="space-y-3">
              {[
                'Toda informação consultada é de uso exclusivamente pessoal e profissional lícito.',
                'Você é integralmente responsável pelo uso das informações obtidas através desta plataforma.',
                'O uso para fins ilícitos, incluindo perseguição, fraude ou violação de privacidade, é estritamente proibido e sujeito às penalidades da lei.',
                'A InfoEasy atua apenas como intermediária de dados e não se responsabiliza por decisões tomadas com base nas informações fornecidas.',
                'Você está ciente da Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018) e suas implicações.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-blue-600">{i + 1}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleDismiss}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Entendi e Confirmo
            </Button>
            <button
              onClick={() => window.open('/terms.html', '_blank')}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Ler os Termos de Serviço Completos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

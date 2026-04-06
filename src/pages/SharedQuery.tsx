import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/components/ApiResponse';
import { Clock, AlertTriangle, Loader2, Share2, Shield } from 'lucide-react';

interface SharedData {
  api_name: string;
  query_value: string;
  response_data: any;
  created_at: string;
  expires_at: string;
  source: string;
}

export default function SharedQuery() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); setExpired(true); return; }

    const fetchData = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `${supabaseUrl}/functions/v1/public-query?token=${token}`;
        const res = await fetch(url, {
          headers: { 'apikey': supabaseKey }
        });
        const json = await res.json();

        if (json.expired || json.error || !json.success) {
          setExpired(true);
        } else {
          setData(json as SharedData);
        }
      } catch {
        setExpired(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Contador regressivo
  useEffect(() => {
    if (!data?.expires_at) return;
    const update = () => {
      const diff = new Date(data.expires_at).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expirado'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [data?.expires_at]);

  const sourceEmoji = (src: string) =>
    ({ telegram: '✈️ Telegram', discord: '🎮 Discord', web: '🌐 Site' }[src] || src);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto" />
          <p className="text-slate-400 font-medium">Carregando consulta...</p>
        </div>
      </div>
    );
  }

  if (expired || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">InfoEasy</span>
          </div>
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-3xl p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3">Link Expirado</h1>
            <p className="text-slate-400 leading-relaxed">
              Este link de consulta já expirou ou é inválido.
              Links compartilhados têm validade de <strong className="text-white">15 minutos</strong>.
            </p>
            <a
              href="https://infoseasy.netlify.app"
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/25"
            >
              <Share2 className="w-4 h-4" />
              Fazer nova consulta
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="https://infoseasy.netlify.app" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">InfoEasy</span>
          </a>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span>Expira: {timeLeft}</span>
            </div>

            {/* Fonte */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 font-medium">
              <span>Via {sourceEmoji(data.source)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Banner de contexto */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Share2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-900">Consulta compartilhada publicamente</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Esta consulta foi compartilhada via link e pode ser visualizada por qualquer pessoa com o link.
              Expira automaticamente em <strong>15 minutos</strong> a partir da criação.
            </p>
          </div>
        </div>

        {/* Resultado completo */}
        <ApiResponse data={data.response_data} apiName={data.api_name} />

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>
            Gerado em {new Date(data.created_at).toLocaleString('pt-BR')} •
            Consulta via <strong className="text-slate-600">{sourceEmoji(data.source)}</strong>
          </p>
          <a
            href="https://infoseasy.netlify.app"
            className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <Shield className="w-4 h-4" />
            Acesse o InfoEasy para fazer suas próprias consultas
          </a>
        </div>
      </main>
    </div>
  );
}

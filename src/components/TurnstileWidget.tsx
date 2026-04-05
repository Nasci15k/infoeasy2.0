import { useEffect, useRef, useCallback, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = '0x4AAAAAACEEOOSo_7XeZ2wC';

// Detecta se está em ambiente de desenvolvimento/preview
const isDevelopment = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname.includes('lovable.app') || 
         hostname.includes('lovableproject.com') ||
         hostname.includes('127.0.0.1');
};

// Lista de domínios de produção onde o Turnstile deve funcionar
const isProductionDomain = () => {
  const hostname = window.location.hostname;
  return hostname === 'easyconsultoria.netlify.app' || 
         hostname.includes('easyconsultoria');
};

export function TurnstileWidget({ onVerify, onError, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);
  // Em ambientes de desenvolvimento, ativa dev mode imediatamente
  const [devMode, setDevMode] = useState(isDevelopment() && !isProductionDomain());
  const [devVerified, setDevVerified] = useState(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current) return;
    
    if (window.turnstile) {
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: onVerify,
          'error-callback': () => {
            // Em caso de erro, ativa modo de desenvolvimento
            if (isDevelopment()) {
              setDevMode(true);
            } else {
              onError?.();
            }
          },
          'expired-callback': onExpire,
          theme: 'auto',
          language: 'pt-br',
        });
      } catch (error) {
        console.error('Error rendering Turnstile widget:', error);
        if (isDevelopment()) {
          setDevMode(true);
        }
      }
    }
  }, [onVerify, onError, onExpire]);

  const handleDevVerify = () => {
    setDevVerified(true);
    // Gera um token fake para desenvolvimento
    onVerify('dev-mode-token-' + Date.now());
  };

  useEffect(() => {
    // Em ambientes de desenvolvimento, já está em devMode
    if (devMode) {
      return;
    }

    // Check if script is already loaded
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Check if script is already being loaded
    if (scriptLoadedRef.current) return;

    // Load the Turnstile script
    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (!existingScript) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      script.defer = true;
      
      window.onTurnstileLoad = () => {
        renderWidget();
      };
      
      script.onerror = () => {
        if (isDevelopment()) {
          setDevMode(true);
        }
      };
      
      document.head.appendChild(script);
    } else {
      // Script exists, wait for it to load
      window.onTurnstileLoad = () => {
        renderWidget();
      };
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  // Modo de desenvolvimento - mostra um botão de verificação simples
  if (devMode) {
    return (
      <div className="flex justify-center my-4">
        <button
          type="button"
          onClick={handleDevVerify}
          disabled={devVerified}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            devVerified 
              ? 'bg-green-50 border-green-300 text-green-700' 
              : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
          }`}
        >
          {devVerified ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Verificado (Dev Mode)
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" />
              Clique para verificar (Dev Mode)
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center my-4"
    />
  );
}

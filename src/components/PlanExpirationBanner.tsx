import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PlanExpirationBanner() {
  const { profile } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!profile?.plan_expires_at) return;

    const updateTimer = () => {
      const expiresAt = new Date(profile.plan_expires_at!);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Plano expirado');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [profile?.plan_expires_at]);

  if (!profile?.plan_expires_at) return null;

  const expiresAt = new Date(profile.plan_expires_at);
  const now = new Date();
  const daysRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Alert className="mb-4 border-orange-500/50 bg-orange-500/10">
      <Clock className="h-4 w-4 text-orange-500" />
      <AlertDescription className="text-sm">
        <span className="font-semibold">Atenção:</span> Seu plano expira em{' '}
        <span className="font-bold text-orange-500">{timeRemaining}</span>. Entre em contato com seu vendedor para renovar.
      </AlertDescription>
    </Alert>
  );
}

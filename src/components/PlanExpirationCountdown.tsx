import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PlanExpirationCountdown() {
  const { profile } = useAuth();
  const [timeData, setTimeData] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    isLessThanOneDay: boolean;
  } | null>(null);

  useEffect(() => {
    if (!profile?.plan_expires_at) {
      setTimeData(null);
      return;
    }

    const updateTimer = () => {
      const expiresAt = new Date(profile.plan_expires_at!);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeData({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          isLessThanOneDay: false,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeData({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        isLessThanOneDay: days === 0,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [profile?.plan_expires_at]);

  if (!profile?.plan_expires_at || !timeData) return null;

  const colorClass = timeData.isExpired 
    ? 'text-red-500 border-red-500/50 bg-red-500/10' 
    : timeData.isLessThanOneDay 
    ? 'text-red-500 border-red-500/50 bg-red-500/10' 
    : 'text-green-500 border-green-500/50 bg-green-500/10';

  const iconColorClass = timeData.isExpired || timeData.isLessThanOneDay ? 'text-red-500' : 'text-green-500';

  return (
    <Card className={`shadow-card ${colorClass}`}>
      <CardHeader>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${timeData.isExpired || timeData.isLessThanOneDay ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          <Clock className={`h-6 w-6 ${iconColorClass}`} />
        </div>
        <CardTitle className="text-xl">
          {timeData.isExpired ? 'Plano Expirado' : 'Tempo Restante do Plano'}
        </CardTitle>
        <CardDescription>
          {timeData.isExpired 
            ? 'Entre em contato com seu vendedor para renovar' 
            : 'Tempo até a expiração do seu plano'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {timeData.isExpired ? (
          <div className="text-center py-4">
            <span className="text-2xl font-bold text-red-500">EXPIRADO</span>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            {timeData.days > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold">{timeData.days}</div>
                <div className="text-sm text-muted-foreground">dias</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-3xl font-bold">{timeData.hours}</div>
              <div className="text-sm text-muted-foreground">horas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{timeData.minutes}</div>
              <div className="text-sm text-muted-foreground">min</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{timeData.seconds}</div>
              <div className="text-sm text-muted-foreground">seg</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

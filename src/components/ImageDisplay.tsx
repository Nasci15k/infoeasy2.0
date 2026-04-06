import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { User, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageDisplayProps {
  imageUrl?: string;
  imageData?: string;
  name?: string;
  className?: string;
}

export function ImageDisplay({ imageUrl, imageData, name, className }: ImageDisplayProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const getSrc = () => {
    if (imageData) {
      if (imageData.startsWith('data:image') || imageData.startsWith('http')) {
        return imageData;
      }
      // Automagicamente detecta se é JPEG ou PNG (padrão JPEG se não especificado)
      return `data:image/jpeg;base64,${imageData}`;
    }
    return imageUrl;
  };

  const src = getSrc();

  if (!src || error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-muted/30 border-2 border-dashed border-border/50 rounded-xl p-4 text-center aspect-square transition-all duration-300",
        className
      )}>
        {error ? (
          <>
            <AlertCircle className="h-8 w-8 text-destructive/50 mb-2" />
            <p className="text-[10px] font-medium text-muted-foreground uppercase leading-tight">Erro ao carregar</p>
          </>
        ) : (
          <>
            <User className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sem Imagem</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-xl bg-muted shadow-sm border border-border/30 aspect-square transition-all duration-500",
      className
    )}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <Loader2 className="h-5 w-5 text-primary/30 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={name || 'Foto'}
        className={cn(
          "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-[9px] text-white font-bold truncate uppercase">{name || 'Foto'}</p>
      </div>
    </div>
  );
}

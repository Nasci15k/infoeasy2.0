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
      "relative group overflow-hidden rounded-2xl bg-slate-100 shadow-lg border border-slate-200 aspect-[3/4] transition-all duration-500",
      className
    )}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 animate-pulse">
          <Loader2 className="h-6 w-6 text-blue-600/20 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={name || 'Foto'}
        className={cn(
          "w-full h-full object-cover transition-all duration-700",
          loading ? "opacity-0 scale-95" : "opacity-100 scale-100",
          "group-hover:scale-110"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      
      {/* Overlay subtil no hover */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {name && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <p className="text-[9px] text-white font-black truncate uppercase tracking-widest text-center">{name}</p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Loader2, MapPin, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface MapEmbedProps {
  address: string;
}

export function MapEmbed({ address }: MapEmbedProps) {
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address || address.length < 5) return;

    const geocode = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          setCoords({ lat: data[0].lat, lon: data[0].lon });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    geocode();
  }, [address]);

  if (!address) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <MapPin className="h-3 w-3 text-rose-500" />
          <span>Localização Geográfica</span>
        </div>
        {coords && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 bg-blue-50/50"
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`, '_blank')}
          >
            Abrir Google Maps <ExternalLink className="h-2 w-2 ml-1" />
          </Button>
        )}
      </div>

      <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-inner group">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/80 z-10">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localizando...</span>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">
              Não foi possível gerar a visualização precisa para este endereço.
            </p>
          </div>
        ) : coords ? (
          <iframe
            title="Mapa"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(coords.lon) - 0.005},${parseFloat(coords.lat) - 0.005},${parseFloat(coords.lon) + 0.005},${parseFloat(coords.lat) + 0.005}&layer=mapnik&marker=${coords.lat},${coords.lon}`}
            className="w-full h-full grayscale-[0.2] contrast-[1.1]"
          />
        ) : !loading && (
           <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aguardando endereço válido...</p>
           </div>
        )}
      </div>
    </div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

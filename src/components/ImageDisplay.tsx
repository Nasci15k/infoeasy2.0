import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';

interface ImageDisplayProps {
  imageUrl?: string;
  imageData?: string;
  name?: string;
}

export function ImageDisplay({ imageUrl, imageData, name }: ImageDisplayProps) {
  const getSrc = () => {
    if (imageData) {
      // Se for base64, verificar se já tem o prefixo
      if (imageData.startsWith('data:image')) {
        return imageData;
      }
      return `data:image/jpeg;base64,${imageData}`;
    }
    return imageUrl;
  };

  const src = getSrc();

  if (!src) {
    return (
      <Card className="p-8 flex items-center justify-center bg-muted">
        <div className="text-center">
          <User className="h-20 w-20 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Foto não disponível</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <img
        src={src}
        alt={name || 'Foto'}
        className="w-full h-auto object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.innerHTML = `
            <div class="p-8 flex items-center justify-center bg-muted">
              <div class="text-center">
                <p class="text-sm text-muted-foreground">Erro ao carregar imagem</p>
              </div>
            </div>
          `;
        }}
      />
    </Card>
  );
}

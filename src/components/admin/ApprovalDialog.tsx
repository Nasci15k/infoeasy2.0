import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (planType: 'daily' | 'weekly' | 'monthly', role: string, expiresAt: Date) => void;
  userName: string;
}

export function ApprovalDialog({ isOpen, onClose, onApprove, userName }: ApprovalDialogProps) {
  const [planType, setPlanType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [role, setRole] = useState<string>('usuario');
  const [daysToAdd, setDaysToAdd] = useState(30);

  const handleApprove = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);
    onApprove(planType, role, expiresAt);
    onClose();
  };

  const handlePlanTypeChange = (value: 'daily' | 'weekly' | 'monthly') => {
    setPlanType(value);
    // Set default days based on plan type
    if (value === 'daily') setDaysToAdd(1);
    else if (value === 'weekly') setDaysToAdd(7);
    else setDaysToAdd(30);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprovar Usuário</DialogTitle>
          <DialogDescription>
            Configure o plano e role para {userName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teste">Teste (10 consultas/dia)</SelectItem>
                <SelectItem value="usuario">Usuário (50 consultas/dia)</SelectItem>
                <SelectItem value="usuario_premium">Premium (Ilimitado)</SelectItem>
                <SelectItem value="revendedor">Revendedor (Ilimitado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Tipo de Plano</Label>
            <Select value={planType} onValueChange={handlePlanTypeChange}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Dias de Validade</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                id="days"
                type="number"
                value={daysToAdd}
                onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 1)}
                min={1}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Expira em: {new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApprove}>
            Aprovar e Configurar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Location = {
  id: number;
  name: string;
  address: string | null;
  isActive: boolean;
};

type LocationFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  location?: Location | null; // null = create mode, object = edit mode
};

export const LocationForm = ({
  open,
  onClose,
  onSuccess,
  location,
}: LocationFormProps) => {
  const [name, setName] = useState(location?.name ?? '');
  const [address, setAddress] = useState(location?.address ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!location;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setLoading(true);

    try {
      const url = isEditing
        ? `/api/locations/${location.id}`
        : '/api/locations';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Error al guardar');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar local' : 'Nuevo local'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Sucursal Centro"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ej: Av. Corrientes 1234"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear local'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

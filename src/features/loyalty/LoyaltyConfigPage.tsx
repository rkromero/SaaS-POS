'use client';

import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoyaltyConfig = {
  organizationId: string;
  isActive: boolean;
  pesosPerPoint: string;
  minPointsToRedeem: number;
  pointsExpiryDays: number | null;
  updatedByUserId: string | null;
  updatedAt: string | null;
};

export const LoyaltyConfigPage = () => {
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [isActive, setIsActive] = useState(false);
  const [pesosPerPoint, setPesosPerPoint] = useState('1000');
  const [minPointsToRedeem, setMinPointsToRedeem] = useState('0');
  const [pointsExpiryDays, setPointsExpiryDays] = useState('');

  useEffect(() => {
    fetch('/api/loyalty/config')
      .then(r => r.json())
      .then((data: LoyaltyConfig) => {
        setConfig(data);
        setIsActive(data.isActive);
        setPesosPerPoint(data.pesosPerPoint);
        setMinPointsToRedeem(String(data.minPointsToRedeem));
        setPointsExpiryDays(data.pointsExpiryDays ? String(data.pointsExpiryDays) : '');
      })
      .catch(() => setError('Error al cargar la configuración'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError('');
    setSaved(false);

    if (Number(pesosPerPoint) <= 0) {
      setError('Los pesos por punto deben ser mayor a 0');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/loyalty/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive,
          pesosPerPoint: Number(pesosPerPoint),
          minPointsToRedeem: Number(minPointsToRedeem),
          pointsExpiryDays: pointsExpiryDays ? Number(pointsExpiryDays) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Error al guardar');
        return;
      }

      const updated: LoyaltyConfig = await res.json();
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando configuración...</p>;
  }

  // Ejemplo: con $15.000 de compra cuántos puntos gana el cliente
  const examplePurchase = 15000;
  const examplePoints = Math.floor(examplePurchase / Number(pesosPerPoint || 1000));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Estado del módulo */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-5 shadow-sm">
        <div>
          <h2 className="font-semibold">Estado del programa</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Activá el módulo para empezar a otorgar puntos a tus clientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Regla de acumulación */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Regla de acumulación de puntos</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pesosPerPoint">Pesos necesarios para ganar 1 punto</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="pesosPerPoint"
                type="number"
                min="1"
                step="1"
                value={pesosPerPoint}
                onChange={e => setPesosPerPoint(e.target.value)}
                className="w-36"
                placeholder="1000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ejemplo: con una compra de
              {' '}
              <strong>
                $
                {examplePurchase.toLocaleString('es-AR')}
              </strong>
              , el cliente gana
              {' '}
              <strong>
                {examplePoints.toLocaleString('es-AR')}
                {' '}
                {examplePoints === 1 ? 'punto' : 'puntos'}
              </strong>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Límites de canje */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Límites de canje</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="minPoints">Puntos mínimos para canjear</Label>
            <Input
              id="minPoints"
              type="number"
              min="0"
              step="1"
              value={minPointsToRedeem}
              onChange={e => setMinPointsToRedeem(e.target.value)}
              className="w-36"
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              El cliente necesita al menos esta cantidad de puntos para poder hacer cualquier canje.
              0 = sin mínimo.
            </p>
          </div>
        </div>
      </div>

      {/* Vencimiento de puntos */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Vencimiento de puntos</h2>
        <div className="space-y-1.5">
          <Label htmlFor="expiryDays">Días hasta el vencimiento</Label>
          <Input
            id="expiryDays"
            type="number"
            min="1"
            step="1"
            value={pointsExpiryDays}
            onChange={e => setPointsExpiryDays(e.target.value)}
            className="w-36"
            placeholder="Sin vencimiento"
          />
          <p className="text-xs text-muted-foreground">
            Dejá vacío para que los puntos no venzan nunca.
          </p>
        </div>
      </div>

      {/* Auditoría */}
      {config?.updatedAt && (
        <p className="text-xs text-muted-foreground">
          Última modificación:
          {' '}
          {new Date(config.updatedAt).toLocaleString('es-AR')}
          {config.updatedByUserId && ` · por ${config.updatedByUserId.slice(0, 12)}...`}
        </p>
      )}

      {/* Acciones */}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600">Configuración guardada correctamente.</p>}

      <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
        <Star className="size-4" />
        {saving ? 'Guardando...' : 'Guardar configuración'}
      </Button>
    </div>
  );
};

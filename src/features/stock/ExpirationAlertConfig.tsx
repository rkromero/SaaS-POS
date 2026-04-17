'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Threshold = {
  id: number;
  thresholdDays: number;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

type DraftThreshold = {
  thresholdDays: number;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

type Props = {
  initialThresholds: Threshold[];
  onSaved: (thresholds: Threshold[]) => void;
};

const PRESETS = [7, 15, 30];

export function ExpirationAlertConfig({ initialThresholds, onSaved }: Props) {
  const [thresholds, setThresholds] = useState<DraftThreshold[]>(
    initialThresholds.length > 0
      ? initialThresholds.map(({ thresholdDays, emailEnabled, inAppEnabled }) => ({ thresholdDays, emailEnabled, inAppEnabled }))
      : [{ thresholdDays: 30, emailEnabled: false, inAppEnabled: true }],
  );
  const [newDays, setNewDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const addThreshold = (days: number) => {
    if (thresholds.some(t => t.thresholdDays === days)) {
      return;
    }
    setThresholds(prev => [
      ...prev,
      { thresholdDays: days, emailEnabled: false, inAppEnabled: true },
    ].sort((a, b) => a.thresholdDays - b.thresholdDays));
  };

  const removeThreshold = (days: number) => {
    setThresholds(prev => prev.filter(t => t.thresholdDays !== days));
  };

  const toggleEmail = (days: number) => {
    setThresholds(prev =>
      prev.map(t => t.thresholdDays === days ? { ...t, emailEnabled: !t.emailEnabled } : t),
    );
  };

  const isDisabledPreset = (days: number) => thresholds.some(t => t.thresholdDays === days);

  const handleAddCustom = () => {
    const days = Number(newDays);
    if (Number.isNaN(days) || days < 1 || days > 365) {
      setError('Ingresá un número entre 1 y 365');
      return;
    }
    setError('');
    addThreshold(days);
    setNewDays('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/stock/expiration/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? 'Error al guardar');
        return;
      }
      const saved: Threshold[] = await res.json();
      setSuccess(true);
      onSaved(saved);
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 rounded-lg border bg-card p-5">
      <div>
        <h3 className="font-semibold">Configuración de alertas de vencimiento</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Definí con cuántos días de anticipación querés recibir alertas.
          Podés configurar múltiples umbrales.
        </p>
      </div>

      {/* Current thresholds */}
      <div className="space-y-2">
        <Label>Umbrales configurados</Label>
        {thresholds.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin umbrales. Agregá al menos uno.</p>
        )}
        <div className="space-y-2">
          {thresholds.map(t => (
            <div
              key={t.thresholdDays}
              className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2"
            >
              <span className="w-20 shrink-0 font-medium">
                {t.thresholdDays}
                {' '}
                días
              </span>
              <div className="flex flex-1 items-center gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={t.inAppEnabled}
                    disabled
                    className="size-3.5"
                  />
                  <span className="text-muted-foreground">In-app</span>
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={t.emailEnabled}
                    onChange={() => toggleEmail(t.thresholdDays)}
                    className="size-3.5"
                  />
                  <span className="text-muted-foreground">Email</span>
                </label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => removeThreshold(t.thresholdDays)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Preset buttons */}
      <div className="space-y-2">
        <Label>Agregar umbral rápido</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(days => (
            <Button
              key={days}
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisabledPreset(days)}
              onClick={() => addThreshold(days)}
            >
              {days}
              {' '}
              días
            </Button>
          ))}
        </div>
      </div>

      {/* Custom threshold */}
      <div className="space-y-2">
        <Label htmlFor="customDays">Otro umbral (días)</Label>
        <div className="flex gap-2">
          <Input
            id="customDays"
            type="number"
            min="1"
            max="365"
            value={newDays}
            onChange={e => setNewDays(e.target.value)}
            placeholder="Ej: 45"
            className="w-32"
            onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddCustom}>
            <Plus className="mr-1.5 size-3.5" />
            Agregar
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Configuración guardada correctamente.</p>
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Guardar configuración
        </Button>
      </div>
    </div>
  );
}

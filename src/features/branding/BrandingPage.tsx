'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type BrandingData = {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  businessName: string | null;
  receiptShowLogo: boolean;
  receiptAddress: string | null;
  receiptPhone: string | null;
  receiptCuit: string | null;
  receiptFooter: string | null;
};

export const BrandingPage = ({ isPaidPlan }: { isPaidPlan: boolean }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e7a35');
  const [businessName, setBusinessName] = useState('');
  const [receiptShowLogo, setReceiptShowLogo] = useState(true);
  const [receiptAddress, setReceiptAddress] = useState('');
  const [receiptPhone, setReceiptPhone] = useState('');
  const [receiptCuit, setReceiptCuit] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');

  useEffect(() => {
    fetch('/api/branding')
      .then(r => r.json())
      .then((data: BrandingData | null) => {
        if (data) {
          setLogoUrl(data.logoUrl ?? '');
          setFaviconUrl(data.faviconUrl ?? '');
          setPrimaryColor(data.primaryColor ?? '#1e7a35');
          setBusinessName(data.businessName ?? '');
          setReceiptShowLogo(data.receiptShowLogo);
          setReceiptAddress(data.receiptAddress ?? '');
          setReceiptPhone(data.receiptPhone ?? '');
          setReceiptCuit(data.receiptCuit ?? '');
          setReceiptFooter(data.receiptFooter ?? '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl,
          faviconUrl,
          primaryColor,
          businessName,
          receiptShowLogo,
          receiptAddress,
          receiptPhone,
          receiptCuit,
          receiptFooter,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Error al guardar');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (!isPaidPlan) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border bg-card p-8 text-center">
        <div className="mb-3 text-4xl">🎨</div>
        <h2 className="mb-2 text-lg font-bold">Personalización de marca</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Agregá tu logo, colores y datos en los tickets con un plan de pago.
        </p>
        <Button onClick={() => window.location.href = '/dashboard/billing'}>
          Ver planes
        </Button>
      </div>
    );
  }

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(k => <div key={k} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Logo y Marca */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 font-semibold">Logo y marca</h2>
        <div className="space-y-4">
          <div>
            <Label>Nombre del negocio</Label>
            <p className="mb-1 text-xs text-muted-foreground">Reemplaza el nombre del sistema en la interfaz</p>
            <Input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Ej: Mi Almacén"
            />
          </div>

          <div>
            <Label>URL del logo</Label>
            <p className="mb-1 text-xs text-muted-foreground">Pegá la URL de tu logo (PNG o SVG, fondo transparente recomendado)</p>
            <Input
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
            {logoUrl && (
              <div className="mt-2 inline-flex items-center gap-2 rounded border bg-muted p-2">
                <img src={logoUrl} alt="Preview" className="h-10 max-w-[8rem] object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
            )}
          </div>

          <div>
            <Label>URL del favicon</Label>
            <p className="mb-1 text-xs text-muted-foreground">Ícono que aparece en la pestaña del navegador (32x32px recomendado)</p>
            <Input
              value={faviconUrl}
              onChange={e => setFaviconUrl(e.target.value)}
              placeholder="https://..."
            />
            {faviconUrl && (
              <div className="mt-2 inline-flex items-center gap-2 rounded border bg-muted p-2">
                <img src={faviconUrl} alt="Favicon" className="size-6 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Color */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 font-semibold">Color principal</h2>
        <p className="mb-3 text-xs text-muted-foreground">Color de botones, enlaces activos y elementos de acción</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={e => setPrimaryColor(e.target.value)}
            className="size-10 cursor-pointer rounded border"
          />
          <Input
            value={primaryColor}
            onChange={e => setPrimaryColor(e.target.value)}
            placeholder="#1e7a35"
            className="w-36 font-mono"
          />
          <div
            className="flex h-9 flex-1 items-center justify-center rounded-md text-sm font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Ejemplo de botón
          </div>
        </div>
      </section>

      {/* Recibos */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 font-semibold">Datos en recibos y tickets</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="receiptShowLogo"
              checked={receiptShowLogo}
              onChange={e => setReceiptShowLogo(e.target.checked)}
              className="size-4"
            />
            <Label htmlFor="receiptShowLogo">Mostrar logo en el ticket impreso</Label>
          </div>

          <div>
            <Label>Dirección</Label>
            <Input
              value={receiptAddress}
              onChange={e => setReceiptAddress(e.target.value)}
              placeholder="Ej: Av. Corrientes 1234, CABA"
            />
          </div>

          <div>
            <Label>Teléfono</Label>
            <Input
              value={receiptPhone}
              onChange={e => setReceiptPhone(e.target.value)}
              placeholder="Ej: 011 4567-8901"
            />
          </div>

          <div>
            <Label>CUIT</Label>
            <Input
              value={receiptCuit}
              onChange={e => setReceiptCuit(e.target.value)}
              placeholder="Ej: 20-12345678-9"
            />
          </div>

          <div>
            <Label>Mensaje al pie del ticket</Label>
            <Input
              value={receiptFooter}
              onChange={e => setReceiptFooter(e.target.value)}
              placeholder="Ej: ¡Gracias por su compra! Vuelva pronto."
            />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600">✓ Cambios guardados</p>}

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? 'Guardando...' : 'Guardar personalización'}
      </Button>
    </div>
  );
};

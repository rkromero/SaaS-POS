'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

type PreviewRow = {
  name: string;
  price: number;
  costPrice?: number;
  sku?: string;
  description?: string;
  category?: string;
  valid: boolean;
  error?: string;
};

const TEMPLATE_CSV = `nombre,precio,costo,sku,descripcion,categoria
Alfajor Milka,500,300,7622300,Alfajor de chocolate con leche,Golosinas
Coca Cola 500ml,1200,,CC500,,Bebidas
Cigarrillos Marlboro,2500,2000,MARL,,Cigarrillos`;

function parseCSV(text: string): PreviewRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  // Detect header
  const header = lines[0]!.toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const idxName = header.findIndex(h => h.includes('nombre') || h.includes('name'));
  const idxPrice = header.findIndex(h => h.includes('precio') || h.includes('price'));
  const idxCost = header.findIndex(h => h.includes('costo') || h.includes('cost'));
  const idxSku = header.findIndex(h => h.includes('sku') || h.includes('codigo'));
  const idxDesc = header.findIndex(h => h.includes('descrip'));
  const idxCat = header.findIndex(h => h.includes('categ'));

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
    const name = idxName >= 0 ? (cols[idxName] ?? '') : (cols[0] ?? '');
    const priceRaw = idxPrice >= 0 ? (cols[idxPrice] ?? '') : (cols[1] ?? '');
    const price = Number(priceRaw);

    const row: PreviewRow = {
      name,
      price,
      costPrice: idxCost >= 0 && cols[idxCost] ? Number(cols[idxCost]) : undefined,
      sku: idxSku >= 0 ? cols[idxSku] : undefined,
      description: idxDesc >= 0 ? cols[idxDesc] : undefined,
      category: idxCat >= 0 ? cols[idxCat] : undefined,
      valid: true,
    };

    if (!name) {
      row.valid = false;
      row.error = 'Sin nombre';
    } else if (!price || price <= 0) {
      row.valid = false;
      row.error = 'Precio inválido';
    }

    return row;
  });
}

export const ProductImport = ({ onDone }: { onDone: () => void }) => {
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPreview(parseCSV(text));
      setResult(null);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    const validRows = preview.filter(r => r.valid);
    if (validRows.length === 0) {
      return;
    }
    setImporting(true);
    const res = await fetch('/api/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: validRows.map(r => ({
          name: r.name,
          price: r.price,
          costPrice: r.costPrice,
          sku: r.sku,
          description: r.description,
          category: r.category,
        })),
      }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_productos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = preview.filter(r => r.valid).length;
  const invalidCount = preview.filter(r => !r.valid).length;

  if (result) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <p className="font-semibold text-green-700">
          ✓
          {' '}
          {result.imported}
          {' '}
          {result.imported === 1 ? 'producto importado' : 'productos importados'}
        </p>
        {result.skipped > 0 && (
          <p className="text-sm text-muted-foreground">
            {result.skipped}
            {' '}
            filas omitidas por datos inválidos
          </p>
        )}
        <Button onClick={() => {
          setPreview([]);
          setResult(null);
          onDone();
        }}
        >
          Listo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Importar productos desde CSV</h3>
        <Button size="sm" variant="outline" onClick={downloadTemplate}>
          Descargar plantilla
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Columnas requeridas:
        {' '}
        <strong>nombre</strong>
        ,
        {' '}
        <strong>precio</strong>
        . Opcionales: costo, sku, descripcion, categoria.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button variant="outline" onClick={() => fileRef.current?.click()}>
        Seleccionar archivo CSV
      </Button>

      {preview.length > 0 && (
        <>
          <div className="flex gap-3 text-sm">
            <span className="font-medium text-green-600">
              {validCount}
              {' '}
              válidas
            </span>
            {invalidCount > 0 && (
              <span className="font-medium text-red-600">
                {invalidCount}
                {' '}
                con errores
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-md border text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-2 py-1 text-left">Nombre</th>
                  <th className="px-2 py-1 text-left">Precio</th>
                  <th className="px-2 py-1 text-left">Categoría</th>
                  <th className="px-2 py-1 text-left">SKU</th>
                  <th className="px-2 py-1 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={`${row.name}-${row.sku ?? i}`} className={row.valid ? '' : 'bg-red-50'}>
                    <td className="px-2 py-1">{row.name || '—'}</td>
                    <td className="px-2 py-1">
                      {row.price > 0 ? `$${row.price}` : '—'}
                    </td>
                    <td className="px-2 py-1">{row.category || '—'}</td>
                    <td className="px-2 py-1">{row.sku || '—'}</td>
                    <td className="px-2 py-1">
                      {row.valid
                        ? <span className="text-green-600">✓</span>
                        : <span className="text-red-600">{row.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            disabled={validCount === 0 || importing}
            onClick={handleImport}
          >
            {importing ? 'Importando...' : `Importar ${validCount} productos`}
          </Button>
        </>
      )}
    </div>
  );
};

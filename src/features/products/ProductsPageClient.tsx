'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { BulkCategoryAssign } from './BulkCategoryAssign';
import { BulkPriceUpdate } from './BulkPriceUpdate';
import { ProductImport } from './ProductImport';
import { ProductList } from './ProductList';

type Mode = 'none' | 'bulk' | 'import' | 'category';

export const ProductsPageClient = ({ isAdmin }: { isAdmin: boolean }) => {
  const [mode, setMode] = useState<Mode>('none');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setMode('none');
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="space-y-3">
          {mode === 'none' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode('bulk')}>
                Ajuste masivo de precios
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMode('import')}>
                Importar desde CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMode('category')}>
                Asignar categorías
              </Button>
            </div>
          )}
          {mode === 'bulk' && <BulkPriceUpdate onDone={refresh} />}
          {mode === 'import' && <ProductImport onDone={refresh} />}
          {mode === 'category' && <BulkCategoryAssign onDone={refresh} />}
        </div>
      )}
      <div className="rounded-md bg-card p-6 shadow-sm">
        <ProductList key={refreshKey} isAdmin={isAdmin} />
      </div>
    </div>
  );
};

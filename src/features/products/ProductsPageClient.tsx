'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { BulkPriceUpdate } from './BulkPriceUpdate';
import { ProductList } from './ProductList';

export const ProductsPageClient = ({ isAdmin }: { isAdmin: boolean }) => {
  const [showBulk, setShowBulk] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div>
          {showBulk
            ? (
                <BulkPriceUpdate
                  onDone={() => {
                    setShowBulk(false);
                    setRefreshKey(k => k + 1);
                  }}
                />
              )
            : (
                <Button variant="outline" size="sm" onClick={() => setShowBulk(true)}>
                  Ajuste masivo de precios
                </Button>
              )}
        </div>
      )}
      <div className="rounded-md bg-card p-6 shadow-sm">
        <ProductList key={refreshKey} isAdmin={isAdmin} />
      </div>
    </div>
  );
};

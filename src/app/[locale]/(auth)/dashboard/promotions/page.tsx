import { Tag } from 'lucide-react';

import { PromotionsPageClient } from '@/features/promotions/PromotionsPageClient';

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="size-6 text-indigo-400" />
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Promociones</h1>
          <p className="text-sm text-zinc-500">
            Precios especiales, descuentos automáticos y combos de productos en el POS.
          </p>
        </div>
      </div>
      <PromotionsPageClient />
    </div>
  );
}

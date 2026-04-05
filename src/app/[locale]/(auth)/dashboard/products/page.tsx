import { auth } from '@clerk/nextjs/server';

import { CategoryManager } from '@/features/categories/CategoryManager';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { ProductList } from '@/features/products/ProductList';

export default async function ProductsPage() {
  const { orgRole } = await auth();
  const isAdmin = orgRole === 'org:admin';

  return (
    <>
      <TitleBar
        title="Productos"
        description="Gestioná el catálogo de productos de tu organización"
      />

      {isAdmin && (
        <div className="mb-6 rounded-md bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Categorías
          </h2>
          <CategoryManager />
        </div>
      )}

      <div className="rounded-md bg-card p-6 shadow-sm">
        <ProductList isAdmin={isAdmin} />
      </div>
    </>
  );
}

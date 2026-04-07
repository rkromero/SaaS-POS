'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ProductForm } from './ProductForm';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  costPrice: string | null;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: number | null;
  categoryName: string | null;
};

type ProductListProps = {
  isAdmin: boolean;
};

export const ProductList = ({ isAdmin }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleActive = async (product: Product) => {
    await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, isActive: !product.isActive }),
    });
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  // Build unique category list from loaded products
  const categories = [...new Map(
    products
      .filter(p => p.categoryId && p.categoryName)
      .map(p => [p.categoryId, { id: p.categoryId!, name: p.categoryName! }]),
  ).values()];

  const filtered = products.filter((p) => {
    const matchSearch
      = search === ''
      || p.name.toLowerCase().includes(search.toLowerCase())
      || (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCategory
      = filterCategory === '' || String(p.categoryId) === filterCategory;
    const matchStatus
      = filterStatus === ''
      || (filterStatus === 'active' ? p.isActive : !p.isActive);
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input
          className="w-56"
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        {isAdmin && (
          <Button
            className="ml-auto"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Nuevo producto
          </Button>
        )}
      </div>

      {loading
        ? <p className="text-sm text-muted-foreground">Cargando productos...</p>
        : filtered.length === 0
          ? (
              <p className="text-sm text-muted-foreground">
                {products.length === 0
                  ? 'No hay productos aún.'
                  : 'Sin resultados para los filtros aplicados.'}
              </p>
            )
          : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    {isAdmin && <TableHead className="text-right">Costo</TableHead>}
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.imageUrl && (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={32}
                              height={32}
                              className="size-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-muted-foreground">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.categoryName ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.sku ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        $
                        {Number(product.price).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right text-muted-foreground">
                          {product.costPrice
                            ? `$${Number(product.costPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="space-x-1 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditing(product);
                              setFormOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(product)}
                          >
                            {product.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            {confirmDelete === product.id ? '¿Confirmar?' : 'Eliminar'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

      {formOpen && (
        <ProductForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={fetchProducts}
          product={editing}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

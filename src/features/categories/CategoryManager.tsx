'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Category = { id: number; name: string };

type CategoryManagerProps = {
  onCategoriesChange?: (categories: Category[]) => void;
};

export const CategoryManager = ({ onCategoriesChange }: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
    onCategoriesChange?.(data);
  }, [onCategoriesChange]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }
    setLoading(true);
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    setNewName('');
    await fetchCategories();
    setLoading(false);
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) {
      return;
    }
    await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName }),
    });
    setEditingId(null);
    fetchCategories();
  };

  const handleDelete = async (id: number) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Nueva categoría..."
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={loading || !newName.trim()}>
          Agregar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-1 rounded-md border bg-background px-2 py-1">
            {editingId === cat.id
              ? (
                  <>
                    <Input
                      className="h-6 w-28 text-sm"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                    />
                    <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={() => handleUpdate(cat.id)}>✓</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={() => setEditingId(null)}>✕</Button>
                  </>
                )
              : (
                  <>
                    <span className="text-sm">{cat.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-1 text-xs opacity-50 hover:opacity-100"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                    >
                      ✎
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-1 text-xs text-destructive opacity-50 hover:opacity-100"
                      onClick={() => handleDelete(cat.id)}
                    >
                      {confirmDelete === cat.id ? '¿Sí?' : '✕'}
                    </Button>
                  </>
                )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin categorías aún.</p>
        )}
      </div>
    </div>
  );
};

'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Supplier = {
  id: number;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
};

type FormData = {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
};

const emptyForm: FormData = { name: '', contactName: '', phone: '', email: '', notes: '' };

export const SupplierManager = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/suppliers')
      .then(r => r.json())
      .then((data) => {
        setSuppliers(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contactName: s.contactName ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      notes: s.notes ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      return;
    }
    setSaving(true);
    if (editing) {
      await fetch(`/api/suppliers/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const handleDeactivate = async (id: number) => {
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    load();
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>← Volver</Button>
          <h3 className="font-semibold">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
        </div>
        <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Contacto</Label>
            <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Button disabled={!form.name.trim() || saving} onClick={handleSave}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Proveedores</h3>
        <Button size="sm" onClick={openNew}>+ Nuevo proveedor</Button>
      </div>

      {loading
        ? (
            <div className="space-y-2">
              {(['a', 'b', 'c'] as const).map(k => <div key={k} className="h-14 animate-pulse rounded-lg bg-muted" />)}
            </div>
          )
        : suppliers.filter(s => s.isActive).length === 0
          ? (
              <p className="text-sm text-muted-foreground">No hay proveedores. Creá el primero.</p>
            )
          : (
              <div className="space-y-2">
                {suppliers.filter(s => s.isActive).map(s => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[s.contactName, s.phone, s.email].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Editar</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeactivate(s.id)}
                      >
                        Desactivar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
    </div>
  );
};

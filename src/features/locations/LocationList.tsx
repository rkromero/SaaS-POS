'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { LocationForm } from './LocationForm';
import { LocationMembers } from './LocationMembers';

type Location = {
  id: number;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
};

export const LocationList = ({ isAdmin }: { isAdmin: boolean }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [membersLocation, setMembersLocation] = useState<Location | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleToggleActive = async (location: Location) => {
    await fetch(`/api/locations/${location.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: location.name,
        address: location.address,
        isActive: !location.isActive,
      }),
    });
    fetchLocations();
  };

  const handleDelete = async (id: number) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    setDeleting(id);
    try {
      await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      fetchLocations();
    } finally {
      setDeleting(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (location: Location) => {
    setEditing(location);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>+ Nuevo local</Button>
        </div>
      )}

      {loading
        ? (
            <p className="text-sm text-muted-foreground">Cargando locales...</p>
          )
        : locations.length === 0
          ? (
              <p className="text-sm text-muted-foreground">
                No hay locales creados aún.
                {isAdmin && ' Creá el primero con el botón de arriba.'}
              </p>
            )
          : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map(loc => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {loc.address ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={loc.isActive ? 'default' : 'secondary'}>
                          {loc.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="space-x-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMembersLocation(loc)}
                          >
                            Miembros
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(loc)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(loc)}
                          >
                            {loc.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleting === loc.id}
                            onClick={() => handleDelete(loc.id)}
                          >
                            {deleting === loc.id
                              ? '...'
                              : confirmDelete === loc.id
                                ? '¿Confirmar?'
                                : 'Eliminar'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

      {formOpen && (
        <LocationForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={fetchLocations}
          location={editing}
        />
      )}

      {membersLocation && (
        <LocationMembers
          locationId={membersLocation.id}
          locationName={membersLocation.name}
          onClose={() => setMembersLocation(null)}
        />
      )}
    </div>
  );
};

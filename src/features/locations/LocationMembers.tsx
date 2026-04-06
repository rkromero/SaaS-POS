'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Member = {
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  role: string;
  assignedToThisLocation: boolean;
  assignmentId: number | null;
};

type LocationMembersProps = {
  locationId: number;
  locationName: string;
  onClose: () => void;
};

export const LocationMembers = ({
  locationId,
  locationName,
  onClose,
}: LocationMembersProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchMembers = () => {
    setLoading(true);
    fetch(`/api/locations/${locationId}/members`)
      .then(r => r.json())
      .then((data) => {
        setMembers(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMembers();
  }, [locationId]);

  const handleAssign = async (targetUserId: string) => {
    setSaving(targetUserId);
    await fetch(`/api/locations/${locationId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    fetchMembers();
    setSaving(null);
  };

  const handleRemove = async (targetUserId: string) => {
    setSaving(targetUserId);
    await fetch(`/api/locations/${locationId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    fetchMembers();
    setSaving(null);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Miembros —
            {' '}
            {locationName}
          </DialogTitle>
        </DialogHeader>

        {loading
          ? <p className="text-sm text-muted-foreground">Cargando miembros...</p>
          : members.length === 0
            ? <p className="text-sm text-muted-foreground">No hay miembros en la organización.</p>
            : (
                <div className="space-y-2">
                  {members.map(member => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        {member.imageUrl && (
                          <img
                            src={member.imageUrl}
                            alt={member.name}
                            className="size-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium">{member.name || member.email}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                        {member.role === 'org:admin' && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {member.assignedToThisLocation && (
                          <Badge variant="default" className="text-xs">Asignado</Badge>
                        )}
                        {member.role !== 'org:admin' && (
                          member.assignedToThisLocation
                            ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={saving === member.userId}
                                  onClick={() => handleRemove(member.userId)}
                                >
                                  {saving === member.userId ? '...' : 'Quitar'}
                                </Button>
                              )
                            : (
                                <Button
                                  size="sm"
                                  disabled={saving === member.userId}
                                  onClick={() => handleAssign(member.userId)}
                                >
                                  {saving === member.userId ? '...' : 'Asignar'}
                                </Button>
                              )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

        <p className="text-xs text-muted-foreground">
          Un miembro solo puede estar asignado a un local a la vez. Asignarlo a este local lo desasigna del anterior.
        </p>
      </DialogContent>
    </Dialog>
  );
};

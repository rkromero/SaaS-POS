'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { CreateUserDialog } from './CreateUserDialog';

type Member = {
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  role: string;
};

export const MemberList = ({ isAdmin }: { isAdmin: boolean }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      setMembers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando miembros...</p>;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            + Nuevo usuario
          </Button>
        </div>
      )}

      {members.length === 0
        ? (
            <p className="text-sm text-muted-foreground">No hay miembros en la organización.</p>
          )
        : (
            <div className="space-y-2">
              {members.map(member => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 rounded-md border px-4 py-3"
                >
                  {member.imageUrl && (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="size-9 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{member.name || member.email}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  <Badge variant={member.role === 'org:admin' ? 'default' : 'secondary'}>
                    {member.role === 'org:admin' ? 'Admin' : 'Miembro'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

      {createOpen && (
        <CreateUserDialog
          onClose={() => setCreateOpen(false)}
          onCreated={fetchMembers}
        />
      )}
    </div>
  );
};

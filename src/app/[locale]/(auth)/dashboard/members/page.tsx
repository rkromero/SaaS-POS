import { auth } from '@clerk/nextjs/server';

import { TitleBar } from '@/features/dashboard/TitleBar';
import { MemberList } from '@/features/members/MemberList';

export default async function MembersPage() {
  const { orgRole } = await auth();
  const isAdmin = orgRole === 'org:admin';

  return (
    <>
      <TitleBar
        title="Miembros"
        description="Usuarios con acceso a tu organización"
      />
      <div className="rounded-md bg-card p-6 shadow-sm">
        {isAdmin
          ? <MemberList isAdmin={isAdmin} />
          : (
              <p className="text-sm text-muted-foreground">
                Solo los administradores pueden gestionar los miembros de la organización.
              </p>
            )}
      </div>
    </>
  );
}

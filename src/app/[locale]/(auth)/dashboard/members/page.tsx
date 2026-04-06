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
        <MemberList isAdmin={isAdmin} />
      </div>
    </>
  );
}

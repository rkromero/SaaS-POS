import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { isSuperAdmin } from '@/libs/SuperAdmin';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId || !isSuperAdmin(userId)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
              Super Admin
            </span>
            <span className="text-sm font-semibold text-zinc-300">Panel de control global</span>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            ← Volver al dashboard
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}

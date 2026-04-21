import Link from 'next/link';

export const DemoBadge = () => (
  <div className="fixed bottom-0 right-20 z-10">
    <Link href="/dashboard/pos">
      <div className="rounded-md bg-[#1E6FD9] px-3 py-2 font-semibold text-white">
        Abrir POS
      </div>
    </Link>
  </div>
);

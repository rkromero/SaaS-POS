'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Tab = { id: string; label: string };

export function SettingsTabNav({ tabs }: { tabs: Tab[] }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'locations';

  return (
    <div className="flex overflow-x-auto border-b border-border">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={`/dashboard/settings?tab=${tab.id}`}
          className={`-mb-px shrink-0 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

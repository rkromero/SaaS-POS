'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type OrgRow = {
  id: string;
  name: string;
  membersCount: number;
  createdAt: number;
  imageUrl: string;
  planType: string;
  licenseType: string;
  mpPlanStatus: string | null;
  planExpiresAt: string | null;
  moduleCount: number;
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-zinc-700 text-zinc-300',
  socio: 'bg-blue-900 text-blue-300',
  basic: 'bg-indigo-900 text-indigo-300',
  pro: 'bg-emerald-900 text-emerald-300',
  enterprise: 'bg-violet-900 text-violet-300',
};

export const SuperAdminOrgsPage = () => {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/orgs')
      .then(r => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrgs(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo cargar la lista de clientes.');
        setLoading(false);
      });
  }, []);

  const filtered = search.trim()
    ? orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : orgs;

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-zinc-800" />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Clientes</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {orgs.length}
            {' '}
            organizaciones registradas
          </p>
        </div>
        <Input
          className="w-64 border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Licencia</th>
              <th className="px-4 py-3">Estado MP</th>
              <th className="px-4 py-3">Módulos</th>
              <th className="px-4 py-3">Miembros</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={7}>
                  No hay resultados.
                </td>
              </tr>
            )}
            {filtered.map(org => (
              <tr key={org.id} className="bg-zinc-950 hover:bg-zinc-900">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {org.imageUrl && (
                      <img
                        src={org.imageUrl}
                        alt={org.name}
                        className="size-7 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-zinc-100">{org.name}</p>
                      <p className="text-xs text-zinc-500">
                        {org.id.slice(0, 20)}
                        …
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${PLAN_COLORS[org.planType] ?? PLAN_COLORS.free}`}>
                    {org.planType.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {org.licenseType === 'becada'
                    ? (
                        <span className="rounded bg-amber-900 px-2 py-0.5 text-xs font-bold text-amber-300">
                          BECADA
                        </span>
                      )
                    : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${
                    org.mpPlanStatus === 'authorized'
                      ? 'text-emerald-400'
                      : org.mpPlanStatus
                        ? 'text-amber-400'
                        : 'text-zinc-600'
                  }`}
                  >
                    {org.mpPlanStatus ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {org.moduleCount > 0
                    ? (
                        <span className="text-xs font-medium text-indigo-400">
                          {org.moduleCount}
                          {' '}
                          activo
                          {org.moduleCount !== 1 ? 's' : ''}
                        </span>
                      )
                    : <span className="text-xs text-zinc-600">0</span>}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {org.membersCount}
                </td>
                <td className="px-4 py-3">
                  <a href={`./orgs/${org.id}`}>
                    <Button size="sm" variant="outline" className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                      Ver detalle
                    </Button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

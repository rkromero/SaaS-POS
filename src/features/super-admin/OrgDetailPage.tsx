'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { MODULES } from '@/libs/Modules';
import type { PlanType } from '@/libs/Plans';
import { PLANS } from '@/libs/Plans';

type OrgDetail = {
  id: string;
  name: string;
  imageUrl: string;
  membersCount: number;
  createdAt: number;
  planType: PlanType;
  licenseType: 'none' | 'becada';
  mpPlanStatus: string | null;
  mpPreapprovalId: string | null;
  planExpiresAt: string | null;
  enabledModules: string[];
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  socio: 'Socio',
  basic: 'Básico',
  pro: 'Pro',
  enterprise: 'Empresa',
};

type Props = { orgId: string };

export const OrgDetailPage = ({ orgId }: Props) => {
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // track which action is saving
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');

  useEffect(() => {
    fetch(`/api/super-admin/orgs/${orgId}`)
      .then(r => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrg(data);
          setSelectedPlan(data.planType);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo cargar el detalle.');
        setLoading(false);
      });
  }, [orgId]);

  const toggleLicense = async () => {
    if (!org) {
      return;
    }
    setSaving('license');
    const newLicense = org.licenseType === 'becada' ? 'none' : 'becada';
    const res = await fetch(`/api/super-admin/orgs/${orgId}/license`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseType: newLicense }),
    });
    if (res.ok) {
      setOrg(prev => prev ? { ...prev, licenseType: newLicense } : prev);
    }
    setSaving(null);
  };

  const toggleModule = async (moduleName: string) => {
    if (!org) {
      return;
    }
    setSaving(`mod_${moduleName}`);
    const isEnabled = org.enabledModules.includes(moduleName);

    if (isEnabled) {
      const res = await fetch(`/api/super-admin/orgs/${orgId}/modules/${moduleName}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setOrg(prev => prev
          ? { ...prev, enabledModules: prev.enabledModules.filter(m => m !== moduleName) }
          : prev,
        );
      }
    } else {
      const res = await fetch(`/api/super-admin/orgs/${orgId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName }),
      });
      if (res.ok) {
        setOrg(prev => prev
          ? { ...prev, enabledModules: [...prev.enabledModules, moduleName] }
          : prev,
        );
      }
    }
    setSaving(null);
  };

  const assignPlan = async () => {
    if (!org) {
      return;
    }
    setSaving('plan');
    const res = await fetch('/api/billing/admin/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetOrgId: orgId, planId: selectedPlan }),
    });
    if (res.ok) {
      setOrg(prev => prev ? { ...prev, planType: selectedPlan } : prev);
    }
    setSaving(null);
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-lg bg-zinc-800" />;
  }

  if (error || !org) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-400">
        {error ?? 'Cliente no encontrado.'}
      </div>
    );
  }

  const planExpired = org.planExpiresAt ? new Date(org.planExpiresAt) < new Date() : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="../orgs" className="text-sm text-zinc-500 hover:text-zinc-300">← Volver</a>
        {org.imageUrl && (
          <img src={org.imageUrl} alt={org.name} className="size-10 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{org.name}</h1>
          <p className="text-sm text-zinc-500">
            {org.membersCount}
            {' '}
            miembro
            {org.membersCount !== 1 ? 's' : ''}
            {' · '}
            Creado el
            {' '}
            {new Date(org.createdAt).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Plan actual */}
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-semibold text-zinc-200">Plan y Suscripción</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Plan</span>
              <span className="font-semibold text-zinc-100">{PLAN_LABELS[org.planType] ?? org.planType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Estado MP</span>
              <span className={`font-medium ${
                org.mpPlanStatus === 'authorized' ? 'text-emerald-400' : 'text-amber-400'
              }`}
              >
                {org.mpPlanStatus ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Vencimiento</span>
              <span className={`text-xs ${planExpired ? 'text-red-400' : 'text-zinc-400'}`}>
                {org.planExpiresAt
                  ? new Date(org.planExpiresAt).toLocaleDateString('es-AR')
                  : 'No expira'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <select
              value={selectedPlan}
              onChange={e => setSelectedPlan(e.target.value as PlanType)}
              className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200"
            >
              {PLANS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={saving === 'plan' || selectedPlan === org.planType}
              onClick={assignPlan}
              className="bg-zinc-700 hover:bg-zinc-600"
            >
              {saving === 'plan' ? 'Guardando...' : 'Asignar'}
            </Button>
          </div>
        </div>

        {/* Licencia becada */}
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-semibold text-zinc-200">Licencia</h2>
          <p className="text-sm text-zinc-500">
            La licencia becada da acceso completo tipo PRO sin depender del sistema de pagos.
          </p>
          <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-3">
            <div>
              {org.licenseType === 'becada'
                ? (
                    <span className="font-bold text-amber-400">BECADA ACTIVA</span>
                  )
                : (
                    <span className="text-zinc-400">Sin licencia especial</span>
                  )}
              <p className="mt-0.5 text-xs text-zinc-600">
                {org.licenseType === 'becada'
                  ? 'Acceso PRO completo. Sin vencimiento.'
                  : 'Acceso según plan contratado.'}
              </p>
            </div>
            <Button
              size="sm"
              disabled={saving === 'license'}
              onClick={toggleLicense}
              className={org.licenseType === 'becada'
                ? 'border border-red-800 bg-transparent text-red-400 hover:bg-red-950'
                : 'bg-amber-700 text-white hover:bg-amber-600'}
            >
              {saving === 'license'
                ? '...'
                : org.licenseType === 'becada'
                  ? 'Quitar becada'
                  : 'Asignar becada'}
            </Button>
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div>
          <h2 className="font-semibold text-zinc-200">Módulos activados manualmente</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Activar un módulo manualmente lo habilita sin importar el plan. Los módulos marcados como
            {' '}
            <span className="text-emerald-500">incluidos en plan</span>
            {' '}
            ya están disponibles para la organización si tiene el plan correspondiente.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULES.map((mod) => {
            const isEnabled = org.enabledModules.includes(mod.id);
            const isSavingThis = saving === `mod_${mod.id}`;

            // Módulos que se activan automáticamente por plan (sin override manual)
            const includedInPlan: Partial<Record<string, string>> = {
              arca: 'Pro / Empresa',
              promotions: 'Pro / Empresa',
            };
            const planLabel = includedInPlan[mod.id];
            const activeByPlan = planLabel
              && (org.planType === 'pro' || org.planType === 'enterprise')
              && !['free', 'basic', 'socio'].includes(org.planType);

            return (
              <div
                key={mod.id}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  isEnabled
                    ? 'border-indigo-800 bg-indigo-950'
                    : activeByPlan
                      ? 'border-emerald-900 bg-emerald-950/40'
                      : 'border-zinc-700 bg-zinc-800'
                }`}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className={`text-sm font-medium ${isEnabled ? 'text-indigo-300' : activeByPlan ? 'text-emerald-300' : 'text-zinc-400'}`}>
                      {mod.name}
                    </p>
                    {planLabel && (
                      <span className="rounded bg-emerald-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                        {planLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600">{mod.description}</p>
                  {activeByPlan && !isEnabled && (
                    <p className="mt-0.5 text-xs text-emerald-700">Activo por plan actual</p>
                  )}
                </div>
                <Button
                  size="sm"
                  disabled={isSavingThis}
                  onClick={() => toggleModule(mod.id)}
                  className={isEnabled
                    ? 'border border-indigo-700 bg-transparent text-indigo-400 hover:bg-indigo-900'
                    : 'border border-zinc-600 bg-transparent text-zinc-400 hover:bg-zinc-700'}
                >
                  {isSavingThis ? '...' : isEnabled ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

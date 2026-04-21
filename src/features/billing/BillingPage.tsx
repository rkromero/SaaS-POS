'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Plan, PLANS, type PlanType } from '@/libs/Plans';

type BillingStatus = {
  planType: PlanType;
  plan: Plan;
  mpPlanStatus: string | null;
  planExpiresAt: string | null;
};

export const BillingPage = () => {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmChangeTo, setConfirmChangeTo] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = () => {
    fetch('/api/billing/status')
      .then(r => r.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleSubscribe = async (planId: PlanType) => {
    setError(null);
    setSubscribing(planId);
    setConfirmChangeTo(null);
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error ?? 'Error al procesar la suscripción');
      }
    } catch {
      setError('Error de red. Intentá de nuevo.');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setCancelling(true);
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setConfirmCancel(false);
        refreshStatus();
      } else {
        setError(data.error ?? 'Error al cancelar la suscripción');
        setConfirmCancel(false);
      }
    } catch {
      setError('Error de red. Intentá de nuevo.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const currentPlan = status?.planType ?? 'free';
  const isActiveSubscription = status?.mpPlanStatus === 'authorized';
  const isOnPaidPlan = isActiveSubscription && currentPlan !== 'free' && currentPlan !== 'socio';

  const visiblePlans = PLANS.filter(p => !p.manualAssign);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Current plan banner */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">Plan actual</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold">{status?.plan.name}</p>
            {isActiveSubscription && (
              <Badge variant="default">Activo</Badge>
            )}
            {status?.mpPlanStatus === 'paused' && (
              <Badge variant="secondary">Pausado</Badge>
            )}
            {status?.mpPlanStatus === 'cancelled' && currentPlan === 'free' && (
              <Badge variant="outline">Cancelado</Badge>
            )}
            {currentPlan === 'socio' && (
              <Badge variant="secondary">Plan Socio</Badge>
            )}
          </div>
          {status?.planExpiresAt && (
            <p className="text-xs text-muted-foreground">
              Próximo cobro:
              {' '}
              {new Date(status.planExpiresAt).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <p className="text-2xl font-bold">{status?.plan.priceLabel}</p>
          {isOnPaidPlan && !confirmCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmCancel(true)}
            >
              Cancelar suscripción
            </Button>
          )}
          {confirmCancel && (
            <div className="flex flex-col items-end gap-1.5 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
              <p className="font-medium text-destructive">
                ¿Cancelar suscripción? Perderás acceso inmediatamente.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={cancelling}
                  onClick={handleCancel}
                >
                  {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancelling}
                  onClick={() => setConfirmCancel(false)}
                >
                  No, mantener
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visiblePlans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPaid = plan.priceUSD > 0;
          const isConfirming = confirmChangeTo === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-lg border bg-card p-5 shadow-sm ${
                plan.highlighted ? 'border-primary ring-1 ring-primary' : ''
              } ${isCurrent ? 'bg-primary/5' : ''}`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Recomendado
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-2 text-2xl font-bold">
                  {plan.priceLabel}
                  {plan.priceUSD > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}
                      en ARS
                    </span>
                  )}
                </p>
              </div>

              <ul className="mb-6 flex-1 space-y-1.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-sm">
                    <span className="mt-0.5 text-primary">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Plan action */}
              {isCurrent
                ? (
                    <Button disabled variant="outline" className="w-full">
                      Plan actual
                    </Button>
                  )
                : isPaid
                  ? isConfirming
                    ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Se cancelará tu plan actual y se te cobrará
                            {' '}
                            <strong>{plan.priceLabel}</strong>
                            {' '}
                            inmediatamente. Los 30 días comienzan desde hoy.
                          </p>
                          <Button
                            className="w-full"
                            disabled={subscribing === plan.id}
                            onClick={() => handleSubscribe(plan.id as PlanType)}
                          >
                            {subscribing === plan.id ? 'Redirigiendo...' : 'Confirmar cambio'}
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full text-xs"
                            onClick={() => setConfirmChangeTo(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )
                    : (
                        <Button
                          className="w-full"
                          variant={plan.highlighted ? 'default' : 'outline'}
                          disabled={subscribing === plan.id}
                          onClick={() => {
                            if (isOnPaidPlan) {
                              setConfirmChangeTo(plan.id as PlanType);
                            } else {
                              handleSubscribe(plan.id as PlanType);
                            }
                          }}
                        >
                          {subscribing === plan.id
                            ? 'Redirigiendo...'
                            : isOnPaidPlan
                              ? 'Cambiar a este plan'
                              : 'Suscribirse'}
                        </Button>
                      )
                  : (
                      <Button disabled variant="outline" className="w-full">
                        Gratis
                      </Button>
                    )}
            </div>
          );
        })}
      </div>

      {/* Socio plan info */}
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">¿Vendés nuestros alfajores?</strong>
        {' '}
        Contactanos para acceder al Plan Socio — usá el sistema gratis e ilimitado a cambio de tener nuestros productos en tu kiosco.
      </div>
    </div>
  );
};

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

  useEffect(() => {
    fetch('/api/billing/status')
      .then(r => r.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      });
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } finally {
      setSubscribing(null);
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

  // Show only non-manual plans in self-service UI
  const visiblePlans = PLANS.filter(p => !p.manualAssign);

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">Plan actual</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold">{status?.plan.name}</p>
            {status?.mpPlanStatus === 'authorized' && (
              <Badge variant="default">Activo</Badge>
            )}
            {status?.mpPlanStatus === 'paused' && (
              <Badge variant="secondary">Pausado</Badge>
            )}
            {currentPlan === 'socio' && (
              <Badge variant="secondary">Plan Socio</Badge>
            )}
          </div>
          {status?.planExpiresAt && (
            <p className="text-xs text-muted-foreground">
              Próximo vencimiento:
              {' '}
              {new Date(status.planExpiresAt).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{status?.plan.priceLabel}</p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visiblePlans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPaid = plan.priceUSD > 0;

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

              {isCurrent
                ? (
                    <Button disabled variant="outline" className="w-full">
                      Plan actual
                    </Button>
                  )
                : isPaid
                  ? (
                      <Button
                        className="w-full"
                        variant={plan.highlighted ? 'default' : 'outline'}
                        disabled={subscribing === plan.id}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {subscribing === plan.id ? 'Redirigiendo...' : 'Suscribirse'}
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

'use client';

import { CheckCircle2, ChevronDown, ChevronUp, Circle, PlayCircle } from 'lucide-react';
import { useState } from 'react';

import { useOnboarding } from './OnboardingContext';
import { ONBOARDING_STEPS, TOTAL_STEPS } from './onboardingSteps';

const STEP_LABELS: Record<number, { icon: string; label: string }> = {
  1: { icon: '📍', label: 'Crear tu local' },
  2: { icon: '🛒', label: 'Cargar productos' },
  3: { icon: '📦', label: 'Cargar stock' },
  4: { icon: '💰', label: 'Primera venta' },
};

export function OnboardingChecklist() {
  const { step, isActive, doneSteps, restartTour } = useOnboarding();
  const [collapsed, setCollapsed] = useState(false);

  // Show only while onboarding is active (not yet completed/skipped)
  if (!isActive) {
    return null;
  }

  const completedCount = doneSteps.length;
  const progressPercent = Math.round((completedCount / TOTAL_STEPS) * 100);

  return (
    <div className="mx-3 mb-3 overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setCollapsed(prev => !prev)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
      >
        <PlayCircle className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">Guía de inicio</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {/* Mini progress bar */}
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {completedCount}
              /
              {TOTAL_STEPS}
            </span>
          </div>
        </div>
        {collapsed
          ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          : <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />}
      </button>

      {/* Steps list — collapsible */}
      {!collapsed && (
        <div className="border-t">
          {ONBOARDING_STEPS.map((s) => {
            const isDone = doneSteps.includes(s.step);
            const isCurrent = s.step === step;
            const meta = STEP_LABELS[s.step];

            return (
              <div
                key={s.step}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                  isCurrent
                    ? 'bg-primary/5 font-medium text-foreground'
                    : isDone
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/60'
                }`}
              >
                {isDone
                  ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                    )
                  : isCurrent
                    ? (
                        <Circle className="size-3.5 shrink-0 animate-pulse text-primary" />
                      )
                    : (
                        <Circle className="size-3.5 shrink-0 text-muted-foreground/30" />
                      )}
                <span className="mr-1">{meta?.icon}</span>
                <span className={isDone ? 'line-through opacity-60' : ''}>{meta?.label}</span>
              </div>
            );
          })}

          {/* Restart button — shown only if user has advanced past step 0 */}
          {step > 0 && step <= TOTAL_STEPS && (
            <div className="border-t px-3 py-2">
              <button
                type="button"
                onClick={restartTour}
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Reiniciar guía desde el principio
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

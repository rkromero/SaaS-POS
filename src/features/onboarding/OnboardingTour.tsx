'use client';

import 'driver.js/dist/driver.css';

import confetti from 'canvas-confetti';
import { driver } from 'driver.js';
import { useEffect, useRef, useState } from 'react';

import { useOnboarding } from './OnboardingContext';
import { ONBOARDING_STEPS, TOTAL_STEPS } from './onboardingSteps';

// ─── Welcome modal (step 0) ───────────────────────────────────────────────────

function WelcomeModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
            🎯
          </div>
          <h2 className="text-2xl font-bold tracking-tight">¡Bienvenido a TuCaja!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            En
            {' '}
            <strong className="text-foreground">4 pasos simples</strong>
            {' '}
            vas a tener todo configurado para empezar a vender hoy mismo.
          </p>
        </div>

        {/* Steps preview */}
        <div className="mb-6 space-y-2">
          {[
            { icon: '📍', label: 'Crear tu local o sucursal' },
            { icon: '🛒', label: 'Cargar categorías y productos' },
            { icon: '📦', label: 'Ingresar el stock inicial' },
            { icon: '💰', label: 'Registrar tu primera venta' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5"
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-sm text-foreground/80">{item.label}</span>
              <div className="ml-auto size-4 rounded-full border-2 border-muted-foreground/30" />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            Saltar guía
          </button>
          <button
            type="button"
            onClick={onStart}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Empezar →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completion modal (step 5) ────────────────────────────────────────────────

function CompletionModal({ onFinish }: { onFinish: () => void }) {
  // Fire confetti on mount
  useEffect(() => {
    const end = Date.now() + 2800;
    const colors = ['#a855f7', '#6366f1', '#22c55e', '#f59e0b'];

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl bg-background p-8 text-center shadow-2xl">
        <div className="mb-6">
          <div className="mb-4 inline-flex size-20 items-center justify-center rounded-full bg-green-100 text-5xl dark:bg-green-900/30">
            🎉
          </div>
          <h2 className="text-2xl font-bold tracking-tight">¡Listo para vender!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Completaste la configuración inicial. Tu negocio está listo para operar con TuCaja.
          </p>
        </div>

        <div className="space-y-2 text-left">
          {[
            { icon: '✅', label: 'Local creado' },
            { icon: '✅', label: 'Productos cargados' },
            { icon: '✅', label: 'Stock configurado' },
            { icon: '✅', label: 'Primera venta lista' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ir al Dashboard →
        </button>
      </div>
    </div>
  );
}

// ─── Skip confirmation dialog (rendered over driver.js overlay) ───────────────

function SkipConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
        <h3 className="font-semibold">¿Saltar la guía?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Podés volver a verla cuando quieras desde
          {' '}
          <strong className="text-foreground">&quot;Guía de inicio&quot;</strong>
          {' '}
          en el menú lateral.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            Sí, saltar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingTour() {
  const { step, isActive, advanceStep, completeTour, skipTour } = useOnboarding();
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // driver instance stored in ref to clean up between step changes
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    // Only run driver.js for steps 1–4
    if (!isActive || step < 1 || step > TOTAL_STEPS) {
      return;
    }

    const stepDef = ONBOARDING_STEPS.find(s => s.step === step);
    if (!stepDef) {
      return;
    }

    let driverInstance: ReturnType<typeof driver> | null = null;

    // Small delay so the sidebar has painted and the target element is in the DOM
    const timer = setTimeout(() => {
      const el = document.getElementById(stepDef.targetId);
      if (!el) {
        return;
      }

      driverInstance = driver({
        allowClose: false,
        overlayOpacity: 0.65,
        stagePadding: 8,
        stageRadius: 10,
        showButtons: ['next', 'close'],
        nextBtnText: stepDef.actionLabel,
        doneBtnText: stepDef.actionLabel,
        popoverClass: 'tucaja-onboarding-popover',
        onNextClick: () => {
          driverInstance?.destroy();
          advanceStep();
        },
        onCloseClick: () => {
          // Intercept close: show our own confirmation dialog.
          // driver.js won't auto-destroy because we're overriding the handler.
          setShowSkipConfirm(true);
        },
      });

      driverRef.current = driverInstance;

      driverInstance.highlight({
        element: `#${stepDef.targetId}`,
        popover: {
          title: stepDef.title,
          description: stepDef.description,
          side: 'right',
          align: 'center',
        },
      });
    }, 350);

    return () => {
      clearTimeout(timer);
      driverInstance?.destroy();
    };
    // advanceStep is stable (useCallback), so no infinite loop
  }, [step, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────

  // Tour not active and not on completion screen → render nothing
  if (!isActive && step !== -1) {
    return null;
  }
  if (step === -1) {
    return null;
  }

  return (
    <>
      {/* Welcome modal */}
      {step === 0 && (
        <WelcomeModal
          onStart={advanceStep}
          onSkip={skipTour}
        />
      )}

      {/* Completion modal (step 5) */}
      {step === TOTAL_STEPS + 1 && isActive && (
        <CompletionModal onFinish={completeTour} />
      )}

      {/* Skip confirmation – rendered on top of driver.js overlay */}
      {showSkipConfirm && (
        <SkipConfirmDialog
          onCancel={() => setShowSkipConfirm(false)}
          onConfirm={() => {
            setShowSkipConfirm(false);
            driverRef.current?.destroy();
            skipTour();
          }}
        />
      )}
    </>
  );
}

'use client';

import 'driver.js/dist/driver.css';

import confetti from 'canvas-confetti';
import { driver } from 'driver.js';
import { X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useOnboarding } from './OnboardingContext';
import type { OnboardingStepDef } from './onboardingSteps';
import { ONBOARDING_STEPS, TOTAL_STEPS } from './onboardingSteps';

// ─── Helper ───────────────────────────────────────────────────────────────────

function isOnTargetPage(pathname: string, href: string) {
  const segment = href.replace('/dashboard/', '');
  return pathname.includes(segment);
}

// ─── Welcome modal (step 0) ───────────────────────────────────────────────────

function WelcomeModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">
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

        <div className="mb-6 space-y-2">
          {[
            { icon: '📍', label: 'Crear tu local o sucursal' },
            { icon: '🛒', label: 'Cargar categorías y productos' },
            { icon: '📦', label: 'Ingresar el stock inicial' },
            { icon: '💰', label: 'Registrar tu primera venta' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2.5">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm text-foreground/80">{item.label}</span>
              <div className="ml-auto size-4 rounded-full border-2 border-muted-foreground/30" />
            </div>
          ))}
        </div>

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

// ─── Floating card (cuando el usuario ya está en la página destino) ───────────

function FloatingStepCard({
  stepDef,
  onNext,
  onSkip,
}: {
  stepDef: OnboardingStepDef;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[9998] w-80 rounded-2xl border bg-background p-5 shadow-2xl">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {stepDef.step}
          </div>
          <span className="text-sm font-semibold">{stepDef.pageTitle}</span>
        </div>
        <button
          type="button"
          onClick={onSkip}
          aria-label="Saltar guía"
          className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {stepDef.pageInstruction}
      </p>

      {/* Barra de progreso por pasos */}
      <div className="mb-3 flex items-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < stepDef.step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {stepDef.pageActionLabel}
      </button>
    </div>
  );
}

// ─── Completion modal (step 5) ────────────────────────────────────────────────

function CompletionModal({ onFinish }: { onFinish: () => void }) {
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
        <div className="mb-6 space-y-2 text-left">
          {['Local creado', 'Productos cargados', 'Stock configurado', 'Primera venta lista'].map(label => (
            <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>✅</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ir al Dashboard →
        </button>
      </div>
    </div>
  );
}

// ─── Skip confirmation ────────────────────────────────────────────────────────

function SkipConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
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
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // ── Spotlight en sidebar: solo cuando NO está en la página destino ─────────
  useEffect(() => {
    if (!isActive || step < 1 || step > TOTAL_STEPS) {
      return;
    }

    const stepDef = ONBOARDING_STEPS.find(s => s.step === step);
    if (!stepDef) {
      return;
    }

    // Ya está en la página destino → floating card lo maneja, no mostrar spotlight
    if (isOnTargetPage(pathname, stepDef.href)) {
      return;
    }

    let driverInstance: ReturnType<typeof driver> | null = null;

    const timer = setTimeout(() => {
      const el = document.getElementById(stepDef.navTargetId);
      if (!el) {
        return;
      }

      driverInstance = driver({
        allowClose: false,
        disableActiveInteraction: false, // permite hacer click en el link resaltado
        overlayOpacity: 0.65,
        stagePadding: 8,
        stageRadius: 10,
        showButtons: ['next', 'close'],
        nextBtnText: stepDef.navActionLabel,
        doneBtnText: stepDef.navActionLabel,
        popoverClass: 'tucaja-onboarding-popover',
        onNextClick: () => {
          driverInstance?.destroy();
          router.push(stepDef.href);
        },
        onCloseClick: () => {
          setShowSkipConfirm(true);
        },
      });

      driverRef.current = driverInstance;

      driverInstance.highlight({
        element: `#${stepDef.navTargetId}`,
        popover: {
          title: stepDef.navTitle,
          description: stepDef.navDescription,
          side: 'right',
          align: 'center',
        },
      });
    }, 350);

    return () => {
      clearTimeout(timer);
      driverInstance?.destroy();
    };
  }, [step, isActive, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === -1) {
    return null;
  }

  const currentStepDef = ONBOARDING_STEPS.find(s => s.step === step);
  const showFloatingCard
    = isActive
    && step >= 1
    && step <= TOTAL_STEPS
    && currentStepDef !== undefined
    && isOnTargetPage(pathname, currentStepDef.href);

  return (
    <>
      {/* Paso 0: modal de bienvenida */}
      {step === 0 && isActive && (
        <WelcomeModal onStart={advanceStep} onSkip={skipTour} />
      )}

      {/* Pasos 1-4 en la página destino: floating card */}
      {showFloatingCard && currentStepDef && (
        <FloatingStepCard
          stepDef={currentStepDef}
          onNext={advanceStep}
          onSkip={() => setShowSkipConfirm(true)}
        />
      )}

      {/* Paso 5: modal de completado */}
      {step === TOTAL_STEPS + 1 && isActive && (
        <CompletionModal onFinish={completeTour} />
      )}

      {/* Confirmación de skip */}
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

'use client';

import { useUser } from '@clerk/nextjs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { TOTAL_STEPS } from './onboardingSteps';

const STORAGE_KEY = 'tucaja_onboarding_step';

// step -1  → not initialized / completed
// step  0  → welcome modal
// step  1-4 → driver.js tour steps
// step  5  → completion modal
type OnboardingState = {
  step: number;
  isActive: boolean;
};

type OnboardingContextValue = {
  step: number;
  isActive: boolean;
  /** Steps 1-4 already seen (to show checkmarks in the checklist) */
  doneSteps: number[];
  advanceStep: () => void;
  completeTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  restartTour: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<OnboardingState>({ step: -1, isActive: false });

  // Initialize: only show if onboarding is not completed
  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }
    if (user.unsafeMetadata?.onboardingCompleted === true) {
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    const step = saved !== null ? Number.parseInt(saved, 10) : 0;
    setState({ step, isActive: true });
  }, [isLoaded, user]);

  // doneSteps: every step whose number is strictly less than current step
  const doneSteps = useMemo(
    () => Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).filter(n => n < state.step),
    [state.step],
  );

  const advanceStep = useCallback(() => {
    setState((prev) => {
      const next = prev.step + 1;
      // After step 4 → show completion modal (step 5)
      if (next <= TOTAL_STEPS + 1) {
        localStorage.setItem(STORAGE_KEY, String(next));
        return { step: next, isActive: true };
      }
      return prev;
    });
  }, []);

  const completeTour = useCallback(async () => {
    await user?.update({
      unsafeMetadata: { ...user.unsafeMetadata, onboardingCompleted: true },
    });
    localStorage.removeItem(STORAGE_KEY);
    setState({ step: -1, isActive: false });
  }, [user]);

  const skipTour = useCallback(async () => {
    await user?.update({
      unsafeMetadata: { ...user.unsafeMetadata, onboardingCompleted: true },
    });
    localStorage.removeItem(STORAGE_KEY);
    setState({ step: -1, isActive: false });
  }, [user]);

  const restartTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '0');
    setState({ step: 0, isActive: true });
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      step: state.step,
      isActive: state.isActive,
      doneSteps,
      advanceStep,
      completeTour,
      skipTour,
      restartTour,
    }),
    [state, doneSteps, advanceStep, completeTour, skipTour, restartTour],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }
  return ctx;
}

'use client';

import { useEffect, useState } from 'react';

import { PriceCheckerModal } from './PriceCheckerModal';

// Monta el modal de consulta de precios globalmente en el dashboard.
// F10 desde cualquier página abre el buscador.
export function PriceCheckerGlobal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return <PriceCheckerModal open={open} onClose={() => setOpen(false)} />;
}

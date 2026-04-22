'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getPendingSales,
  markSaleFailed,
  removePendingSale,
} from '@/libs/offlineSalesDB';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const sales = await getPendingSales();
      setPendingCount(sales.filter(s => s.status === 'pending').length);
    } catch {
      // IndexedDB not available (SSR or private browsing)
    }
  }, []);

  const syncPendingSales = useCallback(async () => {
    if (syncingRef.current) {
      return;
    }
    let pending;
    try {
      const all = await getPendingSales();
      pending = all.filter(s => s.status === 'pending');
    } catch {
      return;
    }
    if (pending.length === 0) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);

    for (const sale of pending) {
      try {
        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale.payload),
        });
        if (res.ok) {
          await removePendingSale(sale.id);
        } else {
          const data = await res.json().catch(() => ({}));
          await markSaleFailed(sale.id, data.error ?? `Error ${res.status}`);
        }
      } catch {
        // Network still down — stop trying
        break;
      }
    }

    await refreshCount();
    syncingRef.current = false;
    setIsSyncing(false);
  }, [refreshCount]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingSales, refreshCount]);

  return { isOnline, pendingCount, isSyncing, syncPendingSales, refreshCount };
}

'use client';

import { Gift, Search, Star, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoyaltyCustomer = {
  id: number;
  name: string;
  email: string | null;
  whatsapp: string | null;
};

type LoyaltyReward = {
  id: number;
  name: string;
  description: string | null;
  type: 'product' | 'discount_fixed' | 'discount_percent';
  pointsCost: number;
  discountValue: string | null;
  productId: number | null;
  stock: number | null;
};

type LoyaltyCustomerData = {
  customer: LoyaltyCustomer;
  balance: number;
  affordableRewards: LoyaltyReward[];
};

type Props = {
  cartTotal: number;
  onCustomerChange: (customerId: number | null) => void;
  onRewardChange: (rewardId: number | null, discount: number) => void;
};

// Calcula el descuento en pesos que aplica un premio sobre un total dado
function calcDiscount(reward: LoyaltyReward, cartTotal: number): number {
  if (reward.type === 'discount_fixed') {
    return Math.min(Number(reward.discountValue ?? 0), cartTotal);
  }
  if (reward.type === 'discount_percent') {
    return cartTotal * (Number(reward.discountValue ?? 0) / 100);
  }
  return 0; // product type: descuento monetario 0
}

function rewardTypeLabel(type: LoyaltyReward['type']): string {
  if (type === 'discount_fixed') {
    return 'Descuento fijo';
  }
  if (type === 'discount_percent') {
    return 'Descuento %';
  }
  return 'Producto gratis';
}

function rewardValueLabel(reward: LoyaltyReward, cartTotal: number): string {
  if (reward.type === 'discount_fixed') {
    return `-$${Number(reward.discountValue ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
  }
  if (reward.type === 'discount_percent') {
    const pct = Number(reward.discountValue ?? 0);
    const amount = cartTotal * pct / 100;
    return `-${pct}% (-$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0 })})`;
  }
  return 'Gratis';
}

export const LoyaltyCustomerPanel = ({ cartTotal, onCustomerChange, onRewardChange }: Props) => {
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [customerData, setCustomerData] = useState<LoyaltyCustomerData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);

  // Notificar al padre cuando cambia el cliente o el premio
  useEffect(() => {
    onCustomerChange(customerData?.customer.id ?? null);
  }, [customerData, onCustomerChange]);

  useEffect(() => {
    if (!selectedReward) {
      onRewardChange(null, 0);
      return;
    }
    onRewardChange(selectedReward.id, calcDiscount(selectedReward, cartTotal));
  }, [selectedReward, cartTotal, onRewardChange]);

  // Si el total cambia (se agregan productos), recalcular el descuento del premio seleccionado
  useEffect(() => {
    if (selectedReward) {
      onRewardChange(selectedReward.id, calcDiscount(selectedReward, cartTotal));
    }
  }, [cartTotal, selectedReward, onRewardChange]);

  const searchCustomer = useCallback(async (query: string) => {
    const digits = query.replace(/\D/g, '');
    if (digits.length < 6) {
      return;
    }

    setSearching(true);
    setNotFound(false);

    try {
      // Buscar cliente por WhatsApp (reutiliza el mismo endpoint que fiado)
      const res = await fetch(`/api/customers/search?whatsapp=${encodeURIComponent(digits)}`);
      const customer: LoyaltyCustomer | null = await res.json();

      if (!customer?.id) {
        setCustomerData(null);
        setSelectedReward(null);
        setNotFound(true);
        return;
      }

      // Cargar puntos y premios disponibles
      const dataRes = await fetch(`/api/loyalty/customer/${customer.id}`);
      if (!dataRes.ok) {
        setCustomerData(null);
        setNotFound(true);
        return;
      }

      const data: LoyaltyCustomerData = await dataRes.json();
      setCustomerData(data);
      setNotFound(false);
      setSelectedReward(null); // limpiar premio al cambiar cliente
    } catch {
      setCustomerData(null);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleClearCustomer = () => {
    setPhone('');
    setCustomerData(null);
    setSelectedReward(null);
    setNotFound(false);
    onCustomerChange(null);
    onRewardChange(null, 0);
  };

  const handleSelectReward = (reward: LoyaltyReward) => {
    if (selectedReward?.id === reward.id) {
      // Deseleccionar si ya estaba seleccionado
      setSelectedReward(null);
    } else {
      setSelectedReward(reward);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-200">
        <Star className="size-4 fill-amber-400 text-amber-400" />
        Fidelización
      </div>

      {/* Búsqueda de cliente por WhatsApp */}
      {!customerData && (
        <div className="space-y-1.5">
          <Label htmlFor="loyaltyPhone" className="text-xs">WhatsApp del cliente</Label>
          <div className="flex gap-2">
            <Input
              id="loyaltyPhone"
              className="flex-1 text-xs"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ej: 1123456789"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  searchCustomer(phone);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={searching || phone.replace(/\D/g, '').length < 6}
              onClick={() => searchCustomer(phone)}
              className="shrink-0"
            >
              {searching ? '...' : <Search className="size-3.5" />}
            </Button>
          </div>

          {notFound && (
            <p className="text-xs text-muted-foreground">
              Cliente no encontrado. Registralo primero o seguí sin puntos.
            </p>
          )}
        </div>
      )}

      {/* Cliente encontrado */}
      {customerData && (
        <div className="space-y-2.5">
          {/* Info del cliente */}
          <div className="flex items-start justify-between rounded-md border border-amber-200 bg-white px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
            <div>
              <p className="text-sm font-semibold">{customerData.customer.name}</p>
              <p className="text-xs text-muted-foreground">
                {customerData.balance.toLocaleString('es-AR')}
                {' '}
                pts disponibles
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCustomer}
              className="text-muted-foreground hover:text-foreground"
              title="Quitar cliente"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Premio seleccionado activo */}
          {selectedReward && (
            <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs dark:border-green-800 dark:bg-green-950/30">
              <div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  {selectedReward.name}
                </span>
                <span className="ml-2 text-green-600 dark:text-green-400">
                  {rewardValueLabel(selectedReward, cartTotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                className="text-green-600 hover:text-green-800"
                title="Quitar premio"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          {/* Lista de premios canjeables */}
          {customerData.affordableRewards.length > 0 && !selectedReward && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Canjes disponibles:</p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {customerData.affordableRewards.map(reward => (
                  <button
                    key={reward.id}
                    type="button"
                    onClick={() => handleSelectReward(reward)}
                    className="flex w-full items-center justify-between rounded-md border bg-white px-2.5 py-1.5 text-left text-xs transition-colors hover:border-amber-300 hover:bg-amber-50 dark:bg-background dark:hover:bg-amber-950/20"
                  >
                    <div className="flex items-center gap-1.5">
                      <Gift className="size-3 text-amber-500" />
                      <span className="font-medium">{reward.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {rewardTypeLabel(reward.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold text-green-600">
                        {rewardValueLabel(reward, cartTotal)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        {reward.pointsCost.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {customerData.affordableRewards.length === 0 && !selectedReward && (
            <p className="text-xs text-muted-foreground">
              Sin premios disponibles con los puntos actuales.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

import { describe, expect, it } from 'vitest';

import {
  calcPointsBalance,
  calcPointsEarned,
  calcRewardDiscount,
  validateRedemption,
} from './loyaltyUtils';

// ─── calcPointsEarned ────────────────────────────────────────────────────────

describe('calcPointsEarned', () => {
  it('otorga 1 punto por cada $1.000 de compra', () => {
    expect(calcPointsEarned(1000, 1000)).toBe(1);
  });

  it('trunca al entero inferior (no redondea)', () => {
    expect(calcPointsEarned(1999, 1000)).toBe(1);
    expect(calcPointsEarned(2000, 1000)).toBe(2);
  });

  it('compra por debajo del umbral no genera puntos', () => {
    expect(calcPointsEarned(500, 1000)).toBe(0);
  });

  it('funciona con umbrales distintos de $1.000', () => {
    // 1 punto por cada $500
    expect(calcPointsEarned(2500, 500)).toBe(5);
    // 1 punto por cada $100
    expect(calcPointsEarned(350, 100)).toBe(3);
  });

  it('devuelve 0 si pesosPerPoint es 0 o negativo', () => {
    expect(calcPointsEarned(1000, 0)).toBe(0);
    expect(calcPointsEarned(1000, -1)).toBe(0);
  });

  it('total 0 genera 0 puntos', () => {
    expect(calcPointsEarned(0, 1000)).toBe(0);
  });
});

// ─── calcRewardDiscount ──────────────────────────────────────────────────────

describe('calcRewardDiscount', () => {
  describe('discount_fixed', () => {
    it('aplica el descuento fijo cuando es menor al total', () => {
      expect(calcRewardDiscount('discount_fixed', 500, 2000)).toBe(500);
    });

    it('no descuenta más que el total del carrito', () => {
      expect(calcRewardDiscount('discount_fixed', 3000, 2000)).toBe(2000);
    });

    it('descuento exactamente igual al total', () => {
      expect(calcRewardDiscount('discount_fixed', 2000, 2000)).toBe(2000);
    });
  });

  describe('discount_percent', () => {
    it('aplica el porcentaje sobre el total', () => {
      expect(calcRewardDiscount('discount_percent', 10, 2000)).toBe(200);
    });

    it('50% descuenta la mitad', () => {
      expect(calcRewardDiscount('discount_percent', 50, 1000)).toBe(500);
    });

    it('100% descuenta todo', () => {
      expect(calcRewardDiscount('discount_percent', 100, 1500)).toBe(1500);
    });
  });

  describe('product', () => {
    it('no genera descuento monetario (el producto se entrega por separado)', () => {
      expect(calcRewardDiscount('product', 0, 2000)).toBe(0);
    });
  });
});

// ─── calcPointsBalance ───────────────────────────────────────────────────────

describe('calcPointsBalance', () => {
  it('balance de un cliente nuevo es 0', () => {
    expect(calcPointsBalance([])).toBe(0);
  });

  it('suma acumulaciones positivas', () => {
    const txs = [{ points: 100 }, { points: 50 }, { points: 200 }];

    expect(calcPointsBalance(txs)).toBe(350);
  });

  it('resta los canjes (puntos negativos)', () => {
    const txs = [{ points: 500 }, { points: -200 }];

    expect(calcPointsBalance(txs)).toBe(300);
  });

  it('historial mixto: earn + redeem + ajuste', () => {
    const txs = [
      { points: 100 }, // earn
      { points: 50 }, // earn
      { points: -80 }, // redeem
      { points: 30 }, // earn
      { points: -20 }, // expire
    ];

    expect(calcPointsBalance(txs)).toBe(80);
  });

  it('balance puede llegar a 0 exacto', () => {
    const txs = [{ points: 100 }, { points: -100 }];

    expect(calcPointsBalance(txs)).toBe(0);
  });
});

// ─── validateRedemption ──────────────────────────────────────────────────────

describe('validateRedemption', () => {
  const base = {
    availablePoints: 500,
    rewardPointsCost: 200,
    minPointsToRedeem: 0,
    rewardStock: null,
  };

  it('devuelve null cuando todo está OK', () => {
    expect(validateRedemption(base)).toBeNull();
  });

  it('error si puntos disponibles < costo del premio', () => {
    const result = validateRedemption({ ...base, availablePoints: 100 });

    expect(result).toContain('Puntos insuficientes');
    expect(result).toContain('100');
    expect(result).toContain('200');
  });

  it('error si no alcanza el mínimo para canjear', () => {
    const result = validateRedemption({ ...base, availablePoints: 200, minPointsToRedeem: 300 });

    expect(result).toContain('300');
  });

  it('OK si alcanza el mínimo exacto y tiene suficientes puntos para el canje', () => {
    const result = validateRedemption({
      ...base,
      availablePoints: 300,
      minPointsToRedeem: 300,
      rewardPointsCost: 200,
    });

    expect(result).toBeNull();
  });

  it('error si el stock del premio está agotado', () => {
    const result = validateRedemption({ ...base, rewardStock: 0 });

    expect(result).toContain('stock');
  });

  it('sin error si el stock es null (ilimitado)', () => {
    expect(validateRedemption({ ...base, rewardStock: null })).toBeNull();
  });

  it('sin error si el stock es mayor a 0', () => {
    expect(validateRedemption({ ...base, rewardStock: 5 })).toBeNull();
  });

  it('el mínimo de 0 no bloquea el canje', () => {
    expect(validateRedemption({ ...base, minPointsToRedeem: 0 })).toBeNull();
  });
});

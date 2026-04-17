// loyaltyUtils.ts
// Funciones puras de cálculo del programa de fidelización.
// Separadas de la lógica de base de datos para permitir tests unitarios.

/**
 * Calcula los puntos a otorgar por una compra.
 * @param total - Monto total de la compra en pesos (después de descuentos)
 * @param pesosPerPoint - Cuántos pesos equivalen a 1 punto (ej: 1000)
 * @returns Puntos enteros a acreditar (floor)
 */
export function calcPointsEarned(total: number, pesosPerPoint: number): number {
  if (pesosPerPoint <= 0) {
    return 0;
  }
  return Math.floor(total / pesosPerPoint);
}

/**
 * Calcula el descuento en pesos que aplica un premio sobre un total.
 * @param rewardType - Tipo de premio
 * @param discountValue - Valor del descuento (pesos o porcentaje)
 * @param cartTotal - Total del carrito antes del descuento
 * @returns Descuento en pesos (nunca negativo, nunca mayor al total)
 */
export function calcRewardDiscount(
  rewardType: 'product' | 'discount_fixed' | 'discount_percent',
  discountValue: number,
  cartTotal: number,
): number {
  if (rewardType === 'discount_fixed') {
    return Math.min(discountValue, cartTotal);
  }
  if (rewardType === 'discount_percent') {
    return cartTotal * (discountValue / 100);
  }
  // product: el descuento monetario es 0
  return 0;
}

/**
 * Calcula el balance de puntos de un cliente a partir de su historial de movimientos.
 * @param transactions - Lista de movimientos (earn positivo, redeem/expire negativo)
 * @returns Balance total de puntos disponibles
 */
export function calcPointsBalance(transactions: { points: number }[]): number {
  return transactions.reduce((sum, tx) => sum + tx.points, 0);
}

/**
 * Valida si un cliente puede canjear un premio.
 * @returns null si puede canjear, string con el mensaje de error si no puede.
 */
export function validateRedemption(params: {
  availablePoints: number;
  rewardPointsCost: number;
  minPointsToRedeem: number;
  rewardStock: number | null;
}): string | null {
  const { availablePoints, rewardPointsCost, minPointsToRedeem, rewardStock } = params;

  if (minPointsToRedeem > 0 && availablePoints < minPointsToRedeem) {
    return `Se requieren al menos ${minPointsToRedeem} puntos para canjear`;
  }
  if (availablePoints < rewardPointsCost) {
    return `Puntos insuficientes. Disponibles: ${availablePoints}, requeridos: ${rewardPointsCost}`;
  }
  if (rewardStock !== null && rewardStock <= 0) {
    return 'Este premio ya no tiene stock disponible';
  }
  return null;
}

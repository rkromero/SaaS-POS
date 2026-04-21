import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted garantiza que estos mocks están disponibles cuando vi.mock() se ejecuta (hoisting)
const { mockDbSelect, mockDbUpdate, mockFetch } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('@/libs/DB', () => ({
  db: { select: mockDbSelect, update: mockDbUpdate },
}));

vi.mock('@/libs/Env', () => ({
  Env: { MP_ACCESS_TOKEN: 'TEST-token-123' },
}));

globalThis.fetch = mockFetch;

// Importar después de los mocks
const { POST } = await import('./route');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(body: object) {
  return new Request('http://localhost/api/billing/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mpPreapprovalResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'preapproval-abc123',
    status: 'authorized',
    external_reference: 'org_TEST|basic',
    ...overrides,
  };
}

function mockMpFetch(preapproval: Record<string, unknown>) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(preapproval),
  });
}

function mockSelectReturns(rows: { mpPreapprovalId: string | null }[]) {
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows),
    }),
  });
}

function captureUpdateSet() {
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
  mockDbUpdate.mockReturnValue({ set: updateSet });
  return updateSet;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/billing/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default update mock (mayoría de tests lo necesitan)
    captureUpdateSet();
  });

  describe('eventos ignorados', () => {
    it('ignora eventos que no son subscription_preapproval', async () => {
      const res = await POST(makeRequest({ type: 'payment', data: { id: '123' } }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('errores de MP API', () => {
    it('retorna 500 cuando MP API responde con error', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const res = await POST(makeRequest({
        type: 'subscription_preapproval',
        data: { id: 'abc' },
      }));

      expect(res.status).toBe(500);
      expect(await res.json()).toMatchObject({ error: 'Failed to fetch subscription' });
    });

    it('retorna 400 cuando external_reference no tiene formato orgId|planId', async () => {
      mockMpFetch(mpPreapprovalResponse({ external_reference: null }));
      const res = await POST(makeRequest({
        type: 'subscription_preapproval',
        data: { id: 'preapproval-abc123' },
      }));

      expect(res.status).toBe(400);
    });
  });

  describe('preapproval authorized', () => {
    it('activa el plan y guarda plan_expires_at a 30 días', async () => {
      const setMock = captureUpdateSet();
      mockMpFetch(mpPreapprovalResponse());

      const before = Date.now();
      const res = await POST(makeRequest({
        type: 'subscription_preapproval',
        data: { id: 'preapproval-abc123' },
      }));
      const after = Date.now();

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });

      const setArg = setMock.mock.calls[0]?.[0];

      expect(setArg).toMatchObject({
        planType: 'basic',
        mpPreapprovalId: 'preapproval-abc123',
        mpPlanStatus: 'authorized',
      });

      // plan_expires_at debe ser ~30 días desde ahora
      const expires = setArg.planExpiresAt as Date;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      expect(expires.getTime()).toBeGreaterThanOrEqual(before + thirtyDays - 100);
      expect(expires.getTime()).toBeLessThanOrEqual(after + thirtyDays + 100);
    });

    it('llama al endpoint correcto de MP con el token', async () => {
      mockMpFetch(mpPreapprovalResponse());
      await POST(makeRequest({
        type: 'subscription_preapproval',
        data: { id: 'preapproval-abc123' },
      }));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mercadopago.com/preapproval/preapproval-abc123',
        expect.objectContaining({
          headers: { Authorization: 'Bearer TEST-token-123' },
        }),
      );
    });
  });

  describe('preapproval cancelled', () => {
    it('revierte el plan a free y limpia plan_expires_at', async () => {
      const setMock = captureUpdateSet();
      mockSelectReturns([{ mpPreapprovalId: 'preapproval-abc123' }]);
      mockMpFetch(mpPreapprovalResponse({ status: 'cancelled' }));

      const res = await POST(makeRequest({
        type: 'subscription_preapproval',
        data: { id: 'preapproval-abc123' },
      }));

      expect(res.status).toBe(200);
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: 'free',
          mpPlanStatus: 'cancelled',
          planExpiresAt: null,
        }),
      );
    });

    it('ignora cancelación obsoleta si el preapproval ID no coincide con el guardado', async () => {
      // La org ya tiene un nuevo preapproval (el usuario cambió de plan)
      mockSelectReturns([{ mpPreapprovalId: 'preapproval-nuevo-xyz' }]);
      mockMpFetch(mpPreapprovalResponse({ status: 'cancelled' }));

      const res = await POST(makeRequest({
        type: 'subscription_preapproval',
        data: { id: 'preapproval-abc123' },
      }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true, ignored: 'stale_cancellation' });
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });
  });
});

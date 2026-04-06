'use client';

import { DM_Sans, Lora, Space_Mono } from 'next/font/google';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

// ─── Fonts ───────────────────────────────────────────────────────────────────
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});
const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
});

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  g900: '#0d2318',
  g800: '#14391f',
  g700: '#1a5c2a',
  g600: '#1e7a35',
  g500: '#22a047',
  g400: '#34c759',
  g300: '#6fdb8a',
  g100: '#e8f9ed',
  g50: '#f3fdf6',
  cream: '#faf8f3',
  warmGray: '#f5f3ee',
  textDark: '#111a14',
  textMid: '#3a4a3e',
  textSoft: '#6b7d6f',
  textMuted: '#9aab9e',
  border: '#dde8df',
  white: '#ffffff',
} as const;

// ─── Style constants (must be before components) ─────────────────────────────
const containerStyle: React.CSSProperties = {
  maxWidth: 1140,
  margin: '0 auto',
  padding: '0 24px',
};
const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-lora)',
  fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
  fontWeight: 700,
  lineHeight: 1.18,
  color: C.textDark,
};
const btnPrimaryLgStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '14px 28px',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  background: C.g600,
  color: 'white',
  boxShadow: '0 4px 16px rgba(30,122,53,.35)',
  border: 'none',
};
const btnOutlineLgStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '14px 28px',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  background: 'transparent',
  color: C.g700,
  border: `1.5px solid ${C.g600}`,
};
const btnPrimarySmStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 18px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  background: C.g600,
  color: 'white',
};
const btnOutlineSmStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 18px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  background: 'transparent',
  color: C.g700,
  border: `1.5px solid ${C.g600}`,
};
const emptyStyle: React.CSSProperties = {};

// ─── Hook: reveal on scroll ──────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = '1';
            (e.target as HTMLElement).style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── Hook: counter animation ─────────────────────────────────────────────────
function useCounters() {
  useEffect(() => {
    const counters = document.querySelectorAll<HTMLElement>('[data-count]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const el = entry.target as HTMLElement;
          const target = Number.parseInt(el.dataset.count ?? '0', 10);
          const isK = target >= 1000;
          const displayTarget = isK ? Math.round(target / 1000) : target;
          const suffix = isK ? 'K+' : target === 98 ? '%' : '+';
          let current = 0;
          const step = Math.ceil(displayTarget / 40);
          const timer = setInterval(() => {
            current = Math.min(current + step, displayTarget);
            el.textContent = `${current}${suffix}`;
            if (current >= displayTarget) {
              clearInterval(timer);
            }
          }, 40);
          io.unobserve(el);
        });
      },
      { threshold: 0.5 },
    );
    counters.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── Hook: sticky navbar shadow ──────────────────────────────────────────────
function useNavbar() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const handle = () => {
      if (!ref.current) {
        return;
      }
      if (window.scrollY > 10) {
        ref.current.style.boxShadow = '0 2px 20px rgba(0,0,0,.07)';
      } else {
        ref.current.style.boxShadow = 'none';
      }
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);
  return ref;
}

// ─── Reveal wrapper ──────────────────────────────────────────────────────────
function R({
  children,
  delay = 0,
  className = '',
  style = emptyStyle,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      data-reveal
      className={className}
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const LandingPage = () => {
  useReveal();
  useCounters();
  const navRef = useNavbar();

  const fontVars = `${lora.variable} ${dmSans.variable} ${spaceMono.variable}`;

  return (
    <div
      className={fontVars}
      style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif', background: C.cream, color: C.textDark, overflowX: 'hidden' }}
    >
      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav
        ref={navRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(250,248,243,.93)',
          backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${C.border}`,
          transition: 'box-shadow .3s',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-space-mono)', fontWeight: 700, fontSize: 20, color: C.g700 }}>
          <span style={{ width: 32, height: 32, background: C.g600, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h12v-2H6.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H15.5c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </span>
          TuCaja
        </Link>

        {/* Nav links — hidden on mobile */}
        <div className="hidden md:flex" style={{ gap: 32, alignItems: 'center' }}>
          {[['#funciones', 'Funciones'], ['#para-quien', 'Para quién'], ['#precios', 'Precios'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href!} style={{ textDecoration: 'none', color: C.textMid, fontSize: 14, fontWeight: 500 }}>
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/sign-in" style={btnOutlineSmStyle}>Iniciar sesión</Link>
          <Link href="/sign-up" style={btnPrimarySmStyle}>Probá gratis →</Link>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          paddingTop: 80,
          display: 'flex',
          alignItems: 'center',
          background: `radial-gradient(ellipse 80% 60% at 50% -5%, rgba(34,160,71,.13) 0%, transparent 68%), ${C.cream}`,
        }}
      >
        <div style={containerStyle}>
          <div
            data-hero-grid
          >
            {/* Copy */}
            <div>
              <R>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-space-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.g600, marginBottom: 16 }}>
                  <span style={{ width: 24, height: 2, background: C.g500, display: 'block' }} />
                  Sistema de punto de venta para Argentina
                </div>
              </R>
              <R delay={80}>
                <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(2.2rem,5vw,3.8rem)', fontWeight: 700, lineHeight: 1.16, marginBottom: 20, color: C.textDark }}>
                  El cuaderno
                  <br />
                  se terminó.
                  <br />
                  <em style={{ fontStyle: 'italic', color: C.g600 }}>Vendé con control.</em>
                </h1>
              </R>
              <R delay={160}>
                <p style={{ fontSize: 18, color: C.textMid, marginBottom: 36, lineHeight: 1.65, maxWidth: 480 }}>
                  Cobrá en segundos, manejá el stock, seguí el fiado y cerrá la caja sin hacer cuentas. Todo desde cualquier dispositivo.
                </p>
              </R>
              <R delay={240}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 44 }}>
                  <Link href="/sign-up" style={btnPrimaryLgStyle}>
                    Empezar gratis — 14 días sin tarjeta
                  </Link>
                  <a href="#funciones" style={btnOutlineLgStyle}>Ver cómo funciona</a>
                </div>
              </R>
              <R delay={320}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: C.textSoft }}>
                  <div style={{ display: 'flex' }}>
                    {['R', 'M', 'J', 'L'].map((l, i) => (
                      <div key={l} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${C.cream}`, background: C.g100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.g800, marginLeft: i === 0 ? 0 : -8 }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  <span>
                    Más de
                    <strong>200 negocios</strong>
                    {' '}
                    ya usan TuCaja
                  </span>
                </div>
              </R>
            </div>

            {/* POS Mockup */}
            <R delay={120}>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                {/* Floating badge top */}
                <div style={{ position: 'absolute', top: -16, right: 0, background: C.white, borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.12)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
                  <span style={{ fontSize: 20 }}>📈</span>
                  <div>
                    <div style={{ fontSize: 11, color: C.textSoft }}>Ventas hoy</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.textDark, fontFamily: 'var(--font-space-mono)' }}>$84.500</div>
                  </div>
                </div>

                {/* Mockup card */}
                <div style={{ width: '100%', maxWidth: 460, background: C.white, borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,.13), 0 0 0 1px rgba(0,0,0,.04)', overflow: 'hidden' }}>
                  {/* Top bar */}
                  <div style={{ background: C.g700, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>🛒 Caja — Local Centro</span>
                    <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, fontFamily: 'var(--font-space-mono)' }}>10:42 am</span>
                  </div>
                  {/* Body */}
                  <div style={{ padding: 20 }}>
                    <div style={{ background: C.warmGray, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 14 }}>🔍</span>
                      <span style={{ color: C.textMuted, fontSize: 13 }}>Buscá un producto o escaneá...</span>
                    </div>
                    {[
                      { name: 'Coca Cola 1.5L', qty: '×2', price: '$2.400' },
                      { name: 'Alfajor Doble', qty: '×3', price: '$1.950' },
                      { name: 'Papas Fritas 100g', qty: '×1', price: '$1.200' },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.g50, borderRadius: 10, padding: '11px 14px', border: `1px solid ${C.g100}`, marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.textDark }}>{item.name}</span>
                        <span style={{ background: '#bbf7d0', color: C.g800, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{item.qty}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.g700, fontFamily: 'var(--font-space-mono)' }}>{item.price}</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: C.border, margin: '16px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 14, color: C.textSoft }}>Total</span>
                      <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-space-mono)', color: C.textDark }}>$5.550</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      {['💵 Efectivo', '💳 Débito', '🔄 Transf.', '📝 Fiado'].map((pm, i) => (
                        <div key={pm} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 600, border: `1.5px solid ${i === 0 ? C.g500 : C.border}`, color: i === 0 ? C.g700 : C.textSoft, background: i === 0 ? C.g50 : 'transparent' }}>
                          {pm}
                        </div>
                      ))}
                    </div>
                    <button type="button" style={{ background: C.g600, color: 'white', border: 'none', width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
                      ✓ Confirmar cobro
                    </button>
                  </div>
                </div>

                {/* Floating badge bottom */}
                <div style={{ position: 'absolute', bottom: 20, left: -12, background: C.g700, borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,.2)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)' }}>Stock bajo</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>3 productos</div>
                  </div>
                </div>
              </div>
            </R>
          </div>
        </div>
      </section>

      {/* ══ STRIP ═══════════════════════════════════════════════════════════ */}
      <div style={{ background: C.g600, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
        {['✓ Funciona offline', '✓ Sin instalación', '✓ Desde cualquier dispositivo', '✓ Soporte en español', '✓ Pago vía Mercado Pago'].map((text, i) => (
          <span key={text} style={{ color: 'white', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span style={{ color: 'rgba(255,255,255,.3)', marginRight: 12 }}>|</span>}
            {text}
          </span>
        ))}
      </div>

      {/* ══ ANTES / DESPUÉS ═════════════════════════════════════════════════ */}
      <section id="funciones" style={{ background: C.white }}>
        <div style={containerStyle}>
          <div style={{ paddingTop: 80, paddingBottom: 48, textAlign: 'center' }}>
            <R><Tag>El cambio que buscás</Tag></R>
            <R delay={80}>
              <h2 style={h2Style}>
                Cómo manejabas el negocio
                <br />
                vs. cómo vas a manejarlo
              </h2>
            </R>
          </div>
        </div>
        <div data-ad-grid>
          {/* Before */}
          <R style={{ background: '#fff8f5', borderRight: '1px solid #ffe4d9' }}>
            <div style={{ padding: '52px 48px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#b94a23', marginBottom: 20 }}>❌ Antes — sin sistema</div>
              <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: '1.5rem', fontWeight: 700, color: '#4a2010', marginBottom: 24 }}>El caos de todos los días</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['📓', 'Anotás las ventas en un cuaderno y al final del día no cierra'],
                  ['🤷', 'No sabés cuánto stock te queda hasta que se te acaba'],
                  ['🔢', 'Cerrás la caja haciendo cuentas a mano y siempre falta o sobra'],
                  ['📱', 'El fiado lo manejás de memoria y hay clientes que se olvidaron'],
                  ['😰', 'No sabés qué productos te conviene más tener'],
                  ['⏰', 'Perdés tiempo buscando precios, anotando, calculando'],
                ].map(([icon, text]) => (
                  <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: '#6b3d2e', lineHeight: 1.55 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    {' '}
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </R>
          {/* Arrow */}
          <div className="hidden md:flex" style={{ alignItems: 'center', justifyContent: 'center', background: C.white, fontSize: 24 }}>→</div>
          {/* After */}
          <R delay={120} style={{ background: C.g50, borderLeft: `1px solid ${C.g100}` }}>
            <div style={{ padding: '52px 48px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.g600, marginBottom: 20 }}>✓ Con TuCaja</div>
              <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: '1.5rem', fontWeight: 700, color: C.g800, marginBottom: 24 }}>Control real desde el primer día</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Cada venta queda registrada automáticamente con número de comprobante',
                  'Recibís una alerta antes de quedarte sin stock, no después',
                  'El cierre de caja te dice cuánto deberías tener y la diferencia exacta',
                  'El fiado queda en el sistema: quién debe, cuánto y desde cuándo',
                  'Ves en tiempo real cuáles son tus productos más rentables',
                  'Cobrás en segundos y el sistema hace el resto solo',
                ].map(text => (
                  <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: C.textMid, lineHeight: 1.55 }}>
                    <span style={{ color: C.g500, flexShrink: 0, fontSize: 18 }}>✓</span>
                    {' '}
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </R>
        </div>
        <div style={{ height: 80 }} />
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
      <section style={{ background: C.cream, padding: '96px 0' }}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Todo lo que incluye</Tag></R>
            <R delay={80}>
              <h2 style={h2Style}>
                Diseñado para el día a día
                <br />
                de tu negocio
              </h2>
            </R>
            <R delay={160}><p style={{ fontSize: 17, color: C.textMid, maxWidth: 540, margin: '0 auto' }}>No es un sistema complicado de contabilidad. Es el sistema que necesitás para abrir, vender y cerrar tranquilo.</p></R>
          </div>

          <FeatureGroup label="Cobrá y vendé">
            <FeatureCard icon="⚡" title="Cobrás en segundos, no en minutos" pills={['Búsqueda por nombre', 'Búsqueda por SKU', 'Carrito rápido']}>
              Buscá el producto, sumá al carrito, elegí cómo paga y listo. Sin complicaciones, sin pasos de más. El cliente no espera.
            </FeatureCard>
            <FeatureCard icon="💳" title="Acepta cualquier forma de pago" pills={['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Fiado']}>
              Efectivo, débito, crédito, transferencia o fiado. No perdés una venta porque no tenés el método que el cliente quiere usar.
            </FeatureCard>
            <FeatureCard icon="🧾" title="Cada venta tiene su comprobante" pills={['Número automático', 'Datos del cliente', 'WhatsApp']}>
              Número de comprobante automático, cliente registrado, monto exacto. Todo queda asentado sin que hagas nada extra.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Manejá el fiado sin dramas">
            <FeatureCard icon="📝" title="El fiado registrado, sin cuaderno aparte" pills={['Deuda automática al vender', 'Balance por cliente', 'Historial completo']} highlight>
              Cuando vendés en fiado, la deuda se crea sola. Ves quién te debe, cuánto y cuándo empezó. Y cuando paga, lo asentás en segundos.
            </FeatureCard>
            <FeatureCard icon="👥" title="Sabés exactamente quién te debe y cuánto" pills={['Lista de deudores', 'Registro de pagos', 'Email y WhatsApp']}>
              Una lista con todos tus clientes, el saldo de cada uno y el historial de transacciones. Nada queda en el aire ni en la memoria.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Controlá el stock">
            <FeatureCard icon="📦" title="Te avisa antes de quedarte sin mercadería" pills={['Umbral configurable', 'Alertas automáticas', 'Por local']}>
              Definís un mínimo por producto y el sistema te alerta cuando llegás a ese límite. Nunca más perdés una venta porque se te acabó algo.
            </FeatureCard>
            <FeatureCard icon="🔄" title="Cada movimiento de stock queda registrado" pills={['Compra', 'Ajuste manual', 'Devolución', 'Pérdida', 'Rotura']}>
              Entradas por compra, salidas por venta, ajustes, pérdidas y roturas. Todo trazable. Si falta algo, sabés por qué.
            </FeatureCard>
            <FeatureCard icon="🗂️" title="Cargá cientos de productos en minutos" pills={['Importación CSV', 'Actualización masiva de precios', 'Categorías']}>
              ¿Tenés un Excel con tus productos? Lo importás directamente. También actualizás precios en masa con un porcentaje, sin tocar uno por uno.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Cerrá la caja sin nervios">
            <FeatureCard icon="🏦" title="Cerrás la caja en segundos y sabés si cierra" pills={['Fondo inicial', 'Desglose por método', 'Diferencia automática']}>
              Ingresás el fondo inicial al abrir y el total contado al cerrar. El sistema te muestra el desglose y si hay diferencias.
            </FeatureCard>
            <FeatureCard icon="💸" title="Registrá los gastos para saber cuánto ganás" pills={['Gastos por local', 'Por fecha', 'Ganancia neta estimada']}>
              Los gastos van contra los ingresos y ves la ganancia neta real. No solo lo que vendiste, sino lo que te quedó después de pagar.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Reportes que te dicen algo útil">
            <FeatureCard icon="📊" title="Al final del día sabés todo lo que necesitás" pills={['Hoy', 'Semana', 'Mes', 'Por local']}>
              Ventas totales, desglose por medio de pago, top 10 productos, gastos y ganancia neta. Para hoy, esta semana o este mes.
            </FeatureCard>
            <FeatureCard icon="🏆" title="Sabés cuáles son tus productos estrella" pills={['Top por cantidad', 'Top por facturación', 'Tendencia 7 días']}>
              El ranking de lo que más vendés y lo que más te deja. Para saber qué conviene tener siempre y dónde poner el foco.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Para negocios que crecen">
            <FeatureCard icon="🏪" title="Manejá múltiples locales desde un solo lugar" pills={['Multi-sucursal', 'Stock por local', 'Empleados por local']}>
              ¿Tenés más de un local? Cada uno con su stock, su caja y sus ventas independientes. Vos lo ves todo, cada empleado solo ve el suyo.
            </FeatureCard>
            <FeatureCard icon="🤝" title="Manejá tus proveedores y pedidos de compra" pills={['Alta de proveedores', 'Órdenes de compra', 'Historial']}>
              Registrá tus proveedores y las órdenes de compra. Tenés un historial de qué pediste, cuándo y a quién, sin perder papeles.
            </FeatureCard>
          </FeatureGroup>
        </div>
      </section>

      {/* ══ DASHBOARD MOCKUP ════════════════════════════════════════════════ */}
      <section style={{ background: C.g50, padding: '96px 0' }}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <R><Tag>Mirá cómo se ve</Tag></R>
            <R delay={80}><h2 style={h2Style}>Tu negocio de un vistazo</h2></R>
            <R delay={160}><p style={{ fontSize: 17, color: C.textMid }}>Abrís el dashboard y en 10 segundos sabés cómo va el día.</p></R>
          </div>
          <R delay={80}>
            <div style={{ background: C.white, borderRadius: 24, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.08)' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', background: C.warmGray, borderBottom: `1px solid ${C.border}` }}>
                {['📊 Dashboard', '📦 Stock', '📝 Fiado'].map((tab, i) => (
                  <div key={tab} style={{ padding: '14px 24px', fontSize: 13, fontWeight: 600, color: i === 0 ? C.g700 : C.textSoft, borderBottom: `2px solid ${i === 0 ? C.g600 : 'transparent'}`, background: i === 0 ? C.white : 'transparent', cursor: 'pointer' }}>
                    {tab}
                  </div>
                ))}
              </div>
              {/* Screen */}
              <div style={{ padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--font-lora)', fontSize: '1.3rem', fontWeight: 700 }}>Panel principal</span>
                  <span style={{ fontSize: 12, color: C.textSoft, fontFamily: 'var(--font-space-mono)' }}>Hoy · domingo 06 abr</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Ventas hoy', value: '$84.500', delta: '↑ 12% vs ayer', deltaColor: C.g600 },
                    { label: 'Ventas este mes', value: '$1.2M', delta: '↑ 8% vs mes anterior', deltaColor: C.g600 },
                    { label: 'Fiado pendiente', value: '$43.200', delta: '7 clientes', deltaColor: '#f59e0b' },
                    { label: 'Alertas stock', value: '3', delta: 'Reposición urgente', deltaColor: '#ef4444', valueColor: '#ef4444' },
                  ].map(m => (
                    <div key={m.label} style={{ background: C.warmGray, borderRadius: 12, padding: '20px 16px' }}>
                      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{m.label}</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '1.6rem', fontWeight: 700, color: m.valueColor ?? C.textDark }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: m.deltaColor, fontWeight: 600, marginTop: 4 }}>{m.delta}</div>
                    </div>
                  ))}
                </div>
                <div data-db-row>
                  {/* Bar chart */}
                  <div style={{ background: C.warmGray, borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 16 }}>Ventas últimos 7 días</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                      {[35, 50, 65, 20, 80, 95, 65].map((h, i) => (
                        // eslint-disable-next-line react/no-array-index-key -- static decorative bars, no reorder
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: C.g400, borderRadius: '4px 4px 0 0', opacity: i === 5 ? 1 : 0.6 }} />
                      ))}
                    </div>
                  </div>
                  {/* Alerts */}
                  <div style={{ background: C.warmGray, borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 12 }}>⚠️ Stock bajo</div>
                    {[['Coca Cola 1.5L', '2'], ['Papas Fritas 100g', '5'], ['Agua Mineral 500ml', '3']].map(([name, qty]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: C.textDark }}>{name}</span>
                        <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                          {qty}
                          {' '}
                          ud.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </R>
        </div>
      </section>

      {/* ══ PARA QUIÉN ══════════════════════════════════════════════════════ */}
      <section id="para-quien" style={{ background: C.g900, padding: '96px 0' }}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag dark>Para tu tipo de negocio</Tag></R>
            <R delay={80}><h2 style={{ ...h2Style, color: 'white' }}>¿Tu negocio está acá?</h2></R>
            <R delay={160}><p style={{ fontSize: 17, color: 'rgba(255,255,255,.6)', marginTop: 14 }}>TuCaja funciona para cualquier negocio que venda al público y necesite control real.</p></R>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '🏪', title: 'Kiosko', items: ['Cobrás rápido en hora pico sin errores', 'El fiado de los clientes del barrio, organizado', 'Sabés qué reponer antes de que se acabe'] },
              { icon: '🛒', title: 'Almacén / Despensa', items: ['Stock de cientos de productos bajo control', 'Importás todo de un Excel en minutos', 'Actualizás precios masivamente en segundos'] },
              { icon: '🏬', title: 'Minimercado', items: ['Múltiples cajeros, mismo sistema', 'Empleados con acceso a su sector', 'Reportes por turno y por cajero'] },
              { icon: '🛍️', title: 'Supermercado de barrio', items: ['Hasta 3 sucursales en plan Pro', 'Stock independiente por local', 'Vista centralizada de todas las sucursales'] },
              { icon: '🏭', title: 'Cadena / Franquicia', items: ['Locales ilimitados en plan Empresa', 'Gestión de proveedores y órdenes de compra', 'Reportes consolidados de toda la red'] },
            ].map((neg, i) => (
              <R key={neg.title} delay={i * 60}>
                <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '28px 24px', border: '1px solid rgba(255,255,255,.1)', height: '100%' }}>
                  <span style={{ fontSize: 36, display: 'block', marginBottom: 16 }}>{neg.icon}</span>
                  <h3 style={{ fontFamily: 'var(--font-lora)', color: 'white', fontSize: '1rem', marginBottom: 12 }}>{neg.title}</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {neg.items.map(item => (
                      <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.45 }}>
                        <span style={{ color: C.g400, flexShrink: 0 }}>→</span>
                        {' '}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ════════════════════════════════════════════════════ */}
      <section style={{ background: C.white, padding: '96px 0' }}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Lo que dicen quienes ya usan TuCaja</Tag></R>
            <R delay={80}><h2 style={h2Style}>Negocios reales, resultados reales</h2></R>
          </div>

          {/* Metrics */}
          <R>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 72 }}>
              {[
                { count: 200, label: 'Negocios activos en Argentina' },
                { count: 50000, label: 'Ventas registradas este mes' },
                { count: 98, label: '% de satisfacción en soporte' },
              ].map((m, i) => (
                <div key={m.label} style={{ padding: '40px 32px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                  <span data-count={m.count} style={{ fontFamily: 'var(--font-space-mono)', fontSize: '3rem', fontWeight: 700, color: C.g600, display: 'block', lineHeight: 1 }}>0</span>
                  <div style={{ fontSize: 14, color: C.textSoft, marginTop: 8 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </R>

          {/* Testimonials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { quote: 'Antes cerraba la caja con calculadora y siempre me faltaba o sobraba algo y no sabía por qué. Ahora en dos minutos sé exactamente qué pasó.', initial: 'R', name: 'Roberto M.', biz: 'Kiosko Don Roberto · Villa del Parque, CABA' },
              { quote: 'El tema del fiado era un caos. Algunos clientes se olvidaban y yo no tenía nada para mostrarles. Ahora la plata que recuperé pagó el primer año del sistema.', initial: 'M', name: 'Marcela P.', biz: 'Almacén La Esquina · Lanús, Buenos Aires' },
              { quote: 'Tengo dos locales y antes me volvía loco tratando de saber cómo iba cada uno. Ahora entro al dashboard y en diez segundos sé cómo está todo.', initial: 'J', name: 'Javier L.', biz: 'Minimercado Javier · Rosario, Santa Fe' },
            ].map((t, i) => (
              <R key={t.name} delay={i * 80}>
                <div style={{ background: C.warmGray, borderRadius: 16, padding: 32, height: '100%' }}>
                  <div style={{ color: '#f59e0b', fontSize: 14, marginBottom: 10 }}>★★★★★</div>
                  <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '1.05rem', color: C.textDark, lineHeight: 1.7, marginBottom: 24 }}>
                    &ldquo;
                    {t.quote}
                    &rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.g100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: C.g700, flexShrink: 0 }}>{t.initial}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: C.textDark, fontSize: 14 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{t.biz}</div>
                    </div>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRECIOS ═════════════════════════════════════════════════════════ */}
      <section id="precios" style={{ background: C.cream, padding: '96px 0' }}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Precios</Tag></R>
            <R delay={80}><h2 style={h2Style}>Sin letra chica, sin sorpresas</h2></R>
            <R delay={160}><p style={{ fontSize: 17, color: C.textMid }}>Empezá gratis. Pagá cuando tu negocio crece.</p></R>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, alignItems: 'start' }}>
            {/* FREE */}
            <R>
              <PlanCard
                name="Gratis"
                desc="Para conocer el sistema"
                price="$0"
                period="/mes"
                features={[
                  [true, '1 local'],
                  [true, 'Hasta 200 ventas por mes'],
                  [true, 'Gestión de productos'],
                  [true, 'Control de stock'],
                  [false, 'Reportes y métricas'],
                  [false, 'Fiado / cuenta corriente'],
                  [false, 'Múltiples locales'],
                ]}
                ctaHref="/sign-up"
                ctaLabel="Empezar gratis"
                ctaVariant="outline"
              />
            </R>
            {/* BASIC */}
            <R delay={80}>
              <PlanCard
                name="Básico"
                desc="Para kioscos independientes"
                price="USD 15"
                period="/mes"
                features={[
                  [true, '1 local'],
                  [true, 'Ventas ilimitadas'],
                  [true, 'Productos y categorías'],
                  [true, 'Control de stock con alertas'],
                  [true, 'Fiado / cuenta corriente'],
                  [true, 'Reportes y métricas completos'],
                  [false, 'Múltiples locales'],
                ]}
                ctaHref="/sign-up"
                ctaLabel="Probar 14 días gratis"
                ctaVariant="outline"
                note="Sin tarjeta. Cancelás cuando querés."
              />
            </R>
            {/* PRO */}
            <R delay={160}>
              <PlanCard
                name="Pro"
                desc="Para cadenas con sucursales"
                price="USD 35"
                period="/mes"
                features={[
                  [true, 'Hasta 3 locales'],
                  [true, 'Ventas ilimitadas'],
                  [true, 'Todo el plan Básico'],
                  [true, 'Stock independiente por local'],
                  [true, 'Empleados asignados por local'],
                  [true, 'Vista centralizada de sucursales'],
                  [true, 'Gestión de proveedores'],
                ]}
                ctaHref="/sign-up"
                ctaLabel="Probar 14 días gratis →"
                ctaVariant="primary"
                recommended
                note="Sin tarjeta. Cancelás cuando querés."
              />
            </R>
            {/* ENTERPRISE */}
            <R delay={240}>
              <PlanCard
                name="Empresa"
                desc="Para franquicias y cadenas grandes"
                price="USD 80"
                period="/mes"
                features={[
                  [true, 'Locales ilimitados'],
                  [true, 'Ventas ilimitadas'],
                  [true, 'Todo el plan Pro'],
                  [true, 'Soporte prioritario'],
                  [true, 'Incorporación asistida'],
                ]}
                ctaHref="mailto:hola@tucaja.ar"
                ctaLabel="Hablar con ventas"
                ctaVariant="outline"
              />
            </R>
          </div>
          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: C.textMuted }}>
            Todos los precios en USD. El cobro se hace en pesos argentinos vía Mercado Pago al tipo de cambio vigente.
          </p>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: C.white, padding: '96px 0' }}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Preguntas frecuentes</Tag></R>
            <R delay={80}><h2 style={h2Style}>Lo que te preguntás antes de empezar</h2></R>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px 48px' }}>
            {[
              ['¿Funciona si se corta internet?', 'Sí. La pantalla de cobro funciona offline. Las ventas se sincronizan cuando volvés a tener conexión. No perdés ninguna venta por un problema de internet.'],
              ['¿Necesito instalar algo?', 'No. TuCaja funciona desde el navegador en tu celular, tablet o computadora. Sin descargas, sin instalaciones, sin configuraciones técnicas.'],
              ['¿Puedo importar mis productos de Excel?', 'Sí. Exportás tu Excel como CSV, lo subís y en minutos tenés todo tu catálogo cargado. También podés actualizar precios en masa con un porcentaje.'],
              ['¿El sistema maneja el fiado y cuenta corriente?', 'Sí. Cuando vendés en fiado la deuda se crea automáticamente. Ves el saldo de cada cliente en tiempo real y registrás los pagos en segundos.'],
              ['¿Puedo tener más de un empleado?', 'Sí. Podés agregar empleados y asignarlos a un local. Cada uno solo ve su local. Vos como dueño ves todo.'],
              ['¿Cómo se cobra? ¿Puedo cancelar cuando quiero?', 'Se cobra mensualmente vía Mercado Pago en pesos argentinos. Podés cancelar en cualquier momento sin penalidades. El plan Gratis no requiere tarjeta.'],
            ].map(([q, a], i) => (
              <R key={q} delay={i * 50}>
                <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 24 }}>
                  <div style={{ fontWeight: 600, color: C.textDark, marginBottom: 8, fontSize: 15 }}>{q}</div>
                  <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.65 }}>{a}</div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ═══════════════════════════════════════════════════════ */}
      <section style={{ background: `radial-gradient(ellipse 60% 80% at 50% 100%, rgba(34,160,71,.22) 0%, transparent 70%), ${C.g900}`, padding: '120px 24px', textAlign: 'center' }}>
        <R><Tag dark>Empezá hoy mismo</Tag></R>
        <R delay={80}>
          <h2 style={{ ...h2Style, color: 'white', marginTop: 16, marginBottom: 16 }}>
            Tu negocio merece más control
            <br />
            <em style={{ fontStyle: 'italic', color: C.g400 }}>y menos caos.</em>
          </h2>
        </R>
        <R delay={160}>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.6)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
            14 días gratis, sin tarjeta de crédito. Si en dos semanas no sentís la diferencia, no pagás nada.
          </p>
        </R>
        <R delay={240}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-up" style={{ ...btnPrimaryLgStyle, background: C.white, color: C.g700, boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
              Empezar gratis ahora →
            </Link>
            <a href="https://wa.me/5491100000000" target="_blank" rel="noopener noreferrer" style={{ ...btnOutlineLgStyle, borderColor: 'rgba(255,255,255,.3)', color: 'rgba(255,255,255,.85)' }}>
              💬 Hablar por WhatsApp
            </a>
          </div>
        </R>
        <R delay={320}>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,.35)' }}>
            Sin tarjeta · Sin contratos · Cancelás cuando querés
          </p>
        </R>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer style={{ background: C.g900, borderTop: '1px solid rgba(255,255,255,.08)', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 16 }}>TuCaja</div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          {[['#funciones', 'Funciones'], ['#precios', 'Precios'], ['#faq', 'Ayuda'], ['mailto:hola@tucaja.ar', 'Contacto']].map(([href, label]) => (
            <a key={href} href={href!} style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontSize: 13 }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>
          © 2025 TuCaja · Sistema de punto de venta para Argentina
        </div>
      </footer>

      {/* Responsive overrides via data attributes to avoid custom Tailwind class warnings */}
      <style>
        {`
        [data-hero-grid] { display: grid; grid-template-columns: clamp(300px,50%,520px) 1fr; gap: 64px; align-items: center; padding: 80px 0 96px; }
        [data-ad-grid]   { display: grid; grid-template-columns: 1fr 64px 1fr; }
        [data-db-row]    { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
        @media (max-width: 900px) { [data-hero-grid] { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { [data-ad-grid] { grid-template-columns: 1fr !important; } [data-db-row] { grid-template-columns: 1fr !important; } }
      `}
      </style>
    </div>
  );
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Tag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: dark ? 'rgba(255,255,255,.1)' : C.g100,
      color: dark ? 'rgba(255,255,255,.8)' : C.g700,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      padding: '5px 12px',
      borderRadius: 100,
      marginBottom: 20,
    }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dark ? C.g400 : C.g500, flexShrink: 0 }} />
      {children}
    </div>
  );
}

function FeatureGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.textMuted, margin: '52px 0 18px' }}>
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {children}
      </div>
    </>
  );
}

function FeatureCard({ icon, title, children, pills, highlight = false }: {
  icon: string;
  title: string;
  children: React.ReactNode;
  pills?: string[];
  highlight?: boolean;
}) {
  return (
    <R>
      <div style={{
        background: highlight ? C.g700 : C.white,
        borderRadius: 16,
        padding: 32,
        border: `1px solid ${highlight ? C.g700 : C.border}`,
        height: '100%',
      }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: highlight ? 'rgba(255,255,255,.15)' : C.g100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>
          {icon}
        </div>
        <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: '1.1rem', fontWeight: 600, color: highlight ? 'white' : C.textDark, marginBottom: 10 }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: highlight ? 'rgba(255,255,255,.8)' : C.textMid }}>{children}</p>
        {pills && pills.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${highlight ? 'rgba(255,255,255,.2)' : C.border}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {pills.map(p => (
              <span key={p} style={{ background: highlight ? 'rgba(255,255,255,.15)' : C.g50, color: highlight ? 'white' : C.g700, border: `1px solid ${highlight ? 'rgba(255,255,255,.2)' : C.g100}`, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>{p}</span>
            ))}
          </div>
        )}
      </div>
    </R>
  );
}

function PlanCard({ name, desc, price, period, features, ctaHref, ctaLabel, ctaVariant, recommended = false, note }: {
  name: string;
  desc: string;
  price: string;
  period: string;
  features: [boolean, string][];
  ctaHref: string;
  ctaLabel: string;
  ctaVariant: 'primary' | 'outline';
  recommended?: boolean;
  note?: string;
}) {
  return (
    <div style={{
      background: C.white,
      borderRadius: 20,
      padding: '36px 28px',
      border: `2px solid ${recommended ? C.g500 : C.border}`,
      boxShadow: recommended ? `0 12px 40px rgba(34,160,71,.15)` : 'none',
      position: 'relative',
      transform: recommended ? 'scale(1.03)' : 'none',
    }}
    >
      {recommended && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: C.g500, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '5px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
          ⭐ El más elegido
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-lora)', fontSize: '1.4rem', fontWeight: 700, color: C.textDark, marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 24 }}>{desc}</div>
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '2.2rem', fontWeight: 700, color: C.textDark }}>{price}</span>
        <span style={{ fontSize: 13, color: C.textSoft, marginLeft: 4 }}>{period}</span>
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {features.map(([active, label]) => (
          <li key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: active ? C.textMid : C.textMuted, lineHeight: 1.45 }}>
            <span style={{ color: active ? C.g500 : '#d1d5db', flexShrink: 0 }}>{active ? '✓' : '—'}</span>
            {label}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          padding: '13px 0',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: 'none',
          background: ctaVariant === 'primary' ? C.g600 : 'transparent',
          color: ctaVariant === 'primary' ? 'white' : C.g700,
          border: ctaVariant === 'outline' ? `1.5px solid ${C.g600}` : 'none',
        }}
      >
        {ctaLabel}
      </Link>
      {note && <p style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 10 }}>{note}</p>}
    </div>
  );
}

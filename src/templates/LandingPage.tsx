'use client';

import { DM_Sans, Lora, Space_Mono } from 'next/font/google';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// ─── Fonts ───────────────────────────────────────────────────────────────────
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono', display: 'swap' });

// ─── Color tokens ─────────────────────────────────────────────────────────────
// Navy = confianza / autoridad. Esmeralda = dinero / crecimiento.
const C = {
  // Navy
  n950: '#020617',
  n900: '#0f172a',
  n800: '#1e293b',
  n700: '#334155',
  n600: '#475569',
  n500: '#64748b',
  n400: '#94a3b8',
  n300: '#cbd5e1',
  n200: '#e2e8f0',
  n100: '#f1f5f9',
  n50: '#f8fafc',
  // Esmeralda
  e700: '#047857',
  e600: '#059669',
  e500: '#10b981',
  e400: '#34d399',
  e200: '#a7f3d0',
  e100: '#d1fae5',
  e50: '#ecfdf5',
  // Semánticos
  white: '#ffffff',
  textDark: '#0f172a',
  textMid: '#334155',
  textSoft: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
} as const;

// ─── Style constants ──────────────────────────────────────────────────────────
const wrap: React.CSSProperties = { maxWidth: 1140, margin: '0 auto', padding: '0 20px' };

const h2base: React.CSSProperties = {
  fontFamily: 'var(--font-lora)',
  fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)',
  fontWeight: 700,
  lineHeight: 1.2,
  color: C.textDark,
};

const btnPrimaryLg: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '15px 28px',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  textDecoration: 'none',
  background: C.e600,
  color: C.white,
  boxShadow: '0 4px 20px rgba(5,150,105,.38)',
  border: 'none',
  cursor: 'pointer',
};
const btnOutlineLg: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '15px 28px',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  background: 'transparent',
  color: C.n800,
  border: `1.5px solid ${C.n300}`,
};
const btnPrimarySm: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '9px 18px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  background: C.e600,
  color: C.white,
};
const btnOutlineSm: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '9px 18px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  background: 'transparent',
  color: C.n700,
  border: `1.5px solid ${C.n200}`,
};
const empty: React.CSSProperties = {};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      entries => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      }),
      { threshold: 0.06, rootMargin: '0px 0px -20px 0px' },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useCounters() {
  useEffect(() => {
    const counters = document.querySelectorAll<HTMLElement>('[data-count]');
    const io = new IntersectionObserver(
      entries => entries.forEach((entry) => {
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
      }),
      { threshold: 0.5 },
    );
    counters.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useNavbar() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const handle = () => {
      if (!ref.current) {
        return;
      }
      ref.current.style.boxShadow = window.scrollY > 10
        ? '0 2px 24px rgba(15,23,42,.1)'
        : 'none';
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);
  return ref;
}

// ─── R: Reveal wrapper ────────────────────────────────────────────────────────
function R({
  children,
  delay = 0,
  style = empty,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      data-reveal
      style={{
        opacity: 0,
        transform: 'translateY(20px)',
        transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const LandingPage = () => {
  useReveal();
  useCounters();
  const navRef = useNavbar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const fontVars = `${lora.variable} ${dmSans.variable} ${spaceMono.variable}`;

  return (
    <div
      className={fontVars}
      style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif', background: C.n50, color: C.textDark, overflowX: 'hidden' }}
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
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(248,250,252,.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${C.border}`,
          transition: 'box-shadow .3s',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--font-space-mono)', fontWeight: 700, fontSize: 18, color: C.n900 }}
        >
          <span style={{ width: 34, height: 34, background: C.e600, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h12v-2H6.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H15.5c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </span>
          TuCaja
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex" style={{ gap: 28, alignItems: 'center' }}>
          {[['#funciones', 'Funciones'], ['#para-quien', 'Para quién'], ['#precios', 'Precios'], ['#faq', 'FAQ']].map(([href, label]) => (
            <a key={href} href={href!} style={{ textDecoration: 'none', color: C.textSoft, fontSize: 14, fontWeight: 500 }}>{label}</a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex" style={{ gap: 10, alignItems: 'center' }}>
          <Link href="/sign-in" style={btnOutlineSm}>Iniciar sesión</Link>
          <Link href="/sign-up" style={btnPrimarySm}>Probá gratis →</Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex md:hidden" style={{ gap: 8, alignItems: 'center' }}>
          <Link href="/sign-up" style={{ ...btnPrimarySm, padding: '8px 14px', fontSize: 13 }}>Probar gratis</Link>
          <button
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: 4.5, flexShrink: 0 }}
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{ display: 'block', width: 22, height: 2, background: C.n700, borderRadius: 2, transition: 'all .2s', ...(mobileOpen && i === 0 ? { transform: 'translateY(6.5px) rotate(45deg)' } : {}), ...(mobileOpen && i === 1 ? { opacity: 0 } : {}), ...(mobileOpen && i === 2 ? { transform: 'translateY(-6.5px) rotate(-45deg)' } : {}) }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 99, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
          onKeyDown={e => e.key === 'Escape' && setMobileOpen(false)}
        >
          <div
            role="presentation"
            style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '20px', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {[['#funciones', 'Funciones'], ['#para-quien', 'Para quién'], ['#precios', 'Precios'], ['#faq', 'FAQ']].map(([href, label]) => (
              <a
                key={href}
                href={href!}
                onClick={() => setMobileOpen(false)}
                style={{ textDecoration: 'none', color: C.textDark, fontSize: 16, fontWeight: 500, padding: '14px 0', borderBottom: `1px solid ${C.border}` }}
              >
                {label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Link href="/sign-in" onClick={() => setMobileOpen(false)} style={{ ...btnOutlineSm, flex: 1, justifyContent: 'center' }}>Iniciar sesión</Link>
              <Link href="/sign-up" onClick={() => setMobileOpen(false)} style={{ ...btnPrimarySm, flex: 1, justifyContent: 'center' }}>Probá gratis</Link>
            </div>
          </div>
        </div>
      )}

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: '100svh',
          paddingTop: 64,
          background: `radial-gradient(ellipse 110% 70% at 65% -5%, rgba(16,185,129,.11) 0%, transparent 60%), linear-gradient(180deg, ${C.n50} 0%, ${C.white} 100%)`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ ...wrap, width: '100%' }}>
          <div data-hero-grid>

            {/* Copy */}
            <div>
              <R>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.e50, border: `1px solid ${C.e200}`, borderRadius: 100, padding: '5px 14px', marginBottom: 22 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.e500, display: 'block', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.e700 }}>
                    Sistema POS para Argentina
                  </span>
                </div>
              </R>

              <R delay={80}>
                <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(2.1rem, 5.5vw, 3.8rem)', fontWeight: 700, lineHeight: 1.12, marginBottom: 22, color: C.textDark }}>
                  Sabé cuánto vendiste,
                  <br />
                  qué stock te queda
                  <br />
                  <em style={{ fontStyle: 'italic', color: C.e600 }}>y cuánto ganás.</em>
                </h1>
              </R>

              <R delay={160}>
                <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: C.textMid, marginBottom: 32, lineHeight: 1.7, maxWidth: 500 }}>
                  El sistema POS que le da
                  {' '}
                  <strong>control total a los dueños de negocios</strong>
                  {' '}
                  en Argentina. Ventas, stock, fiado y caja — en tiempo real, desde cualquier dispositivo.
                </p>
              </R>

              <R delay={240}>
                <div data-hero-ctas>
                  <Link href="/sign-up" style={btnPrimaryLg}>
                    Empezar gratis — 14 días
                  </Link>
                  <a href="#funciones" style={btnOutlineLg}>
                    Ver cómo funciona
                  </a>
                </div>
              </R>

              <R delay={320}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex' }}>
                    {['R', 'M', 'J', 'L'].map((l, i) => (
                      <div key={l} style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid ${C.white}`, background: C.e100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.e700, marginLeft: i === 0 ? 0 : -9 }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: C.textSoft }}>
                    Más de
                    {' '}
                    <strong style={{ color: C.textDark }}>200 negocios</strong>
                    {' '}
                    ya usan TuCaja
                  </span>
                </div>
              </R>

              <R delay={400}>
                <div data-trust-signals>
                  {['✓ Sin tarjeta de crédito', '✓ Funciona offline', '✓ Datos encriptados'].map(t => (
                    <span key={t} style={{ fontSize: 13, color: C.textSoft }}>{t}</span>
                  ))}
                </div>
              </R>
            </div>

            {/* POS Mockup */}
            <R delay={100}>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 20 }}>

                {/* Floating badge — ventas */}
                <div style={{ position: 'absolute', top: 0, right: 8, background: C.white, borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 32px rgba(15,23,42,.12)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: C.e50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📈</div>
                  <div>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Ventas hoy</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.textDark, fontFamily: 'var(--font-space-mono)' }}>$84.500</div>
                  </div>
                </div>

                {/* Mockup principal */}
                <div style={{ width: '100%', maxWidth: 420, background: C.white, borderRadius: 20, boxShadow: '0 24px 64px rgba(15,23,42,.13), 0 0 0 1px rgba(15,23,42,.05)', overflow: 'hidden' }}>
                  <div style={{ background: C.n900, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.e400 }} />
                      <span style={{ color: C.white, fontWeight: 600, fontSize: 13 }}>🛒 Caja — Local Centro</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, fontFamily: 'var(--font-space-mono)' }}>10:42 am</span>
                  </div>
                  <div style={{ padding: 18 }}>
                    <div style={{ background: C.n100, borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 14, opacity: 0.5 }}>🔍</span>
                      <span style={{ color: C.textMuted, fontSize: 13 }}>Buscá un producto o escaneá...</span>
                    </div>
                    {[
                      { name: 'Coca Cola 1.5L', qty: '×2', price: '$2.400' },
                      { name: 'Alfajor Doble', qty: '×3', price: '$1.950' },
                      { name: 'Papas Fritas 100g', qty: '×1', price: '$1.200' },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.e50, borderRadius: 9, padding: '10px 12px', border: `1px solid ${C.e100}`, marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.textDark, flex: 1, marginRight: 8 }}>{item.name}</span>
                        <span style={{ background: C.e100, color: C.e700, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, marginRight: 8, flexShrink: 0 }}>{item.qty}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.e700, fontFamily: 'var(--font-space-mono)', flexShrink: 0 }}>{item.price}</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: C.border, margin: '14px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 14, color: C.textSoft }}>Total</span>
                      <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-space-mono)', color: C.textDark }}>$5.550</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      {['💵 Efect.', '💳 Déb.', '🔄 Transf.', '📝 Fiado'].map((pm, i) => (
                        <div key={pm} style={{ flex: 1, padding: '7px 2px', borderRadius: 7, textAlign: 'center', fontSize: 11, fontWeight: 600, border: `1.5px solid ${i === 0 ? C.e500 : C.border}`, color: i === 0 ? C.e700 : C.textSoft, background: i === 0 ? C.e50 : 'transparent' }}>
                          {pm}
                        </div>
                      ))}
                    </div>
                    <button type="button" style={{ background: C.e600, color: C.white, border: 'none', width: '100%', padding: '13px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', boxShadow: '0 4px 12px rgba(5,150,105,.3)' }}>
                      ✓ Confirmar cobro
                    </button>
                  </div>
                </div>

                {/* Floating badge — stock */}
                <div style={{ position: 'absolute', bottom: 24, left: 0, background: C.n900, borderRadius: 14, padding: '10px 14px', boxShadow: '0 8px 32px rgba(15,23,42,.25)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Stock bajo</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>3 productos → Reponé</div>
                  </div>
                </div>
              </div>
            </R>
          </div>
        </div>
      </section>

      {/* ══ TRUST STRIP ═════════════════════════════════════════════════════ */}
      <div style={{ background: C.n900, padding: '15px 20px' }}>
        <div data-strip>
          {[
            ['⚡', 'Funciona offline'],
            ['📱', 'Celular, tablet o compu'],
            ['🔐', 'Datos encriptados y seguros'],
            ['🇦🇷', 'Soporte en español'],
            ['💳', 'Pago vía Mercado Pago'],
            ['🚀', 'Sin instalación'],
          ].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ ANTES / DESPUÉS ═════════════════════════════════════════════════ */}
      <section id="funciones" style={{ background: C.white, paddingTop: 96, paddingBottom: 0 }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', paddingBottom: 56 }}>
            <R><Tag>El cambio que buscás</Tag></R>
            <R delay={80}>
              <h2 style={h2base}>
                Cómo manejabas el negocio
                <br />
                vs. cómo vas a manejarlo
              </h2>
            </R>
            <R delay={160}>
              <p style={{ fontSize: 16, color: C.textSoft, marginTop: 14, maxWidth: 500, margin: '14px auto 0' }}>
                El 80% de los dueños de kioscos y almacenes trabajan con cuaderno, calculadora y memoria. Hay una forma mejor.
              </p>
            </R>
          </div>
        </div>
        <div data-ad-grid>
          {/* ANTES */}
          <div style={{ background: '#fffbf9', padding: '52px 20px' }}>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <R>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fee2e2', borderRadius: 100, padding: '5px 14px', marginBottom: 22 }}>
                  <span style={{ fontSize: 11 }}>❌</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#991b1b' }}>Sin sistema</span>
                </div>
              </R>
              <R delay={60}>
                <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 700, color: '#450a0a', marginBottom: 28 }}>
                  El caos silencioso de todos los días
                </h3>
              </R>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  ['📓', 'Anotás las ventas en un cuaderno y al final del día no cierra'],
                  ['🤷', 'No sabés cuánto stock te queda hasta que se te acaba'],
                  ['🔢', 'Cerrás la caja haciendo cuentas a mano y siempre falta o sobra'],
                  ['📱', 'El fiado lo manejás de memoria y hay clientes que "se olvidaron"'],
                  ['😰', 'No sabés qué productos te conviene tener ni cuáles no se mueven'],
                  ['⏰', 'Perdés tiempo buscando precios, anotando, calculando — todos los días'],
                ].map(([icon, text], i) => (
                  <R key={text as string} delay={i * 50}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#7f1d1d', lineHeight: 1.65 }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                      {text}
                    </li>
                  </R>
                ))}
              </ul>
            </div>
          </div>

          {/* DESPUÉS */}
          <div style={{ background: C.e50, padding: '52px 20px' }}>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <R>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.e100, borderRadius: 100, padding: '5px 14px', marginBottom: 22 }}>
                  <span style={{ fontSize: 11 }}>✓</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.e700 }}>Con TuCaja</span>
                </div>
              </R>
              <R delay={60}>
                <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 700, color: C.n900, marginBottom: 28 }}>
                  Control real desde el primer día
                </h3>
              </R>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  'Cada venta queda registrada automáticamente, con número de comprobante',
                  'Recibís una alerta antes de quedarte sin stock, no cuando ya se acabó',
                  'El cierre de caja te dice cuánto deberías tener y la diferencia exacta',
                  'El fiado queda en el sistema: quién debe, cuánto y desde cuándo',
                  'Ves en tiempo real cuáles son tus productos más rentables',
                  'Cobrás en segundos — el sistema hace todo el resto solo',
                ].map((text, i) => (
                  <R key={text} delay={i * 50}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: C.textMid, lineHeight: 1.65 }}>
                      <span style={{ color: C.e500, flexShrink: 0, fontWeight: 700, fontSize: 16, marginTop: 1 }}>✓</span>
                      {text}
                    </li>
                  </R>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div style={{ height: 80 }} />
      </section>

      {/* ══ LO QUE GANÁS ════════════════════════════════════════════════════ */}
      <section style={{ background: C.n900, padding: '96px 0' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag dark>Resultados concretos</Tag></R>
            <R delay={80}>
              <h2 style={{ ...h2base, color: C.white }}>
                Tres cosas que cambian
                <br />
                desde el día uno
              </h2>
            </R>
            <R delay={160}>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', marginTop: 14 }}>
                No son funciones. Son resultados que sentís en la caja.
              </p>
            </R>
          </div>

          <div data-benefits-grid>
            {[
              {
                num: '01',
                icon: '🎯',
                title: 'Sabés exactamente en qué estás parado',
                body: 'En cualquier momento del día podés ver cuánto vendiste, cuánto en efectivo, cuánto digital, cuánto fiaste y cuánto te queda en caja. No esperás al cierre para enterarte cómo fue el día.',
                highlighted: true,
              },
              {
                num: '02',
                icon: '📦',
                title: 'Nunca más perdés una venta por falta de stock',
                body: 'El sistema te avisa cuando un producto está por agotarse, antes de que el cliente llegue y no lo encuentre. Definís vos el mínimo y TuCaja cuida el resto.',
                highlighted: false,
              },
              {
                num: '03',
                icon: '💰',
                title: 'Recuperás la plata que te debían sin pelear',
                body: 'El fiado ya no depende de tu memoria ni de la del cliente. Ves el saldo exacto, el historial y podés cobrar con un clic. La plata que perdías en fiado "olvidado" vuelve a vos.',
                highlighted: false,
              },
            ].map((b, i) => (
              <R key={b.num} delay={i * 80}>
                <div style={{
                  background: b.highlighted ? C.e600 : 'rgba(255,255,255,.05)',
                  border: `1px solid ${b.highlighted ? C.e500 : 'rgba(255,255,255,.1)'}`,
                  borderRadius: 20,
                  padding: '36px 28px',
                  height: '100%',
                  boxShadow: b.highlighted ? '0 12px 40px rgba(5,150,105,.25)' : 'none',
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, fontWeight: 700, color: b.highlighted ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.3)', letterSpacing: '.1em' }}>{b.num}</span>
                    <span style={{ fontSize: 28 }}>{b.icon}</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', fontWeight: 700, color: C.white, marginBottom: 14, lineHeight: 1.35 }}>{b.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: b.highlighted ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.55)' }}>{b.body}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
      <section style={{ background: C.n50, padding: '96px 0' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Todo lo que incluye</Tag></R>
            <R delay={80}>
              <h2 style={h2base}>
                Diseñado para el día a día
                <br />
                de tu negocio
              </h2>
            </R>
            <R delay={160}>
              <p style={{ fontSize: 16, color: C.textSoft, maxWidth: 520, margin: '14px auto 0' }}>
                No es un sistema de contabilidad complicado. Es el sistema que necesitás para abrir, vender y cerrar tranquilo.
              </p>
            </R>
          </div>

          <FeatureGroup label="Cobrá y vendé">
            <FeatureCard icon="⚡" title="Cobrás en segundos, no en minutos" pills={['Por nombre', 'Por SKU', 'Carrito rápido']}>
              Buscá el producto, sumá al carrito, elegí cómo paga y listo. Sin complicaciones. El cliente no espera, vos no te equivocás.
            </FeatureCard>
            <FeatureCard icon="💳" title="Acepta cualquier forma de pago" pills={['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Fiado']}>
              No perdés una venta porque el cliente no trae efectivo. Todos los métodos en una pantalla, sin vueltas.
            </FeatureCard>
            <FeatureCard icon="🧾" title="Cada venta tiene su comprobante" pills={['Número automático', 'Datos del cliente', 'WhatsApp']}>
              Todo queda asentado con número de comprobante automático. Sin papeles sueltos, sin errores, sin discusiones.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Fiado sin cuaderno aparte">
            <FeatureCard icon="📝" title="El fiado registrado automáticamente" pills={['Deuda automática', 'Balance por cliente', 'Historial completo']} highlight>
              Cuando vendés en fiado, la deuda se crea sola. Ves quién te debe, cuánto y cuándo empezó. Y cuando paga, lo asentás en segundos.
            </FeatureCard>
            <FeatureCard icon="👥" title="Sabés exactamente quién te debe y cuánto" pills={['Lista de deudores', 'Registro de pagos', 'Historial por cliente']}>
              Una lista con todos tus clientes, su saldo y el historial completo. Nada queda en la memoria de nadie.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Controlá el stock">
            <FeatureCard icon="📦" title="Te avisa antes de quedarte sin mercadería" pills={['Umbral configurable', 'Alertas automáticas', 'Por local']}>
              Definís un mínimo por producto y el sistema te alerta cuando llegás a ese límite. Nunca más una venta perdida por stock agotado.
            </FeatureCard>
            <FeatureCard icon="🔄" title="Cada movimiento queda registrado" pills={['Compra', 'Ajuste', 'Devolución', 'Pérdida', 'Rotura']}>
              Entradas, salidas, ajustes, pérdidas y roturas. Todo trazable. Si falta algo, sabés exactamente por qué.
            </FeatureCard>
            <FeatureCard icon="🗂️" title="Cargá cientos de productos en minutos" pills={['Importación CSV', 'Actualización masiva', 'Categorías']}>
              ¿Tenés un Excel? Lo importás directo. Actualizás precios en masa con un porcentaje sin tocar uno por uno.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Cerrá la caja sin nervios">
            <FeatureCard icon="🏦" title="Cerrás la caja en segundos y sabés si cierra" pills={['Fondo inicial', 'Desglose por método', 'Diferencia automática']}>
              Ingresás el fondo inicial y el total contado. El sistema muestra el desglose y si hay diferencias. Sin cuentas a mano.
            </FeatureCard>
            <FeatureCard icon="💸" title="Registrá los gastos para saber cuánto ganás" pills={['Gastos por local', 'Por fecha', 'Ganancia neta']}>
              Los gastos van contra los ingresos y ves la ganancia neta real. No solo lo que vendiste, sino lo que te quedó.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Datos que te dicen algo útil">
            <FeatureCard icon="📊" title="Al final del día sabés todo lo que necesitás" pills={['Hoy', 'Semana', 'Mes', 'Por local']}>
              Ventas totales, desglose por medio de pago, top 10 productos, gastos y ganancia neta. De un vistazo.
            </FeatureCard>
            <FeatureCard icon="🏆" title="Sabés cuáles son tus productos estrella" pills={['Top por cantidad', 'Top por facturación', 'Tendencia 7 días']}>
              El ranking de lo que más vendés y lo que más te deja. Para saber qué conviene tener siempre y qué no.
            </FeatureCard>
          </FeatureGroup>

          <FeatureGroup label="Para negocios que crecen">
            <FeatureCard icon="🏪" title="Múltiples locales desde un solo lugar" pills={['Multi-sucursal', 'Stock por local', 'Empleados por local']}>
              Cada local con su stock, su caja y sus ventas. Vos lo ves todo desde un panel centralizado.
            </FeatureCard>
            <FeatureCard icon="🤝" title="Proveedores y pedidos de compra" pills={['Alta de proveedores', 'Órdenes de compra', 'Historial']}>
              Registrá tus proveedores y las órdenes de compra. Un historial de qué pediste, cuándo y a quién, sin perder papeles.
            </FeatureCard>
          </FeatureGroup>
        </div>
      </section>

      {/* ══ DASHBOARD MOCKUP ════════════════════════════════════════════════ */}
      <section style={{ background: C.white, padding: '96px 0' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <R><Tag>Así se ve</Tag></R>
            <R delay={80}><h2 style={h2base}>Tu negocio de un vistazo</h2></R>
            <R delay={160}><p style={{ fontSize: 16, color: C.textSoft, marginTop: 12 }}>Abrís el dashboard y en 10 segundos sabés cómo va el día.</p></R>
          </div>
          <R delay={80}>
            <div style={{ background: C.n50, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 20px 60px rgba(15,23,42,.08)' }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', background: C.n100, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
                {['📊 Dashboard', '📦 Stock', '📝 Fiado', '📈 Reportes'].map((tab, i) => (
                  <div key={tab} style={{ padding: '13px 20px', fontSize: 13, fontWeight: 600, color: i === 0 ? C.n900 : C.textSoft, borderBottom: `2px solid ${i === 0 ? C.e600 : 'transparent'}`, background: i === 0 ? C.white : 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {tab}
                  </div>
                ))}
              </div>
              {/* Content */}
              <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: 700, color: C.textDark }}>Panel principal</span>
                  <span style={{ fontSize: 12, color: C.textSoft, fontFamily: 'var(--font-space-mono)', background: C.n100, padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}` }}>Hoy · lunes 14 abr 2026</span>
                </div>
                {/* Metric cards */}
                <div data-metrics-grid>
                  {[
                    { label: 'Ventas hoy', value: '$84.500', delta: '↑ 12% vs ayer', dc: C.e600 },
                    { label: 'Ventas del mes', value: '$1.2M', delta: '↑ 8% vs mes anterior', dc: C.e600 },
                    { label: 'Fiado pendiente', value: '$43.200', delta: '7 clientes', dc: '#d97706' },
                    { label: 'Stock bajo', value: '3', delta: 'Reposición urgente', dc: '#dc2626', vc: '#dc2626' },
                  ].map(m => (
                    <div key={m.label} style={{ background: C.white, borderRadius: 12, padding: '18px 16px', border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{m.label}</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', fontWeight: 700, color: (m as any).vc ?? C.textDark }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: m.dc, fontWeight: 600, marginTop: 4 }}>{m.delta}</div>
                    </div>
                  ))}
                </div>
                {/* Charts row */}
                <div data-db-row style={{ marginTop: 14 }}>
                  <div style={{ background: C.white, borderRadius: 12, padding: 18, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 14 }}>Ventas últimos 7 días</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
                      {[35, 50, 65, 20, 80, 95, 65].map((h, i) => (
                        // eslint-disable-next-line react/no-array-index-key -- decorative bars, no reorder
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? C.e500 : C.e200, borderRadius: '4px 4px 0 0' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                        <span key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: C.textMuted }}>{d}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: C.white, borderRadius: 12, padding: 18, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 12 }}>⚠️ Stock bajo — acción requerida</div>
                    {[['Coca Cola 1.5L', '2 ud.'], ['Papas Fritas 100g', '5 ud.'], ['Agua Mineral 500ml', '3 ud.']].map(([name, qty]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.textDark }}>{name}</span>
                        <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{qty}</span>
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
      <section id="para-quien" style={{ background: C.n50, padding: '96px 0' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Para tu tipo de negocio</Tag></R>
            <R delay={80}><h2 style={h2base}>¿Tu negocio está acá?</h2></R>
            <R delay={160}>
              <p style={{ fontSize: 16, color: C.textSoft, marginTop: 14 }}>
                TuCaja funciona para cualquier negocio que venda al público y necesite control real.
              </p>
            </R>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '🏪', title: 'Kiosko', items: ['Cobrás rápido en hora pico sin errores', 'El fiado del barrio, organizado', 'Sabés qué reponer antes de que se acabe'] },
              { icon: '🛒', title: 'Almacén / Despensa', items: ['Stock de cientos de productos bajo control', 'Importás de un Excel en minutos', 'Actualizás precios masivamente en segundos'] },
              { icon: '🏬', title: 'Minimercado', items: ['Múltiples cajeros, mismo sistema', 'Empleados con acceso a su sector', 'Reportes por turno y por cajero'] },
              { icon: '🛍️', title: 'Super de barrio', items: ['Hasta 3 sucursales en plan Pro', 'Stock independiente por local', 'Vista centralizada de todas las sucursales'] },
              { icon: '🏭', title: 'Cadena / Franquicia', items: ['Locales ilimitados en plan Empresa', 'Gestión de proveedores y órdenes de compra', 'Reportes consolidados de toda la red'] },
            ].map((neg, i) => (
              <R key={neg.title} delay={i * 60}>
                <div style={{ background: C.white, borderRadius: 16, padding: '24px 20px', border: `1px solid ${C.border}`, height: '100%', boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
                  <span style={{ fontSize: 32, display: 'block', marginBottom: 14 }}>{neg.icon}</span>
                  <h3 style={{ fontFamily: 'var(--font-lora)', color: C.textDark, fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>{neg.title}</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {neg.items.map(item => (
                      <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.textSoft, lineHeight: 1.5 }}>
                        <span style={{ color: C.e500, flexShrink: 0, fontWeight: 700 }}>→</span>
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
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Lo que dicen quienes ya usan TuCaja</Tag></R>
            <R delay={80}><h2 style={h2base}>Negocios reales, resultados reales</h2></R>
          </div>

          {/* Métricas */}
          <R>
            <div data-metrics-strip>
              {[
                { count: 200, label: 'Negocios activos en Argentina' },
                { count: 50000, label: 'Ventas registradas este mes' },
                { count: 98, label: '% de satisfacción en soporte' },
              ].map(m => (
                <div key={m.label} style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <span data-count={m.count} style={{ fontFamily: 'var(--font-space-mono)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: C.e600, display: 'block', lineHeight: 1 }}>0</span>
                  <div style={{ fontSize: 14, color: C.textSoft, marginTop: 8 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </R>

          {/* Testimonios */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 56 }}>
            {[
              { quote: 'Antes cerraba la caja con calculadora y siempre me faltaba o sobraba algo y no sabía por qué. Ahora en dos minutos sé exactamente qué pasó.', initial: 'R', name: 'Roberto M.', biz: 'Kiosko Don Roberto · Villa del Parque, CABA' },
              { quote: 'El tema del fiado era un caos. Algunos clientes se olvidaban y yo no tenía nada para mostrarles. Ahora la plata que recuperé pagó el primer año del sistema.', initial: 'M', name: 'Marcela P.', biz: 'Almacén La Esquina · Lanús, Buenos Aires' },
              { quote: 'Tengo dos locales y antes me volvía loco tratando de saber cómo iba cada uno. Ahora entro al dashboard y en diez segundos sé cómo está todo.', initial: 'J', name: 'Javier L.', biz: 'Minimercado Javier · Rosario, Santa Fe' },
            ].map((t, i) => (
              <R key={t.name} delay={i * 80}>
                <div style={{ background: C.n50, borderRadius: 16, padding: '28px 24px', height: '100%', border: `1px solid ${C.border}` }}>
                  <div style={{ color: '#f59e0b', fontSize: 13, marginBottom: 12, letterSpacing: 3 }}>★★★★★</div>
                  <p style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic', fontSize: '1rem', color: C.textDark, lineHeight: 1.78, marginBottom: 24 }}>
                    &ldquo;
                    {t.quote}
                    &rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: C.e100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: C.e700, flexShrink: 0 }}>{t.initial}</div>
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
      <section id="precios" style={{ background: C.n50, padding: '96px 0' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Precios</Tag></R>
            <R delay={80}><h2 style={h2base}>Sin letra chica, sin sorpresas</h2></R>
            <R delay={160}><p style={{ fontSize: 16, color: C.textSoft, marginTop: 12 }}>Empezá gratis. Pagá cuando tu negocio crece.</p></R>
          </div>
          <div data-pricing-grid>
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
                  [true, 'Stock con alertas'],
                  [true, 'Fiado / cuenta corriente'],
                  [true, 'Reportes completos'],
                  [false, 'Múltiples locales'],
                ]}
                ctaHref="/sign-up"
                ctaLabel="Probar 14 días gratis"
                ctaVariant="outline"
                note="Sin tarjeta. Cancelás cuando querés."
              />
            </R>
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
                  [true, 'Stock por local'],
                  [true, 'Empleados por local'],
                  [true, 'Vista centralizada'],
                  [true, 'Gestión de proveedores'],
                ]}
                ctaHref="/sign-up"
                ctaLabel="Probar 14 días gratis →"
                ctaVariant="primary"
                recommended
                note="Sin tarjeta. Cancelás cuando querés."
              />
            </R>
            <R delay={240}>
              <PlanCard
                name="Empresa"
                desc="Para franquicias y cadenas"
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
          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: C.textMuted }}>
            Precios en USD. El cobro se hace en pesos argentinos vía Mercado Pago al tipo de cambio vigente.
          </p>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ background: C.white, padding: '96px 0' }}>
        <div style={wrap}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <R><Tag>Preguntas frecuentes</Tag></R>
            <R delay={80}><h2 style={h2base}>Lo que te preguntás antes de empezar</h2></R>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px 48px', maxWidth: 900, margin: '0 auto' }}>
            {[
              ['¿Funciona si se corta internet?', 'Sí. La pantalla de cobro funciona offline. Las ventas se sincronizan cuando volvés a tener conexión. No perdés ninguna venta por un problema de internet.'],
              ['¿Necesito instalar algo?', 'No. TuCaja funciona desde el navegador en tu celular, tablet o computadora. Sin descargas, sin configuraciones técnicas.'],
              ['¿Puedo importar mis productos de Excel?', 'Sí. Exportás tu Excel como CSV, lo subís y en minutos tenés todo tu catálogo cargado. También podés actualizar precios en masa con un porcentaje.'],
              ['¿El sistema maneja el fiado?', 'Sí. Cuando vendés en fiado la deuda se crea automáticamente. Ves el saldo de cada cliente en tiempo real y registrás los pagos en segundos.'],
              ['¿Puedo tener más de un empleado?', 'Sí. Podés agregar empleados y asignarlos a un local. Cada uno solo ve su local. Vos como dueño ves todo.'],
              ['¿Cómo se cobra? ¿Puedo cancelar cuando quiero?', 'Se cobra mensualmente vía Mercado Pago en pesos argentinos. Podés cancelar en cualquier momento sin penalidades. El plan Gratis no requiere tarjeta.'],
            ].map(([q, a], i) => (
              <R key={q} delay={i * 50}>
                <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 24 }}>
                  <div style={{ fontWeight: 700, color: C.textDark, marginBottom: 8, fontSize: 15, lineHeight: 1.4 }}>{q}</div>
                  <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7 }}>{a}</div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ═══════════════════════════════════════════════════════ */}
      <section style={{ background: C.n900, padding: '100px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 110%, rgba(16,185,129,.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <R><Tag dark>Empezá hoy mismo</Tag></R>
          <R delay={80}>
            <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700, lineHeight: 1.18, color: C.white, marginTop: 16, marginBottom: 16 }}>
              Tu negocio merece
              <br />
              más control
              <br />
              <em style={{ fontStyle: 'italic', color: C.e400 }}>y menos caos.</em>
            </h2>
          </R>
          <R delay={160}>
            <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'rgba(255,255,255,.58)', marginBottom: 40, lineHeight: 1.7 }}>
              14 días gratis, sin tarjeta de crédito. Si en dos semanas no sentís la diferencia, no pagás nada.
            </p>
          </R>
          <R delay={240}>
            <div data-cta-btns>
              <Link href="/sign-up" style={{ ...btnPrimaryLg, background: C.e600, boxShadow: '0 4px 24px rgba(16,185,129,.4)' }}>
                Empezar gratis ahora →
              </Link>
              <a
                href="https://wa.me/5491100000000"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...btnOutlineLg, borderColor: 'rgba(255,255,255,.22)', color: 'rgba(255,255,255,.78)' }}
              >
                💬 Hablar por WhatsApp
              </a>
            </div>
          </R>
          <R delay={320}>
            <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,.28)' }}>
              Sin tarjeta · Sin contratos · Cancelás cuando querés
            </p>
          </R>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer style={{ background: C.n950, borderTop: '1px solid rgba(255,255,255,.06)', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,.45)', marginBottom: 20 }}>TuCaja</div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          {[['#funciones', 'Funciones'], ['#precios', 'Precios'], ['#faq', 'Ayuda'], ['mailto:hola@tucaja.ar', 'Contacto']].map(([href, label]) => (
            <a key={href} href={href!} style={{ color: 'rgba(255,255,255,.32)', textDecoration: 'none', fontSize: 13 }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.16)' }}>
          © 2025 TuCaja · Sistema de punto de venta para Argentina
        </div>
      </footer>

      {/* ══ RESPONSIVE STYLES (mobile-first) ════════════════════════════════ */}
      <style>
        {`
        /* ── Mobile (default) ───────────────────────────────────────────── */
        [data-hero-grid]     { display: flex; flex-direction: column; gap: 48px; padding: 36px 0 60px; }
        [data-hero-ctas]     { display: flex; flex-direction: column; gap: 12px; }
        [data-hero-ctas] a   { text-align: center; justify-content: center; }
        [data-trust-signals] { display: flex; flex-direction: column; gap: 6px; margin-top: 20px; }
        [data-ad-grid]       { display: flex; flex-direction: column; }
        [data-benefits-grid] { display: flex; flex-direction: column; gap: 16px; }
        [data-metrics-grid]  { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        [data-db-row]        { display: flex; flex-direction: column; gap: 12px; }
        [data-pricing-grid]  { display: flex; flex-direction: column; gap: 20px; }
        [data-strip]         { display: flex; flex-wrap: wrap; gap: 10px 20px; justify-content: center; }
        [data-cta-btns]      { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        [data-cta-btns] a    { width: 100%; max-width: 320px; }
        [data-metrics-strip] { display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 0; }
        [data-metrics-strip] > div + div { border-top: 1px solid #e2e8f0; }

        /* ── Tablet 600px+ ──────────────────────────────────────────────── */
        @media (min-width: 600px) {
          [data-hero-ctas]     { flex-direction: row; flex-wrap: wrap; }
          [data-hero-ctas] a   { text-align: left; justify-content: flex-start; }
          [data-trust-signals] { flex-direction: row; gap: 16px; }
          [data-pricing-grid]  { display: grid; grid-template-columns: repeat(2, 1fr); }
          [data-cta-btns]      { flex-direction: row; justify-content: center; }
          [data-cta-btns] a    { width: auto; max-width: none; }
        }

        /* ── Tablet 768px+ ──────────────────────────────────────────────── */
        @media (min-width: 768px) {
          [data-metrics-grid]  { grid-template-columns: repeat(4, 1fr); }
          [data-metrics-strip] { flex-direction: row; }
          [data-metrics-strip] > div + div { border-top: none; border-left: 1px solid #e2e8f0; }
          [data-metrics-strip] > div { flex: 1; }
        }

        /* ── Desktop 900px+ ─────────────────────────────────────────────── */
        @media (min-width: 900px) {
          [data-hero-grid]     { display: grid; grid-template-columns: clamp(300px, 50%, 540px) 1fr; gap: 64px; align-items: center; padding: 80px 0 100px; }
          [data-ad-grid]       { display: grid; grid-template-columns: 1fr 1fr; }
          [data-benefits-grid] { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          [data-db-row]        { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }
          [data-pricing-grid]  { grid-template-columns: repeat(4, 1fr); }
        }
      `}
      </style>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: dark ? 'rgba(255,255,255,.09)' : C.e50,
      border: `1px solid ${dark ? 'rgba(255,255,255,.18)' : C.e200}`,
      color: dark ? 'rgba(255,255,255,.72)' : C.e700,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      padding: '5px 14px',
      borderRadius: 100,
      marginBottom: 20,
    }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dark ? C.e400 : C.e500, flexShrink: 0 }} />
      {children}
    </div>
  );
}

function FeatureGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.textMuted, margin: '52px 0 16px', paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {children}
      </div>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  children,
  pills,
  highlight = false,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  pills?: string[];
  highlight?: boolean;
}) {
  return (
    <R>
      <div style={{
        background: highlight ? C.n900 : C.white,
        borderRadius: 16,
        padding: '28px 24px',
        border: `1px solid ${highlight ? C.n800 : C.border}`,
        height: '100%',
      }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 12, background: highlight ? 'rgba(255,255,255,.09)' : C.e50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 18 }}>
          {icon}
        </div>
        <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: '1.05rem', fontWeight: 700, color: highlight ? C.white : C.textDark, marginBottom: 10, lineHeight: 1.35 }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.72, color: highlight ? 'rgba(255,255,255,.68)' : C.textSoft }}>{children}</p>
        {pills && pills.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${highlight ? 'rgba(255,255,255,.1)' : C.border}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {pills.map(p => (
              <span key={p} style={{ background: highlight ? 'rgba(255,255,255,.09)' : C.e50, color: highlight ? 'rgba(255,255,255,.78)' : C.e700, border: `1px solid ${highlight ? 'rgba(255,255,255,.14)' : C.e200}`, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </R>
  );
}

function PlanCard({
  name,
  desc,
  price,
  period,
  features,
  ctaHref,
  ctaLabel,
  ctaVariant,
  recommended = false,
  note,
}: {
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
      padding: '32px 24px',
      border: `2px solid ${recommended ? C.e500 : C.border}`,
      boxShadow: recommended ? '0 12px 40px rgba(5,150,105,.15)' : 'none',
      position: 'relative',
    }}
    >
      {recommended && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: C.e600, color: C.white, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '5px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
          ⭐ El más elegido
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-lora)', fontSize: '1.35rem', fontWeight: 700, color: C.textDark, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 22 }}>{desc}</div>
      <div style={{ marginBottom: 22 }}>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '2rem', fontWeight: 700, color: C.textDark }}>{price}</span>
        <span style={{ fontSize: 13, color: C.textSoft, marginLeft: 4 }}>{period}</span>
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
        {features.map(([active, label]) => (
          <li key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: active ? C.textMid : C.textMuted, lineHeight: 1.45 }}>
            <span style={{ color: active ? C.e500 : '#d1d5db', flexShrink: 0, fontWeight: 700 }}>{active ? '✓' : '—'}</span>
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
          borderRadius: 9,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          background: ctaVariant === 'primary' ? C.e600 : 'transparent',
          color: ctaVariant === 'primary' ? C.white : C.e700,
          border: ctaVariant === 'outline' ? `1.5px solid ${C.e500}` : 'none',
          boxShadow: ctaVariant === 'primary' ? '0 4px 16px rgba(5,150,105,.28)' : 'none',
        }}
      >
        {ctaLabel}
      </Link>
      {note && <p style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 10 }}>{note}</p>}
    </div>
  );
}

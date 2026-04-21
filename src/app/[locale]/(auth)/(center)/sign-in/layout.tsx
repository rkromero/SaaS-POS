export default function SignInSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* ── Left panel: POS mockup ─────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-nimbo-dark lg:flex lg:w-1/2">
        {/* Glow gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0052ff]/25 via-[#0a0b0d]/80 to-[#0a0b0d]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,82,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,82,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radial blue accent */}
        <div className="absolute -left-24 top-1/3 size-96 rounded-full bg-[#0052ff]/20 blur-3xl" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          {/* Brand name */}
          <div className="text-2xl font-bold tracking-tight text-white">
            <span className="text-nimbo-blue">N</span>
            imbo
          </div>

          {/* ── POS screen mockup ── */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[22rem]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
                {/* Titlebar */}
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/80">
                    Nimbo POS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400">En línea</span>
                  </div>
                </div>

                {/* Product grid */}
                <div className="mb-5 grid grid-cols-3 gap-2.5">
                  {[
                    { emoji: '☕', name: 'Café', price: 350 },
                    { emoji: '💧', name: 'Agua', price: 200 },
                    { emoji: '🥤', name: 'Jugo', price: 450 },
                    { emoji: '🍫', name: 'Snack', price: 180 },
                    { emoji: '🥐', name: 'Medialuna', price: 220 },
                    { emoji: '🍞', name: 'Pan', price: 150 },
                  ].map(item => (
                    <div
                      key={item.name}
                      className="cursor-pointer rounded-xl bg-white/10 p-3 text-center transition-colors hover:bg-[#0052ff]/30"
                    >
                      <div className="mb-1 text-xl">{item.emoji}</div>
                      <div className="text-xs font-medium text-white">
                        {item.name}
                      </div>
                      <div className="text-xs text-nimbo-blue-hover">
                        $
                        {item.price}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart summary */}
                <div className="rounded-xl bg-[#0052ff]/20 p-4">
                  <div className="mb-1.5 flex justify-between text-sm text-white/60">
                    <span>3 productos</span>
                    <span>Total</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">
                      Café · Agua · Snack
                    </span>
                    <span className="text-xl font-bold text-white">$730</span>
                  </div>
                  <div className="mt-3 rounded-lg bg-nimbo-blue py-2 text-center text-sm font-semibold text-white">
                    Cobrar
                  </div>
                </div>
              </div>

              {/* KPI row */}
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-nimbo-blue-hover">
                    $48.2K
                  </div>
                  <div className="text-xs text-white/40">Hoy</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">+12%</div>
                  <div className="text-xs text-white/40">vs ayer</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">87</div>
                  <div className="text-xs text-white/40">Ventas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div>
            <p className="text-sm leading-relaxed text-white/50">
              &ldquo;Nimbo transformó la forma en que gestiono mi negocio. Más
              ventas, menos errores.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#0052ff]/30 text-sm font-bold text-nimbo-blue-hover">
                M
              </div>
              <div>
                <div className="text-xs font-medium text-white">
                  María González
                </div>
                <div className="text-xs text-white/40">
                  Propietaria · Cafetería Central
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: Clerk form ────────────────────────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center bg-white lg:w-1/2">
        {/* Nimbo logo top */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-1 flex items-center gap-2">
            {/* Nimbo "N" logomark */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" rx="20" fill="#0052ff" />
              <path
                d="M22 78V22L50 64V22H78V78L50 36V78H22Z"
                fill="white"
              />
            </svg>
            <span className="text-[1.6rem] font-bold tracking-tight text-nimbo-dark">
              nimbo
            </span>
          </div>
          <p className="text-sm text-nimbo-muted">Tu punto de venta inteligente</p>
        </div>

        {/* Clerk sign-in widget */}
        {children}

        {/* Nimbo watermark — centered background, above Clerk branding */}
        <div className="pointer-events-none absolute bottom-12 left-1/2 flex -translate-x-1/2 select-none flex-col items-center opacity-[0.07]">
          <svg
            width="72"
            height="72"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="100" height="100" rx="20" fill="#0052ff" />
            <path
              d="M22 78V22L50 64V22H78V78L50 36V78H22Z"
              fill="white"
            />
          </svg>
          <span className="mt-1 text-3xl font-bold tracking-tight text-nimbo-blue">
            nimbo
          </span>
        </div>
      </div>
    </div>
  );
}

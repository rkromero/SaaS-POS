'use client';

import { useOrganization, UserButton } from '@clerk/nextjs';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  HandCoins,
  LayoutDashboard,
  Menu,
  MinusCircle,
  Package,
  Palette,
  PieChart,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { useBranding } from '@/features/branding/BrandingContext';
import { OnboardingChecklist } from '@/features/onboarding/OnboardingChecklist';
import { Logo } from '@/templates/Logo';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Used by the onboarding tour to highlight specific nav links */
  tourId?: string;
  /** Only shown if this module is in enabledModules */
  moduleRequired?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  adminOnly?: boolean;
};

const iconClass = 'size-4 shrink-0';

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: <LayoutDashboard className={iconClass} /> },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/dashboard/pos', label: 'Caja POS', icon: <ShoppingCart className={iconClass} />, tourId: 'nav-pos' },
      { href: '/dashboard/caja', label: 'Apertura / Cierre', icon: <Wallet className={iconClass} /> },
      { href: '/dashboard/fiado', label: 'Fiado', icon: <HandCoins className={iconClass} /> },
      { href: '/dashboard/sales', label: 'Ventas', icon: <BarChart3 className={iconClass} /> },
      { href: '/dashboard/expenses', label: 'Gastos', icon: <MinusCircle className={iconClass} /> },
      { href: '/dashboard/mp-control', label: 'Control MP', icon: <CreditCard className={iconClass} />, moduleRequired: 'mp_control' },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { href: '/dashboard/reports', label: 'Reportes', icon: <PieChart className={iconClass} /> },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { href: '/dashboard/products', label: 'Productos', icon: <Package className={iconClass} />, tourId: 'nav-products' },
      { href: '/dashboard/stock', label: 'Stock', icon: <AlertTriangle className={iconClass} />, tourId: 'nav-stock' },
      { href: '/dashboard/suppliers', label: 'Proveedores', icon: <Truck className={iconClass} /> },
    ],
  },
  {
    label: 'Administración',
    adminOnly: true,
    items: [
      { href: '/dashboard/locations', label: 'Locales', icon: <Store className={iconClass} />, tourId: 'nav-locations' },
      { href: '/dashboard/members', label: 'Miembros', icon: <Users className={iconClass} /> },
      { href: '/dashboard/billing', label: 'Planes', icon: <CreditCard className={iconClass} /> },
      { href: '/dashboard/arca', label: 'Facturación ARCA', icon: <FileText className={iconClass} /> },
      { href: '/dashboard/branding', label: 'Personalización', icon: <Palette className={iconClass} /> },
      { href: '/dashboard/organization-profile', label: 'Configuración', icon: <Building2 className={iconClass} /> },
    ],
  },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();

  // Active: exact match for /dashboard, prefix match for others
  const isActive = item.href === '/dashboard'
    ? pathname === '/dashboard' || pathname.endsWith('/dashboard')
    : pathname.includes(item.href.replace('/dashboard/', ''));

  return (
    <Link
      id={item.tourId}
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-primary font-medium text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

function SidebarContent({ onLinkClick, enabledModules }: { onLinkClick?: () => void; enabledModules: string[] }) {
  const { membership, organization } = useOrganization();
  const branding = useBranding();
  const isAdmin = membership?.role === 'org:admin';

  const visibleGroups = navGroups
    .filter(g => !g.adminOnly || isAdmin)
    .map(g => ({
      ...g,
      items: g.items.filter(item => !item.moduleRequired || enabledModules.includes(item.moduleRequired)),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      {/* Logo + org name */}
      <div className="border-b px-4 py-3">
        <Link href="/dashboard" className="mb-3 block">
          <Logo logoUrl={branding?.logoUrl} businessName={branding?.businessName} />
        </Link>
        {organization && (
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            {organization.imageUrl
              ? (
                  <img src={organization.imageUrl} alt="" className="size-5 rounded-full object-cover" />
                )
              : (
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {organization.name.charAt(0).toUpperCase()}
                  </div>
                )}
            <span className="truncate text-sm font-medium">{organization.name}</span>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {visibleGroups.map(group => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink key={item.href} item={item} onClick={onLinkClick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Onboarding checklist — visible until tour is completed */}
      <OnboardingChecklist />

      {/* Bottom: user + locale */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center justify-between">
          <UserButton
            userProfileMode="navigation"
            userProfileUrl="/dashboard/user-profile"
            appearance={{
              elements: { rootBox: 'py-1' },
            }}
          />
          <LocaleSwitcher />
        </div>
      </div>
    </div>
  );
}

const EMPTY_MODULES: string[] = [];

export const DashboardSidebar = ({ enabledModules = EMPTY_MODULES }: { enabledModules?: string[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r bg-background lg:flex lg:flex-col">
        <SidebarContent enabledModules={enabledModules} />
      </aside>

      {/* Mobile: top bar with hamburger */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-3 lg:hidden">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <button
          type="button"
          aria-label="Abrir menú"
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile: overlay sidebar */}
      {open && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background lg:hidden">
            <div className="absolute right-3 top-3">
              <button
                type="button"
                aria-label="Cerrar menú"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarContent enabledModules={enabledModules} onLinkClick={() => setOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
};

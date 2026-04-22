'use client';

import { useOrganization, UserButton } from '@clerk/nextjs';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  Menu,
  MinusCircle,
  Moon,
  Package,
  PieChart,
  Settings,
  ShoppingCart,
  Star,
  Sun,
  Tag,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

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
      { href: '/dashboard/loyalty', label: 'Fidelización', icon: <Star className={iconClass} />, moduleRequired: 'loyalty' },
      { href: '/dashboard/promotions', label: 'Promociones', icon: <Tag className={iconClass} />, moduleRequired: 'promotions' },
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
      { href: '/dashboard/expiration', label: 'Vencimientos', icon: <CalendarClock className={iconClass} />, moduleRequired: 'stock_expiration' },
      { href: '/dashboard/suppliers', label: 'Proveedores', icon: <Truck className={iconClass} /> },
    ],
  },
  {
    label: 'Administración',
    adminOnly: true,
    items: [
      { href: '/dashboard/settings', label: 'Configuración', icon: <Settings className={iconClass} /> },
    ],
  },
];

function NavLink({
  item,
  onClick,
  collapsed,
}: {
  item: NavItem;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  const isActive
    = item.href === '/dashboard'
      ? pathname === '/dashboard' || pathname.endsWith('/dashboard')
      : pathname.includes(item.href.replace('/dashboard/', ''));

  return (
    <Link
      id={item.tourId}
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`flex items-center rounded-md py-2 text-sm transition-colors ${
        collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
      } ${
        isActive
          ? 'bg-nimbo-blue font-medium text-white'
          : 'text-n400 hover:bg-n800 hover:text-n100'
      }`}
    >
      {item.icon}
      {!collapsed && item.label}
    </Link>
  );
}

function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="text-n400 hover:bg-n800 hover:text-n100 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
    >
      {isDark
        ? <Sun className="size-4 shrink-0" />
        : <Moon className="size-4 shrink-0" />}
      {!collapsed && (
        <span className="text-sm">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
      )}
    </button>
  );
}

function SidebarContent({
  onLinkClick,
  enabledModules,
  collapsed,
}: {
  onLinkClick?: () => void;
  enabledModules: string[];
  collapsed?: boolean;
}) {
  const { membership, organization } = useOrganization();
  const branding = useBranding();
  const isAdmin = membership?.role === 'org:admin';

  const visibleGroups = navGroups
    .filter(g => !g.adminOnly || isAdmin)
    .map(g => ({
      ...g,
      items: g.items.filter(
        item => !item.moduleRequired || enabledModules.includes(item.moduleRequired),
      ),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="sidebar-dark text-n100 flex h-full flex-col overflow-hidden">
      {/* Logo + org name */}
      <div className={`border-n800 border-b py-3 ${collapsed ? 'px-2' : 'px-4'}`}>
        {collapsed
          ? (
              <Link href="/dashboard" className="flex justify-center">
                <div className="bg-e600 flex size-8 items-center justify-center rounded-md text-sm font-bold text-white">
                  {(branding?.businessName ?? organization?.name ?? 'A').charAt(0).toUpperCase()}
                </div>
              </Link>
            )
          : (
              <>
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
                          <div className="bg-e600 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                            {organization.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                    <span className="text-n100 truncate text-sm font-medium">{organization.name}</span>
                  </div>
                )}
              </>
            )}
      </div>

      {/* Nav groups */}
      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-1' : 'px-3'}`}>
        <div className="space-y-5">
          {visibleGroups.map(group => (
            <div key={group.label}>
              {collapsed
                ? (
                    /* Divider between groups when collapsed */
                    <div className="bg-n800 mb-1.5 h-px" />
                  )
                : (
                    <p className="text-n600 mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider">
                      {group.label}
                    </p>
                  )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink key={item.href} item={item} onClick={onLinkClick} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Onboarding checklist — hidden when collapsed */}
      {!collapsed && <OnboardingChecklist />}

      {/* Bottom: user + locale + theme toggle */}
      <div className={`border-n800 border-t py-3 ${collapsed ? 'px-2' : 'px-4'}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          <UserButton
            userProfileMode="navigation"
            userProfileUrl="/dashboard/user-profile"
            appearance={{
              elements: { rootBox: 'py-1' },
            }}
          />
          {!collapsed
            ? (
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <LocaleSwitcher />
                </div>
              )
            : <ThemeToggle collapsed />}
        </div>
      </div>
    </div>
  );
}

const EMPTY_MODULES: string[] = [];

export const DashboardSidebar = ({ enabledModules = EMPTY_MODULES }: { enabledModules?: string[] }) => {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed') === 'true';
    setCollapsed(saved);
  }, []);

  // Keep CSS class on <html> in sync so .sidebar-collapsed .sidebar-main rule applies
  useEffect(() => {
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <>
      {/* Desktop sidebar — always visible, width transitions on collapse */}
      <aside
        className={`border-n800 bg-n900 fixed inset-y-0 left-0 z-30 hidden border-r transition-[width] duration-300 lg:flex lg:flex-col ${
          collapsed ? 'w-14' : 'w-56'
        }`}
      >
        <SidebarContent enabledModules={enabledModules} collapsed={collapsed} />

        {/* Pestaña de colapso — forma de fichero, anclada arriba a la altura del primer grupo */}
        <button
          type="button"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          onClick={() => setCollapsed(c => !c)}
          className="border-n800 bg-n900 text-n500 hover:bg-n800 hover:text-n200 absolute left-full top-24 z-10 flex h-12 w-4 items-center justify-center rounded-r-md border border-l-0 shadow-sm transition-colors"
        >
          {collapsed
            ? <ChevronRight className="size-3" />
            : <ChevronLeft className="size-3" />}
        </button>
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
          <aside className="border-n800 bg-n900 fixed inset-y-0 left-0 z-50 w-64 border-r lg:hidden">
            <div className="absolute right-3 top-3">
              <button
                type="button"
                aria-label="Cerrar menú"
                className="text-n400 hover:bg-n800 rounded-md p-1.5"
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

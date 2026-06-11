import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  FileText,
  BookOpen,
  LogOut,
  ChevronDown,
  Calculator,
  ShoppingCart,
  Receipt,
  Landmark,
  UserCog,
  Package,
  List,
  Settings,
  ScrollText,
  Wallet,
  Tractor,
  BarChart3,
  Sun,
  Moon,
  ChevronsUpDown,
  Check,
  Menu,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo, LogoMark } from './Logo';
import { useMe } from '@/hooks/useAuth';
import { useTheme } from './ThemeProvider';
import { useEmpresaContext } from './EmpresaProvider';
import { cn } from '@/lib/utils';

const navGroups: { label: string | null; items: { to: string; label: string; icon: React.ElementType; end?: boolean }[] }[] = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/empresas', label: 'Empresas', icon: Building2 },
      { to: '/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { to: '/documentos', label: 'Ventas', icon: FileText },
      { to: '/compras', label: 'Compras', icon: ShoppingCart },
      { to: '/honorarios', label: 'Honorarios', icon: Receipt },
      { to: '/banco', label: 'Banco', icon: Landmark },
    ],
  },
  {
    label: 'Remuneraciones',
    items: [
      { to: '/rrhh', label: 'RRHH', icon: UserCog },
    ],
  },
  {
    label: 'Impuestos y DDJJ',
    items: [
      { to: '/f29', label: 'F29 IVA', icon: Calculator },
      { to: '/f22', label: 'F22 Renta', icon: ScrollText },
      { to: '/dj1887', label: 'DJ 1887', icon: ScrollText },
      { to: '/dj1879', label: 'DJ 1879', icon: ScrollText },
      { to: '/renta-presunta', label: 'Renta Presunta', icon: Tractor },
    ],
  },
  {
    label: 'Contabilidad',
    items: [
      { to: '/plan-cuentas', label: 'Plan Cuentas', icon: List },
      { to: '/contabilidad', label: 'Contabilidad', icon: BookOpen },
      { to: '/propyme', label: 'ProPyme D3', icon: BarChart3 },
      { to: '/retiros', label: 'Retiros', icon: Wallet },
      { to: '/activos', label: 'Activos Fijos', icon: Package },
    ],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data } = useMe();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { empresa, empresas, setEmpresaId } = useEmpresaContext();
  const usuario = data?.data;
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  function handleLogout() {
    localStorage.removeItem('auth_token');
    navigate('/');
  }

  // Panel de admin: solo visible para ADMIN
  const navGroupsVisible: typeof navGroups = usuario?.rol === 'ADMIN'
    ? [...navGroups, { label: 'Administración del sistema', items: [{ to: '/admin/usuarios', label: 'Usuarios', icon: ShieldCheck }] }]
    : navGroups;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Backdrop (mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — drawer en mobile, fijo en desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-56 lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
        style={{
          background: 'hsl(var(--sidebar-bg))',
          borderRight: '1px solid hsl(var(--sidebar-border))',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 shrink-0" style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
          <Logo className="flex-1" />
          {/* Cerrar (mobile) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Empresa switcher */}
        {empresas.length > 0 && (
          <div className="px-2 py-2 shrink-0" style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors text-left">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10">
                    <Building2 className="h-3 w-3 text-primary" />
                  </div>
                  <span className="flex-1 truncate text-xs font-semibold">{empresa?.razonSocial ?? '—'}</span>
                  <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Mis empresas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {empresas.map((e) => (
                  <DropdownMenuItem
                    key={e.id}
                    onClick={() => setEmpresaId(e.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Check className={cn('h-3.5 w-3.5 text-primary shrink-0', e.id === empresa?.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{e.razonSocial}</p>
                      <p className="text-xs text-muted-foreground">{e.rut}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {navGroupsVisible.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end ?? false}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100 select-none',
                        isActive
                          ? 'bg-primary/10 text-primary dark:bg-primary/15'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Indicador de activo */}
                        <span className={cn('absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity', isActive ? 'opacity-100' : 'opacity-0')} />
                        <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-primary' : '')} />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-2 pb-3 space-y-1" style={{ borderTop: '1px solid hsl(var(--sidebar-border))', paddingTop: '8px' }}>
          {/* Settings + Theme toggle */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/configuracion"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100',
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/15'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Settings className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : '')} />
                  Configuración
                </>
              )}
            </NavLink>
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* User */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate leading-none">{usuario?.nombre ?? 'Usuario'}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{usuario?.email ?? ''}</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="font-semibold text-sm">{usuario?.nombre}</p>
                <p className="text-xs text-muted-foreground">{usuario?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 h-14 px-4 shrink-0 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60" style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <LogoMark className="h-7 w-7 shrink-0 rounded-lg" />
          <span className="text-sm font-semibold truncate">{empresa?.razonSocial ?? 'ContaCLWEB'}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

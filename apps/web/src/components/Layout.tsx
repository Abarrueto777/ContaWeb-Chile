import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
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
import { Separator } from '@/components/ui/separator';
import { useMe } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems: { to: string; label: string; icon: React.ElementType; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/empresas', label: 'Empresas', icon: Building2 },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/documentos', label: 'Ventas', icon: FileText },
  { to: '/compras', label: 'Compras', icon: ShoppingCart },
  { to: '/honorarios', label: 'Honorarios', icon: Receipt },
  { to: '/f29', label: 'F29 IVA', icon: Calculator },
  { to: '/banco', label: 'Banco', icon: Landmark },
  { to: '/rrhh', label: 'RRHH', icon: UserCog },
  { to: '/activos', label: 'Activos Fijos', icon: Package },
  { to: '/plan-cuentas', label: 'Plan Cuentas', icon: List },
  { to: '/contabilidad', label: 'Contabilidad', icon: BookOpen },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data } = useMe();
  const navigate = useNavigate();
  const usuario = data?.data;

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  function handleLogout() {
    localStorage.removeItem('auth_token');
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col border-r bg-card">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Calculator className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">ContaWeb</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Chile</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end ?? false}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* User */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate leading-none">{usuario?.nombre ?? 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{usuario?.email ?? ''}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="font-medium">{usuario?.nombre}</p>
                <p className="text-xs text-muted-foreground">{usuario?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

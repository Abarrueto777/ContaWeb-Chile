import { Building2, FileText, TrendingUp, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useMe } from '@/hooks/useAuth';
import { useEmpresaContext } from '@/components/EmpresaProvider';

export default function Dashboard() {
  const { data: empresasData, isLoading } = useEmpresas();
  const { data: meData } = useMe();
  const { setEmpresaId } = useEmpresaContext();
  const empresas = empresasData?.data ?? [];
  const usuario = meData?.data;

  const currentMonth = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido, {usuario?.nombre?.split(' ')[0] ?? 'contador'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">{currentMonth}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{isLoading ? '—' : empresas.length}</p>
            <p className="text-xs text-muted-foreground mt-1">empresas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documentos del Mes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">facturas y boletas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monto Facturado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">este mes (neto)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asientos Pendientes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">en borrador</p>
          </CardContent>
        </Card>
      </div>

      {/* Empresas recientes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Mis Empresas</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/empresas">
              Ver todas <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : empresas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="font-medium text-sm">Aún no tenés empresas</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Creá tu primera empresa para empezar a trabajar
              </p>
              <Button size="sm" asChild>
                <Link to="/empresas">Crear empresa</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {empresas.slice(0, 4).map((e) => (
              <Card key={e.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{e.razonSocial}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.rut}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.giro}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0 text-xs">Activa</Badge>
                  </div>
                  <div className="flex gap-3 mt-4 pt-3 border-t">
                    <Link
                      to="/clientes"
                      onClick={() => setEmpresaId(e.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      Clientes
                    </Link>
                    <Link
                      to="/documentos"
                      onClick={() => setEmpresaId(e.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      Documentos
                    </Link>
                    <Link
                      to="/contabilidad"
                      onClick={() => setEmpresaId(e.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      Contabilidad
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

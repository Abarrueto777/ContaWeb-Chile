import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import Layout from '@/components/Layout';
import { EmpresaProvider } from '@/components/EmpresaProvider';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Empresas from '@/pages/Empresas';
import Compras from '@/pages/Compras';
import F29 from '@/pages/F29';
import Clientes from '@/pages/Clientes';
import Ventas from '@/pages/Ventas';
import Honorarios from '@/pages/Honorarios';
import Banco from '@/pages/Banco';
import RRHH from '@/pages/RRHH';
import DJ1887 from '@/pages/DJ1887';
import DJ1879 from '@/pages/DJ1879';
import Retiros from '@/pages/Retiros';
import F22 from '@/pages/F22';
import RentaPresunta from '@/pages/RentaPresunta';
import ProPyme from '@/pages/ProPyme';
import Activos from '@/pages/Activos';
import PlanCuentas from '@/pages/PlanCuentas';
import Contabilidad from '@/pages/Contabilidad';
import LibrosIVA from '@/pages/LibrosIVA';
import Configuracion from '@/pages/Configuracion';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EmpresaProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas"
            element={<ProtectedRoute><Empresas /></ProtectedRoute>}
          />
          <Route
            path="/compras"
            element={<ProtectedRoute><Compras /></ProtectedRoute>}
          />
          <Route
            path="/f29"
            element={<ProtectedRoute><F29 /></ProtectedRoute>}
          />
          <Route
            path="/clientes"
            element={<ProtectedRoute><Clientes /></ProtectedRoute>}
          />
          <Route
            path="/documentos"
            element={<ProtectedRoute><Ventas /></ProtectedRoute>}
          />
          <Route
            path="/honorarios"
            element={<ProtectedRoute><Honorarios /></ProtectedRoute>}
          />
          <Route
            path="/banco"
            element={<ProtectedRoute><Banco /></ProtectedRoute>}
          />
          <Route
            path="/rrhh"
            element={<ProtectedRoute><RRHH /></ProtectedRoute>}
          />
          <Route
            path="/dj1887"
            element={<ProtectedRoute><DJ1887 /></ProtectedRoute>}
          />
          <Route
            path="/dj1879"
            element={<ProtectedRoute><DJ1879 /></ProtectedRoute>}
          />
          <Route
            path="/retiros"
            element={<ProtectedRoute><Retiros /></ProtectedRoute>}
          />
          <Route
            path="/f22"
            element={<ProtectedRoute><F22 /></ProtectedRoute>}
          />
          <Route
            path="/renta-presunta"
            element={<ProtectedRoute><RentaPresunta /></ProtectedRoute>}
          />
          <Route
            path="/propyme"
            element={<ProtectedRoute><ProPyme /></ProtectedRoute>}
          />
          <Route
            path="/activos"
            element={<ProtectedRoute><Activos /></ProtectedRoute>}
          />
          <Route
            path="/plan-cuentas"
            element={<ProtectedRoute><PlanCuentas /></ProtectedRoute>}
          />
          <Route
            path="/contabilidad"
            element={<ProtectedRoute><Contabilidad /></ProtectedRoute>}
          />
          <Route
            path="/libros-iva"
            element={<ProtectedRoute><LibrosIVA /></ProtectedRoute>}
          />
          <Route
            path="/configuracion"
            element={<ProtectedRoute><Configuracion /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </EmpresaProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

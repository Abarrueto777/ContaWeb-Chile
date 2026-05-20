import { Link } from 'react-router-dom';
import { useEmpresas } from '@/hooks/useEmpresas';

export default function Dashboard() {
  const { data, isLoading } = useEmpresas();
  const empresas = data?.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg text-gray-900">ContaWeb Chile</span>
        <button
          onClick={() => {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Cerrar sesión
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Mis Empresas</h2>
          <Link
            to="/empresas"
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Gestionar empresas
          </Link>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Cargando…</p>
        ) : empresas.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <p className="text-gray-500 mb-4">Aún no tenés empresas registradas.</p>
            <Link
              to="/empresas"
              className="text-primary-600 hover:underline text-sm font-medium"
            >
              Crear primera empresa
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {empresas.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border p-5">
                <p className="font-semibold text-gray-900">{e.razonSocial}</p>
                <p className="text-sm text-gray-500 mt-1">{e.rut}</p>
                <p className="text-sm text-gray-400">{e.giro}</p>
                <div className="flex gap-3 mt-4">
                  <Link
                    to={`/empresas/${e.id}/clientes`}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Clientes
                  </Link>
                  <Link
                    to={`/empresas/${e.id}/documentos`}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Documentos
                  </Link>
                  <Link
                    to={`/empresas/${e.id}/contabilidad`}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Contabilidad
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

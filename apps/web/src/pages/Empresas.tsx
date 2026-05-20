import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { empresaSchema, type EmpresaInput } from '@contaweb/validations';
import { useEmpresas, useCreateEmpresa } from '@/hooks/useEmpresas';

export default function Empresas() {
  const [mostrarForm, setMostrarForm] = useState(false);
  const { data, isLoading } = useEmpresas();
  const { mutate, isPending, error } = useCreateEmpresa();
  const empresas = data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmpresaInput>({ resolver: zodResolver(empresaSchema) });

  function onSubmit(d: EmpresaInput) {
    mutate(d, {
      onSuccess: () => {
        reset();
        setMostrarForm(false);
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Dashboard
        </Link>
        <span className="font-bold text-lg text-gray-900">Empresas</span>
      </nav>

      <main className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Mis Empresas</h2>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {mostrarForm ? 'Cancelar' : 'Nueva empresa'}
          </button>
        </div>

        {mostrarForm && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Nueva empresa</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                  <input
                    {...register('rut')}
                    placeholder="76.123.456-7"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.rut && <p className="text-red-500 text-xs mt-1">{errors.rut.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                  <input
                    {...register('razonSocial')}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {errors.razonSocial && <p className="text-red-500 text-xs mt-1">{errors.razonSocial.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giro</label>
                <input
                  {...register('giro')}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.giro && <p className="text-red-500 text-xs mt-1">{errors.giro.message}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                  <input
                    {...register('telefono')}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error.message}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50 text-sm"
              >
                {isPending ? 'Creando…' : 'Crear empresa'}
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <p className="text-gray-500">Cargando…</p>
        ) : (
          <div className="space-y-3">
            {empresas.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{e.razonSocial}</p>
                  <p className="text-sm text-gray-500">{e.rut} — {e.giro}</p>
                </div>
                <Link
                  to={`/empresas/${e.id}/clientes`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Ver →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

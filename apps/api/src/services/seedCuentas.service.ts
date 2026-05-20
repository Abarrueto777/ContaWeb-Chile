import { PrismaClient, TipoCuenta, NaturalezaCuenta } from '@prisma/client';

type CuentaDef = {
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  nivel: number;
  codigoPadre?: string;
  permiteMovimientos?: boolean;
};

const PLAN_DE_CUENTAS: CuentaDef[] = [
  // Clase 1 - Activos
  { codigo: '1', nombre: 'Activos', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 1, permiteMovimientos: false },
  { codigo: '1.1', nombre: 'Activos Corrientes', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '1', permiteMovimientos: false },
  { codigo: '1.1.01', nombre: 'Caja', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.1' },
  { codigo: '1.1.02', nombre: 'Banco Cuenta Corriente', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.1' },
  { codigo: '1.1.03', nombre: 'Clientes / Deudores', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.1' },
  { codigo: '1.1.04', nombre: 'Documentos por Cobrar', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.1' },
  { codigo: '1.1.05', nombre: 'IVA Crédito Fiscal', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.1' },
  { codigo: '1.1.06', nombre: 'Existencias (Inventario)', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.1' },
  { codigo: '1.1.07', nombre: 'Gastos Pagados por Anticipado', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.1' },
  { codigo: '1.1.08', nombre: 'Impuestos por Recuperar', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.1' },
  { codigo: '1.2', nombre: 'Activos No Corrientes', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '1', permiteMovimientos: false },
  { codigo: '1.2.01', nombre: 'Terrenos', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.2' },
  { codigo: '1.2.02', nombre: 'Construcciones e Instalaciones', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.2' },
  { codigo: '1.2.03', nombre: 'Maquinaria y Equipo', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.2' },
  { codigo: '1.2.04', nombre: 'Vehículos', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.2' },
  { codigo: '1.2.05', nombre: 'Muebles y Útiles', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.2' },
  { codigo: '1.2.06', nombre: 'Equipos de Computación', tipo: 'ACTIVO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '1.2' },
  { codigo: '1.2.07', nombre: 'Depreciación Acumulada', tipo: 'ACTIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '1.2' },
  // Clase 2 - Pasivos
  { codigo: '2', nombre: 'Pasivos', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 1, permiteMovimientos: false },
  { codigo: '2.1', nombre: 'Pasivos Corrientes', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '2', permiteMovimientos: false },
  { codigo: '2.1.01', nombre: 'Proveedores', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.1' },
  { codigo: '2.1.02', nombre: 'Documentos por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.1' },
  { codigo: '2.1.03', nombre: 'IVA Débito Fiscal', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.1' },
  { codigo: '2.1.04', nombre: 'Impuestos por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.1' },
  { codigo: '2.1.05', nombre: 'Remuneraciones por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.1' },
  { codigo: '2.1.06', nombre: 'Préstamos Bancarios Corto Plazo', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.1' },
  { codigo: '2.1.07', nombre: 'Retenciones por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.1' },
  { codigo: '2.2', nombre: 'Pasivos No Corrientes', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '2', permiteMovimientos: false },
  { codigo: '2.2.01', nombre: 'Préstamos Bancarios Largo Plazo', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.2' },
  { codigo: '2.2.02', nombre: 'Hipotecas por Pagar', tipo: 'PASIVO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '2.2' },
  // Clase 3 - Patrimonio
  { codigo: '3', nombre: 'Patrimonio', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 1, permiteMovimientos: false },
  { codigo: '3.1', nombre: 'Capital', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '3', permiteMovimientos: false },
  { codigo: '3.1.01', nombre: 'Capital Pagado', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '3.1' },
  { codigo: '3.1.02', nombre: 'Reservas', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '3.1' },
  { codigo: '3.2', nombre: 'Resultados', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '3', permiteMovimientos: false },
  { codigo: '3.2.01', nombre: 'Utilidades Retenidas', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '3.2' },
  { codigo: '3.2.02', nombre: 'Pérdidas Acumuladas', tipo: 'PATRIMONIO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '3.2' },
  { codigo: '3.2.03', nombre: 'Resultado del Ejercicio', tipo: 'PATRIMONIO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '3.2' },
  // Clase 4 - Ingresos
  { codigo: '4', nombre: 'Ingresos', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 1, permiteMovimientos: false },
  { codigo: '4.1', nombre: 'Ingresos Operacionales', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '4', permiteMovimientos: false },
  { codigo: '4.1.01', nombre: 'Ventas de Mercaderías', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '4.1' },
  { codigo: '4.1.02', nombre: 'Ventas de Servicios', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '4.1' },
  { codigo: '4.1.03', nombre: 'Otros Ingresos Operacionales', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '4.1' },
  { codigo: '4.2', nombre: 'Ingresos No Operacionales', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 2, codigoPadre: '4', permiteMovimientos: false },
  { codigo: '4.2.01', nombre: 'Intereses Ganados', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '4.2' },
  { codigo: '4.2.02', nombre: 'Dividendos Percibidos', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '4.2' },
  { codigo: '4.2.03', nombre: 'Ganancias por Diferencia de Cambio', tipo: 'INGRESO', naturaleza: 'ACREEDORA', nivel: 3, codigoPadre: '4.2' },
  // Clase 5 - Gastos
  { codigo: '5', nombre: 'Gastos', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 1, permiteMovimientos: false },
  { codigo: '5.1', nombre: 'Gastos Operacionales', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '5', permiteMovimientos: false },
  { codigo: '5.1.01', nombre: 'Costo de Ventas', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.02', nombre: 'Remuneraciones y Sueldos', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.03', nombre: 'Honorarios Profesionales', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.04', nombre: 'Arriendos Pagados', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.05', nombre: 'Servicios Básicos', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.06', nombre: 'Combustibles y Lubricantes', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.07', nombre: 'Materiales y Suministros', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.08', nombre: 'Publicidad y Marketing', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.09', nombre: 'Seguros', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.10', nombre: 'Depreciación del Ejercicio', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.1.11', nombre: 'Gastos de Representación', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.1' },
  { codigo: '5.2', nombre: 'Gastos No Operacionales', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 2, codigoPadre: '5', permiteMovimientos: false },
  { codigo: '5.2.01', nombre: 'Intereses y Gastos Financieros', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.2' },
  { codigo: '5.2.02', nombre: 'Pérdidas por Diferencia de Cambio', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.2' },
  { codigo: '5.2.03', nombre: 'Castigos y Provisiones', tipo: 'GASTO', naturaleza: 'DEUDORA', nivel: 3, codigoPadre: '5.2' },
];

export async function seedPlanDeCuentas(empresaId: string, db: PrismaClient): Promise<void> {
  const creadas = new Map<string, string>();

  for (const cuenta of PLAN_DE_CUENTAS) {
    const cuentaPadreId = cuenta.codigoPadre ? (creadas.get(cuenta.codigoPadre) ?? null) : null;
    const creada = await db.cuentaContable.upsert({
      where: { empresaId_codigo: { empresaId, codigo: cuenta.codigo } },
      create: {
        empresaId,
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        naturaleza: cuenta.naturaleza,
        nivel: cuenta.nivel,
        cuentaPadreId,
        permiteMovimientos: cuenta.permiteMovimientos ?? true,
      },
      update: { nombre: cuenta.nombre },
    });
    creadas.set(cuenta.codigo, creada.id);
  }
}

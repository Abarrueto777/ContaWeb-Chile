// ⚠️ PRECIOS TENTATIVOS (placeholder) — editá este archivo cuando definas los reales.
// Pensados accesibles: contadores que recién arrancan con pocos clientes.

export type PlanId = 'MENSUAL' | 'SEMESTRAL' | 'ANUAL';

export interface Plan {
  id: PlanId;
  nombre: string;
  meses: number;
  precio: number; // CLP totales del período
  detalle: string;
  ahorro?: string;
  destacado?: boolean;
}

export const PLANES: Plan[] = [
  { id: 'MENSUAL', nombre: 'Mensual', meses: 1, precio: 9990, detalle: 'por mes' },
  { id: 'SEMESTRAL', nombre: 'Semestral', meses: 6, precio: 49990, detalle: 'cada 6 meses', ahorro: 'Ahorrás un 17%' },
  { id: 'ANUAL', nombre: 'Anual', meses: 12, precio: 89990, detalle: 'por año', ahorro: 'Ahorrás un 25%', destacado: true },
];

// ⚠️ DATOS DE EJEMPLO — reemplazar por la cuenta real antes de comercializar.
export const DATOS_TRANSFERENCIA = {
  titular: 'ContaCLWEB SpA',
  rut: '77.765.456-8',
  banco: 'Banco BCI',
  tipoCuenta: 'Cuenta Corriente',
  numero: '12345678',
  email: 'mitienda.aij@gmail.com',
};

export const fmtCLP = (n: number) => `$${n.toLocaleString('es-CL')}`;

export type RolUsuario = 'ADMIN' | 'CONTADOR' | 'VISOR';
export type TipoDocumento = 'BOLETA_ELECTRONICA' | 'FACTURA_ELECTRONICA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
export type EstadoDocumento = 'BORRADOR' | 'EMITIDO' | 'ACEPTADO_SII' | 'RECHAZADO_SII' | 'ANULADO';
export type TipoCuenta = 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO';
export type NaturalezaCuenta = 'DEUDORA' | 'ACREEDORA';
export type EstadoAsiento = 'BORRADOR' | 'CONTABILIZADO';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  createdAt: string;
  updatedAt: string;
}

export interface Empresa {
  id: string;
  rut: string;
  razonSocial: string;
  giro: string;
  actividadEconomica?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  empresaId: string;
  rut: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentoTributario {
  id: string;
  empresaId: string;
  clienteId?: string;
  tipo: TipoDocumento;
  folio: number;
  estado: EstadoDocumento;
  fecha: string;
  neto: string;
  iva: string;
  total: string;
  glosa?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineaDocumento {
  id: string;
  documentoId: string;
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
  descuento: string;
  subtotal: string;
}

export interface CuentaContable {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  nivel: number;
  cuentaPadreId?: string;
  permiteMovimientos: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AsientoContable {
  id: string;
  empresaId: string;
  documentoId?: string;
  numero: number;
  fecha: string;
  glosa: string;
  estado: EstadoAsiento;
  lineas: LineaAsiento[];
  createdAt: string;
  updatedAt: string;
}

export interface LineaAsiento {
  id: string;
  asientoId: string;
  cuentaId: string;
  debe: string;
  haber: string;
  glosa?: string;
}

export interface AuthResponse {
  data: {
    token: string;
    usuario: Usuario;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

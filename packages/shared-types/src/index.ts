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
  representanteLegal?: string;
  rutRepresentante?: string;
  tasaRetencionHon?: number;
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

export type TipoDocCompra = 'FACTURA' | 'NOTA_CREDITO' | 'LIQUIDACION_FACTURA';
export type TipoImpuesto = 'NINGUNO' | 'BEBIDAS_20' | 'BEBIDAS_31' | 'LUJO' | 'CARNE' | 'HARINA' | 'DIESEL';

export interface FacturaRecibida {
  id: string;
  empresaId: string;
  proveedorRut: string;
  proveedorNombre: string;
  tipo: TipoDocCompra;
  folio: number;
  fecha: string;
  neto: string;
  iva: string;
  impAdicional: string;
  retencion: string;
  total: string;
  tipoImpuesto: TipoImpuesto;
  glosa?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Honorario {
  id: string;
  empresaId: string;
  prestadorRut: string;
  prestadorNombre: string;
  folio: number;
  fecha: string;
  monto: string;
  retencion: string;
  retiene: boolean;
  glosa?: string;
  createdAt: string;
  updatedAt: string;
}

export interface F29Result {
  periodo: { anio: number; mes: number };
  ventas: {
    neto: number;
    ivaEmitido: number;
    ivaNCEmitidas: number;
    debitoFiscal: number;
  };
  compras: {
    ivaCompras: number;
    ivaNCRecibidas: number;
    impAdicional: number;
    retencionIVA: number;
    creditoFiscal: number;
  };
  honorarios: {
    cantidad: number;
    montoTotal: number;
    retencionHonorarios: number;
  };
  ppm: { tasa: number; monto: number };
  resultado: {
    ivaNeto: number;
    remanente: number;
    totalAPagar: number;
  };
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export type TipoAFP = 'CAPITAL' | 'CUPRUM' | 'HABITAT' | 'PLANVITAL' | 'PROVIDA' | 'MODELO' | 'UNO';
export type TipoTrabajador = 'DEPENDIENTE' | 'SUELDO_EMPRESARIAL';
export type TipoGratificacion = 'ART_50' | 'ART_50_LIBRE' | 'ART_47' | 'NINGUNA';
export type TipoContrato = 'INDEFINIDO' | 'PLAZO_FIJO' | 'OBRA_FAENA';
export type TipoMovimientoBanco = 'COBRO_CLIENTE' | 'PAGO_PROVEEDOR' | 'PAGO_IVA' | 'PAGO_PPM' | 'PAGO_REMUNERACIONES' | 'PAGO_HONORARIO' | 'TRANSFERENCIA' | 'COMISION_BANCO' | 'INTERES_BANCO' | 'INTERES_GANADO' | 'RETIRO_DUENO' | 'APORTE_CAPITAL' | 'GASTO_GENERAL' | 'OTRO';
export type CategoriaActivo = 'MAQUINARIA' | 'VEHICULO' | 'MUEBLES' | 'EQUIPOS_COMPUTACION' | 'CONSTRUCCION' | 'TERRENO' | 'OTRO';

export interface CuentaBancaria {
  id: string;
  empresaId: string;
  banco: string;
  tipoCuenta: string;
  numero: string;
  saldoInicial: string;
  moneda: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovimientoBanco {
  id: string;
  empresaId: string;
  cuentaId: string;
  fecha: string;
  descripcion: string;
  cargo: string;
  abono: string;
  saldo: string;
  tipo: TipoMovimientoBanco;
  conciliado: boolean;
  glosa?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trabajador {
  id: string;
  empresaId: string;
  rut: string;
  nombre: string;
  cargo?: string;
  email?: string;
  tipo: TipoTrabajador;
  sueldoBase: string;
  afp: TipoAFP;
  salud: string;
  pctSalud: string;
  montoIsapre?: string;
  tieneCes: boolean;
  tipoGratificacion: TipoGratificacion;
  tieneMovilizacion: boolean;
  tieneColacion: boolean;
  montoMovilizacion?: string;
  montoColacion?: string;
  jornadaHoras: number;
  tipoContrato: TipoContrato;
  fechaIngreso: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Liquidacion {
  id: string;
  empresaId: string;
  trabajadorId: string;
  anio: number;
  mes: number;
  sueldoBase: string;
  horasExtra: string;
  bono: string;
  diasTrabajados: number;
  imponible: string;
  cotizAfp: string;
  cotizSis: string;
  cotizSalud: string;
  cotizCes: string;
  impuestoUnico: string;
  gratificacion: string;
  movilizacion: string;
  colacion: string;
  anticipo: string;
  liquido: string;
  costoEmpleador: string;
  pagada: boolean;
  trabajador?: Trabajador;
  createdAt: string;
  updatedAt: string;
}

export interface ActivoFijo {
  id: string;
  empresaId: string;
  nombre: string;
  categoria: CategoriaActivo;
  fechaCompra: string;
  costoCompra: string;
  vidaUtilAnios: number;
  valorResidual: string;
  depreciacionMes: string;
  acumDepreciacion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValorUFUTM {
  id: string;
  anio: number;
  mes: number;
  uf: string;
  utm: string;
  imm: string;
}

export interface LibroDiarioEntry {
  fecha: string;
  numero: number;
  glosa: string;
  cuentaCodigo: string;
  cuentaNombre: string;
  debe: number;
  haber: number;
}

export interface LibroMayorEntry {
  cuentaCodigo: string;
  cuentaNombre: string;
  movimientos: { fecha: string; glosa: string; debe: number; haber: number; saldo: number }[];
  totalDebe: number;
  totalHaber: number;
  saldoFinal: number;
}

export interface BalanceEntry {
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  saldo: number;
  nivel: number;
}

export interface ResultadosData {
  ingresos: BalanceEntry[];
  costos: BalanceEntry[];
  gastos: BalanceEntry[];
  totalIngresos: number;
  totalCostos: number;
  totalGastos: number;
  utilidadBruta: number;
  utilidadNeta: number;
}

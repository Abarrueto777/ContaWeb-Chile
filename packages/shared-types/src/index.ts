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

export type TipoVacacion = 'NORMAL' | 'PROGRESIVO' | 'COLECTIVO';
export type EstadoVacacion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface Vacacion {
  id: string;
  empresaId: string;
  trabajadorId: string;
  fechaInicio: string;
  fechaFin: string;
  diasHabiles: number;
  saldoPrevio: string;
  saldoPosterior: string;
  periodoAnual?: string;
  tipo: TipoVacacion;
  estado: EstadoVacacion;
  observacion?: string;
  trabajador?: Trabajador;
  createdAt: string;
  updatedAt: string;
}

export interface VacacionSaldo {
  trabajadorId: string;
  trabajadorNombre: string;
  trabajadorRut: string;
  fechaIngreso: string;
  aniosServicio: number;
  diasGanados: number;
  diasUsados: number;
  saldo: number;
  diasProgresivos: number;
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

export type CausalFiniquito =
  | '159_N1' | '159_N2' | '159_N3' | '159_N4'
  | '160_N1' | '160_N3' | '160_N4' | '160_N7'
  | '161_NECESIDADES' | '161_DESAHUCIO';

export interface Trabajador {
  id: string;
  empresaId: string;
  rut: string;
  nombre: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  sexo?: string;
  cargo?: string;
  email?: string;
  domicilio?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  nacionalidad?: string;
  region?: string;
  comuna?: string;
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
  trabajaFinSemana: boolean;
  montoMovilizacion?: string;
  montoColacion?: string;
  jornadaHoras: number;
  tipoContrato: TipoContrato;
  fechaTerminoContrato?: string;
  fechaIngreso: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Finiquito {
  id: string;
  empresaId: string;
  trabajadorId: string;
  fechaTermino: string;
  causal: CausalFiniquito;
  diasVacaciones: string;
  montoVacaciones: string;
  aniosServicio: string;
  indemnizacion: string;
  avisoPrevio: string;
  otrosDescuentos: string;
  totalBruto: string;
  totalNeto: string;
  trabajador?: Trabajador;
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
  cantHorasExtra: string;
  horasExtraFeriado: string;
  cantHorasExtraFeriado: string;
  horasDescuento: string;
  otrosDescuentos: string;
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
  diasSinGoce: number;
  montoSinGoce: string;
  diasLicenciaMedica: number;
  subsidioLm: string;
  liquido: string;
  costoEmpleador: string;
  pagada: boolean;
  trabajador?: Trabajador;
  createdAt: string;
  updatedAt: string;
}

export type TipoPermiso = 'MATRIMONIO' | 'UNION_CIVIL' | 'FALLECIMIENTO' | 'SIN_GOCE' | 'ADMINISTRATIVO' | 'OTRO';

export interface Permiso {
  id: string;
  empresaId: string;
  trabajadorId: string;
  tipo: TipoPermiso;
  fechaInicio: string;
  fechaFin: string;
  diasHabiles: number;
  conGoce: boolean;
  parentesco?: string;
  observacion?: string;
  trabajador?: { nombre: string; rut: string };
  createdAt: string;
  updatedAt: string;
}

export type TipoLicencia = 'COMUN' | 'ACCIDENTE_LABORAL' | 'PRENATAL' | 'POSTNATAL' | 'MENTAL';

export interface LicenciaMedica {
  id: string;
  empresaId: string;
  trabajadorId: string;
  fechaInicio: string;
  fechaFin: string;
  tipo: TipoLicencia;
  numLicencia: string;
  entidad: string;
  diasLicencia: number;
  subsidioMonto: string;
  subsidioPagado: boolean;
  notas: string;
  trabajador?: { nombre: string; rut: string };
  createdAt: string;
  updatedAt: string;
}

export type TipoBienRP = 'AGRICOLA' | 'TRANSPORTE';

export interface RPBien {
  id: string;
  empresaId: string;
  tipo: TipoBienRP;
  descripcion: string;
  rolAvaluo?: string;
  municipio?: string;
  avaluoFiscal: string;
  anioAvaluo?: number;
  patente?: string;
  tipoVehiculo?: string;
  marca?: string;
  modelo?: string;
  anioVehiculo?: number;
  valorTasacion: string;
  anioTasacion?: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RPPpm {
  id: string;
  empresaId: string;
  anio: number;
  mes: number;
  ventasPeriodo: string;
  ppmTasa: string;
  ppmMonto: string;
  pagado: boolean;
  fechaPago?: string;
  observacion: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentaPresuntaDetalle {
  id: string;
  tipo: TipoBienRP;
  descripcion: string;
  base: number;
  rentaPresunta: number;
}

export interface RentaPresuntaResult {
  anio: number;
  detalle: RentaPresuntaDetalle[];
  baseAgricola: number;
  baseTransporte: number;
  rpAgricola: number;
  rpTransporte: number;
  rentaPresunta: number;
  impuesto1cat: number;
  tasaPresuncion: number;
  tasa1cat: number;
  ppmPagado: number;
  diferencia: number;
  aPagar: number;
  saldoFavor: number;
}

export interface RPPpmResumen {
  registros: RPPpm[];
  totalVentas: number;
  totalPpm: number;
  totalPagado: number;
  totalPendiente: number;
}

export interface ProPymeResumen {
  anio: number;
  mes: number | null;
  ingresos: number;
  gastos: number;
  rentaLiquida: number;
  tasa1cat: number;
  impuesto1cat: number;
  tasaPpm: number;
  ppmAcumulado: number;
  diferencia: number;
  aPagar: number;
  aFavor: number;
}

export interface F22Result {
  anio: number;
  periodo: string;
  ingresos: number;
  gastosTotal: number;
  utilidadNeta: number;
  gastosRechazados: number;
  ajustes: number;
  rentaLiquida: number;
  rentaImponible: number;
  tasa1cat: number;
  impuesto1cat: number;
  ventasNetas: number;
  tasaPpm: number;
  ppmAcumulado: number;
  creditoPpm: number;
  creditoSence: number;
  creditoDonaciones: number;
  creditoOtros: number;
  retenciones: number;
  totalCreditos: number;
  impuestoNeto: number;
  aPagar: number;
  devolucion: number;
  sueldosEmpresarial: number;
}

export interface Socio {
  id: string;
  empresaId: string;
  rut: string;
  nombre: string;
  tipo: string;
  porcentaje: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TipoRentaRetiro = 'AFECTA' | 'EXENTA' | 'NO_RENTA';

export interface Retiro {
  id: string;
  empresaId: string;
  socioId: string;
  fecha: string;
  monto: string;
  concepto: string;
  factorIpc: string;
  montoCorregido: string;
  tipoRenta: TipoRentaRetiro;
  creditoIdpc: string;
  socio?: { nombre: string; rut: string; tipo: string; porcentaje: string };
  createdAt: string;
  updatedAt: string;
}

export interface DJ1886Socio {
  nro: number;
  rut: string;
  nombre: string;
  tipo: string;
  porcentaje: string;
  nRetiros: number;
  afecta: number;
  exenta: number;
  noRenta: number;
  incremento: number;
  credito: number;
  totalCorregido: number;
}

export interface DJ1886Result {
  empresaRut: string;
  empresaNombre: string;
  anio: number;
  tasa1cat: number;
  socios: DJ1886Socio[];
  totales: {
    afecta: number;
    exenta: number;
    noRenta: number;
    incremento: number;
    credito: number;
  };
}

export interface DJ1948Socio {
  nro: number;
  rut: string;
  nombre: string;
  tipo: string;
  porcentaje: string;
  nRetiros: number;
  totalAfecta: number;
  totalExenta: number;
  totalNoRenta: number;
  totalHistorico: number;
  totalCorregido: number;
  totalCreditoIdpc: number;
}

export interface DJ1948Result {
  empresaRut: string;
  empresaNombre: string;
  anio: number;
  tasa1cat: number;
  socios: DJ1948Socio[];
  totales: { historico: number; corregido: number; creditoIdpc: number; afecta: number; exenta: number; noRenta: number };
}

export interface DJ1879Prestador {
  nro: number;
  rut: string;
  nombre: string;
  nBoletas: number;
  bruto: number;
  retencion: number;
  neto: number;
}

export interface DJ1879Result {
  empresaRut: string;
  empresaNombre: string;
  anio: number;
  prestadores: DJ1879Prestador[];
  totales: { bruto: number; retencion: number; neto: number; boletas: number };
}

export interface DJ1887Trabajador {
  nCert: number;
  rut: string;
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  nombres: string;
  meses: number;
  rentaNeta: number;
  impuestoUnico: number;
  noGravada: number;
  mayorRetencion: number;
  rentaExenta: number;
  rebajaZona: number;
  prestamo3pct: number;
  rentaNetaSinAct: number;
  impuestoUnicoSinAct: number;
  periodoCod: 'C' | 'P' | 'F';
  jornadaHoras: number;
  anio40h: number;
}

export interface DJ1887Result {
  empresaRut: string;
  empresaNombre: string;
  anio: number;
  trabajadores: DJ1887Trabajador[];
  totales: {
    trabajadores: number;
    rentaNeta: number;
    impuestoUnico: number;
    noGravada: number;
    rentaNetaSinAct: number;
    impuestoUnicoSinAct: number;
  };
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

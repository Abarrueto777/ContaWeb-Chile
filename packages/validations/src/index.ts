import { z } from 'zod';

// RUT chileno — algoritmo módulo 11
function validarRut(rut: string): boolean {
  const limpio = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]!) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resultado = 11 - (suma % 11);
  const dvEsperado = resultado === 11 ? '0' : resultado === 10 ? 'K' : resultado.toString();

  return dv === dvEsperado;
}

export const rutSchema = z
  .string()
  .min(7, 'RUT demasiado corto')
  .max(12, 'RUT demasiado largo')
  .refine(validarRut, 'RUT chileno inválido');

const passwordSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Nombre demasiado corto'),
  password: passwordSchema,
  rol: z.enum(['ADMIN', 'CONTADOR', 'VISOR']).optional().default('CONTADOR'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export const empresaSchema = z.object({
  rut: rutSchema,
  razonSocial: z.string().min(3, 'Razón social requerida'),
  giro: z.string().min(3, 'Giro requerido'),
  actividadEconomica: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  representanteLegal: z.string().optional(),
  rutRepresentante: rutSchema.optional().or(z.literal('')),
  tasaRetencionHon: z.number().min(0).max(100).optional(),
});

export const clienteSchema = z.object({
  rut: rutSchema,
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

export const lineaDocumentoSchema = z.object({
  descripcion: z.string().min(1, 'Descripción requerida'),
  cantidad: z.number().positive('Cantidad debe ser positiva'),
  precioUnitario: z.number().positive('Precio debe ser positivo'),
  descuento: z.number().min(0).max(100).default(0),
});

export const documentoSchema = z.object({
  clienteId: z.string().optional(),
  clienteRut: rutSchema.optional(),
  clienteNombre: z.string().min(2).optional(),
  tipo: z.enum(['BOLETA_ELECTRONICA', 'FACTURA_ELECTRONICA', 'NOTA_CREDITO', 'NOTA_DEBITO']),
  fecha: z.coerce.date(),
  glosa: z.string().optional(),
  condicionPago: z.enum(['CONTADO', 'CREDITO']).default('CONTADO'),
  lineas: z.array(lineaDocumentoSchema).min(1, 'Al menos una línea requerida'),
});

export const lineaAsientoSchema = z.object({
  cuentaId: z.string().min(1, 'Cuenta requerida'),
  debe: z.number().min(0).default(0),
  haber: z.number().min(0).default(0),
  glosa: z.string().optional(),
});

export const asientoSchema = z
  .object({
    fecha: z.coerce.date(),
    glosa: z.string().min(3, 'Glosa mínimo 3 caracteres'),
    lineas: z.array(lineaAsientoSchema).min(2, 'Mínimo 2 líneas'),
  })
  .refine(
    (data) => {
      const totalDebe = data.lineas.reduce((sum, l) => sum + l.debe, 0);
      const totalHaber = data.lineas.reduce((sum, l) => sum + l.haber, 0);
      return Math.abs(totalDebe - totalHaber) < 0.0001;
    },
    { message: 'La suma del Debe debe ser igual a la suma del Haber' }
  );

export const facturaRecibidaSchema = z.object({
  proveedorRut: rutSchema,
  proveedorNombre: z.string().min(2, 'Nombre del proveedor requerido'),
  tipo: z.enum(['FACTURA', 'NOTA_CREDITO', 'LIQUIDACION_FACTURA']).default('FACTURA'),
  folio: z.number().int().positive('Folio debe ser positivo'),
  fecha: z.coerce.date(),
  neto: z.number().min(0, 'Neto no puede ser negativo'),
  iva: z.number().min(0),
  impAdicional: z.number().min(0).default(0),
  retencion: z.number().min(0).default(0),
  total: z.number().min(0),
  tipoImpuesto: z
    .enum(['NINGUNO', 'BEBIDAS_20', 'BEBIDAS_31', 'LUJO', 'CARNE', 'HARINA', 'DIESEL'])
    .default('NINGUNO'),
  condicionPago: z.enum(['CONTADO', 'CREDITO']).default('CONTADO'),
  glosa: z.string().optional(),
});

export const honorarioSchema = z.object({
  prestadorRut: rutSchema,
  prestadorNombre: z.string().min(2, 'Nombre del prestador requerido'),
  folio: z.number().int().positive('Folio debe ser positivo'),
  fecha: z.coerce.date(),
  monto: z.number().positive('Monto debe ser positivo'),
  retiene: z.boolean().default(true),
  glosa: z.string().optional(),
});

// Plan de cuentas: crear subcuenta derivada de un padre.
// El código, tipo y nivel los calcula el backend a partir del padre.
export const cuentaContableSchema = z.object({
  cuentaPadreId: z.string().min(1, 'Cuenta padre requerida'),
  nombre: z.string().min(2, 'Nombre requerido'),
  naturaleza: z.enum(['DEUDORA', 'ACREEDORA']).optional(),
  permiteMovimientos: z.boolean().default(true),
});

// Editar cuenta: solo datos que no corrompen el libro (nunca código/tipo/padre).
export const cuentaContableUpdateSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  naturaleza: z.enum(['DEUDORA', 'ACREEDORA']).optional(),
  permiteMovimientos: z.boolean().optional(),
});

export const cuentaBancariaSchema = z.object({
  banco: z.string().min(2, 'Banco requerido'),
  tipoCuenta: z.enum(['CORRIENTE', 'VISTA', 'AHORRO']).default('CORRIENTE'),
  numero: z.string().min(1, 'Número de cuenta requerido'),
  saldoInicial: z.number().default(0),
  moneda: z.string().default('CLP'),
});

export const movimientoBancoSchema = z.object({
  cuentaId: z.string().min(1),
  fecha: z.coerce.date(),
  descripcion: z.string().min(1, 'Descripción requerida'),
  cargo: z.number().min(0).default(0),
  abono: z.number().min(0).default(0),
  tipo: z.enum([
    'COBRO_CLIENTE', 'PAGO_PROVEEDOR', 'PAGO_IVA', 'PAGO_PPM', 'PAGO_REMUNERACIONES',
    'PAGO_HONORARIO', 'TRANSFERENCIA', 'COMISION_BANCO', 'INTERES_BANCO', 'INTERES_GANADO',
    'RETIRO_DUENO', 'APORTE_CAPITAL', 'GASTO_GENERAL', 'OTRO',
  ]).default('OTRO'),
  glosa: z.string().optional(),
});

export const trabajadorSchema = z.object({
  rut: rutSchema,
  nombre: z.string().min(2, 'Nombre requerido'),
  apellidoPaterno: z.string().optional().or(z.literal('')),
  apellidoMaterno: z.string().optional().or(z.literal('')),
  sexo: z.enum(['M', 'F']).optional(),
  cargo: z.string().min(2, 'Cargo requerido (Art. 10 CT)'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  domicilio: z.string().min(5, 'Domicilio requerido (Art. 10 CT)'),
  fechaNacimiento: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.date({ required_error: 'Fecha de nacimiento requerida (Art. 10 CT)' }),
  ),
  estadoCivil: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.enum(['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'CONVIVIENTE_CIVIL'], {
      required_error: 'Estado civil requerido (Art. 10 CT)',
    }),
  ),
  nacionalidad: z.string().min(2, 'Nacionalidad requerida (Art. 10 CT)'),
  region: z.string().optional(),
  comuna: z.string().optional(),
  tipo: z.enum(['DEPENDIENTE', 'SUELDO_EMPRESARIAL']).default('DEPENDIENTE'),
  sueldoBase: z.number().positive('Sueldo base requerido'),
  afp: z.enum(['CAPITAL', 'CUPRUM', 'HABITAT', 'PLANVITAL', 'PROVIDA', 'MODELO', 'UNO']).default('HABITAT'),
  salud: z.string().default('FONASA'),
  pctSalud: z.number().min(0).max(1).default(0.07),
  montoIsapre: z.number().min(0).optional(),
  tieneCes: z.boolean().default(false),
  tipoGratificacion: z.enum(['ART_50', 'ART_50_LIBRE', 'ART_47', 'NINGUNA']).default('ART_50'),
  tieneMovilizacion:  z.boolean().default(false),
  tieneColacion:      z.boolean().default(false),
  tieneConectividad:  z.boolean().default(false),
  cargasFamiliares:   z.number().int().min(0).default(0),
  trabajaFinSemana:   z.boolean().default(false),
  montoMovilizacion: z.number().min(0).optional(),
  montoColacion: z.number().min(0).optional(),
  jornadaHoras: z.number().int().min(1).max(45).default(42),
  tipoContrato: z.enum(['INDEFINIDO', 'PLAZO_FIJO', 'OBRA_FAENA']).default('INDEFINIDO'),
  fechaTerminoContrato: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.date().optional(),
  ),
  fechaIngreso: z.coerce.date(),
});

export const CAUSALES_FINIQUITO = [
  '159_N1', '159_N2', '159_N3', '159_N4',
  '160_N1', '160_N3', '160_N4', '160_N7',
  '161_NECESIDADES', '161_DESAHUCIO',
] as const;

export const finiquitoInputSchema = z.object({
  fechaTermino: z.coerce.date(),
  causal: z.enum(CAUSALES_FINIQUITO),
  diasVacaciones: z.number().min(0).default(0),
  avisoPrevioOtorgado: z.boolean().default(true),
  otrosDescuentos: z.number().min(0).default(0),
});

export const liquidacionInputSchema = z.object({
  trabajadorId: z.string().min(1),
  anio: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  horasExtra: z.number().min(0).default(0),
  horasExtraFeriado: z.number().min(0).default(0),
  horasDescuento: z.number().min(0).default(0),
  bono: z.number().min(0).default(0),
  diasTrabajados: z.number().int().min(0).max(31).default(30),
  anticipo: z.number().min(0).default(0),
  otrosDescuentos: z.number().min(0).default(0),
  utm: z.number().positive('UTM del período requerida'),
  imm: z.number().positive('IMM del período requerida'),
});

export const vacacionSchema = z.object({
  trabajadorId: z.string().min(1, 'Trabajador requerido'),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  periodoAnual: z.string().min(1, 'Período requerido').regex(/^Año \d+/, 'Formato inválido — debe ser "Año N · ..."'),
  tipo: z.enum(['NORMAL', 'PROGRESIVO', 'COLECTIVO']).default('NORMAL'),
  observacion: z.string().optional(),
}).refine(d => d.fechaFin >= d.fechaInicio, { message: 'Fecha fin debe ser igual o posterior a fecha inicio', path: ['fechaFin'] });

export const permisoSchema = z.object({
  trabajadorId: z.string().min(1, 'Trabajador requerido'),
  tipo: z.enum(['MATRIMONIO', 'UNION_CIVIL', 'FALLECIMIENTO', 'SIN_GOCE', 'ADMINISTRATIVO', 'OTRO']),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  conGoce: z.boolean().default(true),
  parentesco: z.string().optional(),
  observacion: z.string().optional(),
}).refine(d => d.fechaFin >= d.fechaInicio, { message: 'Fecha fin debe ser igual o posterior a fecha inicio', path: ['fechaFin'] });

export type PermisoInput = z.infer<typeof permisoSchema>;

export const licenciaMedicaSchema = z.object({
  trabajadorId: z.string().min(1, 'Trabajador requerido'),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  tipo: z.enum(['COMUN', 'ACCIDENTE_LABORAL', 'PRENATAL', 'POSTNATAL', 'MENTAL']).default('COMUN'),
  numLicencia: z.string().optional(),
  entidad: z.string().optional(),
  subsidioMonto: z.number().min(0).default(0),
  subsidioPagado: z.boolean().default(false),
  notas: z.string().optional(),
}).refine(d => d.fechaFin >= d.fechaInicio, { message: 'Fecha fin debe ser igual o posterior a fecha inicio', path: ['fechaFin'] });

export type LicenciaMedicaInput = z.infer<typeof licenciaMedicaSchema>;

export const socioSchema = z.object({
  rut: z.string().min(1, 'RUT requerido'),
  nombre: z.string().min(2, 'Nombre requerido'),
  tipo: z.string().default('SOCIO'),
  porcentaje: z.number().min(0).max(100).default(0),
});

export type SocioInput = z.infer<typeof socioSchema>;

export const retiroSchema = z.object({
  socioId: z.string().min(1, 'Socio requerido'),
  fecha: z.coerce.date(),
  monto: z.number().positive('Monto requerido'),
  concepto: z.string().optional(),
  tipoRenta: z.enum(['AFECTA', 'EXENTA', 'NO_RENTA']).default('AFECTA'),
  factorIpc: z.number().positive().default(1),
});

export type RetiroInput = z.infer<typeof retiroSchema>;

export const rpBienSchema = z.object({
  tipo: z.enum(['AGRICOLA', 'TRANSPORTE']),
  descripcion: z.string().optional(),
  rolAvaluo: z.string().optional(),
  municipio: z.string().optional(),
  avaluoFiscal: z.number().min(0).default(0),
  anioAvaluo: z.number().int().min(1900).max(2100).optional(),
  patente: z.string().optional(),
  tipoVehiculo: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  anioVehiculo: z.number().int().min(1900).max(2100).optional(),
  valorTasacion: z.number().min(0).default(0),
  anioTasacion: z.number().int().min(1900).max(2100).optional(),
});

export type RPBienInput = z.infer<typeof rpBienSchema>;

export const rpPpmSchema = z.object({
  anio: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  ventasPeriodo: z.number().min(0).default(0),
  tipo: z.enum(['AGRICOLA', 'TRANSPORTE']).default('AGRICOLA'),
  pagado: z.boolean().default(false),
  observacion: z.string().optional(),
});

export type RPPpmInput = z.infer<typeof rpPpmSchema>;

export const activoFijoSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  categoria: z.enum(['MAQUINARIA', 'VEHICULO', 'MUEBLES', 'EQUIPOS_COMPUTACION', 'CONSTRUCCION', 'TERRENO', 'OTRO']).default('OTRO'),
  fechaCompra: z.coerce.date(),
  costoCompra: z.number().positive('Costo requerido'),
  vidaUtilAnios: z.number().int().min(1, 'Vida útil requerida'),
  valorResidual: z.number().min(0).default(0),
});

// Solicitud de plan de suscripción (etapa de cobro manual por transferencia)
export const solicitudPlanSchema = z.object({
  plan: z.enum(['MENSUAL', 'SEMESTRAL', 'ANUAL']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type EmpresaInput = z.infer<typeof empresaSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type DocumentoInput = z.infer<typeof documentoSchema>;
export type AsientoInput = z.infer<typeof asientoSchema>;
export type FacturaRecibidaInput = z.infer<typeof facturaRecibidaSchema>;
export type HonorarioInput = z.infer<typeof honorarioSchema>;
export type CuentaContableInput = z.infer<typeof cuentaContableSchema>;
export type CuentaContableUpdateInput = z.infer<typeof cuentaContableUpdateSchema>;
export type CuentaBancariaInput = z.infer<typeof cuentaBancariaSchema>;
export type MovimientoBancoInput = z.infer<typeof movimientoBancoSchema>;
export type TrabajadorInput = z.infer<typeof trabajadorSchema>;
export type LiquidacionInput = z.infer<typeof liquidacionInputSchema>;
export type ActivoFijoInput = z.infer<typeof activoFijoSchema>;
export type FiniquitoInput = z.infer<typeof finiquitoInputSchema>;
export type VacacionInput = z.infer<typeof vacacionSchema>;
export type SolicitudPlanInput = z.infer<typeof solicitudPlanSchema>;

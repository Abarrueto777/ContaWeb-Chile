import type { Trabajador } from '@prisma/client';

// AFP rates vigentes — fallback si no vienen en config
const AFP_TASAS_DEFAULT: Record<string, number> = {
  CAPITAL: 0.1144,
  CUPRUM: 0.1144,
  HABITAT: 0.1127,
  PLANVITAL: 0.1127,
  PROVIDA: 0.1145,
  MODELO: 0.1077,
  UNO: 0.1049,
};

const TASA_SIS = 0.0143; // pagado por empleador
const TASA_CES_TRABAJADOR = 0.006;
const TASA_CES_EMPLEADOR = 0.024;
const TASA_CES_EMPLEADOR_PLAZO = 0.030; // Ley 19.728: empleador paga 3% en plazo fijo/obra faena
const TASA_ACCIDENTE = 0.0034;
const TASA_SES = 0.0003;
const TOPE_IMPONIBLE_UF = 81.6;
const TOPE_SE_UF = 75;
const GRATIF_TOPE_IMM = 4.75;

// Impuesto Único 2a Categoría — tramos en UTM mensuales
const TRAMOS_IU = [
  { desde: 0, hasta: 13.5, tasa: 0, rebaja: 0 },
  { desde: 13.5, hasta: 30, tasa: 0.04, rebaja: 0.54 },
  { desde: 30, hasta: 50, tasa: 0.08, rebaja: 1.74 },
  { desde: 50, hasta: 70, tasa: 0.135, rebaja: 4.49 },
  { desde: 70, hasta: 90, tasa: 0.23, rebaja: 11.14 },
  { desde: 90, hasta: 120, tasa: 0.304, rebaja: 17.8 },
  { desde: 120, hasta: 150, tasa: 0.355, rebaja: 23.92 },
  { desde: 150, hasta: Infinity, tasa: 0.4, rebaja: 30.67 },
];

function calcularImpuestoUnico(imponibleAfterDescuentos: number, utm: number): number {
  const enUTM = imponibleAfterDescuentos / utm;
  const tramo = TRAMOS_IU.find((t) => enUTM >= t.desde && enUTM < t.hasta);
  if (!tramo || tramo.tasa === 0) return 0;
  const impuesto = (enUTM * tramo.tasa - tramo.rebaja) * utm;
  return Math.max(0, Math.round(impuesto));
}

function calcularGratificacion(
  tipo: string,
  sueldoBase: number,
  imm: number,
  diasTrabajados: number,
): number {
  const factor = diasTrabajados / 30;
  if (tipo === 'ART_50') {
    const topeMensual = (GRATIF_TOPE_IMM * imm) / 12;
    return Math.round(Math.min(sueldoBase * 0.25, topeMensual) * factor);
  }
  if (tipo === 'ART_50_LIBRE') {
    return Math.round(sueldoBase * 0.25 * factor);
  }
  return 0; // ART_47 handled manually; NINGUNA = 0
}

export interface ConfigCalculo {
  sis_pct?: number;
  ces_trabajador_pct?: number;
  ces_empleador_pct?: number;
  acc_laboral_pct?: number;
  aporte_ses_pct?: number;
  tope_cotiz_uf?: number;
  tope_se_uf?: number;
  movilizacion_mensual?: number;
  colacion_mensual?: number;
  conectividad_mensual?: number;
  asig_fam_monto_a?: number;
  asig_fam_monto_b?: number;
  asig_fam_monto_c?: number;
  // Tasas AFP + indicadores previsionales desde ValorUFUTM del mes
  afp_capital?: number;
  afp_cuprum?: number;
  afp_habitat?: number;
  afp_planvital?: number;
  afp_provida?: number;
  afp_modelo?: number;
  afp_uno?: number;
  sis_empleador_previred?: number;
  tope_imponible_uf_previred?: number;
}

export interface LiquidacionCalculada {
  sueldoBase: number;
  horasExtra: number;
  cantHorasExtra: number;
  horasExtraFeriado: number;
  cantHorasExtraFeriado: number;
  horasDescuento: number;
  otrosDescuentos: number;
  bono: number;
  gratificacion: number;
  imponible: number;
  cotizAfp: number;
  cotizSis: number;
  cotizSalud: number;
  cotizCes: number;
  impuestoUnico: number;
  movilizacion: number;
  colacion: number;
  conectividad: number;
  asigFamiliar: number;
  anticipo: number;
  diasSinGoce: number;
  montoSinGoce: number;
  liquido: number;
  costoEmpleador: number;
}

export function calcularLiquidacion(
  trabajador: Trabajador,
  params: {
    horasExtra: number;
    horasExtraFeriado: number;
    horasDescuento: number;
    otrosDescuentos: number;
    bono: number;
    diasTrabajados: number;
    anticipo: number;
    utm: number;
    imm: number;
    uf: number;
    config?: ConfigCalculo;
    diasSinGoce?: number;
  },
): LiquidacionCalculada {
  const { horasExtra, horasExtraFeriado, horasDescuento, otrosDescuentos, bono, diasTrabajados, anticipo, utm, imm, uf } = params;
  const cfg = params.config ?? {};
  const diasSG = params.diasSinGoce ?? 0;
  const diasEfectivos = Math.max(0, diasTrabajados - diasSG);
  const factor = diasEfectivos / 30;

  const sueldoBase = Number(trabajador.sueldoBase);
  const sueldoDevengado = Math.round(sueldoBase * factor);

  // Valor hora según fórmula legal chilena: sueldo / (jornada_semanal × 30/7)
  const horasMes = Number(trabajador.jornadaHoras) * 30 / 7;
  const valorHora = sueldoBase / horasMes;
  const montoHorasExtra = Math.round(horasExtra * valorHora * 1.5);
  // Horas extras en feriado: recargo 100% (valor hora × 2.0)
  const montoHorasExtraFeriado = Math.round(horasExtraFeriado * valorHora * 2.0);
  const montoHorasDescuento = Math.round(horasDescuento * valorHora);

  // Gratificación se calcula sobre el devengado real (sueldo − atrasos), factor ya aplicado en sueldoDevengado
  const sueldoBaseGratif = Math.max(0, sueldoDevengado - montoHorasDescuento);
  const gratificacion = calcularGratificacion(
    trabajador.tipoGratificacion,
    sueldoBaseGratif,
    imm,
    30, // factor ya está en sueldoBaseGratif
  );

  // Config-overridable rates — Previred del mes tiene prioridad sobre config empresa
  const TASA_SIS_V = cfg.sis_empleador_previred ?? cfg.sis_pct ?? TASA_SIS;
  const TASA_CES_TRAB_V = cfg.ces_trabajador_pct ?? TASA_CES_TRABAJADOR;
  const TASA_CES_EMP_V = cfg.ces_empleador_pct ?? TASA_CES_EMPLEADOR;
  const TASA_ACC_V = cfg.acc_laboral_pct ?? TASA_ACCIDENTE;
  const TASA_SES_V = cfg.aporte_ses_pct ?? TASA_SES;

  // Tope imponible — Previred del mes tiene prioridad
  const topeUF = trabajador.tipo === 'SUELDO_EMPRESARIAL'
    ? (cfg.tope_se_uf ?? TOPE_SE_UF)
    : (cfg.tope_imponible_uf_previred ?? cfg.tope_cotiz_uf ?? TOPE_IMPONIBLE_UF);
  const topePesos = Math.round(topeUF * uf);
  // Atrasos reducen el imponible (base para cotizaciones previsionales)
  const imponibleBruto = Math.max(0, sueldoDevengado - montoHorasDescuento) + montoHorasExtra + montoHorasExtraFeriado + bono + gratificacion;
  const imponible = Math.min(imponibleBruto, topePesos);

  // Tasas AFP: usa indicadores del mes si vienen en config, sino los defaults
  const ra = (v: number | undefined, d: number): number => v !== undefined ? v : d;
  const AFP_TASAS_V: Record<string, number> = {
    CAPITAL:   ra(cfg.afp_capital,   0.1144),
    CUPRUM:    ra(cfg.afp_cuprum,    0.1144),
    HABITAT:   ra(cfg.afp_habitat,   0.1127),
    PLANVITAL: ra(cfg.afp_planvital, 0.1127),
    PROVIDA:   ra(cfg.afp_provida,   0.1145),
    MODELO:    ra(cfg.afp_modelo,    0.1077),
    UNO:       ra(cfg.afp_uno,       0.1049),
  };

  // Descuentos previsionales
  const tasaAfp = AFP_TASAS_V[trabajador.afp] ?? 0.1127;
  const cotizAfp = Math.round(imponible * tasaAfp);
  const cotizSis = 0; // SIS lo paga el empleador
  const cotizSaludMandatoria = Math.round(imponible * Number(trabajador.pctSalud));
  const montoIsapre = (trabajador as unknown as { montoIsapre?: string | null }).montoIsapre;
  const planIsapre = montoIsapre ? Math.round(Number(montoIsapre) * uf) : 0;
  const cotizSalud = planIsapre > cotizSaludMandatoria ? planIsapre : cotizSaludMandatoria;
  // Ley 19.728: en plazo fijo y obra/faena el trabajador NO aporta al seguro de cesantía
  const esPlazoFijoOObra = trabajador.tipoContrato === 'PLAZO_FIJO' || trabajador.tipoContrato === 'OBRA_FAENA';
  const cotizCes = trabajador.tieneCes && !esPlazoFijoOObra ? Math.round(imponible * TASA_CES_TRAB_V) : 0;

  // Impuesto único
  let impuestoUnico = 0;
  if (trabajador.tipo !== 'SUELDO_EMPRESARIAL') {
    const baseIU = imponible - cotizAfp - cotizSalud - cotizCes;
    impuestoUnico = calcularImpuestoUnico(baseIU, utm);
  }

  // No imponibles — usa monto del trabajador si está seteado, sino el default de empresa
  const movilizacionBase = trabajador.tieneMovilizacion
    ? (Number(trabajador.montoMovilizacion ?? 0) || (cfg.movilizacion_mensual ?? 0))
    : 0;
  const colacionBase = trabajador.tieneColacion
    ? (Number(trabajador.montoColacion ?? 0) || (cfg.colacion_mensual ?? 0))
    : 0;
  const conectividadBase = (trabajador as unknown as { tieneConectividad?: boolean }).tieneConectividad
    ? (cfg.conectividad_mensual ?? 0)
    : 0;
  const movilizacion  = Math.round(movilizacionBase  * factor);
  const colacion      = Math.round(colacionBase      * factor);
  const conectividad  = Math.round(conectividadBase  * factor);

  // Asignación familiar por tramos según imponible (Ley 19.728 / D.S. 150)
  const cargasFam = (trabajador as unknown as { cargasFamiliares?: number }).cargasFamiliares ?? 0;
  let asigFamiliar = 0;
  if (cargasFam > 0) {
    const montoA = cfg.asig_fam_monto_a ?? 17063;
    const montoB = cfg.asig_fam_monto_b ?? 10423;
    const montoC = cfg.asig_fam_monto_c ?? 3295;
    let montoCarga = 0;
    if      (imponible <= 352669) montoCarga = montoA;
    else if (imponible <= 530360) montoCarga = montoB;
    else if (imponible <= 1097020) montoCarga = montoC;
    asigFamiliar = Math.round(montoCarga * cargasFam);
  }

  // Sin goce: ya descontado en sueldoDevengado vía diasEfectivos; se guarda solo informativamente
  const montoSinGoce = Math.round(diasSG * (sueldoBase / 30));

  // Líquido — atrasos ya están restados del imponible, no se duplican en totalDescuentos
  const totalDescuentos = cotizAfp + cotizSalud + cotizCes + impuestoUnico + anticipo + otrosDescuentos;
  const liquido = (sueldoDevengado - montoHorasDescuento) + montoHorasExtra + montoHorasExtraFeriado + bono + gratificacion + movilizacion + colacion + conectividad + asigFamiliar - totalDescuentos;

  // Costo empleador
  const sisEmpleador = Math.round(imponible * TASA_SIS_V);
  const tasaCesEmp = esPlazoFijoOObra ? TASA_CES_EMPLEADOR_PLAZO : TASA_CES_EMP_V;
  const cesEmpleador = trabajador.tieneCes ? Math.round(imponible * tasaCesEmp) : 0;
  const accidente = Math.round(imponible * TASA_ACC_V);
  const ses = Math.round(imponible * TASA_SES_V);
  const costoEmpleador = (sueldoDevengado - montoHorasDescuento) + montoHorasExtra + montoHorasExtraFeriado + bono + gratificacion + movilizacion + colacion + conectividad + asigFamiliar + sisEmpleador + cesEmpleador + accidente + ses;

  return {
    sueldoBase: sueldoDevengado,
    horasExtra: montoHorasExtra,
    cantHorasExtra: horasExtra,
    horasExtraFeriado: montoHorasExtraFeriado,
    cantHorasExtraFeriado: horasExtraFeriado,
    horasDescuento: horasDescuento,
    otrosDescuentos: otrosDescuentos,
    bono,
    gratificacion,
    imponible,
    cotizAfp,
    cotizSis: sisEmpleador,
    cotizSalud,
    cotizCes,
    impuestoUnico,
    movilizacion,
    colacion,
    conectividad,
    asigFamiliar,
    anticipo,
    diasSinGoce: diasSG,
    montoSinGoce,
    liquido: Math.max(0, liquido),
    costoEmpleador,
  };
}

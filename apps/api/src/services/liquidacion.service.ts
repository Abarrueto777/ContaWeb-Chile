import type { Trabajador } from '@prisma/client';

// AFP rates 2024 (tasa trabajador, excl. SIS)
const AFP_TASAS: Record<string, number> = {
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

export interface LiquidacionCalculada {
  sueldoBase: number;
  horasExtra: number;
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
  anticipo: number;
  liquido: number;
  costoEmpleador: number;
}

export function calcularLiquidacion(
  trabajador: Trabajador,
  params: {
    horasExtra: number;
    bono: number;
    diasTrabajados: number;
    anticipo: number;
    utm: number;
    imm: number;
    uf: number;
  },
): LiquidacionCalculada {
  const { horasExtra, bono, diasTrabajados, anticipo, utm, imm, uf } = params;
  const factor = diasTrabajados / 30;

  const sueldoBase = Number(trabajador.sueldoBase);
  const sueldoDevengado = Math.round(sueldoBase * factor);

  // Hora extra
  const horasMes = (Number(trabajador.jornadaHoras) * 52) / 12;
  const valorHora = sueldoBase / horasMes;
  const montoHorasExtra = Math.round(horasExtra * valorHora * 1.5);

  // Gratificación
  const gratificacion = calcularGratificacion(
    trabajador.tipoGratificacion,
    sueldoBase,
    imm,
    diasTrabajados,
  );

  // Tope imponible
  const topeUF = trabajador.tipo === 'SUELDO_EMPRESARIAL' ? TOPE_SE_UF : TOPE_IMPONIBLE_UF;
  const topePesos = Math.round(topeUF * uf);
  const imponibleBruto = sueldoDevengado + montoHorasExtra + bono + gratificacion;
  const imponible = Math.min(imponibleBruto, topePesos);

  // Descuentos previsionales
  const tasaAfp = AFP_TASAS[trabajador.afp] ?? 0.1127;
  const cotizAfp = Math.round(imponible * tasaAfp);
  const cotizSis = 0; // SIS lo paga el empleador
  const cotizSalud = Math.round(imponible * Number(trabajador.pctSalud));
  const cotizCes = trabajador.tieneCes ? Math.round(imponible * TASA_CES_TRABAJADOR) : 0;

  // Impuesto único
  let impuestoUnico = 0;
  if (trabajador.tipo !== 'SUELDO_EMPRESARIAL') {
    const baseIU = imponible - cotizAfp - cotizSalud - cotizCes;
    impuestoUnico = calcularImpuestoUnico(baseIU, utm);
  }

  // No imponibles
  const movilizacion = trabajador.tieneMovilizacion
    ? Math.round(Number(trabajador.montoMovilizacion ?? 0) * factor)
    : 0;
  const colacion = trabajador.tieneColacion
    ? Math.round(Number(trabajador.montoColacion ?? 0) * factor)
    : 0;

  // Líquido
  const totalDescuentos = cotizAfp + cotizSalud + cotizCes + impuestoUnico + anticipo;
  const liquido = sueldoDevengado + montoHorasExtra + bono + gratificacion + movilizacion + colacion - totalDescuentos;

  // Costo empleador
  const sisEmpleador = Math.round(imponible * TASA_SIS);
  const cesEmpleador = trabajador.tieneCes ? Math.round(imponible * TASA_CES_EMPLEADOR) : 0;
  const accidente = Math.round(imponible * TASA_ACCIDENTE);
  const ses = Math.round(imponible * TASA_SES);
  const costoEmpleador = sueldoDevengado + montoHorasExtra + bono + gratificacion + movilizacion + colacion + sisEmpleador + cesEmpleador + accidente + ses;

  return {
    sueldoBase: sueldoDevengado,
    horasExtra: montoHorasExtra,
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
    anticipo,
    liquido: Math.max(0, liquido),
    costoEmpleador,
  };
}

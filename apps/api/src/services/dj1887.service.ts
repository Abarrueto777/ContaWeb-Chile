import type { PrismaClient } from '@prisma/client';

/**
 * DJ 1887 — Rentas del Art. 42 N°1 (sueldos) y Retenciones de Impuesto Único.
 * Declaración Jurada anual al SII (AT = año + 1). Plazo: ~27 de marzo del año siguiente.
 *
 * Agrega las liquidaciones del año por trabajador. Los montos se actualizan por
 * factor IPC del mes (default 1.0 — sin actualización, igual que ContaCL cuando no
 * se cargan factores). Las rentas no gravadas incluyen el subsidio por licencia médica
 * (Art. 17 N°1 LIR).
 *
 * Códigos de período (no agrícola, que es el caso general):
 *   C = jornada completa (> 30 h/semana)
 *   P = jornada parcial  (≤ 30 h/semana)
 *   F = trabajador finiquitado durante el año declarado
 */

export interface DJ1887Trabajador {
  nCert: number;
  rut: string;
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  nombres: string;
  meses: number;
  rentaNeta: number;        // renta afecta a IU, actualizada
  impuestoUnico: number;    // IUSC retenido, actualizado
  noGravada: number;        // rentas no gravadas, actualizadas (incluye subsidio LM)
  mayorRetencion: number;
  rentaExenta: number;
  rebajaZona: number;
  prestamo3pct: number;
  rentaNetaSinAct: number;  // histórico, sin actualizar
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

/** Factor IPC de actualización para (anio, mes). Default 1.0 si no hay datos cargados. */
type FactoresIPC = Partial<Record<number, number>>;

export async function generarDJ1887(
  empresaId: string,
  anio: number,
  prisma: PrismaClient,
  factoresIpc: FactoresIPC = {},
): Promise<DJ1887Result> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { rut: true, razonSocial: true },
  });

  const liquidaciones = await prisma.liquidacion.findMany({
    where: { empresaId, anio },
    include: { trabajador: true },
    orderBy: [{ mes: 'asc' }],
  });

  const porTrab = new Map<string, DJ1887Trabajador & { _jornada: number }>();

  for (const l of liquidaciones) {
    const t = l.trabajador;
    let agg = porTrab.get(t.id);
    if (!agg) {
      const partes = t.nombre.trim().split(/\s+/);
      const apPaterno = t.apellidoPaterno ?? (partes.length >= 3 ? partes[0]! : '');
      const apMaterno = t.apellidoMaterno ?? (partes.length >= 3 ? partes[1]! : '');
      const nombres = t.apellidoPaterno
        ? t.nombre.replace(apPaterno, '').replace(apMaterno, '').trim()
        : (partes.length >= 3 ? partes.slice(2).join(' ') : t.nombre);
      agg = {
        nCert: 0,
        rut: t.rut,
        nombre: t.nombre,
        apPaterno,
        apMaterno,
        nombres,
        meses: 0,
        rentaNeta: 0,
        impuestoUnico: 0,
        noGravada: 0,
        mayorRetencion: 0,
        rentaExenta: 0,
        rebajaZona: 0,
        prestamo3pct: 0,
        rentaNetaSinAct: 0,
        impuestoUnicoSinAct: 0,
        periodoCod: 'C',
        jornadaHoras: t.jornadaHoras,
        anio40h: 0,
        _jornada: t.jornadaHoras,
      };
      porTrab.set(t.id, agg);
    }

    const factor = factoresIpc[l.mes] ?? 1.0;

    // Renta afecta a IU = imponible − cotizaciones previsionales del trabajador
    const rentaMes = Math.max(0,
      Number(l.imponible) - Number(l.cotizAfp) - Number(l.cotizSalud) - Number(l.cotizCes));
    const iuMes = Number(l.impuestoUnico);
    const noGravMes = Number(l.movilizacion) + Number(l.colacion)
      + Number((l as typeof l & { conectividad?: unknown }).conectividad ?? 0)
      + Number((l as typeof l & { asigFamiliar?: unknown }).asigFamiliar ?? 0);
    const subsidioLm = Number((l as typeof l & { subsidioLm?: unknown }).subsidioLm ?? 0);

    agg.meses += 1;
    agg.rentaNeta += Math.round(rentaMes * factor);
    agg.impuestoUnico += Math.round(iuMes * factor);
    agg.noGravada += Math.round(noGravMes * factor) + Math.round(subsidioLm * factor);
    agg.rentaNetaSinAct += Math.round(rentaMes);
    agg.impuestoUnicoSinAct += Math.round(iuMes);
    agg.jornadaHoras = t.jornadaHoras;
    if (t.jornadaHoras === 40) agg.anio40h = anio;

    // Código de período
    const ftYear = t.fechaTerminoContrato ? t.fechaTerminoContrato.getFullYear() : null;
    if (ftYear === anio) agg.periodoCod = 'F';
    else if (t.jornadaHoras <= 30) agg.periodoCod = 'P';
    else agg.periodoCod = 'C';
  }

  const trabajadores = [...porTrab.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  trabajadores.forEach((t, i) => { t.nCert = i + 1; });

  const totales = trabajadores.reduce((acc, t) => ({
    trabajadores: acc.trabajadores + 1,
    rentaNeta: acc.rentaNeta + t.rentaNeta,
    impuestoUnico: acc.impuestoUnico + t.impuestoUnico,
    noGravada: acc.noGravada + t.noGravada,
    rentaNetaSinAct: acc.rentaNetaSinAct + t.rentaNetaSinAct,
    impuestoUnicoSinAct: acc.impuestoUnicoSinAct + t.impuestoUnicoSinAct,
  }), { trabajadores: 0, rentaNeta: 0, impuestoUnico: 0, noGravada: 0, rentaNetaSinAct: 0, impuestoUnicoSinAct: 0 });

  return {
    empresaRut: empresa?.rut ?? '',
    empresaNombre: empresa?.razonSocial ?? '',
    anio,
    trabajadores: trabajadores.map(({ _jornada, ...rest }) => rest),
    totales,
  };
}

/** TXT de referencia con el formato pipe-delimited del SII para la DJ 1887. */
export function generarDJ1887Txt(dj: DJ1887Result): string {
  const lineas = dj.trabajadores.map((t) => {
    const rutRaw = t.rut.replace(/\./g, '').replace(/-/g, '');
    const cuerpo = rutRaw.length > 1 ? rutRaw.slice(0, -1) : rutRaw;
    const dv = rutRaw ? rutRaw.slice(-1).toUpperCase() : '0';
    return [
      cuerpo, dv,
      t.nombres.slice(0, 30), t.apPaterno.slice(0, 20), t.apMaterno.slice(0, 20),
      t.meses,
      Math.round(t.rentaNeta),
      Math.round(t.impuestoUnico),
      Math.round(t.mayorRetencion),
      Math.round(t.noGravada),
      Math.round(t.rentaExenta),
      Math.round(t.rebajaZona),
      Math.round(t.prestamo3pct),
      t.periodoCod,
      t.jornadaHoras,
      t.anio40h,
      t.nCert,
    ].join('|');
  });
  const header = `DJ1887|${dj.anio}|${dj.empresaRut}|${lineas.length}`;
  return [header, ...lineas].join('\n');
}

const CAUSALES_CON_INDEMNIZACION = ['161_NECESIDADES', '161_DESAHUCIO'];

export interface FiniquitoCalcInput {
  fechaTermino: Date;
  causal: string;
  diasVacaciones: number;
  avisoPrevioOtorgado: boolean;
  otrosDescuentos: number;
}

export interface FiniquitoCalculado {
  diasVacaciones: number;
  montoVacaciones: number;
  aniosServicio: number;
  indemnizacion: number;
  avisoPrevio: number;
  otrosDescuentos: number;
  totalBruto: number;
  totalNeto: number;
}

export function calcularFiniquito(
  sueldoBase: number,
  fechaIngreso: Date,
  input: FiniquitoCalcInput,
): FiniquitoCalculado {
  const { fechaTermino, causal, diasVacaciones, avisoPrevioOtorgado, otrosDescuentos } = input;

  const msServicio = fechaTermino.getTime() - fechaIngreso.getTime();
  const aniosServicio = msServicio / (1000 * 60 * 60 * 24 * 365.25);

  const montoVacaciones = Math.round(diasVacaciones * (sueldoBase / 30));

  let indemnizacion = 0;
  let avisoPrevio = 0;

  if (CAUSALES_CON_INDEMNIZACION.includes(causal)) {
    const aniosCompletos = Math.min(Math.floor(aniosServicio), 11);
    if (aniosCompletos > 0) indemnizacion = Math.round(aniosCompletos * sueldoBase);
    if (!avisoPrevioOtorgado) avisoPrevio = Math.round(sueldoBase);
  }

  const totalBruto = montoVacaciones + indemnizacion + avisoPrevio;
  const totalNeto = Math.max(0, totalBruto - otrosDescuentos);

  return {
    diasVacaciones,
    montoVacaciones,
    aniosServicio,
    indemnizacion,
    avisoPrevio,
    otrosDescuentos,
    totalBruto,
    totalNeto,
  };
}

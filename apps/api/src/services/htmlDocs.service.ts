// HTML document generators for contrato, finiquito and liquidación (Art. 54 bis)

const BASE_CSS = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111; background: #fff; padding: 24px 32px; }
    h1 { font-size: 14pt; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    h2 { font-size: 11pt; text-transform: uppercase; margin: 16px 0 6px; }
    .subtitle { text-align: center; font-size: 10pt; color: #555; margin-bottom: 20px; }
    .header-box { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 16px; }
    .header-box .empresa { font-size: 12pt; font-weight: bold; }
    .header-box .info { text-align: right; font-size: 10pt; color: #444; }
    table.datos { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.datos td { padding: 3px 6px; font-size: 10.5pt; }
    table.datos td:first-child { font-weight: bold; width: 38%; color: #333; }
    table.montos { width: 100%; border-collapse: collapse; margin: 12px 0; }
    table.montos th { background: #f0f0f0; padding: 5px 8px; text-align: left; font-size: 10pt; border: 1px solid #ccc; }
    table.montos td { padding: 5px 8px; border: 1px solid #ccc; font-size: 10.5pt; }
    table.montos td.monto { text-align: right; font-family: monospace; }
    table.montos tr.total td { font-weight: bold; background: #f8f8f8; }
    .clausula { margin-bottom: 10px; }
    .clausula p { text-align: justify; line-height: 1.55; }
    .num-palabras { font-weight: bold; text-transform: uppercase; border: 1px solid #999; padding: 6px 10px; margin: 8px 0; font-size: 10pt; }
    .firmas { display: flex; justify-content: space-around; margin-top: 40px; }
    .firma-bloque { text-align: center; width: 40%; }
    .firma-linea { border-top: 1px solid #333; margin-bottom: 4px; padding-top: 4px; font-size: 10pt; }
    .firma-label { font-size: 9pt; color: #555; }
    @media print { body { padding: 10mm 15mm; } }
  </style>
`;

function clp(n: number): string {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function fecha(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Number to words (Spanish, Chilean) ──────────────────────────────────────

const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function dosDigitos(n: number): string {
  if (n < 20) return UNIDADES[n]!;
  if (n < 30) return n === 20 ? 'VEINTE' : 'VEINTI' + UNIDADES[n - 20]!;
  const u = n % 10;
  return u === 0 ? DECENAS[Math.floor(n / 10)]! : DECENAS[Math.floor(n / 10)]! + ' Y ' + UNIDADES[u]!;
}

function tresDigitos(n: number): string {
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const parts = [...(c > 0 ? [CENTENAS[c]!] : []), ...(r > 0 ? [dosDigitos(r)] : [])];
  return parts.join(' ');
}

export function numToWords(n: number): string {
  if (n === 0) return 'CERO';
  const parts: string[] = [];
  if (n >= 1_000_000) {
    const m = Math.floor(n / 1_000_000);
    parts.push(m === 1 ? 'UN MILLÓN' : tresDigitos(m) + ' MILLONES');
    n %= 1_000_000;
  }
  if (n >= 1_000) {
    const k = Math.floor(n / 1_000);
    parts.push(k === 1 ? 'MIL' : tresDigitos(k) + ' MIL');
    n %= 1_000;
  }
  if (n > 0) parts.push(tresDigitos(n));
  return parts.join(' ');
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface EmpresaDoc {
  razonSocial: string;
  rut: string;
  giro: string;
  direccion?: string | null;
  representanteLegal?: string | null;
  rutRepresentante?: string | null;
}

export interface TrabajadorDoc {
  nombre: string;
  rut: string;
  cargo?: string | null;
  sueldoBase: number;
  fechaIngreso: Date | string;
  jornadaHoras: number;
  tipoContrato: string;
  afp: string;
  salud: string;
  pctSalud: number;
  tipoGratificacion: string;
  tieneCes: boolean;
  tieneMovilizacion: boolean;
  tieneColacion: boolean;
  montoMovilizacion?: number | null;
  montoColacion?: number | null;
  domicilio?: string | null;
  fechaNacimiento?: Date | string | null;
  estadoCivil?: string | null;
  nacionalidad?: string | null;
  region?: string | null;
  comuna?: string | null;
  tasaAfp?: number | undefined;
  planIsapreUF?: number | undefined;
}

export interface LiquidacionDoc {
  anio: number;
  mes: number;
  diasTrabajados: number;
  sueldoBase: number;
  horasExtra: number;
  cantHorasExtra: number;
  horasExtraFeriado: number;
  cantHorasExtraFeriado: number;
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
  conectividad?: number;
  asigFamiliar?: number;
  anticipo: number;
  uf?: number | undefined;
  horasDescuento: number;
  montoHorasDescuento: number;
  otrosDescuentos: number;
  diasSinGoce?: number;
  montoSinGoce?: number;
  liquido: number;
  costoEmpleador: number;
}

export interface FiniquitoDoc {
  fechaTermino: Date | string;
  causal: string;
  diasVacaciones: number;
  montoVacaciones: number;
  aniosServicio: number;
  indemnizacion: number;
  avisoPrevio: number;
  otrosDescuentos: number;
  totalBruto: number;
  totalNeto: number;
}

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const TIPO_CONTRATO_LABEL: Record<string, string> = {
  INDEFINIDO: 'Contrato de Duración Indefinida',
  PLAZO_FIJO: 'Contrato a Plazo Fijo',
  OBRA_FAENA: 'Contrato por Obra o Faena',
};

const GRATIFICACION_LABEL: Record<string, string> = {
  ART_50: 'Garantizada mensual Art. 50 CT (25% del sueldo base con tope de 4,75 IMM ÷ 12)',
  ART_50_LIBRE: 'Garantizada mensual Art. 50 CT (25% del sueldo base sin tope)',
  ART_47: 'Anual según utilidades Art. 47 CT',
  NINGUNA: 'No aplica',
};

export const CAUSAL_LABEL: Record<string, string> = {
  '159_N1': 'Artículo 159 N°1 del Código del Trabajo — Mutuo acuerdo de las partes.',
  '159_N2': 'Artículo 159 N°2 del Código del Trabajo — Renuncia voluntaria del trabajador.',
  '159_N3': 'Artículo 159 N°3 del Código del Trabajo — Muerte del trabajador.',
  '159_N4': 'Artículo 159 N°4 del Código del Trabajo — Vencimiento del plazo convenido.',
  '160_N1': 'Artículo 160 N°1 del Código del Trabajo — Falta de probidad, conducta inmoral o acoso sexual.',
  '160_N3': 'Artículo 160 N°3 del Código del Trabajo — No concurrencia del trabajador a sus labores sin causa justificada.',
  '160_N4': 'Artículo 160 N°4 del Código del Trabajo — Abandono del trabajo por parte del trabajador.',
  '160_N7': 'Artículo 160 N°7 del Código del Trabajo — Incumplimiento grave de las obligaciones que impone el contrato.',
  '161_NECESIDADES': 'Artículo 161 inciso 1° del Código del Trabajo — Necesidades de la empresa, establecimiento o servicio.',
  '161_DESAHUCIO': 'Artículo 161 inciso 2° del Código del Trabajo — Desahucio dado por el empleador.',
};

const ESTADO_CIVIL_LABEL: Record<string, string> = {
  SOLTERO: 'soltero/a',
  CASADO: 'casado/a',
  DIVORCIADO: 'divorciado/a',
  VIUDO: 'viudo/a',
  CONVIVIENTE_CIVIL: 'conviviente civil',
};

// ── Contrato Individual de Trabajo ───────────────────────────────────────────

export function generarContrato(empresa: EmpresaDoc, trabajador: TrabajadorDoc): string {
  const hoy = new Date();
  const fechaIngreso = typeof trabajador.fechaIngreso === 'string' ? new Date(trabajador.fechaIngreso) : trabajador.fechaIngreso;
  const tipoContratoLabel = TIPO_CONTRATO_LABEL[trabajador.tipoContrato] ?? trabajador.tipoContrato;
  const ciudadEmpresa = empresa.direccion?.split(',').pop()?.trim() ?? 'Santiago';
  const ecLabel = trabajador.estadoCivil ? (ESTADO_CIVIL_LABEL[trabajador.estadoCivil] ?? trabajador.estadoCivil.toLowerCase()) : null;
  const fnLabel = trabajador.fechaNacimiento ? fecha(trabajador.fechaNacimiento) : null;
  const nacionalidad = trabajador.nacionalidad ?? 'chilena';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato de Trabajo — ${trabajador.nombre}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; background: #fff; padding: 18mm 20mm 14mm; }

  /* ── ENCABEZADO ── */
  .ct-header {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    border: 1.5px solid #1a1a2e;
    margin-bottom: 0;
  }
  .ct-empresa-col {
    padding: 10px 14px;
    flex: 1;
    border-right: 1.5px solid #1a1a2e;
  }
  .ct-empresa-nombre { font-size: 12.5pt; font-weight: bold; color: #1a1a2e; margin-bottom: 3px; }
  .ct-empresa-sub { font-size: 8.5pt; color: #555; line-height: 1.5; }
  .ct-titulo-col {
    background: #1a1a2e;
    color: #fff;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 180px;
    text-align: center;
  }
  .ct-titulo-doc { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.8; margin-bottom: 4px; }
  .ct-tipo-badge { font-size: 10pt; font-weight: bold; letter-spacing: 0.5px; }
  .ct-fecha-doc { font-size: 8pt; opacity: 0.7; margin-top: 4px; }

  /* ── TÍTULO ── */
  .ct-title-bar {
    border-left: 1.5px solid #1a1a2e;
    border-right: 1.5px solid #1a1a2e;
    border-bottom: 1.5px solid #1a1a2e;
    text-align: center;
    padding: 8px 0 6px;
    margin-bottom: 14px;
  }
  .ct-title-bar h1 { font-size: 13pt; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; }

  /* ── CLÁUSULAS ── */
  .clausula { margin-bottom: 12px; }
  .clausula h2 {
    display: flex;
    align-items: center;
    font-size: 9pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #fff;
    background: #2c3e6b;
    padding: 4px 10px;
    margin-bottom: 8px;
    gap: 8px;
  }
  .clausula h2 .cl-num { background: #1a1a2e; padding: 2px 7px; font-size: 8pt; border-radius: 2px; flex-shrink: 0; }
  .clausula p { text-align: justify; line-height: 1.6; font-size: 10.5pt; margin-bottom: 6px; }
  .clausula ol { margin-left: 20px; line-height: 1.75; font-size: 10.5pt; }

  /* ── GRILLA IDENTIFICACIÓN ── */
  .id-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 16px; margin: 10px 0 12px; }
  .id-cell { border: 1px solid #ddd; border-radius: 3px; padding: 4px 10px; }
  .id-cell .id-lbl { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; color: #888; margin-bottom: 1px; }
  .id-cell .id-val { font-size: 10pt; }

  /* ── TABLAS DE DATOS ── */
  .ct-table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; }
  .ct-table thead tr { background: #2c3e6b; color: #fff; }
  .ct-table thead th { padding: 5px 10px; font-size: 8.5pt; text-align: left; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; }
  .ct-table tbody td { padding: 5px 10px; font-size: 10pt; border-bottom: 1px solid #eee; }
  .ct-table tbody td:first-child { font-weight: 600; color: #333; font-size: 9.5pt; width: 40%; }
  .ct-table tbody tr:nth-child(even) { background: #f7f8fc; }
  .ct-table tfoot td { padding: 5px 10px; font-size: 9.5pt; font-weight: bold; background: #f0f0f0; border-top: 1.5px solid #aaa; }

  /* ── FIRMAS ── */
  .ct-firmas { display: flex; justify-content: space-around; gap: 28px; margin-top: 50px; }
  .ct-firma-box { flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 14px 16px 10px; text-align: center; }
  .ct-firma-espacio { height: 52px; }
  .ct-firma-nombre { border-top: 1.5px solid #333; padding-top: 5px; font-weight: bold; font-size: 10.5pt; }
  .ct-firma-rut { font-size: 8.5pt; color: #555; margin-top: 3px; }
  .ct-firma-rol { font-size: 8.5pt; color: #333; margin-top: 2px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; }

  /* ── RECEPCIÓN ── */
  .ct-recepcion { margin-top: 22px; border-top: 1px dashed #bbb; padding-top: 8px; font-size: 9pt; color: #555; }

  @media print { body { padding: 10mm 15mm; } }
</style>
</head>
<body>

  <!-- ENCABEZADO -->
  <div class="ct-header">
    <div class="ct-empresa-col">
      <div class="ct-empresa-nombre">${empresa.razonSocial}</div>
      <div class="ct-empresa-sub">RUT: ${empresa.rut} &nbsp;·&nbsp; Giro: ${empresa.giro}${empresa.direccion ? '<br/>' + empresa.direccion : ''}</div>
    </div>
    <div class="ct-titulo-col">
      <div class="ct-titulo-doc">Contrato de Trabajo</div>
      <div class="ct-tipo-badge">${tipoContratoLabel}</div>
      <div class="ct-fecha-doc">${ciudadEmpresa}, ${fecha(hoy)}</div>
    </div>
  </div>
  <div class="ct-title-bar">
    <h1>Contrato Individual de Trabajo</h1>
  </div>

  <!-- CLÁUSULA PRIMERA -->
  <div class="clausula">
    <h2><span class="cl-num">I</span> Comparecencia e Individualización de las Partes</h2>
    <p>En ${ciudadEmpresa}, a ${fecha(hoy)}, comparecen:</p>
    <p><strong>EMPLEADOR:</strong> <strong>${empresa.razonSocial}</strong>, RUT N° ${empresa.rut}, con giro <em>${empresa.giro}</em>${empresa.direccion ? ', domiciliada en ' + empresa.direccion : ''}${empresa.representanteLegal ? ', representada legalmente por don/doña <strong>' + empresa.representanteLegal + '</strong>, RUT N° ' + (empresa.rutRepresentante ?? '—') + ',' : ','} en adelante "<strong>el Empleador</strong>".</p>
    <p><strong>TRABAJADOR/A:</strong></p>
    <div class="id-grid">
      <div class="id-cell"><div class="id-lbl">Nombre completo</div><div class="id-val">${trabajador.nombre}</div></div>
      <div class="id-cell"><div class="id-lbl">RUT</div><div class="id-val">${trabajador.rut}</div></div>
      ${fnLabel ? `<div class="id-cell"><div class="id-lbl">Fecha de nacimiento</div><div class="id-val">${fnLabel}</div></div>` : ''}
      ${ecLabel ? `<div class="id-cell"><div class="id-lbl">Estado civil</div><div class="id-val" style="text-transform:capitalize">${ecLabel}</div></div>` : ''}
      <div class="id-cell"><div class="id-lbl">Nacionalidad</div><div class="id-val" style="text-transform:capitalize">${nacionalidad}</div></div>
      ${trabajador.domicilio ? `<div class="id-cell"><div class="id-lbl">Domicilio</div><div class="id-val">${trabajador.domicilio}${trabajador.comuna ? ', ' + trabajador.comuna : ''}${trabajador.region ? ', ' + trabajador.region : ''}</div></div>` : ''}
    </div>
    <p>En adelante denominado/a "<strong>el Trabajador</strong>", han convenido el siguiente Contrato Individual de Trabajo, sujeto al Código del Trabajo y disposiciones legales vigentes.</p>
  </div>

  <!-- CLÁUSULA SEGUNDA -->
  <div class="clausula">
    <h2><span class="cl-num">II</span> Naturaleza de los Servicios y Lugar de Trabajo</h2>
    <p>El Trabajador se obliga a desempeñar el cargo de <strong>${trabajador.cargo ?? 'los servicios pactados'}</strong> y a ejecutar todas las funciones y labores inherentes al mismo que le sean encomendadas por el Empleador, de acuerdo con la naturaleza del cargo y las instrucciones que imparta la jefatura correspondiente.</p>
    <p>Los servicios se prestarán en el establecimiento del Empleador ubicado en <strong>${empresa.direccion ?? ciudadEmpresa}</strong>, sin perjuicio de las necesidades de la empresa que pudieren requerir que el Trabajador preste servicios en otros lugares dentro del territorio nacional, conforme al Artículo 10 N°3 del Código del Trabajo.</p>
  </div>

  <!-- CLÁUSULA TERCERA -->
  <div class="clausula">
    <h2><span class="cl-num">III</span> Jornada de Trabajo</h2>
    <p>La jornada ordinaria de trabajo será de <strong>${trabajador.jornadaHoras} horas semanales</strong>, distribuidas de lunes a viernes, en los horarios que el Empleador determine, respetando los límites del Artículo 22 del Código del Trabajo.</p>
    <p>Las horas trabajadas en exceso de la jornada ordinaria serán consideradas horas extraordinarias y se pagarán con el recargo del 50% sobre el valor de la hora ordinaria, conforme al Artículo 32 del Código del Trabajo. Deberán ser autorizadas previamente y por escrito por el Empleador.</p>
    <p>El Trabajador tendrá derecho a un descanso mínimo de treinta minutos durante la jornada diaria, tiempo no imputable a la jornada.</p>
  </div>

  <!-- CLÁUSULA CUARTA -->
  <div class="clausula">
    <h2><span class="cl-num">IV</span> Remuneración</h2>
    <p>El Empleador pagará al Trabajador las siguientes remuneraciones y beneficios:</p>
    <table class="ct-table">
      <thead><tr><th>Concepto</th><th>Monto / Detalle</th></tr></thead>
      <tbody>
        <tr><td>Sueldo base mensual</td><td><strong>${clp(trabajador.sueldoBase)}</strong> &nbsp;(${numToWords(trabajador.sueldoBase)} PESOS)</td></tr>
        ${trabajador.tieneMovilizacion && trabajador.montoMovilizacion ? `<tr><td>Asig. movilización (no imponible)</td><td>${clp(trabajador.montoMovilizacion)} mensuales</td></tr>` : ''}
        ${trabajador.tieneColacion && trabajador.montoColacion ? `<tr><td>Asig. colación (no imponible)</td><td>${clp(trabajador.montoColacion)} mensuales</td></tr>` : ''}
        <tr><td>Gratificación</td><td>${GRATIFICACION_LABEL[trabajador.tipoGratificacion] ?? ''}</td></tr>
      </tbody>
    </table>
    <p>Las remuneraciones serán liquidadas y pagadas mensualmente, el último día hábil de cada mes, mediante transferencia electrónica u otro medio convenido. El Empleador entregará la correspondiente liquidación de sueldo conforme al Artículo 54 bis del Código del Trabajo.</p>
    <p>Las asignaciones de movilización y colación no constituyen remuneración y no son imponibles (Artículo 41 CT).</p>
  </div>

  <!-- CLÁUSULA QUINTA -->
  <div class="clausula">
    <h2><span class="cl-num">V</span> Duración y Vigencia del Contrato</h2>
    ${trabajador.tipoContrato === 'INDEFINIDO'
      ? `<p>El presente contrato es de duración <strong>indefinida</strong> y comenzará a regir a contar del <strong>${fecha(fechaIngreso)}</strong>, fecha en que el Trabajador inició la prestación de sus servicios.</p>`
      : `<p>El presente contrato es <strong>${tipoContratoLabel}</strong> y comenzará a regir a contar del <strong>${fecha(fechaIngreso)}</strong>. La duración y término se regirán por las normas aplicables al tipo de contratación pactado y el Código del Trabajo.</p>`
    }
    <p>Las partes dejan constancia de que el presente instrumento se suscribe dentro del plazo legal de 15 días corridos desde la incorporación del Trabajador, conforme al Artículo 9° del Código del Trabajo.</p>
  </div>

  <!-- CLÁUSULA SEXTA -->
  <div class="clausula">
    <h2><span class="cl-num">VI</span> Previsión Social y Seguro de Salud</h2>
    <p>El Trabajador cotizará en las siguientes instituciones previsionales:</p>
    <table class="ct-table">
      <thead><tr><th>Institución</th><th>Detalle</th></tr></thead>
      <tbody>
        <tr><td>AFP</td><td><strong>${trabajador.afp}</strong></td></tr>
        <tr><td>Institución de Salud</td><td><strong>${trabajador.salud}</strong> — cotización del ${(trabajador.pctSalud * 100).toFixed(1)}% sobre la remuneración imponible</td></tr>
        ${trabajador.tieneCes ? '<tr><td>Seguro de Cesantía</td><td>AFC Chile S.A. (Administradora de Fondos de Cesantía)</td></tr>' : ''}
      </tbody>
    </table>
    <p>El Empleador se obliga a enterar las cotizaciones previsionales dentro de los plazos establecidos por la ley.</p>
  </div>

  <!-- CLÁUSULA SÉPTIMA -->
  <div class="clausula">
    <h2><span class="cl-num">VII</span> Feriado Anual</h2>
    <p>El Trabajador tendrá derecho a un feriado anual de quince días hábiles con goce íntegro de remuneraciones, una vez cumplido un año de servicio continuo con el Empleador, conforme al Artículo 67 del Código del Trabajo.</p>
    <p>En contratos a plazo fijo o por obra o faena, el Trabajador tendrá derecho a feriado proporcional al tiempo trabajado si el contrato durase más de treinta días. El feriado podrá fraccionarse, debiendo un período tener al menos diez días hábiles continuos.</p>
  </div>

  <!-- CLÁUSULA OCTAVA -->
  <div class="clausula">
    <h2><span class="cl-num">VIII</span> Obligaciones del Trabajador</h2>
    <p>Sin perjuicio del Código del Trabajo y del Reglamento Interno, el Trabajador se obliga especialmente a:</p>
    <ol>
      <li>Prestar sus servicios con la debida diligencia, cuidado y esmero.</li>
      <li>Respetar los horarios y jornadas de trabajo establecidos.</li>
      <li>Observar las medidas de prevención de riesgos y las normas de seguridad e higiene.</li>
      <li>Guardar la debida reserva respecto de los negocios e información confidencial de la empresa.</li>
      <li>Cuidar los bienes, herramientas e instalaciones que le sean encomendados.</li>
      <li>Comunicar oportunamente cualquier cambio de domicilio, estado civil u otros datos que afecten su situación previsional o tributaria.</li>
    </ol>
  </div>

  <!-- CLÁUSULA NOVENA -->
  <div class="clausula">
    <h2><span class="cl-num">IX</span> Prohibiciones</h2>
    <p>Queda especialmente prohibido al Trabajador:</p>
    <ol>
      <li>Trabajar para otra empresa en actividades que compitan directa o indirectamente con el giro del Empleador.</li>
      <li>Revelar información confidencial, secretos comerciales o datos de clientes a terceros.</li>
      <li>Realizar actividades ajenas a sus funciones dentro del horario de trabajo sin autorización escrita.</li>
      <li>Introducir al lugar de trabajo o consumir bebidas alcohólicas, estupefacientes u otras sustancias prohibidas.</li>
      <li>Utilizar los bienes y sistemas informáticos del Empleador para fines particulares.</li>
    </ol>
  </div>

  <!-- CLÁUSULA DÉCIMA -->
  <div class="clausula">
    <h2><span class="cl-num">X</span> Reglamento Interno y Normativa Aplicable</h2>
    <p>El Trabajador declara haber recibido un ejemplar del Reglamento Interno de Orden, Higiene y Seguridad, cuyas disposiciones conoce y se compromete a cumplir.</p>
    <p>En lo no previsto en el presente contrato, se estará a lo dispuesto en el Código del Trabajo y demás disposiciones legales vigentes.</p>
  </div>

  <!-- CLÁUSULA UNDÉCIMA -->
  <div class="clausula">
    <h2><span class="cl-num">XI</span> Número de Ejemplares</h2>
    <p>El presente contrato se firma en <strong>dos ejemplares</strong> del mismo tenor y fecha, quedando uno en poder de cada parte, con pleno valor y eficacia legal para ambas.</p>
  </div>

  <!-- FIRMAS -->
  <div class="ct-firmas">
    <div class="ct-firma-box">
      <div class="ct-firma-espacio"></div>
      <div class="ct-firma-nombre">${empresa.representanteLegal ?? empresa.razonSocial}</div>
      <div class="ct-firma-rut">RUT: ${empresa.rutRepresentante ?? empresa.rut}</div>
      <div class="ct-firma-rol">${empresa.razonSocial} · Por el Empleador</div>
    </div>
    <div class="ct-firma-box">
      <div class="ct-firma-espacio"></div>
      <div class="ct-firma-nombre">${trabajador.nombre}</div>
      <div class="ct-firma-rut">RUT: ${trabajador.rut}</div>
      <div class="ct-firma-rol">Trabajador/a</div>
    </div>
  </div>

  <!-- RECEPCIÓN DE COPIA -->
  <div class="ct-recepcion">
    <strong>Recepción de copia (Art. 9° CT):</strong> El/la trabajador/a declara haber recibido un ejemplar íntegro del presente contrato en la fecha indicada. &nbsp;&nbsp;Firma: ____________________________
  </div>

</body>
</html>`;
}

// ── Finiquito de Contrato de Trabajo ─────────────────────────────────────────

export function generarFiniquito(empresa: EmpresaDoc, trabajador: TrabajadorDoc, doc: FiniquitoDoc): string {
  const fechaT = typeof doc.fechaTermino === 'string' ? new Date(doc.fechaTermino) : doc.fechaTermino;
  const fechaI = typeof trabajador.fechaIngreso === 'string' ? new Date(trabajador.fechaIngreso) : trabajador.fechaIngreso;
  const causalTexto = CAUSAL_LABEL[doc.causal] ?? doc.causal;
  const ciudadEmpresa = empresa.direccion?.split(',').pop()?.trim() ?? 'Santiago';

  const filas = [
    { label: 'Vacaciones proporcionales', detalle: `${doc.diasVacaciones} días`, monto: doc.montoVacaciones },
    ...(doc.indemnizacion > 0 ? [{ label: `Indemnización por años de servicio (${Math.min(Math.floor(doc.aniosServicio), 11)} año(s))`, detalle: '', monto: doc.indemnizacion }] : []),
    ...(doc.avisoPrevio > 0 ? [{ label: 'Aviso previo (sustitución de aviso)', detalle: '', monto: doc.avisoPrevio }] : []),
    ...(doc.otrosDescuentos > 0 ? [{ label: 'Otros descuentos', detalle: '', monto: -doc.otrosDescuentos }] : []),
  ];

  const filasHtml = filas.map(f => `
    <tr>
      <td class="fq-concepto">${f.label}</td>
      <td class="fq-detalle">${f.detalle}</td>
      <td class="fq-monto${f.monto < 0 ? ' fq-negativo' : ''}">${clp(Math.abs(f.monto))}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Finiquito — ${trabajador.nombre}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; background: #fff; padding: 18mm 20mm 14mm; }

  /* ── ENCABEZADO ── */
  .fq-header {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    border: 1.5px solid #1a1a2e;
    margin-bottom: 0;
  }
  .fq-empresa-col { padding: 10px 14px; flex: 1; border-right: 1.5px solid #1a1a2e; }
  .fq-empresa-nombre { font-size: 12.5pt; font-weight: bold; color: #1a1a2e; margin-bottom: 3px; }
  .fq-empresa-sub { font-size: 8.5pt; color: #555; line-height: 1.5; }
  .fq-titulo-col {
    background: #1a1a2e; color: #fff;
    padding: 10px 16px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-width: 180px; text-align: center;
  }
  .fq-titulo-doc { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.8; margin-bottom: 4px; }
  .fq-titulo-main { font-size: 11pt; font-weight: bold; letter-spacing: 0.5px; }
  .fq-fecha-doc { font-size: 8pt; opacity: 0.7; margin-top: 4px; }

  /* ── TITLE BAR ── */
  .fq-title-bar {
    border-left: 1.5px solid #1a1a2e; border-right: 1.5px solid #1a1a2e; border-bottom: 1.5px solid #1a1a2e;
    text-align: center; padding: 8px 0 6px; margin-bottom: 14px;
  }
  .fq-title-bar h1 { font-size: 13pt; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; }

  /* ── SECCIÓN HEADER ── */
  .fq-seccion-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px;
    color: #fff; background: #2c3e6b;
    padding: 4px 10px; margin: 12px 0 8px;
  }

  /* ── GRILLA PARTES ── */
  .fq-partes { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 16px; margin-bottom: 12px; }
  .fq-parte-col { border: 1px solid #c8d0e8; border-radius: 4px; padding: 8px 12px; background: #f8f9fc; }
  .fq-parte-titulo { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; color: #2c3e6b; margin-bottom: 6px; border-bottom: 1px solid #d0d8f0; padding-bottom: 4px; }
  .fq-parte-row { display: flex; gap: 6px; padding: 2px 0; font-size: 9.5pt; }
  .fq-parte-lbl { font-weight: bold; color: #555; min-width: 95px; flex-shrink: 0; font-size: 9pt; }

  /* ── CAUSAL ── */
  .fq-causal-box {
    border-left: 4px solid #2c3e6b; background: #f0f2fa;
    padding: 8px 14px; margin-bottom: 12px; font-size: 10.5pt; line-height: 1.55;
  }

  /* ── TABLA HABERES ── */
  .fq-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .fq-table thead tr { background: #2c3e6b; color: #fff; }
  .fq-table thead th { padding: 5px 10px; font-size: 8.5pt; text-align: left; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; }
  .fq-table thead th.right { text-align: right; }
  .fq-table tbody tr { border-bottom: 1px solid #eee; }
  .fq-table tbody tr:nth-child(even) { background: #f7f8fc; }
  .fq-concepto { padding: 5px 10px; font-size: 10pt; }
  .fq-detalle { padding: 5px 10px; font-size: 9.5pt; color: #555; text-align: right; }
  .fq-monto { padding: 5px 10px; font-size: 10pt; text-align: right; font-family: monospace; }
  .fq-negativo { color: #b00; }
  .fq-table tfoot tr.fq-bruto td { background: #e8ecf5; font-weight: 600; border-top: 1.5px solid #9aabce; padding: 5px 10px; font-size: 10pt; }
  .fq-table tfoot tr.fq-neto td { background: #1a1a2e; color: #fff; font-weight: bold; font-size: 11pt; padding: 6px 10px; }
  .fq-table tfoot td.right { text-align: right; font-family: monospace; }

  /* ── SON: ── */
  .fq-palabras {
    font-weight: bold; text-transform: uppercase;
    border: 1.5px solid #2c3e6b; border-radius: 3px;
    padding: 6px 12px; margin: 8px 0 14px;
    font-size: 9.5pt; color: #1a1a2e; letter-spacing: 0.3px;
  }

  /* ── DECLARACIÓN ── */
  .fq-declaracion {
    border: 1px solid #c8d0e8; border-radius: 4px;
    padding: 12px 16px; margin-bottom: 18px;
    background: #fafbfe; font-size: 10.5pt; line-height: 1.65;
    text-align: justify;
  }

  /* ── FIRMAS ── */
  .fq-firmas { display: flex; justify-content: space-around; gap: 28px; margin-bottom: 20px; }
  .fq-firma-box { flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 14px 16px 10px; text-align: center; }
  .fq-firma-espacio { height: 52px; }
  .fq-firma-nombre { border-top: 1.5px solid #333; padding-top: 5px; font-weight: bold; font-size: 10.5pt; }
  .fq-firma-rut { font-size: 8.5pt; color: #555; margin-top: 3px; }
  .fq-firma-rol { font-size: 8.5pt; color: #333; margin-top: 2px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; }

  /* ── RATIFICACIÓN ── */
  .fq-ratificacion {
    border: 1px dashed #aaa; border-radius: 4px;
    padding: 10px 14px; font-size: 9pt; color: #444;
    display: flex; justify-content: space-between; align-items: center; gap: 20px;
  }
  .fq-rat-texto { flex: 1; line-height: 1.5; }
  .fq-rat-sello { border: 1px dashed #bbb; border-radius: 4px; min-width: 100px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #bbb; text-transform: uppercase; letter-spacing: 0.5px; }

  @media print { body { padding: 10mm 15mm; } }
</style>
</head>
<body>

  <!-- ENCABEZADO -->
  <div class="fq-header">
    <div class="fq-empresa-col">
      <div class="fq-empresa-nombre">${empresa.razonSocial}</div>
      <div class="fq-empresa-sub">RUT: ${empresa.rut} &nbsp;·&nbsp; Giro: ${empresa.giro}${empresa.direccion ? '<br/>' + empresa.direccion : ''}</div>
    </div>
    <div class="fq-titulo-col">
      <div class="fq-titulo-doc">Documento Laboral</div>
      <div class="fq-titulo-main">FINIQUITO</div>
      <div class="fq-fecha-doc">${ciudadEmpresa}, ${fecha(fechaT)}</div>
    </div>
  </div>
  <div class="fq-title-bar">
    <h1>Finiquito de Contrato de Trabajo</h1>
  </div>

  <!-- PARTES -->
  <div class="fq-seccion-label">Individualización de las Partes</div>
  <div class="fq-partes">
    <div class="fq-parte-col">
      <div class="fq-parte-titulo">Empleador</div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">Empresa:</span><span>${empresa.razonSocial}</span></div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">RUT:</span><span>${empresa.rut}</span></div>
      ${empresa.representanteLegal ? `<div class="fq-parte-row"><span class="fq-parte-lbl">Representante:</span><span>${empresa.representanteLegal}${empresa.rutRepresentante ? ' (RUT ' + empresa.rutRepresentante + ')' : ''}</span></div>` : ''}
    </div>
    <div class="fq-parte-col">
      <div class="fq-parte-titulo">Trabajador/a</div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">Nombre:</span><span>${trabajador.nombre}</span></div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">RUT:</span><span>${trabajador.rut}</span></div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">Cargo:</span><span>${trabajador.cargo ?? '—'}</span></div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">Fecha ingreso:</span><span>${fecha(fechaI)}</span></div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">Fecha término:</span><span>${fecha(fechaT)}</span></div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">Años de servicio:</span><span>${doc.aniosServicio.toFixed(2)}</span></div>
      <div class="fq-parte-row"><span class="fq-parte-lbl">Último sueldo:</span><span>${clp(trabajador.sueldoBase)}</span></div>
    </div>
  </div>

  <!-- CAUSAL -->
  <div class="fq-seccion-label">Causal de Término</div>
  <div class="fq-causal-box">${causalTexto}</div>

  <!-- LIQUIDACIÓN DE HABERES -->
  <div class="fq-seccion-label">Liquidación de Haberes</div>
  <table class="fq-table">
    <thead>
      <tr>
        <th>Concepto</th>
        <th class="right">Detalle</th>
        <th class="right">Monto</th>
      </tr>
    </thead>
    <tbody>${filasHtml}</tbody>
    <tfoot>
      <tr class="fq-bruto">
        <td colspan="2">Total Bruto</td>
        <td class="right">${clp(doc.totalBruto)}</td>
      </tr>
      <tr class="fq-neto">
        <td colspan="2">TOTAL NETO A PAGAR</td>
        <td class="right">${clp(doc.totalNeto)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="fq-palabras">SON: ${numToWords(doc.totalNeto)} PESOS</div>

  <!-- DECLARACIÓN -->
  <div class="fq-declaracion">
    En ${ciudadEmpresa}, a ${fecha(fechaT)}, las partes suscriben el presente finiquito de mutuo acuerdo, declarando el/la trabajador/a haber recibido íntegra y cabalmente todas las prestaciones adeudadas por concepto del contrato de trabajo que por este acto se da por terminado, <strong>no teniendo cargo ni acción alguna que deducir contra el Empleador</strong> por dicho contrato de trabajo ni por las prestaciones derivadas del mismo.
  </div>

  <!-- FIRMAS -->
  <div class="fq-firmas">
    <div class="fq-firma-box">
      <div class="fq-firma-espacio"></div>
      <div class="fq-firma-nombre">${empresa.representanteLegal ?? empresa.razonSocial}</div>
      <div class="fq-firma-rut">RUT: ${empresa.rutRepresentante ?? empresa.rut}</div>
      <div class="fq-firma-rol">${empresa.razonSocial} · Por el Empleador</div>
    </div>
    <div class="fq-firma-box">
      <div class="fq-firma-espacio"></div>
      <div class="fq-firma-nombre">${trabajador.nombre}</div>
      <div class="fq-firma-rut">RUT: ${trabajador.rut}</div>
      <div class="fq-firma-rol">Trabajador/a</div>
    </div>
  </div>

  <!-- RATIFICACIÓN -->
  <div class="fq-ratificacion">
    <div class="fq-rat-texto">
      <strong>Ratificación ante ministro de fe (Art. 177 CT):</strong><br/>
      El presente finiquito fue ratificado ante Notario Público / Inspector del Trabajo / Presidente del Sindicato. Ministro de fe: _______________________________ &nbsp; Fecha: _______________
    </div>
    <div class="fq-rat-sello">Timbre y<br/>firma</div>
  </div>

</body>
</html>`;
}

// ── Comprobante de Feriado (Art. 67 CT) ──────────────────────────────────────

export interface ComprobanteFeriadoDoc {
  fechaInicio: Date | string;
  fechaFin: Date | string;
  diasHabiles: number;
  saldoPrevio: number;
  saldoPosterior: number;
  tipo: string;
  periodoAnual?: string | null;
  observacion?: string | null;
  diasDerechoEnPeriodo?: number;
  diasUsadosEnPeriodo?: number;
}

const TIPO_VAC_LABEL: Record<string, string> = {
  NORMAL: 'Feriado Legal (Art. 67 CT)',
  PROGRESIVO: 'Feriado Progresivo (Art. 68 CT)',
  COLECTIVO: 'Feriado Colectivo (Art. 76 CT)',
};

export function generarComprobanteFeriado(
  empresa: EmpresaDoc,
  trabajador: TrabajadorDoc,
  doc: ComprobanteFeriadoDoc,
  saldoGanado: number,
): string {
  const fi = typeof doc.fechaInicio === 'string' ? new Date(doc.fechaInicio) : doc.fechaInicio;
  const ff = typeof doc.fechaFin === 'string' ? new Date(doc.fechaFin) : doc.fechaFin;
  const hoy = new Date();
  const tipoLabel = TIPO_VAC_LABEL[doc.tipo] ?? doc.tipo;
  const ciudadEmpresa = empresa.direccion?.split(',').pop()?.trim() ?? 'Santiago';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comprobante de Feriado — ${trabajador.nombre}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; background: #fff; padding: 18mm 20mm 14mm; }

  .cf-header { display: flex; justify-content: space-between; align-items: stretch; border: 1.5px solid #1a1a2e; margin-bottom: 0; }
  .cf-empresa-col { padding: 10px 14px; flex: 1; border-right: 1.5px solid #1a1a2e; }
  .cf-empresa-nombre { font-size: 12.5pt; font-weight: bold; color: #1a1a2e; margin-bottom: 3px; }
  .cf-empresa-sub { font-size: 8.5pt; color: #555; line-height: 1.5; }
  .cf-titulo-col {
    background: #1a1a2e; color: #fff; padding: 10px 16px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-width: 180px; text-align: center;
  }
  .cf-titulo-doc { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.8; margin-bottom: 4px; }
  .cf-titulo-main { font-size: 11pt; font-weight: bold; }
  .cf-fecha-doc { font-size: 8pt; opacity: 0.7; margin-top: 4px; }

  .cf-title-bar { border-left: 1.5px solid #1a1a2e; border-right: 1.5px solid #1a1a2e; border-bottom: 1.5px solid #1a1a2e; text-align: center; padding: 8px 0 6px; margin-bottom: 14px; }
  .cf-title-bar h1 { font-size: 13pt; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; }

  .cf-seccion { display: flex; align-items: center; gap: 8px; font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; color: #fff; background: #2c3e6b; padding: 4px 10px; margin: 12px 0 8px; }

  .cf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 16px; margin-bottom: 12px; }
  .cf-cell { border: 1px solid #c8d0e8; border-radius: 3px; padding: 4px 10px; }
  .cf-cell .cf-lbl { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; color: #888; margin-bottom: 1px; }
  .cf-cell .cf-val { font-size: 10.5pt; }

  .cf-periodo-box { border: 1.5px solid #2c3e6b; border-radius: 4px; padding: 12px 16px; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; }
  .cf-periodo-item .cf-p-lbl { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; color: #666; margin-bottom: 3px; }
  .cf-periodo-item .cf-p-val { font-size: 12pt; font-weight: bold; color: #1a1a2e; }
  .cf-periodo-item .cf-p-sub { font-size: 8pt; color: #888; margin-top: 1px; }

  .cf-saldo-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .cf-saldo-table thead tr { background: #2c3e6b; color: #fff; }
  .cf-saldo-table thead th { padding: 5px 10px; font-size: 8.5pt; text-align: left; font-weight: bold; text-transform: uppercase; }
  .cf-saldo-table thead th.right { text-align: right; }
  .cf-saldo-table tbody td { padding: 5px 10px; font-size: 10pt; border-bottom: 1px solid #eee; }
  .cf-saldo-table tbody td.right { text-align: right; font-family: monospace; }
  .cf-saldo-table tfoot td { background: #1a1a2e; color: #fff; font-weight: bold; padding: 6px 10px; font-size: 10.5pt; }
  .cf-saldo-table tfoot td.right { text-align: right; font-family: monospace; }

  .cf-tipo-badge { display: inline-block; background: #e8ecf5; border: 1px solid #c8d0e8; border-radius: 3px; padding: 3px 10px; font-size: 9pt; color: #2c3e6b; font-weight: bold; margin-bottom: 12px; }

  .cf-anual-badge { display: flex; align-items: center; justify-content: space-between; background: #2c3e6b; color: #fff; border-radius: 4px; padding: 9px 16px; margin-bottom: 10px; }
  .cf-anual-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.6px; opacity: 0.75; }
  .cf-anual-val { font-size: 15pt; font-weight: bold; letter-spacing: 1.5px; }

  .cf-declaracion { border: 1px solid #c8d0e8; border-radius: 4px; padding: 12px 16px; margin-bottom: 18px; background: #fafbfe; font-size: 10.5pt; line-height: 1.65; text-align: justify; }

  .cf-firmas { display: flex; justify-content: space-around; gap: 28px; margin-bottom: 16px; }
  .cf-firma-box { flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 14px 16px 10px; text-align: center; }
  .cf-firma-espacio { height: 52px; }
  .cf-firma-nombre { border-top: 1.5px solid #333; padding-top: 5px; font-weight: bold; font-size: 10.5pt; }
  .cf-firma-rut { font-size: 8.5pt; color: #555; margin-top: 3px; }
  .cf-firma-rol { font-size: 8.5pt; color: #333; margin-top: 2px; font-weight: bold; text-transform: uppercase; }

  @media print { body { padding: 10mm 15mm; } }
</style>
</head>
<body>

  <div class="cf-header">
    <div class="cf-empresa-col">
      <div class="cf-empresa-nombre">${empresa.razonSocial}</div>
      <div class="cf-empresa-sub">RUT: ${empresa.rut} &nbsp;·&nbsp; Giro: ${empresa.giro}${empresa.direccion ? '<br/>' + empresa.direccion : ''}</div>
    </div>
    <div class="cf-titulo-col">
      <div class="cf-titulo-doc">Documento Laboral</div>
      <div class="cf-titulo-main">COMPROBANTE</div>
      <div class="cf-fecha-doc">Emitido: ${fecha(hoy)}</div>
    </div>
  </div>
  <div class="cf-title-bar">
    <h1>Comprobante de Feriado — Art. 67 CT</h1>
  </div>

  <div class="cf-seccion">Datos del Trabajador</div>
  <div class="cf-grid">
    <div class="cf-cell"><div class="cf-lbl">Nombre</div><div class="cf-val">${trabajador.nombre}</div></div>
    <div class="cf-cell"><div class="cf-lbl">RUT</div><div class="cf-val">${trabajador.rut}</div></div>
    <div class="cf-cell"><div class="cf-lbl">Cargo</div><div class="cf-val">${trabajador.cargo ?? '—'}</div></div>
    <div class="cf-cell"><div class="cf-lbl">Fecha de ingreso</div><div class="cf-val">${fecha(typeof trabajador.fechaIngreso === 'string' ? new Date(trabajador.fechaIngreso) : trabajador.fechaIngreso)}</div></div>
  </div>

  <div class="cf-seccion">Período de Feriado</div>
  ${doc.periodoAnual ? `<div class="cf-anual-badge"><span class="cf-anual-label">Período Anual Compensado</span><span class="cf-anual-val">${doc.periodoAnual}</span></div>` : ''}
  <div class="cf-tipo-badge">${tipoLabel}</div>
  <div class="cf-periodo-box">
    <div class="cf-periodo-item">
      <div class="cf-p-lbl">Desde</div>
      <div class="cf-p-val">${fecha(fi)}</div>
      <div class="cf-p-sub">(Inicio)</div>
    </div>
    <div class="cf-periodo-item">
      <div class="cf-p-lbl">Hasta</div>
      <div class="cf-p-val">${fecha(ff)}</div>
      <div class="cf-p-sub">(Término)</div>
    </div>
    <div class="cf-periodo-item">
      <div class="cf-p-lbl">Días hábiles</div>
      <div class="cf-p-val">${doc.diasHabiles}</div>
      <div class="cf-p-sub">(Lunes a viernes)</div>
    </div>
  </div>
  ${doc.observacion ? `<p style="font-size:9.5pt;color:#555;margin-bottom:12px;"><strong>Observación:</strong> ${doc.observacion}</p>` : ''}

  <div class="cf-seccion">Saldo de Vacaciones</div>
  <table class="cf-saldo-table">
    <thead>
      <tr>
        <th>Concepto</th>
        <th class="right">Días</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Días ganados acumulados (al momento del feriado)</td><td class="right">${saldoGanado}</td></tr>
      <tr><td>Saldo disponible antes de este feriado</td><td class="right">${doc.saldoPrevio}</td></tr>
      <tr><td>Días utilizados en este feriado</td><td class="right" style="color:#b00;">− ${doc.diasHabiles}</td></tr>
      ${doc.diasDerechoEnPeriodo != null ? (() => {
        const usados = doc.diasUsadosEnPeriodo ?? 0;
        const derecho = doc.diasDerechoEnPeriodo;
        const restantes = derecho - usados;
        const agotado = restantes <= 0;
        const color = agotado ? '#b00' : '#1a7a1a';
        const estadoTexto = agotado
          ? `<strong>Período agotado</strong> (${usados}/${derecho} días utilizados)`
          : `${usados} de ${derecho} días utilizados — quedan <strong>${restantes}</strong>`;
        return `<tr><td>Estado en ${doc.periodoAnual ?? 'el período'}</td><td class="right" style="color:${color};font-size:9.5pt;">${estadoTexto}</td></tr>`;
      })() : ''}
    </tbody>
    <tfoot>
      <tr><td>Saldo restante después de este feriado</td><td class="right">${doc.saldoPosterior}</td></tr>
    </tfoot>
  </table>

  <div class="cf-declaracion">
    En ${ciudadEmpresa}, a ${fecha(hoy)}, el Empleador <strong>${empresa.razonSocial}</strong> y el/la Trabajador/a <strong>${trabajador.nombre}</strong> (RUT ${trabajador.rut}) suscriben el presente comprobante, dejando constancia del otorgamiento y recepción conforme del feriado legal comprendido entre el ${fecha(fi)} y el ${fecha(ff)}, correspondiente a <strong>${doc.diasHabiles} días hábiles</strong>${doc.periodoAnual ? `, imputable al período anual <strong>${doc.periodoAnual}</strong>` : ''}, de conformidad al Artículo 67° y siguientes del Código del Trabajo.
  </div>

  <div class="cf-firmas">
    <div class="cf-firma-box">
      <div class="cf-firma-espacio"></div>
      <div class="cf-firma-nombre">${empresa.representanteLegal ?? empresa.razonSocial}</div>
      <div class="cf-firma-rut">RUT: ${empresa.rutRepresentante ?? empresa.rut}</div>
      <div class="cf-firma-rol">${empresa.razonSocial} · Por el Empleador</div>
    </div>
    <div class="cf-firma-box">
      <div class="cf-firma-espacio"></div>
      <div class="cf-firma-nombre">${trabajador.nombre}</div>
      <div class="cf-firma-rut">RUT: ${trabajador.rut}</div>
      <div class="cf-firma-rol">Trabajador/a — Recibo Conforme</div>
    </div>
  </div>

</body>
</html>`;
}

// ── Comprobante de Permiso Especial ──────────────────────────────────────────

export interface ComprobantePermisoDoc {
  tipo: string;
  fechaInicio: Date | string;
  fechaFin: Date | string;
  diasHabiles: number;
  conGoce: boolean;
  parentesco?: string;
  observacion?: string;
}

const TIPO_PERMISO_LABEL: Record<string, string> = {
  MATRIMONIO: 'Permiso por Matrimonio Civil (Art. 207 bis CT)',
  UNION_CIVIL: 'Permiso por Unión Civil (Ley 20.830 + Art. 207 bis CT)',
  FALLECIMIENTO: 'Permiso por Fallecimiento (Art. 66 CT)',
  SIN_GOCE: 'Permiso sin Goce de Sueldo',
  ADMINISTRATIVO: 'Permiso Administrativo',
  OTRO: 'Permiso Especial',
};

export function generarComprobantePermiso(
  empresa: EmpresaDoc,
  trabajador: TrabajadorDoc,
  doc: ComprobantePermisoDoc,
): string {
  const fi = typeof doc.fechaInicio === 'string' ? new Date(doc.fechaInicio) : doc.fechaInicio;
  const ff = typeof doc.fechaFin === 'string' ? new Date(doc.fechaFin) : doc.fechaFin;
  const hoy = new Date();
  const tipoLabel = TIPO_PERMISO_LABEL[doc.tipo] ?? doc.tipo;
  const ciudadEmpresa = empresa.direccion?.split(',').pop()?.trim() ?? 'Santiago';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comprobante de Permiso — ${trabajador.nombre}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; background: #fff; padding: 18mm 20mm 14mm; }

  .cf-header { display: flex; justify-content: space-between; align-items: stretch; border: 1.5px solid #1a1a2e; margin-bottom: 0; }
  .cf-empresa-col { padding: 10px 14px; flex: 1; border-right: 1.5px solid #1a1a2e; }
  .cf-empresa-nombre { font-size: 12.5pt; font-weight: bold; color: #1a1a2e; margin-bottom: 3px; }
  .cf-empresa-sub { font-size: 8.5pt; color: #555; line-height: 1.5; }
  .cf-titulo-col {
    background: #1a1a2e; color: #fff; padding: 10px 16px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-width: 180px; text-align: center;
  }
  .cf-titulo-doc { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.8; margin-bottom: 4px; }
  .cf-titulo-main { font-size: 11pt; font-weight: bold; }
  .cf-fecha-doc { font-size: 8pt; opacity: 0.7; margin-top: 4px; }

  .cf-title-bar { border-left: 1.5px solid #1a1a2e; border-right: 1.5px solid #1a1a2e; border-bottom: 1.5px solid #1a1a2e; text-align: center; padding: 8px 0 6px; margin-bottom: 14px; }
  .cf-title-bar h1 { font-size: 13pt; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; }

  .cf-seccion { display: flex; align-items: center; gap: 8px; font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; color: #fff; background: #2c3e6b; padding: 4px 10px; margin: 12px 0 8px; }

  .cf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 16px; margin-bottom: 12px; }
  .cf-cell { border: 1px solid #c8d0e8; border-radius: 3px; padding: 4px 10px; }
  .cf-cell .cf-lbl { font-size: 7pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.4px; color: #888; margin-bottom: 1px; }
  .cf-cell .cf-val { font-size: 10.5pt; }

  .cf-tipo-badge { display: inline-block; background: #e8ecf5; border: 1px solid #c8d0e8; border-radius: 3px; padding: 3px 10px; font-size: 9pt; color: #2c3e6b; font-weight: bold; margin-bottom: 12px; }

  .cf-periodo-box { border: 1.5px solid #2c3e6b; border-radius: 4px; padding: 12px 16px; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; }
  .cf-periodo-item .cf-p-lbl { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; color: #666; margin-bottom: 3px; }
  .cf-periodo-item .cf-p-val { font-size: 12pt; font-weight: bold; color: #1a1a2e; }
  .cf-periodo-item .cf-p-sub { font-size: 8pt; color: #888; margin-top: 1px; }

  .cf-goce-badge { display: inline-block; border-radius: 3px; padding: 3px 10px; font-size: 9pt; font-weight: bold; margin-bottom: 8px; }
  .cf-goce-si { background: #dcfce7; border: 1px solid #86efac; color: #166534; }
  .cf-goce-no { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }

  .cf-advertencia { border: 1.5px solid #f97316; border-radius: 4px; padding: 8px 14px; margin-bottom: 12px; background: #fff7ed; color: #9a3412; font-size: 10pt; line-height: 1.5; }

  .cf-declaracion { border: 1px solid #c8d0e8; border-radius: 4px; padding: 12px 16px; margin-bottom: 18px; background: #fafbfe; font-size: 10.5pt; line-height: 1.65; text-align: justify; }

  .cf-firmas { display: flex; justify-content: space-around; gap: 28px; margin-bottom: 16px; }
  .cf-firma-box { flex: 1; border: 1px solid #bbb; border-radius: 4px; padding: 14px 16px 10px; text-align: center; }
  .cf-firma-espacio { height: 52px; }
  .cf-firma-nombre { border-top: 1.5px solid #333; padding-top: 5px; font-weight: bold; font-size: 10.5pt; }
  .cf-firma-rut { font-size: 8.5pt; color: #555; margin-top: 3px; }
  .cf-firma-rol { font-size: 8.5pt; color: #333; margin-top: 2px; font-weight: bold; text-transform: uppercase; }

  @media print { body { padding: 10mm 15mm; } }
</style>
</head>
<body>

  <div class="cf-header">
    <div class="cf-empresa-col">
      <div class="cf-empresa-nombre">${empresa.razonSocial}</div>
      <div class="cf-empresa-sub">RUT: ${empresa.rut} &nbsp;·&nbsp; Giro: ${empresa.giro}${empresa.direccion ? '<br/>' + empresa.direccion : ''}</div>
    </div>
    <div class="cf-titulo-col">
      <div class="cf-titulo-doc">Documento Laboral</div>
      <div class="cf-titulo-main">COMPROBANTE</div>
      <div class="cf-fecha-doc">Emitido: ${fecha(hoy)}</div>
    </div>
  </div>
  <div class="cf-title-bar">
    <h1>Comprobante de Permiso</h1>
  </div>

  <div class="cf-seccion">Datos del Trabajador</div>
  <div class="cf-grid">
    <div class="cf-cell"><div class="cf-lbl">Nombre</div><div class="cf-val">${trabajador.nombre}</div></div>
    <div class="cf-cell"><div class="cf-lbl">RUT</div><div class="cf-val">${trabajador.rut}</div></div>
    <div class="cf-cell"><div class="cf-lbl">Cargo</div><div class="cf-val">${trabajador.cargo ?? '—'}</div></div>
    <div class="cf-cell"><div class="cf-lbl">Fecha de ingreso</div><div class="cf-val">${fecha(typeof trabajador.fechaIngreso === 'string' ? new Date(trabajador.fechaIngreso) : trabajador.fechaIngreso)}</div></div>
  </div>

  <div class="cf-seccion">Detalle del Permiso</div>
  <div class="cf-tipo-badge">${tipoLabel}</div>
  <div class="cf-periodo-box">
    <div class="cf-periodo-item">
      <div class="cf-p-lbl">Desde</div>
      <div class="cf-p-val">${fecha(fi)}</div>
      <div class="cf-p-sub">(Inicio)</div>
    </div>
    <div class="cf-periodo-item">
      <div class="cf-p-lbl">Hasta</div>
      <div class="cf-p-val">${fecha(ff)}</div>
      <div class="cf-p-sub">(Término)</div>
    </div>
    <div class="cf-periodo-item">
      <div class="cf-p-lbl">Días hábiles</div>
      <div class="cf-p-val">${doc.diasHabiles}</div>
      <div class="cf-p-sub">(Lunes a viernes)</div>
    </div>
  </div>
  <div>
    <span class="cf-goce-badge ${doc.conGoce ? 'cf-goce-si' : 'cf-goce-no'}">Goce de sueldo: ${doc.conGoce ? 'SÍ' : 'NO'}</span>
  </div>
  ${doc.parentesco ? `<p style="font-size:9.5pt;color:#555;margin:8px 0 4px;"><strong>Parentesco:</strong> ${doc.parentesco}</p>` : ''}
  ${doc.observacion ? `<p style="font-size:9.5pt;color:#555;margin:8px 0 12px;"><strong>Observación:</strong> ${doc.observacion}</p>` : ''}
  ${!doc.conGoce ? `<div class="cf-advertencia"><strong>Atención:</strong> Este permiso NO incluye remuneración. El período sin goce de sueldo será descontado de la liquidación del mes correspondiente.</div>` : ''}

  <div class="cf-declaracion">
    En ${ciudadEmpresa}, a ${fecha(hoy)}, el Empleador <strong>${empresa.razonSocial}</strong> otorga al/la Trabajador/a <strong>${trabajador.nombre}</strong> (RUT ${trabajador.rut}) el permiso especial indicado, comprendido entre el ${fecha(fi)} y el ${fecha(ff)}, correspondiente a <strong>${doc.diasHabiles} días hábiles</strong>, ${doc.conGoce ? 'con goce íntegro de remuneraciones' : 'sin goce de remuneración'}, de conformidad a la normativa laboral vigente.
  </div>

  <div class="cf-firmas">
    <div class="cf-firma-box">
      <div class="cf-firma-espacio"></div>
      <div class="cf-firma-nombre">${empresa.representanteLegal ?? empresa.razonSocial}</div>
      <div class="cf-firma-rut">RUT: ${empresa.rutRepresentante ?? empresa.rut}</div>
      <div class="cf-firma-rol">${empresa.razonSocial} · Por el Empleador</div>
    </div>
    <div class="cf-firma-box">
      <div class="cf-firma-espacio"></div>
      <div class="cf-firma-nombre">${trabajador.nombre}</div>
      <div class="cf-firma-rut">RUT: ${trabajador.rut}</div>
      <div class="cf-firma-rol">Trabajador/a — Recibo Conforme</div>
    </div>
  </div>

</body>
</html>`;
}

// ── Liquidación de Sueldo (Art. 54 bis CT) ───────────────────────────────────

export function generarLiquidacionPdf(
  empresa: EmpresaDoc,
  trabajador: TrabajadorDoc,
  liq: LiquidacionDoc,
): string {
  const mesLabel = MESES_ES[liq.mes - 1] ?? String(liq.mes);

  // Adic. ISAPRE: diferencia entre lo que paga por el plan y la cotización mandatoria (7%)
  const cotizSaludMandatoria = Math.round(liq.imponible * trabajador.pctSalud);
  const adicIsapre = liq.cotizSalud > cotizSaludMandatoria ? liq.cotizSalud - cotizSaludMandatoria : 0;

  const totalImponible = liq.imponible;
  const totalNoImponible = liq.movilizacion + liq.colacion + (liq.conectividad ?? 0) + (liq.asigFamiliar ?? 0);
  const totalHaberes = totalImponible + totalNoImponible;
  const subtotalLegal = liq.cotizAfp + liq.cotizSalud + liq.cotizCes + liq.impuestoUnico;
  const subtotalOtros = liq.anticipo + liq.otrosDescuentos;
  const totalDescuentos = subtotalLegal + subtotalOtros;

  const diasEfectivos = liq.diasTrabajados - (liq.diasSinGoce ?? 0);
  const labelDias = diasEfectivos < 30 ? ` (${diasEfectivos} días)` : '';
  const notaSinGoce = (liq.diasSinGoce ?? 0) > 0
    ? `<tr><td class="liq-concepto" style="color:#888;font-size:8.5pt;padding-left:16px;">↳ ${liq.diasSinGoce} día${(liq.diasSinGoce ?? 0) > 1 ? 's' : ''} permiso sin goce de sueldo</td><td></td></tr>`
    : '';

  const imponiblesRows = [
    `<tr><td class="liq-concepto">Sueldo Base${labelDias}</td><td class="liq-num">${clp(liq.sueldoBase)}</td></tr>${notaSinGoce}`,
    ...(liq.montoHorasDescuento > 0 ? [`<tr><td class="liq-concepto" style="color:#c0392b;">Desc. Atrasos${liq.horasDescuento > 0 ? ` (${liq.horasDescuento} hs)` : ''}</td><td class="liq-num" style="color:#c0392b;">-${clp(liq.montoHorasDescuento)}</td></tr>`] : []),
    ...(liq.gratificacion > 0 ? [`<tr><td class="liq-concepto">Gratif. Art.50${trabajador.tipoGratificacion === 'ART_50_LIBRE' ? ' S/T' : ''}</td><td class="liq-num">${clp(liq.gratificacion)}</td></tr>`] : []),
    ...(liq.horasExtra > 0 ? [`<tr><td class="liq-concepto">Horas Extraordinarias${liq.cantHorasExtra > 0 ? ` (${liq.cantHorasExtra} hrs · 50%)` : ''}</td><td class="liq-num">${clp(liq.horasExtra)}</td></tr>`] : []),
    ...(liq.horasExtraFeriado > 0 ? [`<tr><td class="liq-concepto">Horas Extraordinarias Feriado${liq.cantHorasExtraFeriado > 0 ? ` (${liq.cantHorasExtraFeriado} hrs · 100%)` : ''}</td><td class="liq-num">${clp(liq.horasExtraFeriado)}</td></tr>`] : []),
    ...(liq.bono > 0 ? [`<tr><td class="liq-concepto">Bono</td><td class="liq-num">${clp(liq.bono)}</td></tr>`] : []),
  ].join('');

  const noImponiblesRows = [
    ...(liq.movilizacion > 0 ? [`<tr><td class="liq-concepto">Movilización (no imp.)</td><td class="liq-num">${clp(liq.movilizacion)}</td></tr>`] : []),
    ...(liq.colacion > 0 ? [`<tr><td class="liq-concepto">Colación (no imp.)</td><td class="liq-num">${clp(liq.colacion)}</td></tr>`] : []),
    ...((liq.conectividad ?? 0) > 0 ? [`<tr><td class="liq-concepto">Asig. Conectividad (no imp.)</td><td class="liq-num">${clp(liq.conectividad!)}</td></tr>`] : []),
    ...((liq.asigFamiliar ?? 0) > 0 ? [`<tr><td class="liq-concepto">Asignación Familiar</td><td class="liq-num">${clp(liq.asigFamiliar!)}</td></tr>`] : []),
  ].join('');

  const descLegalRows = [
    `<tr><td class="liq-concepto">AFP ${trabajador.afp}</td><td class="liq-num">${clp(liq.cotizAfp)}</td></tr>`,
    `<tr><td class="liq-concepto">Salud ${trabajador.salud} (${(trabajador.pctSalud * 100).toFixed(0)}%)</td><td class="liq-num">${clp(cotizSaludMandatoria)}</td></tr>`,
    ...(adicIsapre > 0 ? [`<tr><td class="liq-concepto">Adic. ISAPRE</td><td class="liq-num">${clp(adicIsapre)}</td></tr>`] : []),
    ...(liq.cotizCes > 0 ? [`<tr><td class="liq-concepto">Seg. Cesantía (0.6%)</td><td class="liq-num">${clp(liq.cotizCes)}</td></tr>`] : []),
    ...(liq.impuestoUnico > 0 ? [`<tr><td class="liq-concepto">Imp. Único 2da Cat.</td><td class="liq-num">${clp(liq.impuestoUnico)}</td></tr>`] : []),
  ].join('');

  const descOtrosRows = [
    ...(liq.anticipo > 0 ? [`<tr><td class="liq-concepto">Anticipo de Sueldo</td><td class="liq-num">${clp(liq.anticipo)}</td></tr>`] : []),
    ...(liq.otrosDescuentos > 0 ? [`<tr><td class="liq-concepto">Otros Descuentos</td><td class="liq-num">${clp(liq.otrosDescuentos)}</td></tr>`] : []),
  ].join('');

  const ufStr = liq.uf ? liq.uf.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  const tasaAfpStr = trabajador.tasaAfp != null ? String(trabajador.tasaAfp) : '—';
  const planUFStr = trabajador.planIsapreUF != null ? String(trabajador.planIsapreUF) : '—';
  const fi = typeof trabajador.fechaIngreso === 'string'
    ? trabajador.fechaIngreso.slice(0, 10)
    : trabajador.fechaIngreso instanceof Date
      ? trabajador.fechaIngreso.toISOString().slice(0, 10)
      : '—';

  const copia = (titulo: string) => `
  <div class="liq-page">
    <!-- ENCABEZADO EMPRESA -->
    <div class="dfn-top">
      <div class="dfn-top-left">
        <div>${empresa.rut}</div>
        ${empresa.direccion ? `<div>${empresa.direccion}</div>` : ''}
      </div>
      <div class="dfn-top-right">${empresa.razonSocial}</div>
    </div>
    <div class="dfn-titulo-row">
      <span class="dfn-titulo">LIQUIDACION DE REMUNERACIONES</span>
      <span class="dfn-periodo">${mesLabel.toUpperCase()}</span>
      <span class="dfn-periodo">${liq.anio}</span>
      <span class="dfn-copia">${titulo}</span>
    </div>
    <hr class="dfn-hr" />

    <!-- DATOS TRABAJADOR -->
    <table class="dfn-worker">
      <tr>
        <td class="dfn-wlbl">NOMBRE:</td><td class="dfn-wval" colspan="3"><strong>${trabajador.nombre}</strong></td>
      </tr>
      <tr>
        <td class="dfn-wlbl">R.U.T:</td><td class="dfn-wval">${trabajador.rut}</td>
        <td class="dfn-wlbl">SUCURSAL:</td><td class="dfn-wval">${empresa.razonSocial}</td>
      </tr>
      <tr>
        <td class="dfn-wlbl">CARGO:</td><td class="dfn-wval">${trabajador.cargo ?? '—'}</td>
        <td class="dfn-wlbl">FECHA INGRESO:</td><td class="dfn-wval">${fi}</td>
      </tr>
      <tr>
        <td class="dfn-wlbl">D/TRABAJADOS:</td><td class="dfn-wval">${diasEfectivos}${(liq.diasSinGoce ?? 0) > 0 ? ` (${liq.diasSinGoce} sin goce)` : ''}</td>
        <td class="dfn-wlbl">${trabajador.salud}</td><td class="dfn-wval">${planUFStr}</td>
      </tr>
      <tr>
        <td class="dfn-wlbl">S.BASE CONTRATO:</td><td class="dfn-wval">${trabajador.sueldoBase.toLocaleString('es-CL')}</td>
        <td class="dfn-wlbl">AFP ${trabajador.afp}:</td><td class="dfn-wval">${tasaAfpStr}</td>
      </tr>
      <tr>
        <td class="dfn-wlbl">VALOR UF:</td><td class="dfn-wval">${ufStr}</td>
        <td></td><td></td>
      </tr>
    </table>
    <hr class="dfn-hr" />

    <!-- CUERPO: HABERES + DESCUENTOS -->
    <table class="dfn-body">
      <thead>
        <tr>
          <th class="dfn-th" colspan="2">DETALLE DE HABERES</th>
          <th class="dfn-th" colspan="2">DETALLE DE DESCUENTOS</th>
        </tr>
      </thead>
      <tbody>
        <!-- Sueldo Base -->
        <tr>
          <td class="dfn-lbl">SUELDO BASE.:</td>
          <td class="dfn-num">${liq.sueldoBase.toLocaleString('es-CL')}</td>
          <td class="dfn-lbl">T. FONDO PENSION</td>
          <td class="dfn-num">${liq.cotizAfp.toLocaleString('es-CL')}</td>
        </tr>
        ${liq.montoHorasDescuento > 0 ? `<tr>
          <td class="dfn-lbl dfn-desc">${liq.horasDescuento > 0 ? liq.horasDescuento.toFixed(2) : ''}  HORAS DESCUENTO:</td>
          <td class="dfn-num dfn-desc">${liq.montoHorasDescuento.toLocaleString('es-CL')}</td>
          <td class="dfn-lbl">APORTE SALUD</td>
          <td class="dfn-num">${cotizSaludMandatoria.toLocaleString('es-CL')}</td>
        </tr>` : `<tr>
          <td colspan="2"></td>
          <td class="dfn-lbl">APORTE SALUD</td>
          <td class="dfn-num">${cotizSaludMandatoria.toLocaleString('es-CL')}</td>
        </tr>`}
        ${adicIsapre > 0 ? `<tr>
          <td class="dfn-lbl">GRATIF. MENSUAL:</td>
          <td class="dfn-num">${liq.gratificacion.toLocaleString('es-CL')}</td>
          <td class="dfn-lbl">APORTE ADICIONAL DE SALUD</td>
          <td class="dfn-num">${adicIsapre.toLocaleString('es-CL')}</td>
        </tr>` : `<tr>
          <td class="dfn-lbl">GRATIF. MENSUAL:</td>
          <td class="dfn-num">${liq.gratificacion.toLocaleString('es-CL')}</td>
          <td colspan="2"></td>
        </tr>`}
        ${liq.horasExtra > 0 ? `<tr>
          <td class="dfn-lbl">HRS. EXTRA${liq.cantHorasExtra > 0 ? ` (${liq.cantHorasExtra} × 50%):` : ':'}</td>
          <td class="dfn-num">${liq.horasExtra.toLocaleString('es-CL')}</td>
          <td colspan="2"></td>
        </tr>` : ''}
        ${liq.horasExtraFeriado > 0 ? `<tr>
          <td class="dfn-lbl">HRS. EXTRA FERIADO${liq.cantHorasExtraFeriado > 0 ? ` (${liq.cantHorasExtraFeriado} × 100%):` : ':'}</td>
          <td class="dfn-num">${liq.horasExtraFeriado.toLocaleString('es-CL')}</td>
          <td colspan="2"></td>
        </tr>` : ''}
        ${liq.bono > 0 ? `<tr>
          <td class="dfn-lbl">BONO:</td>
          <td class="dfn-num">${liq.bono.toLocaleString('es-CL')}</td>
          <td colspan="2"></td>
        </tr>` : ''}
        <tr class="dfn-subtotal">
          <td class="dfn-lbl">T. HAB. IMP. Y TRIBUT.</td>
          <td class="dfn-num">${totalImponible.toLocaleString('es-CL')}</td>
          <td class="dfn-lbl">AFC TRAB. 0.6</td>
          <td class="dfn-num">${liq.cotizCes.toLocaleString('es-CL')}</td>
        </tr>
        <tr class="dfn-subtotal">
          <td colspan="2"></td>
          <td class="dfn-lbl"><strong>T. LEYES SOCIALES</strong></td>
          <td class="dfn-num"><strong>${subtotalLegal.toLocaleString('es-CL')}</strong></td>
        </tr>
        <!-- No imponibles -->
        ${liq.movilizacion > 0 ? `<tr>
          <td class="dfn-lbl">T. MOVILIZACION</td>
          <td class="dfn-num">${liq.movilizacion.toLocaleString('es-CL')}</td>
          <td class="dfn-lbl">IMPUESTO UNICO</td>
          <td class="dfn-num">${liq.impuestoUnico.toLocaleString('es-CL')}</td>
        </tr>` : liq.impuestoUnico > 0 ? `<tr>
          <td colspan="2"></td>
          <td class="dfn-lbl">IMPUESTO UNICO</td>
          <td class="dfn-num">${liq.impuestoUnico.toLocaleString('es-CL')}</td>
        </tr>` : ''}
        ${liq.colacion > 0 ? `<tr>
          <td class="dfn-lbl">T. COLACION</td>
          <td class="dfn-num">${liq.colacion.toLocaleString('es-CL')}</td>
          <td class="dfn-lbl">ANTICIPO DE SUELDO</td>
          <td class="dfn-num">${liq.anticipo > 0 ? liq.anticipo.toLocaleString('es-CL') : ''}</td>
        </tr>` : liq.anticipo > 0 ? `<tr>
          <td colspan="2"></td>
          <td class="dfn-lbl">ANTICIPO DE SUELDO</td>
          <td class="dfn-num">${liq.anticipo.toLocaleString('es-CL')}</td>
        </tr>` : ''}
        ${(liq.conectividad ?? 0) > 0 ? `<tr>
          <td class="dfn-lbl">ASIG. CONECTIVIDAD</td>
          <td class="dfn-num">${liq.conectividad!.toLocaleString('es-CL')}</td>
          <td colspan="2"></td>
        </tr>` : ''}
        ${(liq.asigFamiliar ?? 0) > 0 ? `<tr>
          <td class="dfn-lbl">ASIG. FAMILIAR</td>
          <td class="dfn-num">${liq.asigFamiliar!.toLocaleString('es-CL')}</td>
          <td colspan="2"></td>
        </tr>` : ''}
        ${liq.otrosDescuentos > 0 ? `<tr>
          <td colspan="2"></td>
          <td class="dfn-lbl">OTROS DESCUENTOS</td>
          <td class="dfn-num">${liq.otrosDescuentos.toLocaleString('es-CL')}</td>
        </tr>` : ''}
        <tr class="dfn-subtotal">
          <td class="dfn-lbl">T.HAB. N.IMP. Y N.TRIBUT.</td>
          <td class="dfn-num">${totalNoImponible.toLocaleString('es-CL')}</td>
          <td class="dfn-lbl"><strong>T. OTROS DESCUENTOS</strong></td>
          <td class="dfn-num"><strong>${subtotalOtros.toLocaleString('es-CL')}</strong></td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="dfn-total-hab">
          <td class="dfn-lbl">TOTAL HABERES</td>
          <td class="dfn-num">${totalHaberes.toLocaleString('es-CL')}</td>
          <td></td>
          <td class="dfn-num">${totalDescuentos.toLocaleString('es-CL')}</td>
        </tr>
        <tr class="dfn-liquido-row">
          <td colspan="2" class="dfn-lbl">LIQUIDO A PAGO: <strong>${liq.liquido.toLocaleString('es-CL')}</strong> &nbsp; ${numToWords(liq.liquido)}</td>
          <td class="dfn-lbl">SOBREGIRO:</td>
          <td class="dfn-num">0</td>
        </tr>
      </tfoot>
    </table>

    <!-- RECIBO -->
    <div class="dfn-recibo">
      Certifico que he recibido de <strong>${empresa.razonSocial}</strong> la suma de <strong>$${liq.liquido.toLocaleString('es-CL')}</strong> &nbsp; ${numToWords(liq.liquido)}<br>
      a mi entera satisfacción y no tengo cargo ni cobro alguno posterior que hacer, por ninguno de los conceptos comprendidos en esta liquidación.
    </div>
    <div class="dfn-footer">
      <span>Forma de Pago: Abono en cuenta bancaria</span>
      <span>Valor UF: ${ufStr}</span>
    </div>
    <div class="dfn-firmas">
      <div class="dfn-firma">
        <div class="dfn-firma-linea"></div>
        <div>RECIBI CONFORME</div>
        <div class="dfn-firma-sub">${trabajador.nombre}</div>
      </div>
      <div class="dfn-firma">
        <div class="dfn-firma-linea"></div>
        <div>${empresa.representanteLegal ?? empresa.razonSocial}</div>
        <div class="dfn-firma-sub">Por el Empleador</div>
      </div>
    </div>
  </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Liquidación ${mesLabel} ${liq.anio} — ${trabajador.nombre}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
  .liq-page { padding: 12mm 14mm 8mm; max-width: 210mm; margin: 0 auto; }

  /* ENCABEZADO EMPRESA */
  .dfn-top { display: flex; justify-content: space-between; font-size: 8.5pt; margin-bottom: 4px; }
  .dfn-top-right { font-weight: bold; font-size: 9.5pt; }
  .dfn-titulo-row { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; }
  .dfn-titulo { font-weight: bold; font-size: 11pt; text-transform: uppercase; }
  .dfn-periodo { font-weight: bold; font-size: 11pt; }
  .dfn-copia { font-size: 7.5pt; color: #555; border: 1px solid #aaa; padding: 1px 5px; margin-left: auto; }
  .dfn-hr { border: none; border-top: 2px solid #000; margin: 4px 0; }

  /* DATOS TRABAJADOR */
  .dfn-worker { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 8.5pt; }
  .dfn-worker td { padding: 2px 6px; }
  .dfn-wlbl { font-weight: bold; white-space: nowrap; }
  .dfn-wval { width: 35%; }

  /* CUERPO */
  .dfn-body { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8.5pt; }
  .dfn-body th { background: #000; color: #fff; padding: 4px 8px; text-align: left; font-size: 9pt; }
  .dfn-body td { padding: 2px 8px; vertical-align: top; border-bottom: 1px solid #eee; }
  .dfn-lbl { width: 30%; }
  .dfn-num { width: 20%; text-align: right; }
  .dfn-desc { color: #c00; }
  .dfn-subtotal td { border-top: 1px solid #999; border-bottom: 2px solid #000; font-weight: bold; background: #f5f5f5; }
  .dfn-total-hab td { font-weight: bold; font-size: 9.5pt; border-top: 2px solid #000; background: #eee; padding: 4px 8px; }
  .dfn-liquido-row td { font-size: 9.5pt; border-top: 1px solid #000; padding: 4px 8px; }

  /* RECIBO / FOOTER */
  .dfn-recibo { font-size: 8pt; line-height: 1.5; margin: 8px 0 4px; }
  .dfn-footer { display: flex; justify-content: space-between; font-size: 8pt; margin: 4px 0 16px; }
  .dfn-firmas { display: flex; justify-content: space-around; margin-top: 8px; }
  .dfn-firma { text-align: center; min-width: 140px; font-size: 8.5pt; }
  .dfn-firma-linea { border-top: 1px solid #000; margin-top: 30px; margin-bottom: 3px; }
  .dfn-firma-sub { font-size: 7.5pt; color: #555; margin-top: 1px; }

  .liq-separator { border: none; border-top: 2px dashed #999; margin: 10px 0; }
  @media print { .liq-page { padding: 6mm 10mm; } .liq-separator { page-break-before: always; border: none; } .dfn-print-bar { display: none; } }
  .dfn-print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1a1a2e; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; z-index: 100; font-size: 10pt; }
  .dfn-print-bar button { background: #fff; color: #1a1a2e; border: none; padding: 6px 18px; font-size: 10pt; font-weight: bold; border-radius: 4px; cursor: pointer; }
  .dfn-print-bar button:hover { background: #e8e8e8; }
  body { padding-top: 42px; }
</style>
</head>
<body>
<div class="dfn-print-bar">
  <span>Liquidación ${mesLabel.toUpperCase()} ${liq.anio} — ${trabajador.nombre}</span>
  <button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
</div>
${copia('COPIA EMPLEADOR')}
<hr class="liq-separator" />
${copia('COPIA TRABAJADOR')}
</body>
</html>`;
}

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
}

export interface LiquidacionDoc {
  anio: number;
  mes: number;
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

  const remuneracionItems: string[] = [
    `<tr><td>Sueldo base mensual:</td><td><strong>${clp(trabajador.sueldoBase)}</strong> (${numToWords(trabajador.sueldoBase)} PESOS)</td></tr>`,
  ];
  if (trabajador.tieneMovilizacion && trabajador.montoMovilizacion) {
    remuneracionItems.push(`<tr><td>Asignación de movilización (no imponible):</td><td>${clp(trabajador.montoMovilizacion)} mensuales</td></tr>`);
  }
  if (trabajador.tieneColacion && trabajador.montoColacion) {
    remuneracionItems.push(`<tr><td>Asignación de colación (no imponible):</td><td>${clp(trabajador.montoColacion)} mensuales</td></tr>`);
  }
  remuneracionItems.push(`<tr><td>Gratificación:</td><td>${GRATIFICACION_LABEL[trabajador.tipoGratificacion] ?? ''}</td></tr>`);

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Contrato de Trabajo — ${trabajador.nombre}</title>${BASE_CSS}
<style>
  .numero-contrato { text-align:right; font-size:9.5pt; color:#555; margin-bottom:4px; }
  .identificacion-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 24px; }
  .id-row { display:flex; gap:6px; font-size:10.5pt; padding:2px 0; }
  .id-row span:first-child { font-weight:bold; color:#333; min-width:140px; flex-shrink:0; }
</style>
</head>
<body>
  <p class="numero-contrato">Fecha: ${fecha(hoy)}</p>

  <div class="header-box">
    <div class="empresa">${empresa.razonSocial}<br/><span style="font-size:9.5pt;font-weight:normal">RUT: ${empresa.rut} &nbsp;·&nbsp; Giro: ${empresa.giro}</span>${empresa.direccion ? '<br/><span style="font-size:9pt;color:#555">' + empresa.direccion + '</span>' : ''}</div>
    <div class="info" style="display:flex;flex-direction:column;align-items:flex-end;justify-content:center;">
      <span style="font-size:8.5pt;color:#888;margin-bottom:2px;">TIPO DE CONTRATO</span>
      <span style="font-size:10pt;font-weight:bold;">${tipoContratoLabel}</span>
    </div>
  </div>

  <h1>Contrato Individual de Trabajo</h1>

  <!-- CLÁUSULA PRIMERA: COMPARECENCIA -->
  <div class="clausula">
    <h2>Cláusula Primera — Comparecencia e Individualización de las Partes</h2>
    <p>En ${ciudadEmpresa}, a ${fecha(hoy)}, comparecen:</p>
    <br/>
    <p><strong>EMPLEADOR:</strong> <strong>${empresa.razonSocial}</strong>, RUT N° ${empresa.rut}, con giro <em>${empresa.giro}</em>${empresa.direccion ? ', domiciliada en ' + empresa.direccion : ''}, representada legalmente${empresa.representanteLegal ? ' por don/doña <strong>' + empresa.representanteLegal + '</strong>, cédula de identidad / RUT N° ' + (empresa.rutRepresentante ?? '—') + ',' : ','} en adelante denominada indistintamente "<strong>la Empresa</strong>" o "<strong>el Empleador</strong>".</p>
    <br/>
    <p><strong>TRABAJADOR/A:</strong></p>
    <div class="identificacion-grid" style="margin-top:8px;">
      <div>
        <div class="id-row"><span>Nombre completo:</span><span>${trabajador.nombre}</span></div>
        <div class="id-row"><span>RUT:</span><span>${trabajador.rut}</span></div>
        ${fnLabel ? `<div class="id-row"><span>Fecha de nacimiento:</span><span>${fnLabel}</span></div>` : ''}
        ${ecLabel ? `<div class="id-row"><span>Estado civil:</span><span style="text-transform:capitalize">${ecLabel}</span></div>` : ''}
      </div>
      <div>
        <div class="id-row"><span>Nacionalidad:</span><span style="text-transform:capitalize">${nacionalidad}</span></div>
        ${trabajador.domicilio ? `<div class="id-row"><span>Domicilio:</span><span>${trabajador.domicilio}${trabajador.comuna ? ', ' + trabajador.comuna : ''}${trabajador.region ? ', ' + trabajador.region : ''}</span></div>` : ''}
      </div>
    </div>
    <br/>
    <p>En adelante denominado/a "<strong>el Trabajador</strong>", han convenido el siguiente Contrato Individual de Trabajo, sujeto a las normas del Código del Trabajo y demás disposiciones legales vigentes.</p>
  </div>

  <!-- CLÁUSULA SEGUNDA: FUNCIONES Y LUGAR DE TRABAJO -->
  <div class="clausula">
    <h2>Cláusula Segunda — Naturaleza de los Servicios y Lugar de Trabajo</h2>
    <p>El Trabajador se obliga a desempeñar el cargo de <strong>${trabajador.cargo ?? 'los servicios pactados'}</strong> y a ejecutar todas las funciones y labores inherentes al mismo que le sean encomendadas por el Empleador, de acuerdo con la naturaleza del cargo y las instrucciones que imparta la jefatura correspondiente.</p>
    <br/>
    <p>Los servicios se prestarán en el establecimiento del Empleador ubicado en <strong>${empresa.direccion ?? ciudadEmpresa}</strong>, sin perjuicio de las necesidades de la empresa que pudieren requerir que el trabajador preste servicios en otros lugares dentro del territorio nacional, de conformidad al Artículo 10 N°3 del Código del Trabajo.</p>
  </div>

  <!-- CLÁUSULA TERCERA: JORNADA DE TRABAJO -->
  <div class="clausula">
    <h2>Cláusula Tercera — Jornada de Trabajo</h2>
    <p>La jornada ordinaria de trabajo será de <strong>${trabajador.jornadaHoras} horas semanales</strong>, distribuidas de lunes a viernes, en los horarios que el Empleador determine, respetando en todo caso los límites establecidos en el Artículo 22 del Código del Trabajo y la jornada máxima legal vigente.</p>
    <br/>
    <p>Las horas trabajadas en exceso de la jornada ordinaria pactada serán consideradas horas extraordinarias y se pagarán con el recargo del 50% sobre el valor de la hora ordinaria, conforme al Artículo 32 del Código del Trabajo. Las horas extraordinarias deberán ser autorizadas previamente y por escrito por el Empleador.</p>
    <br/>
    <p>El Trabajador tendrá derecho a un descanso de, al menos, treinta minutos durante la jornada diaria, el que no se imputará a la jornada de trabajo.</p>
  </div>

  <!-- CLÁUSULA CUARTA: REMUNERACIÓN -->
  <div class="clausula">
    <h2>Cláusula Cuarta — Remuneración</h2>
    <p>El Empleador pagará al Trabajador las siguientes remuneraciones y beneficios:</p>
    <table class="datos" style="margin-top:8px;margin-bottom:8px;">
      ${remuneracionItems.join('\n      ')}
    </table>
    <p>Las remuneraciones serán liquidadas y pagadas mensualmente, el último día hábil de cada mes, mediante cheque, transferencia electrónica u otro medio de pago convenido. El Empleador entregará al Trabajador la correspondiente liquidación de sueldo, conforme al Artículo 54 bis del Código del Trabajo.</p>
    <br/>
    <p>Las asignaciones de movilización y colación, en caso de corresponder, no constituyen remuneración y no son imponibles, conforme al Artículo 41 del Código del Trabajo.</p>
  </div>

  <!-- CLÁUSULA QUINTA: DURACIÓN -->
  <div class="clausula">
    <h2>Cláusula Quinta — Duración y Vigencia del Contrato</h2>
    ${trabajador.tipoContrato === 'INDEFINIDO'
      ? `<p>El presente contrato es de duración <strong>indefinida</strong> y comenzará a regir a contar del <strong>${fecha(fechaIngreso)}</strong>, fecha en que el Trabajador inició la prestación de sus servicios.</p>`
      : `<p>El presente contrato es <strong>${tipoContratoLabel}</strong> y comenzará a regir a contar del <strong>${fecha(fechaIngreso)}</strong>. La duración y término del contrato se regirán por las normas aplicables al tipo de contratación pactado y lo dispuesto en el Código del Trabajo.</p>`
    }
    <br/>
    <p>Las partes dejan constancia de que el presente instrumento se suscribe dentro del plazo legal de 15 días corridos contados desde la incorporación del Trabajador, conforme al Artículo 9° del Código del Trabajo.</p>
  </div>

  <!-- CLÁUSULA SEXTA: PREVISIÓN SOCIAL -->
  <div class="clausula">
    <h2>Cláusula Sexta — Previsión Social y Seguro de Salud</h2>
    <p>El Trabajador se encuentra afiliado y cotizará en las siguientes instituciones previsionales:</p>
    <table class="datos" style="margin-top:8px;margin-bottom:8px;">
      <tr><td>AFP:</td><td><strong>${trabajador.afp}</strong></td></tr>
      <tr><td>Institución de Salud:</td><td><strong>${trabajador.salud}</strong> (cotización del ${(trabajador.pctSalud * 100).toFixed(1)}% sobre la remuneración imponible)</td></tr>
      ${trabajador.tieneCes ? '<tr><td>Seguro de Cesantía:</td><td>Administradora de Fondos de Cesantía (AFC Chile S.A.)</td></tr>' : ''}
    </table>
    <p>El Empleador se obliga a efectuar las retenciones y a enterar las cotizaciones previsionales dentro de los plazos establecidos por la ley, bajo apercibimiento de las sanciones previstas en el Decreto Ley N° 3.500 y demás normativa vigente.</p>
  </div>

  <!-- CLÁUSULA SÉPTIMA: VACACIONES -->
  <div class="clausula">
    <h2>Cláusula Séptima — Feriado Anual</h2>
    <p>El Trabajador tendrá derecho a un feriado anual de quince días hábiles con goce íntegro de remuneraciones, una vez cumplido un año de servicio continuo con el Empleador, conforme al Artículo 67 del Código del Trabajo.</p>
    <br/>
    <p>En los contratos a plazo fijo o por obra o faena determinada, el trabajador tendrá derecho a feriado proporcional al tiempo trabajado, con goce de las remuneraciones correspondientes, si el contrato durase más de treinta días.</p>
    <br/>
    <p>El feriado deberá ser concedido preferentemente en primavera o verano, pudiendo las partes acordar su fraccionamiento, pero siempre que uno de los períodos tenga, a lo menos, diez días hábiles continuos.</p>
  </div>

  <!-- CLÁUSULA OCTAVA: OBLIGACIONES DEL TRABAJADOR -->
  <div class="clausula">
    <h2>Cláusula Octava — Obligaciones del Trabajador</h2>
    <p>Sin perjuicio de las normas del Código del Trabajo y del Reglamento Interno, el Trabajador se obliga especialmente a:</p>
    <ol style="margin-left:18px;line-height:1.7;font-size:10.5pt;">
      <li>Prestar sus servicios con la debida diligencia, cuidado y esmero.</li>
      <li>Respetar los horarios y jornadas de trabajo establecidos.</li>
      <li>Observar las medidas de prevención de riesgos y las normas de seguridad e higiene ocupacional.</li>
      <li>Guardar la debida reserva respecto de los negocios, documentos e información confidencial de la empresa.</li>
      <li>Cuidar los bienes, herramientas e instalaciones que le sean encomendados.</li>
      <li>Comunicar al Empleador con la debida anticipación cualquier ausencia por enfermedad u otra causa justificada.</li>
      <li>Comunicar oportunamente cualquier cambio de domicilio, estado civil u otros datos que afecten su situación previsional o tributaria.</li>
    </ol>
  </div>

  <!-- CLÁUSULA NOVENA: PROHIBICIONES -->
  <div class="clausula">
    <h2>Cláusula Novena — Prohibiciones</h2>
    <p>Queda especialmente prohibido al Trabajador:</p>
    <ol style="margin-left:18px;line-height:1.7;font-size:10.5pt;">
      <li>Trabajar para otra empresa o persona en actividades que compitan directa o indirectamente con el giro del Empleador, durante la vigencia del presente contrato.</li>
      <li>Revelar información confidencial, secretos comerciales o datos de clientes de la empresa a terceros, durante y con posterioridad a la vigencia del contrato.</li>
      <li>Realizar actividades ajenas a sus funciones dentro del horario de trabajo sin autorización escrita del Empleador.</li>
      <li>Introducir al lugar de trabajo o consumir bebidas alcohólicas, estupefacientes u otras sustancias prohibidas.</li>
      <li>Utilizar los bienes, equipos y sistemas informáticos del Empleador para fines particulares o ajenos al servicio.</li>
    </ol>
  </div>

  <!-- CLÁUSULA DÉCIMA: REGLAMENTO INTERNO Y DISPOSICIONES GENERALES -->
  <div class="clausula">
    <h2>Cláusula Décima — Reglamento Interno y Normativa Aplicable</h2>
    <p>El Trabajador declara haber recibido un ejemplar del Reglamento Interno de Orden, Higiene y Seguridad de la empresa, cuyas disposiciones conoce, acepta y se compromete a cumplir. El incumplimiento de dichas normas podrá dar lugar a las sanciones previstas en el mismo Reglamento y en la ley.</p>
    <br/>
    <p>En lo no previsto en el presente contrato, se estará a lo dispuesto en el Código del Trabajo, sus reglamentos y demás disposiciones legales y reglamentarias vigentes o que se dicten en el futuro.</p>
  </div>

  <!-- CLÁUSULA UNDÉCIMA: EJEMPLARES -->
  <div class="clausula">
    <h2>Cláusula Undécima — Número de Ejemplares</h2>
    <p>El presente contrato se firma en <strong>dos ejemplares</strong> del mismo tenor y fecha, quedando uno en poder de cada parte, con pleno valor y eficacia legal para ambas.</p>
  </div>

  <div class="firmas">
    <div class="firma-bloque">
      <div style="height:55px;"></div>
      <div class="firma-linea">${empresa.representanteLegal ?? empresa.razonSocial}</div>
      <div class="firma-label">RUT: ${empresa.rutRepresentante ?? empresa.rut}<br/><strong>${empresa.razonSocial}</strong><br/>Por el Empleador</div>
    </div>
    <div class="firma-bloque">
      <div style="height:55px;"></div>
      <div class="firma-linea">${trabajador.nombre}</div>
      <div class="firma-label">RUT: ${trabajador.rut}<br/>Trabajador/a</div>
    </div>
  </div>

  <div style="margin-top:28px;border-top:1px solid #ccc;padding-top:10px;font-size:9pt;color:#666;">
    <p><strong>Recepción de copia:</strong> El/la trabajador/a declara haber recibido un ejemplar del presente contrato en la fecha indicada. ______________________________</p>
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
    { label: 'Vacaciones proporcionales', dias: `${doc.diasVacaciones} días`, monto: doc.montoVacaciones },
    ...(doc.indemnizacion > 0 ? [{ label: `Indemnización por años de servicio (${Math.min(Math.floor(doc.aniosServicio), 11)} año(s))`, dias: '', monto: doc.indemnizacion }] : []),
    ...(doc.avisoPrevio > 0 ? [{ label: 'Aviso previo (sustitución de aviso)', dias: '', monto: doc.avisoPrevio }] : []),
    ...(doc.otrosDescuentos > 0 ? [{ label: 'Otros descuentos', dias: '', monto: -doc.otrosDescuentos }] : []),
  ];

  const filasHtml = filas.map(f => `
    <tr>
      <td>${f.label}</td>
      <td class="monto">${f.dias}</td>
      <td class="monto" style="color:${f.monto < 0 ? '#c00' : 'inherit'}">${clp(Math.abs(f.monto))}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Finiquito — ${trabajador.nombre}</title>${BASE_CSS}</head>
<body>
  <div class="header-box">
    <div class="empresa">${empresa.razonSocial}<br/><span style="font-size:9.5pt;font-weight:normal">RUT: ${empresa.rut}</span></div>
    <div class="info">Fecha: ${fecha(fechaT)}</div>
  </div>

  <h1>Finiquito de Contrato de Trabajo</h1>

  <h2>Datos de las partes</h2>
  <table class="datos">
    <tr><td>Empleador:</td><td>${empresa.razonSocial} (RUT ${empresa.rut})</td></tr>
    <tr><td>Representante:</td><td>${empresa.representanteLegal ?? '—'} ${empresa.rutRepresentante ? '(RUT ' + empresa.rutRepresentante + ')' : ''}</td></tr>
    <tr><td>Trabajador/a:</td><td>${trabajador.nombre} (RUT ${trabajador.rut})</td></tr>
    <tr><td>Cargo:</td><td>${trabajador.cargo ?? '—'}</td></tr>
    <tr><td>Fecha de ingreso:</td><td>${fecha(fechaI)}</td></tr>
    <tr><td>Fecha de término:</td><td>${fecha(fechaT)}</td></tr>
    <tr><td>Años de servicio:</td><td>${doc.aniosServicio.toFixed(2)}</td></tr>
    <tr><td>Último sueldo base:</td><td>${clp(trabajador.sueldoBase)}</td></tr>
  </table>

  <h2>Causal de término</h2>
  <p style="font-size:10.5pt;margin-bottom:12px;">${causalTexto}</p>

  <h2>Liquidación de haberes</h2>
  <table class="montos">
    <thead><tr><th>Concepto</th><th style="text-align:right">Días / detalle</th><th style="text-align:right">Monto</th></tr></thead>
    <tbody>
      ${filasHtml}
      <tr class="total">
        <td colspan="2">TOTAL BRUTO</td>
        <td class="monto">${clp(doc.totalBruto)}</td>
      </tr>
      <tr class="total">
        <td colspan="2">TOTAL NETO A PAGAR</td>
        <td class="monto">${clp(doc.totalNeto)}</td>
      </tr>
    </tbody>
  </table>

  <div class="num-palabras">SON: ${numToWords(doc.totalNeto)} PESOS</div>

  <div class="clausula" style="margin-top:14px;">
    <p>En ${ciudadEmpresa}, a ${fecha(fechaT)}, las partes suscriben el presente finiquito de mutuo acuerdo,
    declarando el trabajador/a haber recibido íntegra y cabalmente todas las prestaciones adeudadas
    por concepto del contrato de trabajo que por este acto se da por terminado, no teniendo
    cargo ni acción alguna que deducir contra el empleador por dicho contrato de trabajo.</p>
  </div>

  <div class="firmas">
    <div class="firma-bloque">
      <div style="height:50px;"></div>
      <div class="firma-linea">${empresa.representanteLegal ?? empresa.razonSocial}</div>
      <div class="firma-label">RUT: ${empresa.rutRepresentante ?? empresa.rut}<br/>Por el Empleador</div>
    </div>
    <div class="firma-bloque">
      <div style="height:50px;"></div>
      <div class="firma-linea">${trabajador.nombre}</div>
      <div class="firma-label">RUT: ${trabajador.rut}<br/>Trabajador/a</div>
    </div>
  </div>

  <div style="margin-top:30px;border-top:1px solid #ccc;padding-top:10px;font-size:9pt;color:#555;">
    <p>Ratificado ante Notario / Inspector del Trabajo — Firma y timbre: _______________________</p>
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
  const totalImponible = liq.imponible;
  const totalNoImponible = liq.movilizacion + liq.colacion;
  const totalHaberes = totalImponible + totalNoImponible;
  const totalDescuentos = liq.cotizAfp + liq.cotizSalud + liq.cotizCes + liq.impuestoUnico + liq.anticipo;

  const haberes: { label: string; imponible: number; noImponible: number }[] = [
    { label: 'Sueldo Base', imponible: liq.sueldoBase, noImponible: 0 },
    ...(liq.horasExtra > 0 ? [{ label: 'Horas Extraordinarias (50%)', imponible: liq.horasExtra, noImponible: 0 }] : []),
    ...(liq.bono > 0 ? [{ label: 'Bono', imponible: liq.bono, noImponible: 0 }] : []),
    ...(liq.gratificacion > 0 ? [{ label: 'Gratificación Legal', imponible: liq.gratificacion, noImponible: 0 }] : []),
    ...(liq.movilizacion > 0 ? [{ label: 'Asig. de Movilización', imponible: 0, noImponible: liq.movilizacion }] : []),
    ...(liq.colacion > 0 ? [{ label: 'Asig. de Colación', imponible: 0, noImponible: liq.colacion }] : []),
  ];

  const descuentos: { label: string; monto: number }[] = [
    { label: `Cotización AFP ${trabajador.afp}`, monto: liq.cotizAfp },
    { label: `Cotización Salud ${trabajador.salud} (${(trabajador.pctSalud * 100).toFixed(1)}%)`, monto: liq.cotizSalud },
    ...(liq.cotizCes > 0 ? [{ label: 'CES — Cotización Trabajador (0.6%)', monto: liq.cotizCes }] : []),
    ...(liq.impuestoUnico > 0 ? [{ label: 'Impuesto Único 2ª Categoría', monto: liq.impuestoUnico }] : []),
    ...(liq.anticipo > 0 ? [{ label: 'Anticipo de Remuneración', monto: liq.anticipo }] : []),
  ];

  const haberesRows = haberes.map(h => `
        <tr>
          <td class="liq-concepto">${h.label}</td>
          <td class="liq-num">${h.imponible > 0 ? clp(h.imponible) : ''}</td>
          <td class="liq-num">${h.noImponible > 0 ? clp(h.noImponible) : ''}</td>
        </tr>`).join('');

  const descRows = descuentos.map(d => `
        <tr>
          <td class="liq-concepto">${d.label}</td>
          <td class="liq-num">${clp(d.monto)}</td>
        </tr>`).join('');

  const copia = (titulo: string) => `
  <div class="liq-page">
    <!-- ENCABEZADO -->
    <div class="liq-header">
      <div class="liq-empresa">
        <div class="liq-empresa-nombre">${empresa.razonSocial}</div>
        <div class="liq-empresa-datos">RUT: ${empresa.rut}</div>
        ${empresa.giro ? `<div class="liq-empresa-datos">Giro: ${empresa.giro}</div>` : ''}
        ${empresa.direccion ? `<div class="liq-empresa-datos">${empresa.direccion}</div>` : ''}
      </div>
      <div class="liq-titulo-bloque">
        <div class="liq-titulo">LIQUIDACIÓN DE REMUNERACIONES</div>
        <div class="liq-periodo">${mesLabel.toUpperCase()} ${liq.anio}</div>
        <div class="liq-copia-label">${titulo}</div>
      </div>
    </div>

    <!-- DATOS TRABAJADOR -->
    <div class="liq-worker-grid">
      <div class="liq-field"><span class="liq-label">Trabajador/a</span><span class="liq-val">${trabajador.nombre}</span></div>
      <div class="liq-field"><span class="liq-label">RUT</span><span class="liq-val">${trabajador.rut}</span></div>
      <div class="liq-field"><span class="liq-label">Cargo</span><span class="liq-val">${trabajador.cargo ?? '—'}</span></div>
      <div class="liq-field"><span class="liq-label">AFP</span><span class="liq-val">${trabajador.afp}</span></div>
      <div class="liq-field"><span class="liq-label">Salud</span><span class="liq-val">${trabajador.salud}</span></div>
      <div class="liq-field"><span class="liq-label">Contrato</span><span class="liq-val">${trabajador.tipoContrato}</span></div>
    </div>

    <!-- CUERPO: HABERES + DESCUENTOS -->
    <div class="liq-body">
      <!-- HABERES -->
      <div class="liq-section">
        <table class="liq-table">
          <thead>
            <tr class="liq-th-row">
              <th class="liq-th liq-th-concepto">HABERES</th>
              <th class="liq-th liq-th-num">Imponible</th>
              <th class="liq-th liq-th-num">No Imponible</th>
            </tr>
          </thead>
          <tbody>
            ${haberesRows}
          </tbody>
          <tfoot>
            <tr class="liq-subtotal">
              <td class="liq-concepto">Total Imponible</td>
              <td class="liq-num">${clp(totalImponible)}</td>
              <td class="liq-num"></td>
            </tr>
            <tr class="liq-subtotal">
              <td class="liq-concepto">Total No Imponible</td>
              <td class="liq-num"></td>
              <td class="liq-num">${clp(totalNoImponible)}</td>
            </tr>
            <tr class="liq-total">
              <td class="liq-concepto">TOTAL HABERES</td>
              <td class="liq-num" colspan="2">${clp(totalHaberes)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- DESCUENTOS -->
      <div class="liq-section">
        <table class="liq-table">
          <thead>
            <tr class="liq-th-row">
              <th class="liq-th liq-th-concepto">DESCUENTOS</th>
              <th class="liq-th liq-th-num">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${descRows}
          </tbody>
          <tfoot>
            <tr class="liq-total">
              <td class="liq-concepto">TOTAL DESCUENTOS</td>
              <td class="liq-num">${clp(totalDescuentos)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="liq-costo-emp">Aporte empleador SIS: ${clp(liq.cotizSis)}</div>
      </div>
    </div>

    <!-- LÍQUIDO -->
    <div class="liq-liquido-box">
      <div class="liq-liquido-label">LÍQUIDO A PAGAR</div>
      <div class="liq-liquido-monto">${clp(liq.liquido)}</div>
    </div>
    <div class="liq-palabras">SON: ${numToWords(liq.liquido)} PESOS</div>

    <!-- RECIBO -->
    <div class="liq-recibo">
      <p class="liq-recibo-titulo">RECIBO — Art. 54 bis Código del Trabajo</p>
      <p class="liq-recibo-texto">Yo, <strong>${trabajador.nombre}</strong>, RUT ${trabajador.rut}, declaro recibir conforme la suma de <strong>${clp(liq.liquido)}</strong> por concepto de remuneración correspondiente al mes de ${mesLabel} ${liq.anio}.</p>
      <div class="liq-recibo-firmas">
        <div class="liq-firma-bloque">
          <div class="liq-firma-linea"></div>
          <div class="liq-firma-nombre">${trabajador.nombre}</div>
          <div class="liq-firma-sub">RUT: ${trabajador.rut} &nbsp;·&nbsp; Fecha: _______________</div>
        </div>
        <div class="liq-firma-bloque">
          <div class="liq-firma-linea"></div>
          <div class="liq-firma-nombre">${empresa.representanteLegal ?? empresa.razonSocial}</div>
          <div class="liq-firma-sub">Por el Empleador</div>
        </div>
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
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #111; background: #fff; }

  .liq-page {
    padding: 14mm 16mm 10mm;
    max-width: 210mm;
    margin: 0 auto;
  }

  /* ENCABEZADO */
  .liq-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border: 1.5px solid #333;
    padding: 8px 12px;
    margin-bottom: 6px;
    gap: 12px;
  }
  .liq-empresa-nombre { font-size: 12pt; font-weight: bold; margin-bottom: 2px; }
  .liq-empresa-datos { font-size: 8.5pt; color: #444; line-height: 1.4; }
  .liq-titulo-bloque { text-align: right; flex-shrink: 0; }
  .liq-titulo { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  .liq-periodo { font-size: 10pt; font-weight: bold; color: #333; margin-top: 2px; }
  .liq-copia-label { font-size: 8pt; color: #888; margin-top: 3px; border: 1px solid #ccc; padding: 1px 6px; display: inline-block; }

  /* DATOS TRABAJADOR */
  .liq-worker-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1px solid #aaa;
    border-bottom: none;
    margin-bottom: 8px;
  }
  .liq-field {
    display: flex;
    flex-direction: column;
    padding: 4px 8px;
    border-right: 1px solid #aaa;
    border-bottom: 1px solid #aaa;
  }
  .liq-field:nth-child(3n) { border-right: none; }
  .liq-label { font-size: 7.5pt; color: #666; font-weight: bold; text-transform: uppercase; }
  .liq-val { font-size: 9.5pt; }

  /* CUERPO */
  .liq-body { display: flex; gap: 8px; margin-bottom: 8px; }
  .liq-section { flex: 1; }

  /* TABLAS */
  .liq-table { width: 100%; border-collapse: collapse; }
  .liq-th-row { background: #1a1a2e; color: #fff; }
  .liq-th { padding: 5px 8px; font-size: 9pt; font-weight: bold; text-transform: uppercase; }
  .liq-th-concepto { text-align: left; }
  .liq-th-num { text-align: right; min-width: 80px; }
  .liq-table tbody tr { border-bottom: 1px solid #e0e0e0; }
  .liq-table tbody tr:nth-child(even) { background: #f7f7f7; }
  .liq-concepto { padding: 4px 8px; font-size: 9.5pt; }
  .liq-num { padding: 4px 8px; font-size: 9.5pt; text-align: right; font-family: monospace; }
  .liq-subtotal { border-top: 1px solid #ccc; background: #f0f0f0; }
  .liq-subtotal .liq-concepto { font-size: 9pt; font-weight: 600; color: #444; }
  .liq-subtotal .liq-num { font-size: 9pt; }
  .liq-total { background: #e8e8e8; border-top: 2px solid #555; }
  .liq-total .liq-concepto { font-weight: bold; font-size: 9.5pt; }
  .liq-total .liq-num { font-weight: bold; font-size: 9.5pt; }
  .liq-costo-emp { font-size: 8pt; color: #666; margin-top: 4px; text-align: right; }

  /* LÍQUIDO */
  .liq-liquido-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 2px solid #1a1a2e;
    background: #1a1a2e;
    color: #fff;
    padding: 6px 14px;
    margin-bottom: 4px;
  }
  .liq-liquido-label { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .liq-liquido-monto { font-size: 14pt; font-weight: bold; font-family: monospace; }
  .liq-palabras { font-size: 8.5pt; font-weight: bold; text-transform: uppercase; border: 1px solid #aaa; padding: 3px 10px; margin-bottom: 10px; color: #333; }

  /* RECIBO */
  .liq-recibo { border: 1px dashed #aaa; padding: 8px 10px; }
  .liq-recibo-titulo { font-size: 8.5pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; color: #333; }
  .liq-recibo-texto { font-size: 9pt; line-height: 1.4; margin-bottom: 12px; }
  .liq-recibo-firmas { display: flex; justify-content: space-around; margin-top: 8px; }
  .liq-firma-bloque { text-align: center; min-width: 160px; }
  .liq-firma-linea { border-top: 1px solid #333; margin-top: 36px; margin-bottom: 3px; }
  .liq-firma-nombre { font-size: 9pt; font-weight: bold; }
  .liq-firma-sub { font-size: 7.5pt; color: #666; margin-top: 1px; }

  /* SEPARADOR entre copias */
  .liq-separator {
    border: none;
    border-top: 1px dashed #bbb;
    margin: 10px 0;
    text-align: center;
    font-size: 8pt;
    color: #aaa;
    position: relative;
  }

  @media print {
    .liq-page { padding: 8mm 12mm; }
    .liq-separator { page-break-before: always; border: none; }
  }
</style>
</head>
<body>
${copia('COPIA EMPLEADOR')}
<hr class="liq-separator" />
${copia('COPIA TRABAJADOR')}
</body>
</html>`;
}

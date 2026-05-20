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

// ── Contrato Individual de Trabajo ───────────────────────────────────────────

export function generarContrato(empresa: EmpresaDoc, trabajador: TrabajadorDoc): string {
  const hoy = new Date();
  const fechaIngreso = typeof trabajador.fechaIngreso === 'string' ? new Date(trabajador.fechaIngreso) : trabajador.fechaIngreso;
  const tipoContratoLabel = TIPO_CONTRATO_LABEL[trabajador.tipoContrato] ?? trabajador.tipoContrato;
  const ciudadEmpresa = empresa.direccion?.split(',').pop()?.trim() ?? 'Santiago';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Contrato de Trabajo — ${trabajador.nombre}</title>${BASE_CSS}</head>
<body>
  <div class="header-box">
    <div class="empresa">${empresa.razonSocial}<br/><span style="font-size:9.5pt;font-weight:normal">RUT: ${empresa.rut}</span></div>
    <div class="info">${fecha(hoy)}</div>
  </div>

  <h1>Contrato Individual de Trabajo</h1>
  <p class="subtitle">${tipoContratoLabel}</p>

  <div class="clausula">
    <h2>Primero — Comparecencia</h2>
    <p>En ${ciudadEmpresa}, a ${fecha(hoy)}, entre <strong>${empresa.razonSocial}</strong>, RUT ${empresa.rut},
    con giro <em>${empresa.giro}</em>${empresa.direccion ? ', domiciliada en ' + empresa.direccion : ''},
    representada ${empresa.representanteLegal ? 'por don/doña <strong>' + empresa.representanteLegal + '</strong>, RUT ' + (empresa.rutRepresentante ?? '—') + ',' : 'legalmente,'}
    en adelante "<strong>el Empleador</strong>"; y <strong>${trabajador.nombre}</strong>,
    RUT ${trabajador.rut}${trabajador.domicilio ? ', domiciliado/a en ' + trabajador.domicilio : ''}${trabajador.estadoCivil ? ', estado civil ' + trabajador.estadoCivil.toLowerCase() : ''},
    en adelante "<strong>el Trabajador</strong>", se ha convenido el siguiente contrato individual de trabajo.</p>
  </div>

  <div class="clausula">
    <h2>Segundo — Funciones</h2>
    <p>El Trabajador se compromete a desempeñar el cargo de <strong>${trabajador.cargo ?? 'los servicios pactados'}</strong>
    y a realizar todas las labores propias del cargo que le encomiende el Empleador.</p>
  </div>

  <div class="clausula">
    <h2>Tercero — Remuneración</h2>
    <p>El Empleador pagará al Trabajador una remuneración mensual de <strong>${clp(trabajador.sueldoBase)}</strong>
    (${numToWords(trabajador.sueldoBase)} PESOS), pagaderos el último día hábil de cada mes.
    ${trabajador.tieneMovilizacion && trabajador.montoMovilizacion ? `Además, se pagará asignación de movilización de ${clp(trabajador.montoMovilizacion)} mensuales, no imponible.` : ''}
    ${trabajador.tieneColacion && trabajador.montoColacion ? `Se pagará asignación de colación de ${clp(trabajador.montoColacion)} mensuales, no imponible.` : ''}
    La gratificación se liquidará conforme al ${GRATIFICACION_LABEL[trabajador.tipoGratificacion] ?? ''}.</p>
  </div>

  <div class="clausula">
    <h2>Cuarto — Jornada de Trabajo</h2>
    <p>La jornada ordinaria de trabajo será de <strong>${trabajador.jornadaHoras} horas semanales</strong>,
    distribuidas de lunes a viernes o según acuerdo de las partes, respetando el límite legal.
    Las horas extraordinarias serán pagadas con el recargo legal del 50% sobre el valor de la hora ordinaria.</p>
  </div>

  <div class="clausula">
    <h2>Quinto — Duración del Contrato</h2>
    <p>El presente contrato ${trabajador.tipoContrato === 'INDEFINIDO' ? 'es de duración <strong>indefinida</strong>, comenzando el día ' + fecha(fechaIngreso) + '.' : 'comienza el día ' + fecha(fechaIngreso) + ' y finaliza según las condiciones pactadas para el tipo ' + tipoContratoLabel + '.'}
    El período de prueba inicial, si lo hubiere, se regirá por la ley vigente.</p>
  </div>

  <div class="clausula">
    <h2>Sexto — Previsión Social</h2>
    <p>El Trabajador se encuentra afiliado a la AFP <strong>${trabajador.afp}</strong>
    e institución de salud <strong>${trabajador.salud}</strong>, con cotización del ${(trabajador.pctSalud * 100).toFixed(1)}%.
    ${trabajador.tieneCes ? 'Adicionalmente cotiza en el Seguro de Cesantía (AFC).' : ''}
    Las cotizaciones previsionales serán enteradas por el Empleador en los plazos establecidos por la ley.</p>
  </div>

  <div class="clausula">
    <h2>Séptimo — Vacaciones</h2>
    <p>El Trabajador tendrá derecho a un feriado anual de quince días hábiles con goce de remuneraciones íntegras
    después de un año de servicio continuo, conforme al Artículo 67 del Código del Trabajo.
    En los contratos a plazo o por obra, el trabajador tendrá derecho al feriado proporcional.</p>
  </div>

  <div class="clausula">
    <h2>Octavo — Disposiciones Generales</h2>
    <p>El presente contrato se regirá en todo por las normas del Código del Trabajo y demás disposiciones
    legales y reglamentarias vigentes. El Trabajador declara conocer el Reglamento Interno de la empresa
    y se compromete a cumplirlo. El presente contrato se firma en dos ejemplares del mismo tenor y fecha,
    quedando uno en poder de cada parte.</p>
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
  const descuentos = liq.cotizAfp + liq.cotizSalud + liq.cotizCes + liq.impuestoUnico + liq.anticipo;
  const totalHaberes = liq.sueldoBase + liq.horasExtra + liq.bono + liq.gratificacion + liq.movilizacion + liq.colacion;

  const haberes = [
    { label: 'Sueldo base', monto: liq.sueldoBase, imponible: true },
    ...(liq.horasExtra > 0 ? [{ label: 'Horas extra (50%)', monto: liq.horasExtra, imponible: true }] : []),
    ...(liq.bono > 0 ? [{ label: 'Bono', monto: liq.bono, imponible: true }] : []),
    ...(liq.gratificacion > 0 ? [{ label: 'Gratificación', monto: liq.gratificacion, imponible: true }] : []),
    ...(liq.movilizacion > 0 ? [{ label: 'Movilización', monto: liq.movilizacion, imponible: false }] : []),
    ...(liq.colacion > 0 ? [{ label: 'Colación', monto: liq.colacion, imponible: false }] : []),
  ];

  const desc = [
    { label: `AFP ${trabajador.afp}`, monto: liq.cotizAfp },
    { label: `Salud ${trabajador.salud} (${(trabajador.pctSalud * 100).toFixed(1)}%)`, monto: liq.cotizSalud },
    ...(liq.cotizCes > 0 ? [{ label: 'CES trabajador (0.6%)', monto: liq.cotizCes }] : []),
    ...(liq.impuestoUnico > 0 ? [{ label: 'Impuesto Único 2ª Cat.', monto: liq.impuestoUnico }] : []),
    ...(liq.anticipo > 0 ? [{ label: 'Anticipo', monto: liq.anticipo }] : []),
  ];

  const haberesHtml = haberes.map(h => `
    <tr>
      <td>${h.label}</td>
      <td class="monto">${clp(h.monto)}</td>
      <td style="text-align:center;font-size:9pt;color:#777">${h.imponible ? 'Imp.' : 'N/I'}</td>
    </tr>`).join('');

  const descHtml = desc.map(d => `
    <tr><td>${d.label}</td><td class="monto">${clp(d.monto)}</td></tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Liquidación ${mesLabel} ${liq.anio} — ${trabajador.nombre}</title>${BASE_CSS}</head>
<body>
  <div class="header-box">
    <div class="empresa">${empresa.razonSocial}<br/><span style="font-size:9.5pt;font-weight:normal">RUT: ${empresa.rut} · ${empresa.giro}</span>${empresa.direccion ? '<br/><span style="font-size:9pt;color:#555">' + empresa.direccion + '</span>' : ''}</div>
    <div class="info" style="font-size:13pt;font-weight:bold;">LIQUIDACIÓN DE SUELDO<br/><span style="font-size:11pt">${mesLabel} ${liq.anio}</span></div>
  </div>

  <table class="datos" style="margin-bottom:16px;">
    <tr><td>Trabajador/a:</td><td>${trabajador.nombre}</td></tr>
    <tr><td>RUT:</td><td>${trabajador.rut}</td></tr>
    <tr><td>Cargo:</td><td>${trabajador.cargo ?? '—'}</td></tr>
    <tr><td>AFP:</td><td>${trabajador.afp}</td></tr>
    <tr><td>Salud:</td><td>${trabajador.salud}</td></tr>
  </table>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <div>
      <h2>Haberes</h2>
      <table class="montos">
        <thead><tr><th>Concepto</th><th style="text-align:right">Monto</th><th style="text-align:center">Tipo</th></tr></thead>
        <tbody>
          ${haberesHtml}
          <tr class="total"><td>Total haberes</td><td class="monto">${clp(totalHaberes)}</td><td></td></tr>
          <tr><td style="color:#555;font-size:10pt">Base imponible</td><td class="monto" style="color:#555;font-size:10pt">${clp(liq.imponible)}</td><td></td></tr>
        </tbody>
      </table>
    </div>
    <div>
      <h2>Descuentos</h2>
      <table class="montos">
        <thead><tr><th>Concepto</th><th style="text-align:right">Monto</th></tr></thead>
        <tbody>
          ${descHtml}
          <tr class="total"><td>Total descuentos</td><td class="monto">${clp(descuentos)}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:8px;font-size:9pt;color:#555;">
        Costo empleador: SIS ${clp(liq.cotizSis)}
      </div>
    </div>
  </div>

  <div style="margin-top:16px;padding:10px 14px;border:2px solid #333;border-radius:4px;">
    <p style="font-size:12pt;font-weight:bold;">TOTAL LÍQUIDO A PAGAR: ${clp(liq.liquido)}</p>
    <div class="num-palabras" style="margin-top:6px;">SON: ${numToWords(liq.liquido)} PESOS</div>
  </div>

  <div style="margin-top:30px;border-top:1px dashed #999;padding-top:14px;">
    <p style="font-size:10pt;margin-bottom:6px;font-weight:bold;">RECIBO DE PAGO (Art. 54 bis Código del Trabajo)</p>
    <p style="font-size:10pt;">Yo, <strong>${trabajador.nombre}</strong>, RUT ${trabajador.rut}, declaro haber recibido conforme la cantidad de ${clp(liq.liquido)} (${numToWords(liq.liquido)} PESOS), correspondiente a mi remuneración del mes de ${mesLabel} ${liq.anio}.</p>
    <div class="firmas" style="margin-top:20px;">
      <div class="firma-bloque">
        <div style="height:40px;"></div>
        <div class="firma-linea">${trabajador.nombre}</div>
        <div class="firma-label">RUT: ${trabajador.rut} · Fecha: ___________</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

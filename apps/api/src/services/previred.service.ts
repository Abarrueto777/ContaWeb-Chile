import * as cheerio from 'cheerio';

export interface PreviredIndicadores {
  afpCapital: number;
  afpCuprum: number;
  afpHabitat: number;
  afpPlanvital: number;
  afpProvida: number;
  afpModelo: number;
  afpUno: number;
  sisEmpleador: number;
  topeImponibleUf: number;
  uf: number | null;
  utm: number | null;
  imm: number | null;
  _encontrado: string[];  // campos que el scraper realmente encontró
  _advertencias: string[]; // qué no pudo parsear
}

function parsePct(raw: string): number {
  return parseFloat(raw.replace('%', '').replace(',', '.').trim()) / 100;
}

function parseCurrency(raw: string): number {
  return parseFloat(raw.replace(/[$.]/g, '').replace(',', '.').trim());
}

const AFP_NAMES: Record<string, keyof Pick<PreviredIndicadores,
  'afpCapital' | 'afpCuprum' | 'afpHabitat' | 'afpPlanvital' | 'afpProvida' | 'afpModelo' | 'afpUno'
>> = {
  capital:   'afpCapital',
  cuprum:    'afpCuprum',
  habitat:   'afpHabitat',
  hábitat:   'afpHabitat',
  planvital: 'afpPlanvital',
  provida:   'afpProvida',
  modelo:    'afpModelo',
  uno:       'afpUno',
};

export async function scrapePreviredIndicadores(): Promise<PreviredIndicadores> {
  const result: PreviredIndicadores = {
    afpCapital: 0.1144, afpCuprum: 0.1144, afpHabitat: 0.1127,
    afpPlanvital: 0.1127, afpProvida: 0.1145, afpModelo: 0.1077, afpUno: 0.1049,
    sisEmpleador: 0.0162, topeImponibleUf: 90.0,
    uf: null, utm: null, imm: null,
    _encontrado: [], _advertencias: [],
  };

  let html: string;
  try {
    const res = await fetch('https://www.previred.com/indicadores-previsionales/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'es-CL,es;q=0.9',
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    result._advertencias.push(`No se pudo conectar a previred.com: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }

  const $ = cheerio.load(html);
  const fullText = $.text();

  // Si la página está en blanco o tiene muy poco texto, es JS-rendered
  if (fullText.trim().length < 500) {
    result._advertencias.push('Previred.com devuelve HTML vacío (requiere JavaScript). Ingresa las tasas manualmente.');
    return result;
  }

  // ── 1. AFP rates — buscar en TODAS las tablas ─────────────────────────────
  let afpEncontradas = 0;
  $('table').each((_, table) => {
    const headerText = $(table).find('th, td').map((_, el) => $(el).text().toLowerCase()).get().join(' ');
    if (!headerText.includes('afp') && !headerText.includes('pension')) return;

    $(table).find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;
      const nombre = $(cells[0]).text().trim().toLowerCase().replace(/\s+/g, '');
      const tasaRaw = $(cells[1]).text().trim();
      const pctMatch = tasaRaw.match(/([\d,]+)\s*%/);
      if (!pctMatch) return;
      const tasa = parsePct(pctMatch[0]);
      if (tasa < 0.05 || tasa > 0.20) return; // rango razonable para AFP

      for (const [key, field] of Object.entries(AFP_NAMES)) {
        if (nombre.includes(key)) {
          result[field] = tasa;
          result._encontrado.push(`${field}=${(tasa*100).toFixed(2)}%`);
          afpEncontradas++;
          break;
        }
      }
    });
  });

  // Fallback: buscar tasas AFP en texto libre con regex
  if (afpEncontradas === 0) {
    const afpRegex = /(capital|cuprum|h[aá]bitat|planvital|provida|modelo|uno)\s*[:\-–]?\s*([\d,]+)\s*%/gi;
    let m: RegExpExecArray | null;
    while ((m = afpRegex.exec(fullText)) !== null) {
      const nombre = m[1]!.toLowerCase().replace('á','a');
      const field = AFP_NAMES[nombre];
      if (!field) continue;
      const tasa = parsePct(m[2]! + '%');
      if (tasa < 0.05 || tasa > 0.20) continue;
      result[field] = tasa;
      result._encontrado.push(`${field}=${(tasa*100).toFixed(2)}% (texto)`);
      afpEncontradas++;
    }
  }

  if (afpEncontradas === 0) {
    result._advertencias.push('No se encontraron tasas AFP en la página. Verifica previred.com manualmente.');
  }

  // ── 2. SIS empleador ─────────────────────────────────────────────────────
  const sisMatch = fullText.match(/sis[^%\n]*?([\d,]+)\s*%/i);
  if (sisMatch && sisMatch[1]) {
    const sis = parsePct(sisMatch[1] + '%');
    if (sis > 0.001 && sis < 0.05) {
      result.sisEmpleador = sis;
      result._encontrado.push(`sisEmpleador=${(sis*100).toFixed(4)}%`);
    }
  }

  // ── 3. Tope imponible en UF ────────────────────────────────────────────────
  const topeMatch = fullText.match(/tope[^(]*\(([\d.,]+)\s*[Uu][Ff]\)/i);
  if (topeMatch && topeMatch[1]) {
    const tope = parseFloat(topeMatch[1].replace(',', '.'));
    if (tope > 50 && tope < 200) {
      result.topeImponibleUf = tope;
      result._encontrado.push(`topeImponibleUf=${tope}`);
    }
  }

  // ── 4. UTM ─────────────────────────────────────────────────────────────────
  const utmMatch = fullText.match(/utm[^$\n]*\$?\s*([\d.]+(?:,\d+)?)/i);
  if (utmMatch && utmMatch[1]) {
    const utm = parseCurrency(utmMatch[1]);
    if (utm > 50000 && utm < 200000) {
      result.utm = utm;
      result._encontrado.push(`utm=${utm}`);
    }
  }

  // ── 5. IMM ─────────────────────────────────────────────────────────────────
  const immMatch = fullText.match(/ingreso m[ií]nimo[^$\n]*\$?\s*([\d.]+(?:,\d+)?)/i);
  if (immMatch && immMatch[1]) {
    const imm = parseCurrency(immMatch[1]);
    if (imm > 300000 && imm < 1500000) {
      result.imm = imm;
      result._encontrado.push(`imm=${imm}`);
    }
  }

  if (result._encontrado.length === 0) {
    result._advertencias.push('El scraper no pudo extraer ningún dato de previred.com. Ingresa las tasas manualmente.');
  }

  return result;
}

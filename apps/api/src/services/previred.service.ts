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
}

function parsePct(raw: string): number {
  return parseFloat(raw.replace('%', '').replace(',', '.').trim()) / 100;
}

function parseCurrency(raw: string): number {
  return parseFloat(raw.replace(/[$.]/g, '').replace(',', '.').trim());
}

function parseUfFromText(text: string): number | null {
  const match = text.match(/\((\d+(?:[.,]\d+)?)\s*UF\)/i);
  if (!match || !match[1]) return null;
  return parseFloat(match[1].replace(',', '.'));
}

const AFP_MAP: Record<string, keyof Pick<PreviredIndicadores,
  'afpCapital' | 'afpCuprum' | 'afpHabitat' | 'afpPlanvital' | 'afpProvida' | 'afpModelo' | 'afpUno'
>> = {
  capital:  'afpCapital',
  cuprum:   'afpCuprum',
  habitat:  'afpHabitat',
  planvital:'afpPlanvital',
  provida:  'afpProvida',
  modelo:   'afpModelo',
  uno:      'afpUno',
};

export async function scrapePreviredIndicadores(): Promise<PreviredIndicadores> {
  const res = await fetch('https://www.previred.com/indicadores-previsionales/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContaWeb/1.0)' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Previred respondió ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const result: PreviredIndicadores = {
    afpCapital: 0.1144, afpCuprum: 0.1144, afpHabitat: 0.1127,
    afpPlanvital: 0.1127, afpProvida: 0.1145, afpModelo: 0.1077, afpUno: 0.1049,
    sisEmpleador: 0.0162, topeImponibleUf: 90.0,
    uf: null, utm: null, imm: null,
  };

  // AFP rates — buscar tabla con columna "AFP"
  $('table').each((_, table) => {
    const headers = $(table).find('th').map((_, th) => $(th).text().trim().toLowerCase()).get();
    if (!headers.some(h => h === 'afp')) return;

    $(table).find('tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      const afpName = $(cells[0]).text().trim().toLowerCase();
      const tasaRaw = $(cells[1]).text().trim();
      const field = AFP_MAP[afpName];
      if (field && tasaRaw) result[field] = parsePct(tasaRaw);
    });
  });

  // SIS — buscar sección con "SEGURO DE INVALIDEZ"
  $('section').each((_, section) => {
    const heading = $(section).find('h2').text().trim().toUpperCase();

    if (heading.includes('INVALIDEZ')) {
      $(section).find('p, li').each((_, el) => {
        const text = $(el).text();
        if (text.toLowerCase().includes('tasa sis')) {
          const match = text.match(/([\d,]+)%/);
          if (match && match[1]) result.sisEmpleador = parsePct(match[1] + '%');
        }
      });
    }

    if (heading.includes('TOPES') || heading.includes('TOPE')) {
      $(section).find('li').each((_, li) => {
        const text = $(li).text();
        if (text.toLowerCase().includes('afp')) {
          const uf = parseUfFromText(text);
          if (uf) result.topeImponibleUf = uf;
        }
      });
    }

    if (heading.includes('VALOR UF') || heading.includes('UF')) {
      const firstStrong = $(section).find('strong').first().text();
      if (firstStrong) {
        const val = parseCurrency(firstStrong);
        if (val > 100) result.uf = val;
      }
    }

    if (heading === 'VALOR' || heading.includes('UTM')) {
      const firstTd = $(section).find('td').first().text();
      if (firstTd) {
        const val = parseCurrency(firstTd);
        if (val > 1000) result.utm = val;
      }
    }

    if (heading.includes('RENTAS MÍNIMAS') || heading.includes('MINIMAS')) {
      const firstLi = $(section).find('li').first().find('strong').text();
      if (firstLi) {
        const val = parseCurrency(firstLi);
        if (val > 100000) result.imm = val;
      }
    }
  });

  return result;
}

import https from 'https';
import { prisma } from '../lib/prisma';

function fetchUFDia(dia: number, mes: number, anio: number): Promise<number | null> {
  const diaStr = String(dia).padStart(2, '0');
  const mesStr = String(mes).padStart(2, '0');
  const url = `https://mindicador.cl/api/uf/${diaStr}-${mesStr}-${anio}`;
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'ContaWeb/1.0' } }, (resp) => {
      let body = '';
      resp.on('data', (c: Buffer) => { body += c.toString(); });
      resp.on('end', () => {
        try {
          const data = JSON.parse(body) as { serie?: Array<{ valor: number }> };
          resolve(data.serie?.[0]?.valor ?? null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

export async function getUFLiquidacion(anio: number, mes: number): Promise<number> {
  // 1 — Registro mensual en DB (debe ser el último día del mes si el sync fue correcto)
  const row = await prisma.valorUFUTM.findFirst({
    where: { anio, mes },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });
  if (row?.uf && Number(row.uf) > 0) return Number(row.uf);

  // 2 — Para meses ya terminados: fetch desde mindicador.cl (último día del mes)
  const lastDay = new Date(anio, mes, 0).getDate();
  const hoy = new Date();
  if (new Date(anio, mes - 1, lastDay) <= hoy) {
    const uf = await fetchUFDia(lastDay, mes, anio);
    if (uf) {
      // Guardar en DB para evitar llamadas futuras
      await prisma.valorUFUTM.upsert({
        where: { anio_mes: { anio, mes } },
        create: { anio, mes, uf, utm: 0, imm: 0 },
        update: { uf },
      }).catch(() => null);
      return uf;
    }
  }

  // 3 — Fallback al más reciente disponible
  const latest = await prisma.valorUFUTM.findFirst({
    where: { uf: { gt: 0 } },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });
  return latest?.uf ? Number(latest.uf) : 40000;
}

function fetchMindicador(): Promise<{ uf: number; utm: number; imm: number }> {
  return new Promise((resolve, reject) => {
    https.get('https://mindicador.cl/api', (resp) => {
      let body = '';
      resp.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      resp.on('end', () => {
        try {
          const data = JSON.parse(body) as Record<string, unknown>;
          resolve({
            uf: (data['uf'] as { valor?: number } | undefined)?.valor ?? 0,
            utm: (data['utm'] as { valor?: number } | undefined)?.valor ?? 0,
            imm: (data['ingreso_minimo_mensual'] as { valor?: number } | undefined)?.valor ?? 0,
          });
        } catch {
          reject(new Error('Respuesta inválida de mindicador.cl'));
        }
      });
    }).on('error', reject);
  });
}

export async function syncValoresMes(anio: number, mes: number) {
  const existente = await prisma.valorUFUTM.findUnique({
    where: { anio_mes: { anio, mes } },
  });
  if (existente) return existente;

  const { uf, utm, imm } = await fetchMindicador();
  if (!uf) throw new Error('No se pudo obtener UF de mindicador.cl');

  return prisma.valorUFUTM.upsert({
    where: { anio_mes: { anio, mes } },
    create: { anio, mes, uf, utm, imm },
    update: { uf, utm, imm },
  });
}

export async function forzarSyncValoresMes(anio: number, mes: number) {
  const { uf, utm, imm } = await fetchMindicador();
  if (!uf) throw new Error('No se pudo obtener UF de mindicador.cl');

  return prisma.valorUFUTM.upsert({
    where: { anio_mes: { anio, mes } },
    create: { anio, mes, uf, utm, imm },
    update: { uf, utm, imm },
  });
}

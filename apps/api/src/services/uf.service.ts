import https from 'https';
import { prisma } from '../lib/prisma';

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

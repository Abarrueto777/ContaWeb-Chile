import { Router } from 'express';
import https from 'https';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const valores = await prisma.valorUFUTM.findMany({ orderBy: { anio: 'desc' } });
    res.json({ data: valores });
  } catch (err) {
    next(err);
  }
});

router.get('/:anio/:mes', async (req, res, next) => {
  try {
    const { anio, mes } = req.params as { anio: string; mes: string };
    const valor = await prisma.valorUFUTM.findUnique({
      where: { anio_mes: { anio: Number(anio), mes: Number(mes) } },
    });
    if (!valor) {
      const ultimo = await prisma.valorUFUTM.findFirst({ orderBy: [{ anio: 'desc' }, { mes: 'desc' }] });
      if (ultimo) return void res.json({ data: ultimo, fallback: true });
      return void res.status(404).json({ error: 'Valor UF/UTM no encontrado' });
    }
    res.json({ data: valor });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { anio, mes, uf, utm, imm } = req.body as {
      anio: number; mes: number; uf: number; utm: number; imm: number;
    };
    const valor = await prisma.valorUFUTM.upsert({
      where: { anio_mes: { anio, mes } },
      create: { anio, mes, uf, utm, imm },
      update: { uf, utm, imm },
    });
    res.status(201).json({ data: valor });
  } catch (err) {
    next(err);
  }
});

router.get('/fetch-actual', async (_req, res, next) => {
  try {
    const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
      https.get('https://mindicador.cl/api', (resp) => {
        let body = '';
        resp.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        resp.on('end', () => {
          try { resolve(JSON.parse(body) as Record<string, unknown>); }
          catch { reject(new Error('Respuesta inválida de mindicador.cl')); }
        });
      }).on('error', reject);
    });

    const uf = (data['uf'] as { valor?: number } | undefined)?.valor ?? 0;
    const utm = (data['utm'] as { valor?: number } | undefined)?.valor ?? 0;
    const imm = (data['ingreso_minimo_mensual'] as { valor?: number } | undefined)?.valor ?? 0;

    res.json({ data: { uf, utm, imm } });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middlewares/auth';
import { syncValoresMes, forzarSyncValoresMes } from '../services/uf.service';

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
    const {
      anio, mes, uf, utm, imm,
      afpCapital, afpCuprum, afpHabitat, afpPlanvital, afpProvida, afpModelo, afpUno,
    } = req.body as {
      anio: number; mes: number; uf: number; utm: number; imm: number;
      afpCapital?: number; afpCuprum?: number; afpHabitat?: number; afpPlanvital?: number;
      afpProvida?: number; afpModelo?: number; afpUno?: number;
    };
    const afpFields = {
      ...(afpCapital   !== undefined && { afpCapital }),
      ...(afpCuprum    !== undefined && { afpCuprum }),
      ...(afpHabitat   !== undefined && { afpHabitat }),
      ...(afpPlanvital !== undefined && { afpPlanvital }),
      ...(afpProvida   !== undefined && { afpProvida }),
      ...(afpModelo    !== undefined && { afpModelo }),
      ...(afpUno       !== undefined && { afpUno }),
    };
    const valor = await prisma.valorUFUTM.upsert({
      where: { anio_mes: { anio, mes } },
      create: { anio, mes, uf, utm, imm, ...afpFields },
      update: { uf, utm, imm, ...afpFields },
    });
    res.status(201).json({ data: valor });
  } catch (err) {
    next(err);
  }
});

// Sincroniza el mes actual: crea en BD si no existe, devuelve los valores
router.post('/sync', async (_req, res, next) => {
  try {
    const now = new Date();
    const valor = await forzarSyncValoresMes(now.getFullYear(), now.getMonth() + 1);
    res.json({ data: valor });
  } catch (err) {
    next(err);
  }
});

// Sync de un mes específico (sin forzar: solo crea si no existe)
router.post('/sync/:anio/:mes', async (req, res, next) => {
  try {
    const { anio, mes } = req.params as { anio: string; mes: string };
    const valor = await syncValoresMes(Number(anio), Number(mes));
    res.json({ data: valor });
  } catch (err) {
    next(err);
  }
});

// Forzar re-fetch desde mindicador.cl para un mes específico
router.post('/sync/:anio/:mes/forzar', async (req, res, next) => {
  try {
    const { anio, mes } = req.params as { anio: string; mes: string };
    const valor = await forzarSyncValoresMes(Number(anio), Number(mes));
    res.json({ data: valor });
  } catch (err) {
    next(err);
  }
});

export default router;

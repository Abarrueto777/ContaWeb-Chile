import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { syncValoresMes, forzarSyncValoresMes } from '../services/uf.service';
import { scrapePreviredIndicadores } from '../services/previred.service';

const router = Router();
router.use(requireAuth);

// Escritura de indicadores: solo ADMIN
function requireAdmin(req: Parameters<typeof requireAuth>[0], _res: Parameters<typeof requireAuth>[1], next: Parameters<typeof requireAuth>[2]) {
  if (req.user?.rol !== 'ADMIN') return next(createError('Se requiere rol ADMIN', 403));
  next();
}

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

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      anio, mes, uf, utm, imm,
      afpCapital, afpCuprum, afpHabitat, afpPlanvital, afpProvida, afpModelo, afpUno,
      sisEmpleador, topeImponibleUf,
    } = req.body as {
      anio: number; mes: number; uf: number; utm: number; imm: number;
      afpCapital?: number; afpCuprum?: number; afpHabitat?: number; afpPlanvital?: number;
      afpProvida?: number; afpModelo?: number; afpUno?: number;
      sisEmpleador?: number; topeImponibleUf?: number;
    };
    const extra = {
      ...(afpCapital      !== undefined && { afpCapital }),
      ...(afpCuprum       !== undefined && { afpCuprum }),
      ...(afpHabitat      !== undefined && { afpHabitat }),
      ...(afpPlanvital    !== undefined && { afpPlanvital }),
      ...(afpProvida      !== undefined && { afpProvida }),
      ...(afpModelo       !== undefined && { afpModelo }),
      ...(afpUno          !== undefined && { afpUno }),
      ...(sisEmpleador    !== undefined && { sisEmpleador }),
      ...(topeImponibleUf !== undefined && { topeImponibleUf }),
    };
    const valor = await prisma.valorUFUTM.upsert({
      where: { anio_mes: { anio, mes } },
      create: { anio, mes, uf, utm, imm, ...extra },
      update: { uf, utm, imm, ...extra },
    });
    res.status(201).json({ data: valor });
  } catch (err) {
    next(err);
  }
});

// Sincroniza el mes actual: crea en BD si no existe, devuelve los valores
router.post('/sync', requireAdmin, async (_req, res, next) => {
  try {
    const now = new Date();
    const valor = await forzarSyncValoresMes(now.getFullYear(), now.getMonth() + 1);
    res.json({ data: valor });
  } catch (err) {
    next(err);
  }
});

// Sync de un mes específico (sin forzar: solo crea si no existe)
router.post('/sync/:anio/:mes', requireAdmin, async (req, res, next) => {
  try {
    const { anio, mes } = req.params as { anio: string; mes: string };
    const valor = await syncValoresMes(Number(anio), Number(mes));
    res.json({ data: valor });
  } catch (err) {
    next(err);
  }
});

// Forzar re-fetch desde mindicador.cl para un mes específico
router.post('/sync/:anio/:mes/forzar', requireAdmin, async (req, res, next) => {
  try {
    const { anio, mes } = req.params as { anio: string; mes: string };
    const valor = await forzarSyncValoresMes(Number(anio), Number(mes));
    res.json({ data: valor });
  } catch (err) {
    next(err);
  }
});

// Sync de indicadores Previred (AFP rates, SIS, tope) para el mes actual
router.post('/sync-previred', requireAdmin, async (_req, res, next) => {
  try {
    const now = new Date();
    const anio = now.getFullYear();
    const mes  = now.getMonth() + 1;
    const indicadores = await scrapePreviredIndicadores();

    // Solo guarda si el scraper encontró algo real (no solo defaults)
    const scraperEncontro = indicadores._encontrado.length > 0;
    if (!scraperEncontro) {
      // Devuelve advertencias sin guardar datos incorrectos
      return void res.status(422).json({
        error: indicadores._advertencias.join(' '),
        _advertencias: indicadores._advertencias,
        _encontrado: [],
      });
    }

    const valor = await prisma.valorUFUTM.upsert({
      where: { anio_mes: { anio, mes } },
      create: {
        anio, mes,
        uf:  indicadores.uf  ?? 0,
        utm: indicadores.utm ?? 0,
        imm: indicadores.imm ?? 0,
        afpCapital:      indicadores.afpCapital,
        afpCuprum:       indicadores.afpCuprum,
        afpHabitat:      indicadores.afpHabitat,
        afpPlanvital:    indicadores.afpPlanvital,
        afpProvida:      indicadores.afpProvida,
        afpModelo:       indicadores.afpModelo,
        afpUno:          indicadores.afpUno,
        sisEmpleador:    indicadores.sisEmpleador,
        topeImponibleUf: indicadores.topeImponibleUf,
        previredSyncAt:  new Date(),
      },
      update: {
        afpCapital:      indicadores.afpCapital,
        afpCuprum:       indicadores.afpCuprum,
        afpHabitat:      indicadores.afpHabitat,
        afpPlanvital:    indicadores.afpPlanvital,
        afpProvida:      indicadores.afpProvida,
        afpModelo:       indicadores.afpModelo,
        afpUno:          indicadores.afpUno,
        sisEmpleador:    indicadores.sisEmpleador,
        topeImponibleUf: indicadores.topeImponibleUf,
        previredSyncAt:  new Date(),
        ...(indicadores.uf  && { uf:  indicadores.uf }),
        ...(indicadores.utm && { utm: indicadores.utm }),
        ...(indicadores.imm && { imm: indicadores.imm }),
      },
    });
    res.json({
      data: { ...valor, _scraped: indicadores },
      _encontrado: indicadores._encontrado,
      _advertencias: indicadores._advertencias,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

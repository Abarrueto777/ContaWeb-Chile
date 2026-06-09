import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';

const router = Router();
router.use(requireAuth);

function requireAdmin(req: Parameters<typeof requireAuth>[0], _res: Parameters<typeof requireAuth>[1], next: Parameters<typeof requireAuth>[2]) {
  if (req.user?.rol !== 'ADMIN') return next(createError('Se requiere rol ADMIN', 403));
  next();
}

// GET /api/factores-ipc?anio=2025 — factores del año (o todos)
router.get('/', async (req, res, next) => {
  try {
    const anio = req.query['anio'] ? Number(req.query['anio']) : null;
    const factores = await prisma.factorIpc.findMany({
      where: anio ? { anio } : {},
      orderBy: [{ anio: 'desc' }, { mes: 'asc' }],
    });
    res.json({ data: factores });
  } catch (err) {
    next(err);
  }
});

// PUT /api/factores-ipc — upsert de un factor (ADMIN)
router.put('/', requireAdmin, async (req, res, next) => {
  try {
    const { anio, mes, factor } = req.body as { anio?: number; mes?: number; factor?: number };
    if (!anio || !mes || mes < 1 || mes > 12 || factor === undefined || factor <= 0) {
      return next(createError('Datos inválidos: anio, mes (1-12) y factor (> 0) requeridos', 400));
    }
    const registro = await prisma.factorIpc.upsert({
      where: { anio_mes: { anio, mes } },
      create: { anio, mes, factor },
      update: { factor },
    });
    res.json({ data: registro, message: 'Factor IPC guardado' });
  } catch (err) {
    next(err);
  }
});

export default router;

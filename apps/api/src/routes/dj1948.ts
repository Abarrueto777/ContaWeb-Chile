import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { generarDJ1948, recalcularRetirosIpc } from '../services/retiros.service';

const router = Router({ mergeParams: true });

// GET /api/empresas/:empresaId/dj1948?anio=2025
router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const dj = await generarDJ1948(empresaId, anio, prisma);
    res.json({ data: dj });
  } catch {
    res.status(500).json({ error: 'Error al generar la DJ 1948' });
  }
});

// POST /api/empresas/:empresaId/dj1948/recalcular?anio=2025
router.post('/recalcular', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const n = await recalcularRetirosIpc(empresaId, anio, prisma);
    res.json({ data: { actualizados: n }, message: `${n} retiro(s) recalculado(s)` });
  } catch {
    res.status(500).json({ error: 'Error al recalcular los retiros' });
  }
});

export default router;

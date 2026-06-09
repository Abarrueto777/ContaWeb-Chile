import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { generarDJ1887, generarDJ1887Txt } from '../services/dj1887.service';

const router = Router({ mergeParams: true });

// GET /api/empresas/:empresaId/dj1887?anio=2025 — datos agregados
router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const dj = await generarDJ1887(empresaId, anio, prisma);
    res.json({ data: dj });
  } catch {
    res.status(500).json({ error: 'Error al generar la DJ 1887' });
  }
});

// GET /api/empresas/:empresaId/dj1887/txt?anio=2025 — archivo TXT de referencia (SII)
router.get('/txt', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const dj = await generarDJ1887(empresaId, anio, prisma);
    if (dj.trabajadores.length === 0) return void res.status(404).json({ error: 'No hay liquidaciones para el año' });
    const txt = generarDJ1887Txt(dj);
    const rutEmp = (dj.empresaRut || empresaId).replace(/\./g, '');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="DJ1887_${rutEmp}_${anio}.txt"`);
    res.send(txt);
  } catch {
    res.status(500).json({ error: 'Error al generar el TXT de la DJ 1887' });
  }
});

export default router;

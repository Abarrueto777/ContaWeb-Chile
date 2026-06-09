import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { generarDJ1879, generarDJ1879Txt } from '../services/dj1879.service';

const router = Router({ mergeParams: true });

// GET /api/empresas/:empresaId/dj1879?anio=2025
router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const dj = await generarDJ1879(empresaId, anio, prisma);
    res.json({ data: dj });
  } catch {
    res.status(500).json({ error: 'Error al generar la DJ 1879' });
  }
});

// GET /api/empresas/:empresaId/dj1879/txt?anio=2025
router.get('/txt', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const dj = await generarDJ1879(empresaId, anio, prisma);
    if (dj.prestadores.length === 0) return void res.status(404).json({ error: 'No hay honorarios para el año' });
    const txt = generarDJ1879Txt(dj);
    const rutEmp = (dj.empresaRut || empresaId).replace(/\./g, '');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="DJ1879_${rutEmp}_${anio}.txt"`);
    res.send(txt);
  } catch {
    res.status(500).json({ error: 'Error al generar el TXT de la DJ 1879' });
  }
});

export default router;

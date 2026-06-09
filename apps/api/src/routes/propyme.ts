import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { resumenProPyme, sincronizarPpm } from '../services/propyme.service';
import { resumenPpm } from '../services/rentaPresunta.service';

const router = Router({ mergeParams: true });

// GET /api/empresas/:empresaId/propyme/resumen?anio=2025&mes=6  (mes opcional; sin mes = anual)
router.get('/resumen', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const mesRaw = req.query['mes'];
    const mes = mesRaw && Number(mesRaw) >= 1 && Number(mesRaw) <= 12 ? Number(mesRaw) : null;
    const resumen = await resumenProPyme(empresaId, anio, mes, prisma);
    res.json({ data: resumen });
  } catch {
    res.status(500).json({ error: 'Error al generar el resumen ProPyme' });
  }
});

// GET /api/empresas/:empresaId/propyme/ppm?anio=2025
router.get('/ppm', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const resumen = await resumenPpm(empresaId, anio, prisma);
    res.json({ data: resumen });
  } catch {
    res.status(500).json({ error: 'Error al obtener PPM' });
  }
});

// POST /api/empresas/:empresaId/propyme/ppm/sincronizar?anio=2025
router.post('/ppm/sincronizar', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const n = await sincronizarPpm(empresaId, anio, prisma);
    res.json({ data: { actualizados: n }, message: n > 0 ? `${n} mes(es) sincronizados desde documentos emitidos` : 'No se encontraron documentos emitidos para el período' });
  } catch {
    res.status(500).json({ error: 'Error al sincronizar el PPM' });
  }
});

// PATCH /api/empresas/:empresaId/propyme/ppm/:id/pagar
router.patch('/ppm/:id/pagar', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    const pagado = (req.body as { pagado?: boolean }).pagado ?? true;
    const existente = await prisma.rPPpm.findFirst({ where: { id, empresaId } });
    if (!existente) return void res.status(404).json({ error: 'Registro no encontrado' });
    const registro = await prisma.rPPpm.update({ where: { id }, data: { pagado, fechaPago: pagado ? new Date() : null } });
    res.json({ data: registro });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el PPM' });
  }
});

export default router;

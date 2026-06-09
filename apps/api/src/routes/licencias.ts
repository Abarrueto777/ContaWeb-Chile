import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { licenciaMedicaSchema } from '@contaweb/validations';
import { diasCalendarioEntre } from '../services/licencias.service';

const router = Router({ mergeParams: true });

// GET /api/empresas/:empresaId/licencias — historial
router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { trabajadorId, anio } = req.query as { trabajadorId?: string; anio?: string };
    const where: Record<string, unknown> = { empresaId, ...(trabajadorId ? { trabajadorId } : {}) };
    if (anio) {
      const ini = new Date(Number(anio), 0, 1);
      const fin = new Date(Number(anio), 11, 31, 23, 59, 59);
      where['fechaInicio'] = { lte: fin };
      where['fechaFin'] = { gte: ini };
    }
    const licencias = await prisma.licenciaMedica.findMany({
      where,
      include: { trabajador: { select: { nombre: true, rut: true } } },
      orderBy: { fechaInicio: 'desc' },
    });
    res.json({ data: licencias });
  } catch {
    res.status(500).json({ error: 'Error al obtener licencias médicas' });
  }
});

// POST /api/empresas/:empresaId/licencias
router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = licenciaMedicaSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });

    const { trabajadorId, fechaInicio, fechaFin, tipo, numLicencia, entidad, subsidioMonto, subsidioPagado, notas } = parsed.data;
    const trabajador = await prisma.trabajador.findFirst({ where: { id: trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });

    const diasLicencia = diasCalendarioEntre(fechaInicio, fechaFin);

    const licencia = await prisma.licenciaMedica.create({
      data: {
        empresaId, trabajadorId, fechaInicio, fechaFin, tipo, diasLicencia,
        numLicencia: numLicencia ?? '', entidad: entidad ?? 'FONASA',
        subsidioMonto, subsidioPagado, notas: notas ?? '',
      },
      include: { trabajador: { select: { nombre: true, rut: true } } },
    });
    res.status(201).json({ data: licencia, message: 'Licencia médica registrada' });
  } catch {
    res.status(500).json({ error: 'Error al registrar licencia médica' });
  }
});

// PUT /api/empresas/:empresaId/licencias/:id
router.put('/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    const parsed = licenciaMedicaSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });

    const existente = await prisma.licenciaMedica.findFirst({ where: { id, empresaId } });
    if (!existente) return void res.status(404).json({ error: 'Licencia médica no encontrada' });

    const { trabajadorId, fechaInicio, fechaFin, tipo, numLicencia, entidad, subsidioMonto, subsidioPagado, notas } = parsed.data;
    const diasLicencia = diasCalendarioEntre(fechaInicio, fechaFin);

    const licencia = await prisma.licenciaMedica.update({
      where: { id },
      data: {
        trabajadorId, fechaInicio, fechaFin, tipo, diasLicencia,
        numLicencia: numLicencia ?? '', entidad: entidad ?? 'FONASA',
        subsidioMonto, subsidioPagado, notas: notas ?? '',
      },
      include: { trabajador: { select: { nombre: true, rut: true } } },
    });
    res.json({ data: licencia, message: 'Licencia médica actualizada' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar licencia médica' });
  }
});

// DELETE /api/empresas/:empresaId/licencias/:id
router.delete('/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    await prisma.licenciaMedica.delete({ where: { id, empresaId } });
    res.json({ message: 'Licencia médica eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar licencia médica' });
  }
});

export default router;

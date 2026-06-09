import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { retiroSchema } from '@contaweb/validations';
import { getConfig } from '../services/config.service';
import { calcularRetiro } from '../services/retiros.service';
import { factorIpcParaFecha } from '../services/factoresIpc.service';

const router = Router({ mergeParams: true });

// GET /api/empresas/:empresaId/retiros?anio=2025
router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = req.query['anio'] ? Number(req.query['anio']) : null;
    const where: Record<string, unknown> = { empresaId };
    if (anio) where['fecha'] = { gte: new Date(anio, 0, 1), lte: new Date(anio, 11, 31, 23, 59, 59) };
    const retiros = await prisma.retiro.findMany({
      where,
      include: { socio: { select: { nombre: true, rut: true, tipo: true, porcentaje: true } } },
      orderBy: { fecha: 'desc' },
    });
    res.json({ data: retiros });
  } catch {
    res.status(500).json({ error: 'Error al obtener retiros' });
  }
});

// POST /api/empresas/:empresaId/retiros
router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = retiroSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });

    const socio = await prisma.socio.findFirst({ where: { id: parsed.data.socioId, empresaId } });
    if (!socio) return void res.status(404).json({ error: 'Socio no encontrado' });

    const config = await getConfig(empresaId);
    const tasa = Number(config['tasa_1cat_pct'] ?? '0.25');
    const factorIpc = await factorIpcParaFecha(parsed.data.fecha, parsed.data.factorIpc, prisma);
    const { montoCorregido, creditoIdpc } = calcularRetiro(parsed.data.monto, factorIpc, parsed.data.tipoRenta, tasa);

    const retiro = await prisma.retiro.create({
      data: {
        empresaId, socioId: parsed.data.socioId, fecha: parsed.data.fecha,
        monto: parsed.data.monto, concepto: parsed.data.concepto ?? '',
        factorIpc, tipoRenta: parsed.data.tipoRenta,
        montoCorregido, creditoIdpc,
      },
      include: { socio: { select: { nombre: true, rut: true, tipo: true, porcentaje: true } } },
    });
    res.status(201).json({ data: retiro, message: 'Retiro registrado' });
  } catch {
    res.status(500).json({ error: 'Error al registrar retiro' });
  }
});

// PUT /api/empresas/:empresaId/retiros/:id
router.put('/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    const parsed = retiroSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const existente = await prisma.retiro.findFirst({ where: { id, empresaId } });
    if (!existente) return void res.status(404).json({ error: 'Retiro no encontrado' });

    const config = await getConfig(empresaId);
    const tasa = Number(config['tasa_1cat_pct'] ?? '0.25');
    const factorIpc = await factorIpcParaFecha(parsed.data.fecha, parsed.data.factorIpc, prisma);
    const { montoCorregido, creditoIdpc } = calcularRetiro(parsed.data.monto, factorIpc, parsed.data.tipoRenta, tasa);

    const retiro = await prisma.retiro.update({
      where: { id },
      data: {
        socioId: parsed.data.socioId, fecha: parsed.data.fecha,
        monto: parsed.data.monto, concepto: parsed.data.concepto ?? '',
        factorIpc, tipoRenta: parsed.data.tipoRenta,
        montoCorregido, creditoIdpc,
      },
      include: { socio: { select: { nombre: true, rut: true, tipo: true, porcentaje: true } } },
    });
    res.json({ data: retiro, message: 'Retiro actualizado' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar retiro' });
  }
});

// DELETE /api/empresas/:empresaId/retiros/:id
router.delete('/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    await prisma.retiro.deleteMany({ where: { id, empresaId } });
    res.json({ message: 'Retiro eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar retiro' });
  }
});

export default router;

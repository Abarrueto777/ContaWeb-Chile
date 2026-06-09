import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { rpBienSchema, rpPpmSchema, type RPBienInput } from '@contaweb/validations';
import { calcularRentaPresunta, calcularPpmMes, resumenPpm } from '../services/rentaPresunta.service';

const router = Router({ mergeParams: true });

// Convierte los opcionales del schema (undefined) a null para Prisma (campos nullables)
function bienData(d: RPBienInput) {
  return {
    tipo: d.tipo,
    descripcion: d.descripcion ?? '',
    rolAvaluo: d.rolAvaluo ?? null,
    municipio: d.municipio ?? null,
    avaluoFiscal: d.avaluoFiscal,
    anioAvaluo: d.anioAvaluo ?? null,
    patente: d.patente ?? null,
    tipoVehiculo: d.tipoVehiculo ?? null,
    marca: d.marca ?? null,
    modelo: d.modelo ?? null,
    anioVehiculo: d.anioVehiculo ?? null,
    valorTasacion: d.valorTasacion,
    anioTasacion: d.anioTasacion ?? null,
  };
}

// ── Bienes ──────────────────────────────────────────────────────────
router.get('/bienes', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const bienes = await prisma.rPBien.findMany({ where: { empresaId, activo: true }, orderBy: [{ tipo: 'asc' }, { createdAt: 'asc' }] });
    res.json({ data: bienes });
  } catch {
    res.status(500).json({ error: 'Error al obtener bienes' });
  }
});

router.post('/bienes', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = rpBienSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const bien = await prisma.rPBien.create({ data: { empresaId, ...bienData(parsed.data) } });
    res.status(201).json({ data: bien, message: 'Bien registrado' });
  } catch {
    res.status(500).json({ error: 'Error al registrar bien' });
  }
});

router.put('/bienes/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    const parsed = rpBienSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const existente = await prisma.rPBien.findFirst({ where: { id, empresaId } });
    if (!existente) return void res.status(404).json({ error: 'Bien no encontrado' });
    const bien = await prisma.rPBien.update({ where: { id }, data: bienData(parsed.data) });
    res.json({ data: bien, message: 'Bien actualizado' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar bien' });
  }
});

router.delete('/bienes/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    await prisma.rPBien.updateMany({ where: { id, empresaId }, data: { activo: false } });
    res.json({ message: 'Bien dado de baja' });
  } catch {
    res.status(500).json({ error: 'Error al dar de baja el bien' });
  }
});

// ── PPM mensual ─────────────────────────────────────────────────────
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

// Upsert del PPM de un mes (calcula tasa y monto según régimen)
router.put('/ppm', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = rpPpmSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const { anio, mes, ventasPeriodo, tipo, pagado, observacion } = parsed.data;
    const { tasa, monto } = calcularPpmMes(ventasPeriodo, tipo);
    const registro = await prisma.rPPpm.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes, ventasPeriodo, ppmTasa: tasa, ppmMonto: monto, pagado, observacion: observacion ?? '' },
      update: { ventasPeriodo, ppmTasa: tasa, ppmMonto: monto, pagado, observacion: observacion ?? '' },
    });
    res.json({ data: registro, message: 'PPM guardado' });
  } catch {
    res.status(500).json({ error: 'Error al guardar PPM' });
  }
});

router.patch('/ppm/:id/pagar', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    const pagado = (req.body as { pagado?: boolean }).pagado ?? true;
    const existente = await prisma.rPPpm.findFirst({ where: { id, empresaId } });
    if (!existente) return void res.status(404).json({ error: 'Registro no encontrado' });
    const registro = await prisma.rPPpm.update({ where: { id }, data: { pagado, fechaPago: pagado ? new Date() : null } });
    res.json({ data: registro });
  } catch {
    res.status(500).json({ error: 'Error al actualizar PPM' });
  }
});

// ── Cálculo de renta presunta ───────────────────────────────────────
router.get('/calculo', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const anio = Number(req.query['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });
    const calc = await calcularRentaPresunta(empresaId, anio, prisma);
    res.json({ data: calc });
  } catch {
    res.status(500).json({ error: 'Error al calcular la renta presunta' });
  }
});

export default router;

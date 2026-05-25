import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { liquidacionInputSchema } from '@contaweb/validations';
import { calcularLiquidacion } from '../services/liquidacion.service';
import { createError } from '../middlewares/errorHandler';
import { generarLiquidacionPdf, type EmpresaDoc, type TrabajadorDoc } from '../services/htmlDocs.service';

const router = Router({ mergeParams: true });

router.get('/lre', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    if (!anio || !mes) return next(createError('Parámetros anio y mes requeridos', 400));

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) return next(createError('Empresa no encontrada', 404));

    const liquidaciones = await prisma.liquidacion.findMany({
      where: { empresaId, anio: Number(anio), mes: Number(mes) },
      include: { trabajador: true },
      orderBy: { trabajador: { nombre: 'asc' } },
    });

    const headers = [
      'RUN_EMPLEADOR', 'RUN_TRABAJADOR', 'NOMBRE', 'TIPO_TRABAJADOR', 'TIPO_CONTRATO',
      'JORNADA_HRS', 'DIAS_TRABAJADOS', 'SUELDO_BASE', 'HORAS_EXTRA_MONTO', 'BONO',
      'GRATIFICACION', 'MOVILIZACION', 'COLACION', 'TOTAL_HABERES_IMPONIBLES',
      'TOTAL_HABERES_NO_IMPONIBLES', 'AFP', 'COTIZ_AFP', 'COTIZ_SIS', 'SALUD',
      'COTIZ_SALUD', 'COTIZ_CESANTIA', 'IMPUESTO_UNICO', 'TOTAL_DESCUENTOS',
      'ANTICIPO', 'LIQUIDO', 'COSTO_EMPLEADOR',
    ];

    const rows = liquidaciones.map((liq) => {
      const t = liq.trabajador;
      const noImponible = Number(liq.movilizacion) + Number(liq.colacion);
      const totalDescuentos = Number(liq.cotizAfp) + Number(liq.cotizSis) + Number(liq.cotizSalud) + Number(liq.cotizCes) + Number(liq.impuestoUnico);
      return [
        empresa.rut, t.rut, t.nombre, t.tipo, t.tipoContrato,
        t.jornadaHoras, liq.diasTrabajados, Math.round(Number(liq.sueldoBase)),
        Math.round(Number(liq.horasExtra)), Math.round(Number(liq.bono)),
        Math.round(Number(liq.gratificacion)), Math.round(Number(liq.movilizacion)),
        Math.round(Number(liq.colacion)), Math.round(Number(liq.imponible)),
        Math.round(noImponible), t.afp, Math.round(Number(liq.cotizAfp)),
        Math.round(Number(liq.cotizSis)), t.salud, Math.round(Number(liq.cotizSalud)),
        Math.round(Number(liq.cotizCes)), Math.round(Number(liq.impuestoUnico)),
        Math.round(totalDescuentos), Math.round(Number(liq.anticipo)),
        Math.round(Number(liq.liquido)), Math.round(Number(liq.costoEmpleador)),
      ].join(';');
    });

    const mesPad = String(mes).padStart(2, '0');
    const csv = [headers.join(';'), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="LRE_${empresa.rut}_${anio}_${mesPad}.csv"`);
    res.send('﻿' + csv);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    const where: Record<string, unknown> = { empresaId };
    if (anio) where['anio'] = Number(anio);
    if (mes) where['mes'] = Number(mes);
    const liquidaciones = await prisma.liquidacion.findMany({
      where,
      include: { trabajador: true },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    res.json({ data: liquidaciones });
  } catch {
    res.status(500).json({ error: 'Error al obtener liquidaciones' });
  }
});

router.post('/calcular', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = liquidacionInputSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const trabajador = await prisma.trabajador.findFirst({ where: { id: parsed.data.trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });
    const valorUF = await prisma.valorUFUTM.findFirst({
      where: { anio: parsed.data.anio, mes: parsed.data.mes },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    const uf = Number(valorUF?.uf ?? 38000);
    const resultado = calcularLiquidacion(trabajador, { ...parsed.data, uf });
    res.json({ data: resultado });
  } catch {
    res.status(500).json({ error: 'Error al calcular liquidación' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = liquidacionInputSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const trabajador = await prisma.trabajador.findFirst({ where: { id: parsed.data.trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });
    const valorUF = await prisma.valorUFUTM.findFirst({
      where: { anio: parsed.data.anio, mes: parsed.data.mes },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    const uf = Number(valorUF?.uf ?? 38000);
    const calc = calcularLiquidacion(trabajador, { ...parsed.data, uf });
    const liquidacion = await prisma.liquidacion.create({
      data: { empresaId, trabajadorId: parsed.data.trabajadorId, anio: parsed.data.anio, mes: parsed.data.mes, ...calc },
      include: { trabajador: true },
    });
    res.status(201).json({ data: liquidacion });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'P2002') {
      return void res.status(409).json({ error: 'Ya existe una liquidación para este trabajador en el período' });
    }
    res.status(500).json({ error: 'Error al guardar liquidación' });
  }
});

router.get('/:liquidacionId/pdf', async (req, res) => {
  try {
    const { empresaId, liquidacionId } = req.params as { empresaId: string; liquidacionId: string };
    const [liq, empresa] = await Promise.all([
      prisma.liquidacion.findFirst({ where: { id: liquidacionId, empresaId }, include: { trabajador: true } }),
      prisma.empresa.findUnique({ where: { id: empresaId } }),
    ]);
    if (!liq || !empresa) return void res.status(404).json({ error: 'No encontrado' });

    const t = liq.trabajador;
    const empresaDoc: EmpresaDoc = {
      razonSocial: empresa.razonSocial,
      rut: empresa.rut,
      giro: empresa.giro,
      direccion: empresa.direccion,
      representanteLegal: (empresa as typeof empresa & { representanteLegal?: string | null }).representanteLegal,
      rutRepresentante: (empresa as typeof empresa & { rutRepresentante?: string | null }).rutRepresentante,
    };
    const trabDoc: TrabajadorDoc = {
      nombre: t.nombre,
      rut: t.rut,
      cargo: t.cargo,
      sueldoBase: Number(t.sueldoBase),
      fechaIngreso: t.fechaIngreso,
      jornadaHoras: t.jornadaHoras,
      tipoContrato: t.tipoContrato,
      afp: t.afp,
      salud: t.salud,
      pctSalud: Number(t.pctSalud),
      tipoGratificacion: t.tipoGratificacion,
      tieneCes: t.tieneCes,
      tieneMovilizacion: t.tieneMovilizacion,
      tieneColacion: t.tieneColacion,
    };
    const liqDoc = {
      anio: liq.anio,
      mes: liq.mes,
      sueldoBase: Number(liq.sueldoBase),
      horasExtra: Number(liq.horasExtra),
      bono: Number(liq.bono),
      gratificacion: Number(liq.gratificacion),
      imponible: Number(liq.imponible),
      cotizAfp: Number(liq.cotizAfp),
      cotizSis: Number(liq.cotizSis),
      cotizSalud: Number(liq.cotizSalud),
      cotizCes: Number(liq.cotizCes),
      impuestoUnico: Number(liq.impuestoUnico),
      movilizacion: Number(liq.movilizacion),
      colacion: Number(liq.colacion),
      anticipo: Number(liq.anticipo),
      liquido: Number(liq.liquido),
      costoEmpleador: Number(liq.costoEmpleador),
    };

    const html = generarLiquidacionPdf(empresaDoc, trabDoc, liqDoc);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

router.put('/:liquidacionId', async (req, res, next) => {
  try {
    const { empresaId, liquidacionId } = req.params as { empresaId: string; liquidacionId: string };
    const parsed = liquidacionInputSchema.safeParse(req.body);
    if (!parsed.success) return next(createError('Datos inválidos', 400));
    const liq = await prisma.liquidacion.findFirst({ where: { id: liquidacionId, empresaId } });
    if (!liq) return next(createError('Liquidación no encontrada', 404));
    const trabajador = await prisma.trabajador.findFirst({ where: { id: liq.trabajadorId, empresaId } });
    if (!trabajador) return next(createError('Trabajador no encontrado', 404));
    const valorUF = await prisma.valorUFUTM.findFirst({
      where: { anio: parsed.data.anio, mes: parsed.data.mes },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    const uf = Number(valorUF?.uf ?? 38000);
    const calc = calcularLiquidacion(trabajador, { ...parsed.data, uf });
    const updated = await prisma.liquidacion.update({
      where: { id: liquidacionId },
      data: { ...calc },
      include: { trabajador: true },
    });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/:liquidacionId/pagar', async (req, res) => {
  try {
    const liq = await prisma.liquidacion.update({ where: { id: req.params['liquidacionId'] }, data: { pagada: true } });
    res.json({ data: liq });
  } catch {
    res.status(500).json({ error: 'Error al marcar pagada' });
  }
});

router.delete('/:liquidacionId', async (req, res) => {
  try {
    await prisma.liquidacion.delete({ where: { id: req.params['liquidacionId'] } });
    res.json({ message: 'Liquidación eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar liquidación' });
  }
});

export default router;

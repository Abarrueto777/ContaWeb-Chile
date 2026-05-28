import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { trabajadorSchema, finiquitoInputSchema } from '@contaweb/validations';
import { calcularFiniquito } from '../services/finiquito.service';
import { generarContrato, generarFiniquito, type EmpresaDoc, type TrabajadorDoc, type FiniquitoDoc } from '../services/htmlDocs.service';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { activo } = req.query;
    const where: Record<string, unknown> = { empresaId };
    if (activo !== undefined) where['activo'] = activo === 'true';
    const trabajadores = await prisma.trabajador.findMany({ where, orderBy: { nombre: 'asc' } });
    res.json({ data: trabajadores });
  } catch {
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = trabajadorSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const { montoMovilizacion, montoColacion, cargo, email, montoIsapre, domicilio, fechaNacimiento, estadoCivil, nacionalidad, region, comuna, fechaTerminoContrato, ...rest } = parsed.data;
    const trabajador = await prisma.trabajador.create({
      data: {
        ...rest,
        empresaId,
        ...(cargo !== undefined ? { cargo } : {}),
        ...(email !== undefined && email !== '' ? { email } : {}),
        ...(montoMovilizacion !== undefined ? { montoMovilizacion } : {}),
        ...(montoColacion !== undefined ? { montoColacion } : {}),
        ...(montoIsapre !== undefined ? { montoIsapre } : {}),
        ...(domicilio !== undefined ? { domicilio } : {}),
        ...(fechaNacimiento !== undefined ? { fechaNacimiento } : {}),
        ...(estadoCivil !== undefined ? { estadoCivil } : {}),
        ...(nacionalidad !== undefined ? { nacionalidad } : {}),
        ...(region !== undefined ? { region } : {}),
        ...(comuna !== undefined ? { comuna } : {}),
        ...(fechaTerminoContrato !== undefined ? { fechaTerminoContrato } : {}),
      } as Parameters<typeof prisma.trabajador.create>[0]['data'],
    });
    res.status(201).json({ data: trabajador });
  } catch {
    res.status(500).json({ error: 'Error al crear trabajador' });
  }
});

router.put('/:trabajadorId', async (req, res) => {
  try {
    const parsed = trabajadorSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const { montoMovilizacion, montoColacion, cargo, email, montoIsapre, domicilio, fechaNacimiento, estadoCivil, nacionalidad, region, comuna, fechaTerminoContrato, ...rest } = parsed.data;
    const trabajador = await prisma.trabajador.update({
      where: { id: req.params['trabajadorId'] },
      data: {
        ...rest,
        cargo: cargo ?? null,
        email: email !== '' ? (email ?? null) : null,
        montoMovilizacion: montoMovilizacion ?? null,
        montoColacion: montoColacion ?? null,
        montoIsapre: montoIsapre ?? null,
        domicilio: domicilio ?? null,
        fechaNacimiento: fechaNacimiento ?? null,
        estadoCivil: estadoCivil ?? null,
        nacionalidad: nacionalidad ?? null,
        region: region ?? null,
        comuna: comuna ?? null,
        fechaTerminoContrato: fechaTerminoContrato ?? null,
      } as Parameters<typeof prisma.trabajador.update>[0]['data'],
    });
    res.json({ data: trabajador });
  } catch {
    res.status(500).json({ error: 'Error al actualizar trabajador' });
  }
});

router.patch('/:trabajadorId/desactivar', async (req, res) => {
  try {
    const trabajador = await prisma.trabajador.update({
      where: { id: req.params['trabajadorId'] },
      data: { activo: false },
    });
    res.json({ data: trabajador });
  } catch {
    res.status(500).json({ error: 'Error al desactivar trabajador' });
  }
});

router.patch('/:trabajadorId/reactivar', async (req, res) => {
  try {
    const trabajador = await prisma.trabajador.update({
      where: { id: req.params['trabajadorId'] },
      data: { activo: true },
    });
    res.json({ data: trabajador });
  } catch {
    res.status(500).json({ error: 'Error al reactivar trabajador' });
  }
});

// ── Contrato Individual de Trabajo ───────────────────────────────────────────

router.get('/:trabajadorId/contrato', async (req, res) => {
  try {
    const { empresaId, trabajadorId } = req.params as { empresaId: string; trabajadorId: string };
    const [tRaw, empresa] = await Promise.all([
      prisma.trabajador.findFirst({ where: { id: trabajadorId, empresaId } }),
      prisma.empresa.findUnique({ where: { id: empresaId } }),
    ]);
    if (!tRaw || !empresa) return void res.status(404).json({ error: 'No encontrado' });

    const t = tRaw as typeof tRaw & {
      domicilio?: string | null;
      fechaNacimiento?: Date | null;
      estadoCivil?: string | null;
      nacionalidad?: string | null;
      region?: string | null;
      comuna?: string | null;
    };

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
      montoMovilizacion: t.montoMovilizacion ? Number(t.montoMovilizacion) : null,
      montoColacion: t.montoColacion ? Number(t.montoColacion) : null,
      domicilio: t.domicilio,
      fechaNacimiento: t.fechaNacimiento,
      estadoCivil: t.estadoCivil,
      nacionalidad: t.nacionalidad,
      region: t.region,
      comuna: t.comuna,
    };

    const html = generarContrato(empresaDoc, trabDoc);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    res.status(500).json({ error: 'Error al generar contrato' });
  }
});

// ── Finiquito ─────────────────────────────────────────────────────────────────

router.post('/:trabajadorId/finiquito', async (req, res) => {
  try {
    const { empresaId, trabajadorId } = req.params as { empresaId: string; trabajadorId: string };
    const parsed = finiquitoInputSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });

    const trabajador = await prisma.trabajador.findFirst({ where: { id: trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });

    const calc = calcularFiniquito(Number(trabajador.sueldoBase), trabajador.fechaIngreso, {
      fechaTermino: parsed.data.fechaTermino,
      causal: parsed.data.causal,
      diasVacaciones: parsed.data.diasVacaciones,
      avisoPrevioOtorgado: parsed.data.avisoPrevioOtorgado,
      otrosDescuentos: parsed.data.otrosDescuentos,
    });

    const finiquito = await (prisma as unknown as {
      finiquito: { create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>> };
    }).finiquito.create({
      data: {
        empresaId,
        trabajadorId,
        fechaTermino: parsed.data.fechaTermino,
        causal: parsed.data.causal,
        diasVacaciones: calc.diasVacaciones,
        montoVacaciones: calc.montoVacaciones,
        aniosServicio: Math.round(calc.aniosServicio * 100) / 100,
        indemnizacion: calc.indemnizacion,
        avisoPrevio: calc.avisoPrevio,
        otrosDescuentos: calc.otrosDescuentos,
        totalBruto: calc.totalBruto,
        totalNeto: calc.totalNeto,
        updatedAt: new Date(),
      },
    });

    res.status(201).json({ data: finiquito });
  } catch {
    res.status(500).json({ error: 'Error al crear finiquito' });
  }
});

router.get('/:trabajadorId/finiquito/:finiquitoId', async (req, res) => {
  try {
    const { empresaId, trabajadorId, finiquitoId } = req.params as { empresaId: string; trabajadorId: string; finiquitoId: string };

    const [finiquitoRaw, tRaw, empresa] = await Promise.all([
      (prisma as unknown as {
        finiquito: { findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null> };
      }).finiquito.findFirst({ where: { id: finiquitoId, empresaId, trabajadorId } }),
      prisma.trabajador.findFirst({ where: { id: trabajadorId, empresaId } }),
      prisma.empresa.findUnique({ where: { id: empresaId } }),
    ]);

    if (!finiquitoRaw || !tRaw || !empresa) return void res.status(404).json({ error: 'No encontrado' });

    const f = finiquitoRaw as Record<string, unknown>;
    const t = tRaw as typeof tRaw & { domicilio?: string | null; estadoCivil?: string | null; nacionalidad?: string | null };

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
      domicilio: t.domicilio,
      estadoCivil: t.estadoCivil,
      nacionalidad: t.nacionalidad,
    };

    const finDoc: FiniquitoDoc = {
      fechaTermino: f['fechaTermino'] as Date,
      causal: f['causal'] as string,
      diasVacaciones: Number(f['diasVacaciones']),
      montoVacaciones: Number(f['montoVacaciones']),
      aniosServicio: Number(f['aniosServicio']),
      indemnizacion: Number(f['indemnizacion']),
      avisoPrevio: Number(f['avisoPrevio']),
      otrosDescuentos: Number(f['otrosDescuentos']),
      totalBruto: Number(f['totalBruto']),
      totalNeto: Number(f['totalNeto']),
    };

    const html = generarFiniquito(empresaDoc, trabDoc, finDoc);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    res.status(500).json({ error: 'Error al generar finiquito' });
  }
});

export default router;

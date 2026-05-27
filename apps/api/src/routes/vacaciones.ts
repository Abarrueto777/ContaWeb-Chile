import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { vacacionSchema } from '@contaweb/validations';
import { diasHabilesEntre, calcularSaldoTrabajador, diasGanadosHastaHoy } from '../services/vacaciones.service';
import { generarComprobanteFeriado, type EmpresaDoc, type TrabajadorDoc, type ComprobanteFeriadoDoc } from '../services/htmlDocs.service';

const router = Router({ mergeParams: true });

// GET /api/empresas/:empresaId/vacaciones — historial completo
router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { trabajadorId } = req.query as { trabajadorId?: string };
    const vacaciones = await prisma.vacacion.findMany({
      where: { empresaId, ...(trabajadorId ? { trabajadorId } : {}) },
      include: { trabajador: { select: { nombre: true, rut: true } } },
      orderBy: { fechaInicio: 'desc' },
    });
    res.json({ data: vacaciones });
  } catch {
    res.status(500).json({ error: 'Error al obtener vacaciones' });
  }
});

// GET /api/empresas/:empresaId/vacaciones/saldos — saldo por trabajador activo
router.get('/saldos', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const trabajadores = await prisma.trabajador.findMany({ where: { empresaId, activo: true }, orderBy: { nombre: 'asc' } });

    const saldos = await Promise.all(trabajadores.map(async (t) => {
      const { ganados, usados, saldo, progresivos, aniosServicio } = await calcularSaldoTrabajador(empresaId, t.id, prisma);
      return {
        trabajadorId: t.id,
        trabajadorNombre: t.nombre,
        trabajadorRut: t.rut,
        fechaIngreso: t.fechaIngreso.toISOString(),
        aniosServicio,
        diasGanados: ganados,
        diasUsados: usados,
        saldo,
        diasProgresivos: progresivos,
      };
    }));

    res.json({ data: saldos });
  } catch {
    res.status(500).json({ error: 'Error al calcular saldos' });
  }
});

// POST /api/empresas/:empresaId/vacaciones
router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = vacacionSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });

    const { trabajadorId, fechaInicio, fechaFin, periodoAnual, tipo, observacion } = parsed.data;

    const diasHabiles = diasHabilesEntre(fechaInicio, fechaFin);
    if (diasHabiles === 0) return void res.status(400).json({ error: 'El período no contiene días hábiles' });

    const { saldo, ganados } = await calcularSaldoTrabajador(empresaId, trabajadorId, prisma);
    if (saldo < diasHabiles) {
      return void res.status(400).json({ error: `Saldo insuficiente: tiene ${saldo} días disponibles y solicita ${diasHabiles}` });
    }

    const saldoPrevio = saldo;
    const saldoPosterior = saldo - diasHabiles;

    const vacacion = await prisma.vacacion.create({
      data: { empresaId, trabajadorId, fechaInicio, fechaFin, diasHabiles, saldoPrevio, saldoPosterior, periodoAnual: periodoAnual ?? null, tipo: tipo as 'NORMAL' | 'PROGRESIVO' | 'COLECTIVO', observacion: observacion ?? null, estado: 'APROBADA' },
      include: { trabajador: { select: { nombre: true, rut: true } } },
    });

    void ganados; // used for balance check above
    res.status(201).json({ data: vacacion, message: 'Feriado registrado' });
  } catch {
    res.status(500).json({ error: 'Error al registrar feriado' });
  }
});

// DELETE /api/empresas/:empresaId/vacaciones/:id
router.delete('/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    await prisma.vacacion.delete({ where: { id, empresaId } });
    res.json({ message: 'Feriado eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar feriado' });
  }
});

// GET /api/empresas/:empresaId/vacaciones/:id/comprobante
router.get('/:id/comprobante', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };

    const [vac, empresa] = await Promise.all([
      prisma.vacacion.findUnique({ where: { id, empresaId }, include: { trabajador: true } }),
      prisma.empresa.findUnique({ where: { id: empresaId } }),
    ]);

    if (!vac || !empresa) return void res.status(404).json({ error: 'No encontrado' });
    const t = vac.trabajador;

    // Calcular estado del período anual
    let diasDerechoEnPeriodo: number | undefined;
    let diasUsadosEnPeriodo: number | undefined;
    if (vac.periodoAnual) {
      const m = vac.periodoAnual.match(/^Año (\d+)/);
      if (m) {
        const n = parseInt(m[1]!);
        const prog = n < 10 ? 0 : Math.floor((n - 10) / 3) + 1;
        diasDerechoEnPeriodo = 15 + prog;
        const agg = await prisma.vacacion.aggregate({
          where: { trabajadorId: vac.trabajadorId, periodoAnual: vac.periodoAnual },
          _sum: { diasHabiles: true },
        });
        diasUsadosEnPeriodo = agg._sum.diasHabiles ?? 0;
      }
    }

    const empresaDoc: EmpresaDoc = {
      razonSocial: empresa.razonSocial, rut: empresa.rut, giro: empresa.giro,
      direccion: empresa.direccion,
      representanteLegal: (empresa as typeof empresa & { representanteLegal?: string | null }).representanteLegal,
      rutRepresentante: (empresa as typeof empresa & { rutRepresentante?: string | null }).rutRepresentante,
    };
    const trabDoc: TrabajadorDoc = {
      nombre: t.nombre, rut: t.rut, cargo: t.cargo,
      sueldoBase: Number(t.sueldoBase), fechaIngreso: t.fechaIngreso,
      jornadaHoras: t.jornadaHoras, tipoContrato: t.tipoContrato,
      afp: t.afp, salud: t.salud, pctSalud: Number(t.pctSalud),
      tipoGratificacion: t.tipoGratificacion, tieneCes: t.tieneCes,
      tieneMovilizacion: t.tieneMovilizacion, tieneColacion: t.tieneColacion,
    };
    const ferDoc: ComprobanteFeriadoDoc = {
      fechaInicio: vac.fechaInicio, fechaFin: vac.fechaFin,
      diasHabiles: vac.diasHabiles, saldoPrevio: Number(vac.saldoPrevio),
      saldoPosterior: Number(vac.saldoPosterior), tipo: vac.tipo,
      ...(vac.periodoAnual != null ? { periodoAnual: vac.periodoAnual } : {}),
      ...(vac.observacion != null ? { observacion: vac.observacion } : {}),
      ...(diasDerechoEnPeriodo != null ? { diasDerechoEnPeriodo, diasUsadosEnPeriodo: diasUsadosEnPeriodo ?? 0 } : {}),
    };
    const saldoGanado = diasGanadosHastaHoy(t.fechaIngreso);

    const html = generarComprobanteFeriado(empresaDoc, trabDoc, ferDoc, saldoGanado);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    res.status(500).json({ error: 'Error al generar comprobante' });
  }
});

export default router;

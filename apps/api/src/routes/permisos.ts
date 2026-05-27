import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { permisoSchema } from '@contaweb/validations';
import { diasHabilesPermiso } from '../services/permisos.service';
import { generarComprobantePermiso, type EmpresaDoc, type TrabajadorDoc } from '../services/htmlDocs.service';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { trabajadorId } = req.query as { trabajadorId?: string };
    const permisos = await prisma.permiso.findMany({
      where: { empresaId, ...(trabajadorId ? { trabajadorId } : {}) },
      include: { trabajador: { select: { nombre: true, rut: true } } },
      orderBy: { fechaInicio: 'desc' },
    });
    res.json({ data: permisos });
  } catch {
    res.status(500).json({ error: 'Error al obtener permisos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = permisoSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });

    const { trabajadorId, tipo, fechaInicio, fechaFin, conGoce, parentesco, observacion } = parsed.data;

    const trabajador = await prisma.trabajador.findFirst({ where: { id: trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });

    const diasHabiles = diasHabilesPermiso(fechaInicio, fechaFin, trabajador.trabajaFinSemana);
    const tiposLegales = ['MATRIMONIO', 'UNION_CIVIL', 'FALLECIMIENTO'];
    if (diasHabiles === 0 && tiposLegales.includes(tipo)) {
      return void res.status(400).json({ error: 'El período no contiene días hábiles' });
    }

    const permiso = await prisma.permiso.create({
      data: {
        empresaId,
        trabajadorId,
        tipo: tipo as 'MATRIMONIO' | 'UNION_CIVIL' | 'FALLECIMIENTO' | 'SIN_GOCE' | 'ADMINISTRATIVO' | 'OTRO',
        fechaInicio,
        fechaFin,
        diasHabiles,
        conGoce,
        ...(parentesco != null ? { parentesco } : {}),
        ...(observacion != null ? { observacion } : {}),
      },
      include: { trabajador: { select: { nombre: true, rut: true } } },
    });

    res.status(201).json({ data: permiso, message: 'Permiso registrado' });
  } catch {
    res.status(500).json({ error: 'Error al registrar permiso' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    await prisma.permiso.delete({ where: { id, empresaId } });
    res.json({ message: 'Permiso eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar permiso' });
  }
});

router.get('/:id/comprobante', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };

    const [permiso, empresa] = await Promise.all([
      prisma.permiso.findUnique({ where: { id, empresaId }, include: { trabajador: true } }),
      prisma.empresa.findUnique({ where: { id: empresaId } }),
    ]);

    if (!permiso || !empresa) return void res.status(404).json({ error: 'No encontrado' });
    const t = permiso.trabajador;

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

    const html = generarComprobantePermiso(empresaDoc, trabDoc, {
      tipo: permiso.tipo,
      fechaInicio: permiso.fechaInicio,
      fechaFin: permiso.fechaFin,
      diasHabiles: permiso.diasHabiles,
      conGoce: permiso.conGoce,
      ...(permiso.parentesco != null ? { parentesco: permiso.parentesco } : {}),
      ...(permiso.observacion != null ? { observacion: permiso.observacion } : {}),
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    res.status(500).json({ error: 'Error al generar comprobante' });
  }
});

export default router;

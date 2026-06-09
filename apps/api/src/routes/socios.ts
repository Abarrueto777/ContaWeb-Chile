import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { socioSchema } from '@contaweb/validations';

const router = Router({ mergeParams: true });

// GET /api/empresas/:empresaId/socios
router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { todos } = req.query as { todos?: string };
    const socios = await prisma.socio.findMany({
      where: { empresaId, ...(todos === '1' ? {} : { activo: true }) },
      orderBy: { nombre: 'asc' },
    });
    res.json({ data: socios });
  } catch {
    res.status(500).json({ error: 'Error al obtener socios' });
  }
});

// POST /api/empresas/:empresaId/socios
router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = socioSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const socio = await prisma.socio.create({ data: { empresaId, ...parsed.data } });
    res.status(201).json({ data: socio, message: 'Socio registrado' });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'P2002') {
      return void res.status(409).json({ error: 'Ya existe un socio con ese RUT en la empresa' });
    }
    res.status(500).json({ error: 'Error al registrar socio' });
  }
});

// PUT /api/empresas/:empresaId/socios/:id
router.put('/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    const parsed = socioSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const existente = await prisma.socio.findFirst({ where: { id, empresaId } });
    if (!existente) return void res.status(404).json({ error: 'Socio no encontrado' });
    const socio = await prisma.socio.update({ where: { id }, data: parsed.data });
    res.json({ data: socio, message: 'Socio actualizado' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar socio' });
  }
});

// DELETE /api/empresas/:empresaId/socios/:id — baja lógica
router.delete('/:id', async (req, res) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    await prisma.socio.updateMany({ where: { id, empresaId }, data: { activo: false } });
    res.json({ message: 'Socio dado de baja' });
  } catch {
    res.status(500).json({ error: 'Error al dar de baja al socio' });
  }
});

export default router;

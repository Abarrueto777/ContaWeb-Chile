import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { validate } from '../middlewares/validate';
import { createError } from '../middlewares/errorHandler';
import { clienteSchema } from '@contaweb/validations';

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const clientes = await prisma.cliente.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
    });
    res.json({ data: clientes });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(clienteSchema), async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const cliente = await prisma.cliente.create({
      data: { ...req.body, empresaId },
    });
    res.status(201).json({ data: cliente });
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'P2002') {
      return next(createError('El RUT ya está registrado en esta empresa', 409));
    }
    next(err);
  }
});

router.put('/:clienteId', validate(clienteSchema), async (req, res, next) => {
  try {
    const { empresaId, clienteId } = req.params as { empresaId: string; clienteId: string };
    const existente = await prisma.cliente.findFirst({
      where: { id: clienteId, empresaId },
    });
    if (!existente) return next(createError('Cliente no encontrado', 404));

    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: req.body,
    });
    res.json({ data: cliente });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const cuentas = await prisma.cuentaContable.findMany({
      where: { empresaId },
      orderBy: { codigo: 'asc' },
    });
    res.json({ data: cuentas });
  } catch (err) {
    next(err);
  }
});

export default router;

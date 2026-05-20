import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const cuentas = await prisma.cuentaContable.findMany({
      where: { empresaId: req.params['empresaId'] },
      orderBy: { codigo: 'asc' },
    });
    res.json({ data: cuentas });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { validate } from '../middlewares/validate';
import { createError } from '../middlewares/errorHandler';
import { asientoSchema } from '@contaweb/validations';

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const asientos = await prisma.asientoContable.findMany({
      where: { empresaId: req.params['empresaId'] },
      include: { lineas: { include: { cuenta: true } } },
      orderBy: { numero: 'desc' },
    });
    res.json({ data: asientos });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(asientoSchema), async (req, res, next) => {
  try {
    const { fecha, glosa, lineas } = req.body;
    const empresaId = req.params['empresaId']!;

    const ultimoAsiento = await prisma.asientoContable.findFirst({
      where: { empresaId },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const numero = (ultimoAsiento?.numero ?? 0) + 1;

    const asiento = await prisma.asientoContable.create({
      data: {
        empresaId,
        numero,
        fecha,
        glosa,
        lineas: {
          create: lineas.map((l: { cuentaId: string; debe: number; haber: number; glosa?: string }) => ({
            cuentaId: l.cuentaId,
            debe: new Decimal(l.debe),
            haber: new Decimal(l.haber),
            glosa: l.glosa ?? null,
          })),
        },
      },
      include: { lineas: { include: { cuenta: true } } },
    });

    res.status(201).json({ data: asiento });
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'P2025') {
      return next(createError('Una o más cuentas no existen', 404));
    }
    next(err);
  }
});

export default router;

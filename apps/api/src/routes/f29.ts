import { Router } from 'express';
import { createError } from '../middlewares/errorHandler';
import { calcularF29 } from '../services/f29.service';

const router = Router({ mergeParams: true });

router.get('/:anio/:mes', async (req, res, next) => {
  try {
    const { empresaId, anio, mes } = req.params as { empresaId: string; anio: string; mes: string };

    const a = Number(anio);
    const m = Number(mes);

    if (isNaN(a) || isNaN(m) || m < 1 || m > 12) {
      return next(createError('Período inválido', 400));
    }

    const resultado = await calcularF29(empresaId, a, m);
    res.json({ data: resultado });
  } catch (err) {
    next(err);
  }
});

export default router;

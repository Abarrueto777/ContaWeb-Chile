import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { cuentaContableSchema, cuentaContableUpdateSchema } from '@contaweb/validations';
import { validate } from '../middlewares/validate';
import { calcularCodigoHijo } from '../services/cuentaContable.service';

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

// Crear subcuenta derivada de un padre (código/tipo/nivel calculados por el backend).
router.post('/', validate(cuentaContableSchema), async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { cuentaPadreId, nombre, naturaleza, permiteMovimientos } = req.body;

    const padre = await prisma.cuentaContable.findFirst({
      where: { id: cuentaPadreId, empresaId },
      include: { cuentasHijo: { select: { codigo: true } }, _count: { select: { lineasAsiento: true } } },
    });
    if (!padre) {
      return void res.status(400).json({ error: 'La cuenta padre no existe en esta empresa' });
    }

    // Una cuenta con movimientos no puede convertirse en agrupadora: rompería el balance.
    if (padre._count.lineasAsiento > 0) {
      return void res.status(400).json({
        error: 'No se pueden agregar subcuentas a una cuenta que ya tiene movimientos registrados',
      });
    }

    const codigo = calcularCodigoHijo(
      padre.codigo,
      padre.nivel,
      padre.cuentasHijo.map((h) => h.codigo),
    );

    const cuenta = await prisma.$transaction(async (tx) => {
      // El padre deja de ser hoja: ahora agrupa, no recibe movimientos directos.
      if (padre.permiteMovimientos) {
        await tx.cuentaContable.update({
          where: { id: padre.id },
          data: { permiteMovimientos: false },
        });
      }
      return tx.cuentaContable.create({
        data: {
          empresaId,
          codigo,
          nombre,
          tipo: padre.tipo,
          naturaleza: naturaleza ?? padre.naturaleza,
          nivel: padre.nivel + 1,
          cuentaPadreId: padre.id,
          permiteMovimientos,
        },
      });
    });

    res.status(201).json({ data: cuenta });
  } catch (err) {
    next(err);
  }
});

// Editar cuenta: nombre, naturaleza y permiteMovimientos. Nunca código/tipo/padre.
router.put('/:cuentaId', validate(cuentaContableUpdateSchema), async (req, res, next) => {
  try {
    const { empresaId, cuentaId } = req.params as { empresaId: string; cuentaId: string };
    const { nombre, naturaleza, permiteMovimientos } = req.body;

    const cuenta = await prisma.cuentaContable.findFirst({
      where: { id: cuentaId, empresaId },
      include: { _count: { select: { cuentasHijo: true } } },
    });
    if (!cuenta) {
      return void res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    // Una cuenta agrupadora (con hijos) nunca permite movimientos directos.
    const permite = cuenta._count.cuentasHijo > 0 ? false : (permiteMovimientos ?? cuenta.permiteMovimientos);

    const actualizada = await prisma.cuentaContable.update({
      where: { id: cuentaId },
      data: {
        nombre,
        naturaleza: naturaleza ?? cuenta.naturaleza,
        permiteMovimientos: permite,
      },
    });

    res.json({ data: actualizada });
  } catch (err) {
    next(err);
  }
});

// Borrar cuenta: solo si no tiene movimientos ni subcuentas (típico: alta equivocada).
router.delete('/:cuentaId', async (req, res, next) => {
  try {
    const { empresaId, cuentaId } = req.params as { empresaId: string; cuentaId: string };

    const cuenta = await prisma.cuentaContable.findFirst({
      where: { id: cuentaId, empresaId },
      include: { _count: { select: { lineasAsiento: true, cuentasHijo: true } } },
    });
    if (!cuenta) {
      return void res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    if (cuenta._count.lineasAsiento > 0) {
      return void res.status(400).json({ error: 'No se puede borrar una cuenta con movimientos registrados' });
    }
    if (cuenta._count.cuentasHijo > 0) {
      return void res.status(400).json({ error: 'No se puede borrar una cuenta que tiene subcuentas' });
    }

    await prisma.cuentaContable.delete({ where: { id: cuentaId } });
    res.json({ message: 'Cuenta eliminada' });
  } catch (err) {
    next(err);
  }
});

export default router;

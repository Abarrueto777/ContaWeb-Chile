import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createError } from '../middlewares/errorHandler';
import { solicitudPlanSchema } from '@contaweb/validations';
import { sendSolicitudPlanEmail } from '../services/email.service';

const router = Router();

// A propósito SIN requireSuscripcion: el momento de mayor uso de este endpoint
// es justo cuando el trial ya venció y el usuario quiere pagar.
router.use(requireAuth);

// El usuario eligió un plan y avisa que transfirió: se notifica al admin por email
// para que verifique el pago y active desde /admin/usuarios.
router.post('/solicitar', validate(solicitudPlanSchema), async (req, res, next) => {
  try {
    const { plan } = req.body as { plan: 'MENSUAL' | 'SEMESTRAL' | 'ANUAL' };

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
      select: { nombre: true, email: true },
    });
    if (!usuario) return next(createError('Usuario no encontrado', 404));

    await sendSolicitudPlanEmail(usuario.nombre, usuario.email, plan);

    res.json({ message: 'Recibimos tu solicitud. Apenas confirmemos la transferencia activamos tu plan (máximo 24 horas hábiles).' });
  } catch (err) {
    next(err);
  }
});

export default router;

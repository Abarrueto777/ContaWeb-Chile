import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { sendPlanActivadoEmail } from '../services/email.service';
import { calcularExtensionSuscripcion, conEstadoSuscripcion } from '../services/suscripcion.service';
import { adminEstadoUsuarioSchema, adminSuscripcionSchema } from '@contaweb/validations';
import type { AdminEstadoUsuarioInput, AdminSuscripcionInput } from '@contaweb/validations';

const router = Router();

// Todo el panel de admin exige sesión + rol ADMIN
router.use(requireAuth, requireAdmin);

// Listar todos los usuarios con su cantidad de empresas
router.get('/usuarios', async (_req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        trialFin: true,
        suscripcionHasta: true,
        createdAt: true,
        _count: { select: { empresas: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: usuarios.map((u) => conEstadoSuscripcion(u)) });
  } catch (err) {
    next(err);
  }
});

// Suspender / reactivar un usuario (palanca de control para planes)
router.patch('/usuarios/:id/estado', validate(adminEstadoUsuarioSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { estado } = req.body as AdminEstadoUsuarioInput;

    if (id === req.user!.id) {
      return void res.status(400).json({ error: 'No puedes cambiar tu propio estado' });
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { estado },
      select: { id: true, email: true, nombre: true, rol: true, estado: true, createdAt: true },
    });
    res.json({ data: usuario });
  } catch (err) {
    next(err);
  }
});

// Activar/extender suscripción manual: 1, 6 o 12 meses (mensual/semestral/anual).
// EXTIENDE desde el vencimiento vigente si lo hay (renovar antes no regala días),
// o desde hoy si ya venció. El cobro es por fuera (transferencia) en esta etapa.
router.patch('/usuarios/:id/suscripcion', validate(adminSuscripcionSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { meses, correccion } = req.body as AdminSuscripcionInput;

    const actual = await prisma.usuario.findUnique({
      where: { id },
      select: { nombre: true, email: true, trialFin: true, suscripcionHasta: true },
    });
    if (!actual) {
      return void res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const hasta = calcularExtensionSuscripcion(actual, meses);

    const usuario = await prisma.usuario.update({
      where: { id },
      data: { suscripcionHasta: hasta },
      select: { id: true, email: true, nombre: true, rol: true, estado: true, trialFin: true, suscripcionHasta: true, createdAt: true },
    });

    // Confirmación automática al cliente. Best-effort: si el email falla,
    // la activación ya está hecha (el acceso es lo prioritario).
    const nombrePlan = meses === 1 ? 'Mensual' : meses === 6 ? 'Semestral' : 'Anual';
    try { await sendPlanActivadoEmail(actual.email, actual.nombre, nombrePlan, hasta, correccion === true); } catch { /* el admin puede avisar a mano */ }

    res.json({ data: usuario, message: `Suscripción activa hasta ${hasta.toLocaleDateString('es-CL')}` });
  } catch (err) {
    next(err);
  }
});

// Quitar la suscripción paga (corrección de errores del admin): el usuario vuelve
// al estado que dicte su trial. NO se avisa al cliente por email — es interno.
router.delete('/usuarios/:id/suscripcion', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const existe = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      return void res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { suscripcionHasta: null },
      select: { id: true, email: true, nombre: true, rol: true, estado: true, trialFin: true, suscripcionHasta: true, createdAt: true },
    });
    res.json({ data: usuario, message: 'Suscripción quitada' });
  } catch (err) {
    next(err);
  }
});

// Borrar usuario y TODOS sus datos (cascada a nivel DB)
router.delete('/usuarios/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    if (id === req.user!.id) {
      return void res.status(400).json({ error: 'No puedes borrar tu propia cuenta' });
    }
    const usuario = await prisma.usuario.findUnique({ where: { id }, select: { rol: true } });
    if (!usuario) {
      return void res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (usuario.rol === 'ADMIN') {
      return void res.status(400).json({ error: 'No se puede borrar a un administrador' });
    }

    await prisma.usuario.delete({ where: { id } });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    next(err);
  }
});

export default router;

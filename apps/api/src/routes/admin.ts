import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin } from '../middlewares/auth';

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
        createdAt: true,
        _count: { select: { empresas: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: usuarios });
  } catch (err) {
    next(err);
  }
});

// Suspender / reactivar un usuario (palanca de control para planes)
router.patch('/usuarios/:id/estado', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const { estado } = req.body as { estado?: string };

    if (estado !== 'ACTIVO' && estado !== 'SUSPENDIDO') {
      return void res.status(400).json({ error: 'Estado inválido (ACTIVO | SUSPENDIDO)' });
    }
    if (id === req.user!.id) {
      return void res.status(400).json({ error: 'No podés cambiar tu propio estado' });
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

// Borrar usuario y TODOS sus datos (cascada a nivel DB)
router.delete('/usuarios/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };

    if (id === req.user!.id) {
      return void res.status(400).json({ error: 'No podés borrar tu propia cuenta' });
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

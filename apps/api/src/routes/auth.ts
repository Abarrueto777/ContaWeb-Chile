import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { loginSchema, registroSchema } from '@contaweb/validations';

const router = Router();

// Registro público (self-signup). El rol se FUERZA a CONTADOR en el server:
// nunca se confía en el rol que manda el cliente. Los ADMIN se promueven a mano.
router.post('/registro', validate(registroSchema), async (req, res, next) => {
  try {
    const { email, nombre, password } = req.body;

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) return next(createError('El email ya está registrado', 409));

    const hash = await bcrypt.hash(password, 12);
    const usuario = await prisma.usuario.create({
      data: { email, nombre, password: hash, rol: 'CONTADOR' },
      select: { id: true, email: true, nombre: true, rol: true, createdAt: true, updatedAt: true },
    });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env['JWT_EXPIRES_IN'] ?? (process.env['NODE_ENV'] === 'production' ? '8h' : '7d')) as unknown as Exclude<jwt.SignOptions['expiresIn'], undefined> }
    );

    res.status(201).json({ data: { token, usuario } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return next(createError('Credenciales inválidas', 401));

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return next(createError('Credenciales inválidas', 401));

    if (usuario.estado === 'SUSPENDIDO') {
      return next(createError('Tu cuenta está suspendida. Contactá al administrador.', 403));
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env['JWT_EXPIRES_IN'] ?? (process.env['NODE_ENV'] === 'production' ? '8h' : '7d')) as unknown as Exclude<jwt.SignOptions['expiresIn'], undefined> }
    );

    const { password: _, ...usuarioPublico } = usuario;
    res.json({ data: { token, usuario: usuarioPublico } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, nombre: true, rol: true, createdAt: true, updatedAt: true },
    });
    if (!usuario) return next(createError('Usuario no encontrado', 404));
    res.json({ data: usuario });
  } catch (err) {
    next(err);
  }
});

export default router;

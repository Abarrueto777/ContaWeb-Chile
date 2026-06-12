import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { loginSchema, registroSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from '@contaweb/validations';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email.service';

const router = Router();

const APP_URL = process.env['APP_URL'] ?? 'http://localhost:5173';

// Genera token de verificación (guarda solo el hash), válido 24h, y manda el email.
async function enviarVerificacion(usuarioId: string, email: string): Promise<void> {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { verifyTokenHash: tokenHash, verifyTokenExpiry: expiry },
  });
  await sendVerificationEmail(email, `${APP_URL}/verify-email?token=${rawToken}`);
}

// Registro público (self-signup). El rol se FUERZA a CONTADOR en el server:
// nunca se confía en el rol que manda el cliente. Los ADMIN se promueven a mano.
router.post('/registro', validate(registroSchema), async (req, res, next) => {
  try {
    const { email, nombre, password } = req.body;

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) return next(createError('El email ya está registrado', 409));

    const hash = await bcrypt.hash(password, 12);
    const usuario = await prisma.usuario.create({
      // Trial de 45 días: cubre un ciclo tributario mensual completo (cierre + F29) con margen.
      data: { email, nombre, password: hash, rol: 'CONTADOR', trialFin: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
      select: { id: true, email: true, nombre: true, rol: true, emailVerificado: true, trialFin: true, suscripcionHasta: true, createdAt: true, updatedAt: true },
    });

    // Enviar verificación sin bloquear el registro si el email falla (puede reenviar luego).
    try { await enviarVerificacion(usuario.id, usuario.email); } catch { /* el usuario puede reenviar */ }

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

    // Objeto explícito: nunca exponer password ni los hashes de tokens.
    const usuarioPublico = {
      id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol,
      emailVerificado: usuario.emailVerificado, trialFin: usuario.trialFin, suscripcionHasta: usuario.suscripcionHasta,
      createdAt: usuario.createdAt, updatedAt: usuario.updatedAt,
    };
    res.json({ data: { token, usuario: usuarioPublico } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, nombre: true, rol: true, emailVerificado: true, trialFin: true, suscripcionHasta: true, createdAt: true, updatedAt: true },
    });
    if (!usuario) return next(createError('Usuario no encontrado', 404));
    res.json({ data: usuario });
  } catch (err) {
    next(err);
  }
});

// Pedir recuperación: genera un token (hasheado) y manda el link por email.
// Respuesta SIEMPRE igual, exista o no el email (anti-enumeración).
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (usuario) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { resetTokenHash: tokenHash, resetTokenExpiry: expiry },
      });

      const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(usuario.email, resetUrl);
    }

    res.json({ message: 'Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.' });
  } catch (err) {
    next(err);
  }
});

// Restablecer con el token del email: valida hash + expiración, setea la nueva clave y quema el token.
router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const usuario = await prisma.usuario.findFirst({
      where: { resetTokenHash: tokenHash, resetTokenExpiry: { gt: new Date() } },
    });
    if (!usuario) {
      return next(createError('El enlace es inválido o expiró. Pedí uno nuevo.', 400));
    }

    const hash = await bcrypt.hash(password, 12);
    await prisma.usuario.update({
      where: { id: usuario.id },
      // passwordChangedAt invalida cualquier JWT emitido antes de este reset.
      data: { password: hash, resetTokenHash: null, resetTokenExpiry: null, passwordChangedAt: new Date() },
    });

    res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
  } catch (err) {
    next(err);
  }
});

// Verificar email con el token del link (público: el token ES la credencial).
router.post('/verify-email', validate(verifyEmailSchema), async (req, res, next) => {
  try {
    const { token } = req.body;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const usuario = await prisma.usuario.findFirst({
      where: { verifyTokenHash: tokenHash, verifyTokenExpiry: { gt: new Date() } },
    });
    if (!usuario) {
      return next(createError('El enlace de verificación es inválido o expiró.', 400));
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { emailVerificado: true, verifyTokenHash: null, verifyTokenExpiry: null },
    });

    res.json({ message: 'Email verificado. ¡Gracias!' });
  } catch (err) {
    next(err);
  }
});

// Reenviar el email de verificación al usuario logueado.
router.post('/resend-verification', requireAuth, async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.id } });
    if (!usuario) return next(createError('Usuario no encontrado', 404));
    if (usuario.emailVerificado) {
      return void res.json({ message: 'Tu email ya está verificado.' });
    }
    await enviarVerificacion(usuario.id, usuario.email);
    res.json({ message: 'Te reenviamos el email de verificación.' });
  } catch (err) {
    next(err);
  }
});

export default router;

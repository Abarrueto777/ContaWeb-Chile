import './loadEnv'; // PRIMER import: carga el .env raíz antes que cualquier módulo lea process.env.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import path from 'path';
import { execSync } from 'child_process';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import suscripcionRoutes from './routes/suscripcion';
import empresasRoutes from './routes/empresas';
import ufRoutes from './routes/uf';
import factoresIpcRoutes from './routes/factoresIpc';
import { syncValoresMes } from './services/uf.service';
import { scrapePreviredIndicadores } from './services/previred.service';
import { prisma } from './lib/prisma';

// Validar variables críticas al inicio
if (!process.env['JWT_SECRET'] || process.env['JWT_SECRET'].length < 32) {
  console.error('FATAL: JWT_SECRET no definido o demasiado corto (mínimo 32 chars). El servidor no puede arrancar de forma segura.');
  process.exit(1);
}

const app = express();
// Railway inyecta PORT; API_PORT como fallback para desarrollo local
const PORT = process.env['PORT'] ?? process.env['API_PORT'] ?? 3001;

// Necesario para que rate-limit y req.ip funcionen bien detrás de Railway/nginx
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN']
    ? process.env['CORS_ORIGIN'].split(',').map((o) => o.trim())
    : /^http:\/\/localhost:\d+$/,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting — login: 10 intentos / 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

// Rate limiting general — 200 req / min por IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
});

// Rate limiting password reset — 5 intentos / 15 min por IP.
// Evita abuso del envío de emails (quema de cuota Brevo) y fuerza bruta de tokens.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

// Rate limiting solicitudes de plan — 5 / 15 min por IP (manda email al admin)
const solicitudPlanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
});

// Rate limiting registro — 5 cuentas / 15 min por IP (cada registro manda email)
const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros. Intenta de nuevo en 15 minutos.' },
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/registro', registroLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth/resend-verification', passwordResetLimiter);
app.use('/api/suscripcion', solicitudPlanLimiter);
app.use('/api', apiLimiter);

// Health check — usado por Railway para verificar que el servicio levantó
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suscripcion', suscripcionRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/uf', ufRoutes);
app.use('/api/factores-ipc', factoresIpcRoutes);

app.use(errorHandler);

// Servir el frontend React en producción (misma instancia que la API)
if (process.env['NODE_ENV'] === 'production') {
  const webDist = path.join(__dirname, '../../web/dist');
  app.use(express.static(webDist));
  // SPA fallback — rutas client-side devuelven index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

async function syncPreviredMesActual() {
  const now = new Date();
  const anio = now.getFullYear();
  const mes  = now.getMonth() + 1;
  const indicadores = await scrapePreviredIndicadores();
  await prisma.valorUFUTM.upsert({
    where: { anio_mes: { anio, mes } },
    create: {
      anio, mes,
      uf:  indicadores.uf  ?? 0,
      utm: indicadores.utm ?? 0,
      imm: indicadores.imm ?? 0,
      afpCapital: indicadores.afpCapital, afpCuprum: indicadores.afpCuprum,
      afpHabitat: indicadores.afpHabitat, afpPlanvital: indicadores.afpPlanvital,
      afpProvida: indicadores.afpProvida, afpModelo: indicadores.afpModelo,
      afpUno: indicadores.afpUno, sisEmpleador: indicadores.sisEmpleador,
      topeImponibleUf: indicadores.topeImponibleUf, previredSyncAt: new Date(),
    },
    update: {
      afpCapital: indicadores.afpCapital, afpCuprum: indicadores.afpCuprum,
      afpHabitat: indicadores.afpHabitat, afpPlanvital: indicadores.afpPlanvital,
      afpProvida: indicadores.afpProvida, afpModelo: indicadores.afpModelo,
      afpUno: indicadores.afpUno, sisEmpleador: indicadores.sisEmpleador,
      topeImponibleUf: indicadores.topeImponibleUf, previredSyncAt: new Date(),
      ...(indicadores.uf  && { uf:  indicadores.uf }),
      ...(indicadores.utm && { utm: indicadores.utm }),
      ...(indicadores.imm && { imm: indicadores.imm }),
    },
  });
  return indicadores;
}

// Correr migraciones antes de arrancar (solo en producción)
if (process.env['NODE_ENV'] === 'production') {
  try {
    console.log('Corriendo migraciones...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log('✓ Migraciones aplicadas');
  } catch (err) {
    console.error('⚠ Error en migraciones (continuando):', err);
  }
}

app.listen(PORT, () => {
  console.log(`ContaCLWEB API corriendo en http://localhost:${PORT}`);

  const now = new Date();
  syncValoresMes(now.getFullYear(), now.getMonth() + 1)
    .then(() => console.log(`✓ UF/UTM/IMM ${now.getMonth() + 1}/${now.getFullYear()} sincronizados`))
    .catch((err: Error) => console.warn(`⚠ No se pudo sincronizar UF/UTM/IMM: ${err.message}`));

  // Cron: día 2 de cada mes a las 8:00 (horario Chile UTC-4)
  // día 2 para asegurar que previred ya publicó los indicadores del mes
  cron.schedule('0 12 2 * *', () => {
    syncPreviredMesActual()
      .then(i => console.log(`✓ Previred auto-sync: AFP Hábitat ${(i.afpHabitat * 100).toFixed(2)}%, SIS ${(i.sisEmpleador * 100).toFixed(2)}%`))
      .catch((err: Error) => console.warn(`⚠ Cron Previred falló: ${err.message}`));
  });
});

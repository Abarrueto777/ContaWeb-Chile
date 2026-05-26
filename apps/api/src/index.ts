import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import empresasRoutes from './routes/empresas';
import ufRoutes from './routes/uf';
import { syncValoresMes } from './services/uf.service';
import { scrapePreviredIndicadores } from './services/previred.service';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env['API_PORT'] ?? 3001;

app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN']
    ? process.env['CORS_ORIGIN'].split(',').map((o) => o.trim())
    : /^http:\/\/localhost:\d+$/,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/uf', ufRoutes);

app.use(errorHandler);

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

app.listen(PORT, () => {
  console.log(`ContaWeb API corriendo en http://localhost:${PORT}`);

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

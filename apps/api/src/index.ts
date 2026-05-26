import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import empresasRoutes from './routes/empresas';
import ufRoutes from './routes/uf';
import { syncValoresMes } from './services/uf.service';

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

app.listen(PORT, () => {
  console.log(`ContaWeb API corriendo en http://localhost:${PORT}`);

  const now = new Date();
  syncValoresMes(now.getFullYear(), now.getMonth() + 1)
    .then(() => console.log(`✓ UF/UTM/IMM ${now.getMonth() + 1}/${now.getFullYear()} sincronizados`))
    .catch((err: Error) => console.warn(`⚠ No se pudo sincronizar UF/UTM/IMM: ${err.message}`));
});

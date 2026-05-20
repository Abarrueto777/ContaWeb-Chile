import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import empresasRoutes from './routes/empresas';

const app = express();
const PORT = process.env['API_PORT'] ?? 3001;

app.use(helmet());
app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ContaWeb API corriendo en http://localhost:${PORT}`);
});

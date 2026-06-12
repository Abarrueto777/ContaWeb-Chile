import dotenv from 'dotenv';
import path from 'path';

// Carga el .env de la raíz del monorepo ANTES que cualquier otro módulo lea process.env.
// Debe importarse como PRIMER import en index.ts: por el hoisting de imports de ESM,
// los módulos importados se evalúan en orden, así que este corre primero y deja las
// variables disponibles para el resto (email.service lee EMAIL_FROM al cargarse).
// No pisa variables ya presentes en el entorno (Railway las inyecta en producción).
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

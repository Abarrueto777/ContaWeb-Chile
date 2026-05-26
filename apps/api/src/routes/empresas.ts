import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createError } from '../middlewares/errorHandler';
import { empresaSchema } from '@contaweb/validations';
import { seedPlanDeCuentas } from '../services/seedCuentas.service';
import clientesRouter from './clientes';
import documentosRouter from './documentos';
import cuentasRouter from './cuentas';
import asientosRouter from './asientos';
import comprasRouter from './compras';
import honorariosRouter from './honorarios';
import f29Router from './f29';
import bancoRouter from './banco';
import trabajadoresRouter from './trabajadores';
import liquidacionesRouter from './liquidaciones';
import activosRouter from './activos';
import reportesRouter from './reportes';
import siiRouter from './sii';
import configEmpresaRoutes from './config-empresa';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: { usuarioId: req.user!.id },
      orderBy: { razonSocial: 'asc' },
    });
    res.json({ data: empresas });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(empresaSchema), async (req, res, next) => {
  try {
    const empresa = await prisma.empresa.create({
      data: { ...req.body, usuarioId: req.user!.id },
    });

    await seedPlanDeCuentas(empresa.id, prisma);

    res.status(201).json({ data: empresa, message: 'Empresa creada con Plan de Cuentas' });
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'P2002') {
      return next(createError('El RUT ya está registrado', 409));
    }
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const empresa = await prisma.empresa.findFirst({
      where: { id, usuarioId: req.user!.id },
    });
    if (!empresa) return next(createError('Empresa no encontrada', 404));
    res.json({ data: empresa });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(empresaSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const existente = await prisma.empresa.findFirst({
      where: { id, usuarioId: req.user!.id },
    });
    if (!existente) return next(createError('Empresa no encontrada', 404));

    const empresa = await prisma.empresa.update({
      where: { id },
      data: req.body,
    });
    res.json({ data: empresa });
  } catch (err) {
    next(err);
  }
});

router.use('/:empresaId/clientes', clientesRouter);
router.use('/:empresaId/documentos', documentosRouter);
router.use('/:empresaId/cuentas', cuentasRouter);
router.use('/:empresaId/asientos', asientosRouter);
router.use('/:empresaId/compras', comprasRouter);
router.use('/:empresaId/honorarios', honorariosRouter);
router.use('/:empresaId/f29', f29Router);
router.use('/:empresaId/banco', bancoRouter);
router.use('/:empresaId/trabajadores', trabajadoresRouter);
router.use('/:empresaId/liquidaciones', liquidacionesRouter);
router.use('/:empresaId/activos', activosRouter);
router.use('/:empresaId/reportes', reportesRouter);
router.use('/:empresaId/sii', siiRouter);
router.use('/:empresaId/config', configEmpresaRoutes);

export default router;

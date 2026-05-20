import { Router } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { validate } from '../middlewares/validate';
import { createError } from '../middlewares/errorHandler';
import { documentoSchema } from '@contaweb/validations';

const IVA_CHILE = 0.19;

const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const documentos = await prisma.documentoTributario.findMany({
      where: { empresaId },
      include: { cliente: true, lineas: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: documentos });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(documentoSchema), async (req, res, next) => {
  try {
    const { clienteId, tipo, fecha, glosa, lineas } = req.body;
    const { empresaId } = req.params as { empresaId: string };

    const neto = lineas.reduce((sum: number, l: { cantidad: number; precioUnitario: number; descuento: number }) => {
      const subtotal = l.cantidad * l.precioUnitario * (1 - l.descuento / 100);
      return sum + subtotal;
    }, 0);

    const iva = new Decimal(neto).mul(IVA_CHILE).toDecimalPlaces(4);
    const total = new Decimal(neto).add(iva).toDecimalPlaces(4);

    const ultimoFolio = await prisma.documentoTributario.findFirst({
      where: { empresaId, tipo },
      orderBy: { folio: 'desc' },
      select: { folio: true },
    });
    const folio = (ultimoFolio?.folio ?? 0) + 1;

    const documento = await prisma.documentoTributario.create({
      data: {
        empresaId,
        clienteId: clienteId ?? null,
        tipo,
        folio,
        fecha,
        glosa: glosa ?? null,
        neto: new Decimal(neto).toDecimalPlaces(4),
        iva,
        total,
        lineas: {
          create: lineas.map((l: { descripcion: string; cantidad: number; precioUnitario: number; descuento: number }) => ({
            descripcion: l.descripcion,
            cantidad: new Decimal(l.cantidad),
            precioUnitario: new Decimal(l.precioUnitario),
            descuento: new Decimal(l.descuento),
            subtotal: new Decimal(l.cantidad * l.precioUnitario * (1 - l.descuento / 100)).toDecimalPlaces(4),
          })),
        },
      },
      include: { lineas: true, cliente: true },
    });

    res.status(201).json({ data: documento });
  } catch (err) {
    next(err);
  }
});

router.get('/:docId', async (req, res, next) => {
  try {
    const { empresaId, docId } = req.params as { empresaId: string; docId: string };
    const documento = await prisma.documentoTributario.findFirst({
      where: { id: docId, empresaId },
      include: { lineas: true, cliente: true },
    });
    if (!documento) return next(createError('Documento no encontrado', 404));
    res.json({ data: documento });
  } catch (err) {
    next(err);
  }
});

export default router;

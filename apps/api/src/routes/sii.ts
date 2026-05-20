import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { createError } from '../middlewares/errorHandler';

const router = Router({ mergeParams: true });

function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  const sep = lines[0]?.includes(';') ? ';' : ',';
  return lines.map((line) => {
    const fields: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === sep && !inQuote) { fields.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    fields.push(cur.trim());
    return fields;
  });
}

const TIPO_DOC_MAP: Record<string, string> = {
  '33': 'FACTURA', '34': 'FACTURA', '43': 'LIQUIDACION_FACTURA',
  '56': 'NOTA_DEBITO', '61': 'NOTA_CREDITO',
  'FACTURA ELECTRONICA': 'FACTURA', 'FACTURA NO AFECTA': 'FACTURA',
  'NOTA DE CREDITO ELECTRONICA': 'NOTA_CREDITO', 'NOTA CREDITO': 'NOTA_CREDITO',
  'LIQUIDACION-FACTURA': 'LIQUIDACION_FACTURA',
};

function normalizeTipo(raw: string): 'FACTURA' | 'NOTA_CREDITO' | 'LIQUIDACION_FACTURA' {
  const upper = raw.toUpperCase().trim();
  return (TIPO_DOC_MAP[upper] as 'FACTURA' | 'NOTA_CREDITO' | 'LIQUIDACION_FACTURA') ?? 'FACTURA';
}

function idx(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.findIndex((h) => h.toUpperCase().includes(c.toUpperCase()));
    if (i >= 0) return i;
  }
  return -1;
}

router.post('/import', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { tipo, csv } = req.body as { tipo: 'compras' | 'ventas'; csv: string };

    if (!tipo || !csv) return next(createError('Campos tipo y csv requeridos', 400));
    if (tipo !== 'compras' && tipo !== 'ventas') return next(createError('tipo debe ser compras o ventas', 400));

    const rows = parseCSV(csv);
    if (rows.length < 2) return next(createError('CSV sin datos', 400));

    const rawHeaders = rows[0]!.map((h) => h.replace(/^"/, '').replace(/"$/, '').trim());

    const iRut = idx(rawHeaders, 'RUT EMISOR', 'RUT RECEPTOR', 'RUT PROVEEDOR');
    const iNombre = idx(rawHeaders, 'RAZON SOCIAL', 'RAZÓN SOCIAL', 'NOMBRE');
    const iForlio = idx(rawHeaders, 'FOLIO');
    const iFecha = idx(rawHeaders, 'FECHA EMISION', 'FECHA DOC', 'FECHA');
    const iNeto = idx(rawHeaders, 'MONTO NETO', 'NETO');
    const iIva = idx(rawHeaders, 'IVA RECUPERABLE', 'IVA');
    const iTotal = idx(rawHeaders, 'MONTO TOTAL', 'TOTAL');
    const iTipo = idx(rawHeaders, 'TIPO DOC', 'TIPO');

    if ([iRut, iForlio, iFecha, iTotal].some((i) => i < 0)) {
      return next(createError('Formato CSV no reconocido. Columnas esperadas: RUT, Folio, Fecha, Monto Total', 400));
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows.slice(1)) {
      if (row.length < 3) continue;
      try {
        const proveedorRut = row[iRut] ?? '';
        const proveedorNombre = iNombre >= 0 ? (row[iNombre] ?? '') : '';
        const folio = parseInt(row[iForlio] ?? '0');
        const fechaStr = row[iFecha] ?? '';
        const neto = Math.round(Math.abs(parseFloat((row[iNeto] ?? '0').replace(/\./g, '').replace(',', '.'))));
        const iva = Math.round(Math.abs(parseFloat((row[iIva] ?? '0').replace(/\./g, '').replace(',', '.'))));
        const total = Math.round(Math.abs(parseFloat((row[iTotal] ?? '0').replace(/\./g, '').replace(',', '.'))));
        const rawTipo = iTipo >= 0 ? (row[iTipo] ?? '') : '';
        const tipoDoc = normalizeTipo(rawTipo);

        if (!proveedorRut || !folio || !fechaStr || total === 0) { skipped++; continue; }

        const [d, m, y] = fechaStr.includes('/') ? fechaStr.split('/') : fechaStr.split('-');
        const fecha = new Date(Number(y), Number(m) - 1, Number(d));
        if (isNaN(fecha.getTime())) { skipped++; continue; }

        if (tipo === 'compras') {
          await prisma.facturaRecibida.upsert({
            where: { empresaId_proveedorRut_tipo_folio: { empresaId, proveedorRut, tipo: tipoDoc, folio } },
            create: { empresaId, proveedorRut, proveedorNombre, tipo: tipoDoc, folio, fecha, neto, iva, total },
            update: {},
          });
        } else {
          // ventas: importar como DocumentoTributario si el cliente existe
          await prisma.documentoTributario.upsert({
            where: { empresaId_tipo_folio: { empresaId, tipo: 'FACTURA_ELECTRONICA', folio } },
            create: {
              empresaId, tipo: 'FACTURA_ELECTRONICA', folio, fecha, neto, iva, total,
              estado: 'EMITIDO', glosa: `Importado SII — ${proveedorNombre}`,
            },
            update: {},
          });
        }
        imported++;
      } catch {
        skipped++;
      }
    }

    res.json({ data: { imported, skipped } });
  } catch (err) {
    next(err);
  }
});

export default router;

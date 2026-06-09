import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { calcularF22, type F22Ajustes } from '../services/f22.service';

const router = Router({ mergeParams: true });

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

// GET /api/empresas/:empresaId/f22?anio=2025&gastosRechazados=&ajustes=&creditoPpm=&...
router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const q = req.query as Record<string, string>;
    const anio = Number(q['anio']);
    if (!anio || Number.isNaN(anio)) return void res.status(400).json({ error: 'Parámetro anio requerido' });

    const ajustes: F22Ajustes = {
      gastosRechazados: num(q['gastosRechazados']),
      ajustes: num(q['ajustes']),
      creditoPpm: num(q['creditoPpm']),
      creditoSence: num(q['creditoSence']),
      creditoDonaciones: num(q['creditoDonaciones']),
      creditoOtros: num(q['creditoOtros']),
      retenciones: num(q['retenciones']),
    };

    const f22 = await calcularF22(empresaId, anio, ajustes, prisma);
    res.json({ data: f22 });
  } catch {
    res.status(500).json({ error: 'Error al calcular el F22' });
  }
});

export default router;

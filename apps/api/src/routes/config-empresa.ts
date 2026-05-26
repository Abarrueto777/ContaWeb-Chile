import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { getConfig, setConfig } from '../services/config.service';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const config = await getConfig(empresaId);
    res.json({ data: config });
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const data = req.body as Record<string, string>;
    await setConfig(empresaId, data);
    const config = await getConfig(empresaId);
    res.json({ data: config });
  } catch (err) { next(err); }
});

export default router;

import { prisma } from '../lib/prisma';

export const CONFIG_DEFAULTS: Record<string, string> = {
  iva_pct:              '0.19',
  ppm_pct:              '0.002',
  tasa_1cat_pct:        '0.25',
  retencion_hon_pct:    '0.1525',
  tope_cotiz_uf:        '81.6',
  tope_se_uf:           '75.0',
  ces_trabajador_pct:   '0.006',
  ces_empleador_pct:    '0.024',
  acc_laboral_pct:      '0.0034',
  aporte_ses_pct:       '0.0003',
  sis_pct:              '0.0143',
  horas_semanales:      '42',
  movilizacion_mensual:  '0',
  colacion_mensual:      '0',
  conectividad_mensual:  '0',
  asig_fam_monto_a:      '17063',
  asig_fam_monto_b:      '10423',
  asig_fam_monto_c:      '3295',
};

export async function getConfig(empresaId: string): Promise<Record<string, string>> {
  const rows = await prisma.configEmpresa.findMany({ where: { empresaId } });
  const map: Record<string, string> = { ...CONFIG_DEFAULTS };
  for (const row of rows) {
    map[row.clave] = row.valor;
  }
  return map;
}

export async function setConfig(empresaId: string, data: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(data).map(([clave, valor]) =>
      prisma.configEmpresa.upsert({
        where: { empresaId_clave: { empresaId, clave } },
        create: { empresaId, clave, valor },
        update: { valor },
      })
    )
  );
}

import { useState } from 'react';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { useDJ1887, descargarDJ1887Txt } from '@/hooks/useDJ1887';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DJ1887Trabajador } from '@contaweb/shared-types';

function clp(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

const PERIODO_LABEL: Record<string, string> = { C: 'Jornada completa', P: 'Jornada parcial', F: 'Finiquitado' };
const PERIODO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = { C: 'default', P: 'secondary', F: 'destructive' };

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-1 ${accent ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DJ1887() {
  const now = new Date();
  // Por defecto se declara el año anterior (AT = año + 1)
  const [anio, setAnio] = useState(now.getFullYear() - 1);
  const [descargando, setDescargando] = useState(false);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = useDJ1887(empresa?.id ?? '', anio);
  const dj = data?.data;

  async function onDescargarTxt() {
    if (!empresa) return;
    setDescargando(true);
    try {
      await descargarDJ1887Txt(empresa.id, anio);
    } catch {
      alert('No hay datos para descargar en el año seleccionado.');
    } finally {
      setDescargando(false);
    }
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-medium">No tienes empresas registradas</p>
    </div>
  );

  const trabajadores = dj?.trabajadores ?? [];
  const tot = dj?.totales;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DJ 1887</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {empresa.razonSocial} — Rentas Art. 42 N°1 y Retenciones · AT {anio + 1} (renta {anio})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="w-24 h-9"
            min={2000}
            max={now.getFullYear()}
          />
          <Button onClick={onDescargarTxt} disabled={descargando || trabajadores.length === 0}>
            {descargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Descargar TXT
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
        Plazo de declaración: <strong>~27 de marzo de {anio + 1}</strong>. El TXT es de referencia —
        para declarar: <strong>sii.cl → Declaraciones Juradas → 1887</strong>. Montos actualizados con factor IPC 1,0 (sin reajuste cargado).
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando…
        </div>
      ) : trabajadores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Sin liquidaciones para {anio}</p>
          <p className="text-sm text-muted-foreground">Genera liquidaciones en RRHH para poder declarar.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Trabajadores" value={String(tot?.trabajadores ?? 0)} />
            <Kpi label="Renta neta total" value={clp(tot?.rentaNeta ?? 0)} accent="text-foreground" />
            <Kpi label="Rentas no gravadas" value={clp(tot?.noGravada ?? 0)} accent="text-blue-600" />
            <Kpi label="Impuesto único retenido" value={clp(tot?.impuestoUnico ?? 0)} accent="text-red-600" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-3 py-2 text-center font-medium">N°</th>
                      <th className="px-3 py-2 text-left font-medium">RUT</th>
                      <th className="px-3 py-2 text-left font-medium">Trabajador</th>
                      <th className="px-3 py-2 text-center font-medium">Período</th>
                      <th className="px-3 py-2 text-center font-medium">Meses</th>
                      <th className="px-3 py-2 text-right font-medium">Renta Neta</th>
                      <th className="px-3 py-2 text-right font-medium hidden md:table-cell">No Gravada</th>
                      <th className="px-3 py-2 text-right font-medium">Imp. Único</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trabajadores.map((t: DJ1887Trabajador) => (
                      <tr key={t.nCert} className="border-b hover:bg-muted/10">
                        <td className="px-3 py-2 text-center text-muted-foreground">{t.nCert}</td>
                        <td className="px-3 py-2 font-mono text-xs">{t.rut}</td>
                        <td className="px-3 py-2">{t.nombre}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant={PERIODO_VARIANT[t.periodoCod]} className="text-[10px]" title={PERIODO_LABEL[t.periodoCod]}>
                            {t.periodoCod}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">{t.meses}</td>
                        <td className="px-3 py-2 text-right font-mono">{clp(t.rentaNeta)}</td>
                        <td className="px-3 py-2 text-right font-mono hidden md:table-cell">{clp(t.noGravada)}</td>
                        <td className="px-3 py-2 text-right font-mono">{clp(t.impuestoUnico)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30 font-semibold">
                      <td className="px-3 py-2" colSpan={5}>Totales</td>
                      <td className="px-3 py-2 text-right font-mono">{clp(tot?.rentaNeta ?? 0)}</td>
                      <td className="px-3 py-2 text-right font-mono hidden md:table-cell">{clp(tot?.noGravada ?? 0)}</td>
                      <td className="px-3 py-2 text-right font-mono">{clp(tot?.impuestoUnico ?? 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Códigos de período: <strong>C</strong> jornada completa (&gt;30h) · <strong>P</strong> jornada parcial (≤30h) ·
            <strong> F</strong> finiquitado durante el año. Las rentas no gravadas incluyen movilización, colación,
            conectividad, asignación familiar y subsidio por licencia médica (Art. 17 N°1 LIR).
          </p>
        </>
      )}
    </div>
  );
}

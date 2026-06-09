import { useState } from 'react';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { useDJ1879, descargarDJ1879Txt } from '@/hooks/useDJ1879';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DJ1879Prestador } from '@contaweb/shared-types';

function clp(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-xl font-bold mt-1 ${accent ?? ''}`}>{value}</p></CardContent></Card>
  );
}

export default function DJ1879() {
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear() - 1);
  const [descargando, setDescargando] = useState(false);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = useDJ1879(empresa?.id ?? '', anio);
  const dj = data?.data;

  async function onDescargarTxt() {
    if (!empresa) return;
    setDescargando(true);
    try { await descargarDJ1879Txt(empresa.id, anio); }
    catch { alert('No hay honorarios para descargar en el año seleccionado.'); }
    finally { setDescargando(false); }
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  const prestadores = dj?.prestadores ?? [];
  const tot = dj?.totales;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DJ 1879</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial} — Retenciones por honorarios (Art. 42 N°2) · AT {anio + 1} (renta {anio})</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24 h-9" min={2000} max={now.getFullYear()} />
          <Button onClick={onDescargarTxt} disabled={descargando || prestadores.length === 0}>
            {descargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Descargar TXT
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
        Plazo de declaración: <strong>~28 de marzo de {anio + 1}</strong>. El TXT es de referencia —
        para declarar: <strong>sii.cl → Declaraciones Juradas → 1879</strong>.
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando…</div>
      ) : prestadores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Sin honorarios para {anio}</p>
          <p className="text-sm text-muted-foreground">Registrá boletas de honorarios para poder declarar.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Prestadores" value={String(tot?.boletas ? prestadores.length : 0)} />
            <Kpi label="Renta bruta" value={clp(tot?.bruto ?? 0)} accent="text-foreground" />
            <Kpi label="Retención" value={clp(tot?.retencion ?? 0)} accent="text-red-600" />
            <Kpi label="Líquido pagado" value={clp(tot?.neto ?? 0)} accent="text-green-600" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-3 py-2 text-center font-medium">N°</th>
                      <th className="px-3 py-2 text-left font-medium">RUT</th>
                      <th className="px-3 py-2 text-left font-medium">Prestador</th>
                      <th className="px-3 py-2 text-center font-medium">Boletas</th>
                      <th className="px-3 py-2 text-right font-medium">Renta bruta</th>
                      <th className="px-3 py-2 text-right font-medium">Retención</th>
                      <th className="px-3 py-2 text-right font-medium">Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestadores.map((p: DJ1879Prestador) => (
                      <tr key={p.nro} className="border-b hover:bg-muted/10">
                        <td className="px-3 py-2 text-center text-muted-foreground">{p.nro}</td>
                        <td className="px-3 py-2 font-mono text-xs">{p.rut}</td>
                        <td className="px-3 py-2">{p.nombre}</td>
                        <td className="px-3 py-2 text-center">{p.nBoletas}</td>
                        <td className="px-3 py-2 text-right font-mono">{clp(p.bruto)}</td>
                        <td className="px-3 py-2 text-right font-mono text-red-600">{clp(p.retencion)}</td>
                        <td className="px-3 py-2 text-right font-mono text-green-600">{clp(p.neto)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30 font-semibold">
                      <td className="px-3 py-2" colSpan={3}>Totales</td>
                      <td className="px-3 py-2 text-center">{tot?.boletas ?? 0}</td>
                      <td className="px-3 py-2 text-right font-mono">{clp(tot?.bruto ?? 0)}</td>
                      <td className="px-3 py-2 text-right font-mono text-red-600">{clp(tot?.retencion ?? 0)}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-600">{clp(tot?.neto ?? 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

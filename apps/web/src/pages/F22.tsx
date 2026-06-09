import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useF22, type F22Ajustes } from '@/hooks/useF22';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function clp(n: number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function Fila({ rec, desc, monto, bold, color, alt }: { rec?: string; desc: string; monto: number; bold?: boolean; color?: string; alt?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border-b border-border/40 ${alt ? 'bg-muted/30' : ''}`}>
      <span className="w-12 text-right text-[11px] text-muted-foreground shrink-0">{rec ? `Rec.${rec}` : ''}</span>
      <span className={`flex-1 text-sm ${bold ? 'font-semibold' : 'text-muted-foreground'}`}>{desc}</span>
      <span className={`w-32 text-right font-mono text-sm ${bold ? 'font-bold' : ''} ${color ?? (monto < 0 ? 'text-red-600' : '')}`}>
        {monto === 0 ? '—' : clp(monto)}
      </span>
    </div>
  );
}

function Seccion({ titulo, color }: { titulo: string; color?: string }) {
  return <div className={`px-3 py-1.5 mt-3 text-xs font-bold text-white rounded-t ${color ?? 'bg-slate-700'}`}>{titulo}</div>;
}

const CAMPOS_AJUSTE: { key: keyof F22Ajustes; label: string; hint?: string }[] = [
  { key: 'gastosRechazados', label: 'Gastos rechazados', hint: 'Art. 33 N°1 — gastos no aceptados' },
  { key: 'ajustes', label: 'Ajustes RLI', hint: 'Otros ajustes a la renta líquida' },
  { key: 'creditoPpm', label: 'PPM manual (0 = automático)', hint: 'Dejar en 0 para usar el PPM calculado' },
  { key: 'creditoSence', label: 'Crédito SENCE', hint: 'Art. 68 — capacitación' },
  { key: 'creditoDonaciones', label: 'Crédito donaciones', hint: 'Art. 69 y otras normas' },
  { key: 'retenciones', label: 'Retenciones Art. 74' },
  { key: 'creditoOtros', label: 'Otros créditos' },
];

export default function F22() {
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear() - 1);
  const [ajustes, setAjustes] = useState<F22Ajustes>({
    gastosRechazados: 0, ajustes: 0, creditoPpm: 0, creditoSence: 0, creditoDonaciones: 0, creditoOtros: 0, retenciones: 0,
  });

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = useF22(empresa?.id ?? '', anio, ajustes);
  const f = data?.data;

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  const tasaPct = `${((f?.tasa1cat ?? 0.25) * 100).toFixed(0)}%`;
  const tasaPpmPct = `${((f?.tasaPpm ?? 0.002) * 100).toFixed(2)}%`;

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">F22 — Renta Anual</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial} · {f?.periodo ?? `AT ${anio + 1} — Renta ${anio}`} · ProPyme</p>
        </div>
        <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24 h-9" min={2000} max={now.getFullYear()} />
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Borrador orientativo — verificá con el contador antes de declarar en sii.cl. Tasa 1ª Cat: {tasaPct} · PPM: {tasaPpmPct}.
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        {/* Ajustes manuales */}
        <Card className="h-fit">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ajustes manuales</p>
            {CAMPOS_AJUSTE.map(({ key, label, hint }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  value={ajustes[key] || ''}
                  onChange={(e) => setAjustes((a) => ({ ...a, [key]: Number(e.target.value) || 0 }))}
                  className="h-8"
                  placeholder="0"
                />
                {hint && <p className="text-[10px] text-muted-foreground italic">{hint}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Formulario */}
        <div className="space-y-3">
          {isLoading || !f ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculando…</div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">RLI</p><p className="text-lg font-bold text-blue-600">{clp(f.rentaImponible)}</p></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Impuesto {tasaPct}</p><p className="text-lg font-bold text-amber-600">{clp(f.impuesto1cat)}</p></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total créditos</p><p className="text-lg font-bold text-green-600">{clp(f.totalCreditos)}</p></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">{f.aPagar > 0 ? 'A pagar' : 'Devolución'}</p><p className={`text-lg font-bold ${f.aPagar > 0 ? 'text-red-600' : 'text-green-600'}`}>{clp(f.aPagar > 0 ? f.aPagar : f.devolucion)}</p></CardContent></Card>
              </div>

              <Card>
                <CardContent className="p-0 pb-2">
                  <Seccion titulo="SECCIÓN A — Resultado del Ejercicio" />
                  <Fila rec="628" desc="Ingresos del ejercicio" monto={f.ingresos} alt />
                  <Fila desc="(−) Gastos del ejercicio" monto={-f.gastosTotal} />
                  <Fila rec="630" desc="RESULTADO / UTILIDAD NETA" monto={f.utilidadNeta} bold color={f.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'} alt />

                  <Seccion titulo="SECCIÓN B — Renta Líquida Imponible (RLI)" />
                  <Fila desc="Resultado del ejercicio" monto={f.utilidadNeta} alt />
                  <Fila rec="633" desc="(+) Gastos rechazados (Art. 33 N°1)" monto={f.gastosRechazados} />
                  <Fila rec="634" desc="(+/−) Ajustes normativos" monto={f.ajustes} alt />
                  <Fila rec="632" desc="RENTA LÍQUIDA IMPONIBLE" monto={f.rentaImponible} bold color="text-blue-600" />

                  <Seccion titulo={`SECCIÓN C — Impuesto 1ª Categoría (${tasaPct})`} />
                  <Fila rec="632" desc="RLI (base imponible)" monto={f.rentaImponible} alt />
                  <Fila rec="18" desc={`Impuesto determinado × ${tasaPct}`} monto={f.impuesto1cat} bold color="text-amber-600" />

                  <Seccion titulo="SECCIÓN D — Créditos al Impuesto" />
                  <Fila rec="15" desc={`Crédito PPM (${tasaPpmPct} × ventas)`} monto={-f.creditoPpm} alt />
                  <Fila rec="22" desc="Crédito SENCE (Art. 68)" monto={-f.creditoSence} />
                  <Fila desc="Crédito donaciones (Art. 69)" monto={-f.creditoDonaciones} alt />
                  <Fila rec="16" desc="Retenciones Art. 74" monto={-f.retenciones} />
                  <Fila desc="Otros créditos" monto={-f.creditoOtros} alt />
                  <Fila rec="38" desc="TOTAL CRÉDITOS" monto={-f.totalCreditos} bold color="text-green-600" />

                  <Seccion titulo="SECCIÓN E — Resultado Final" color={f.aPagar > 0 ? 'bg-red-600' : 'bg-green-600'} />
                  {f.aPagar > 0
                    ? <Fila rec="89" desc="▶ IMPUESTO A PAGAR AL FISCO" monto={f.aPagar} bold color="text-red-600" alt />
                    : <Fila rec="90" desc="◀ DEVOLUCIÓN A SOLICITAR" monto={f.devolucion} bold color="text-green-600" alt />}

                  <Seccion titulo="SECCIÓN F — PPM (Pagos Provisionales Mensuales)" />
                  <Fila rec="72" desc="Ventas netas (base PPM)" monto={f.ventasNetas} alt />
                  <Fila rec="73" desc={`PPM determinado (${tasaPpmPct} × ventas)`} monto={f.ppmAcumulado} />
                  {f.sueldosEmpresarial > 0 && <Fila desc="Sueldo empresarial pagado en el año" monto={f.sueldosEmpresarial} alt />}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

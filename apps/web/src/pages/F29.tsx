import { useState } from 'react';
import { FileText, ChevronRight, Loader2 } from 'lucide-react';
import { useF29 } from '@/hooks/useF29';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function clp(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function FilaF29({ label, valor, destacado, subtotal }: { label: string; valor: number; destacado?: boolean; subtotal?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${subtotal ? 'border-t' : 'border-b border-dashed border-border/50'}`}>
      <span className={`text-sm ${destacado ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
      <span className={`text-sm font-mono ${destacado ? 'font-bold text-base' : ''} ${valor < 0 ? 'text-destructive' : ''}`}>
        {clp(valor)}
      </span>
    </div>
  );
}

export default function F29() {
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading, error } = useF29(empresa?.id ?? '', anio, mes);

  const f29 = data?.data;

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-medium">No tienes empresas registradas</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Formulario F29</h1>
        <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial} — Declaración mensual IVA</p>
      </div>

      {/* Selector período */}
      <div className="flex items-center gap-3">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <Input
          type="number"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="w-24"
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          Error al calcular el F29
        </p>
      )}

      {f29 && (
        <div className="space-y-4">
          {/* Débito Fiscal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Débito Fiscal (Ventas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <FilaF29 label="Ventas netas del período" valor={f29.ventas.neto} />
              <FilaF29 label="IVA sobre ventas" valor={f29.ventas.ivaEmitido} />
              <FilaF29 label="(-) IVA notas de crédito emitidas" valor={-f29.ventas.ivaNCEmitidas} />
              <FilaF29 label="Débito Fiscal" valor={f29.ventas.debitoFiscal} destacado />
            </CardContent>
          </Card>

          {/* Crédito Fiscal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Crédito Fiscal (Compras)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <FilaF29 label="IVA facturas recibidas" valor={f29.compras.ivaCompras} />
              <FilaF29 label="(-) IVA notas de crédito recibidas" valor={-f29.compras.ivaNCRecibidas} />
              <FilaF29 label="(+) Impuestos adicionales recuperables" valor={f29.compras.impAdicional} />
              <FilaF29 label="Crédito Fiscal" valor={f29.compras.creditoFiscal} destacado />
            </CardContent>
          </Card>

          {/* Determinación IVA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Determinación IVA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <FilaF29 label="Débito Fiscal" valor={f29.ventas.debitoFiscal} />
              <FilaF29 label="(-) Crédito Fiscal" valor={-f29.compras.creditoFiscal} />
              <FilaF29 label="(-) Retención IVA (carne/harina)" valor={-f29.compras.retencionIVA} />
              <FilaF29 label="IVA neto a pagar" valor={f29.resultado.ivaNeto} destacado />
              {f29.resultado.remanente > 0 && (
                <div className="pt-1">
                  <Badge variant="secondary">Remanente CF: {clp(f29.resultado.remanente)}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Otros impuestos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Otros impuestos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <FilaF29
                label={`PPM (${(f29.ppm.tasa * 100).toFixed(2)}% sobre ventas netas)`}
                valor={f29.ppm.monto}
              />
              <FilaF29
                label={`Retención honorarios (${f29.honorarios.cantidad} boletas)`}
                valor={f29.honorarios.retencionHonorarios}
              />
            </CardContent>
          </Card>

          {/* Total a pagar */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-base">Total F29 a pagar</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {clp(f29.resultado.totalAPagar)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                IVA {clp(f29.resultado.ivaNeto)} + PPM {clp(f29.ppm.monto)} + Ret. Hon. {clp(f29.honorarios.retencionHonorarios)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

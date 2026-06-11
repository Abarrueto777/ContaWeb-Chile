import { useState } from 'react';
import axios from 'axios';
import { Users, Trash2, Ban, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useAdminUsuarios, useUpdateEstadoUsuario, useDeleteUsuario, type AdminUsuario } from '@/hooks/useAdminUsuarios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function msgError(e: Error | null): string | null {
  if (!e) return null;
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return e.message;
}

const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function AdminUsuarios() {
  const { data, isLoading } = useAdminUsuarios();
  const updateEstado = useUpdateEstadoUsuario();
  const deleteUsuario = useDeleteUsuario();
  const [borrando, setBorrando] = useState<AdminUsuario | null>(null);

  const usuarios = data?.data ?? [];

  const toggleEstado = (u: AdminUsuario) => {
    updateEstado.mutate({ id: u.id, estado: u.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO' });
  };

  const onBorrar = () => {
    if (!borrando) return;
    deleteUsuario.mutate(borrando.id, {
      onSuccess: () => { setBorrando(null); deleteUsuario.reset(); },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">{usuarios.length} usuarios registrados</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : usuarios.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">Sin usuarios</p>
        </CardContent></Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Usuario</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Rol</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Empresas</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Alta</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="px-5 py-3 w-28"></th>
            </tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">{u.nombre}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    {u.rol === 'ADMIN'
                      ? <Badge variant="default" className="text-xs gap-1"><ShieldCheck className="h-3 w-3" />ADMIN</Badge>
                      : <Badge variant="secondary" className="text-xs">{u.rol}</Badge>}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{u._count.empresas}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground text-xs">{fmtFecha(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    {u.estado === 'ACTIVO'
                      ? <span className="text-xs text-green-600 font-medium">Activo</span>
                      : <span className="text-xs text-orange-600 font-medium">Suspendido</span>}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {u.rol === 'ADMIN' ? (
                      <span className="text-xs text-muted-foreground italic pr-2">protegido</span>
                    ) : (
                      <>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title={u.estado === 'ACTIVO' ? 'Suspender' : 'Reactivar'}
                          disabled={updateEstado.isPending}
                          onClick={() => toggleEstado(u)}
                        >
                          {u.estado === 'ACTIVO'
                            ? <Ban className="h-4 w-4 text-orange-600" />
                            : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Borrar" onClick={() => setBorrando(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {updateEstado.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(updateEstado.error)}</p>
      )}

      {/* Confirmar borrado */}
      <Dialog open={!!borrando} onOpenChange={(v) => { if (!v) { setBorrando(null); deleteUsuario.reset(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Borrar usuario</DialogTitle>
            <DialogDescription>
              Vas a borrar a <span className="font-medium">{borrando?.nombre}</span> ({borrando?.email}) y
              <span className="font-medium"> TODOS sus datos</span>
              {borrando && borrando._count.empresas > 0 ? `, incluidas sus ${borrando._count.empresas} empresa(s) con toda su contabilidad` : ''}.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteUsuario.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(deleteUsuario.error)}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrando(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={onBorrar} disabled={deleteUsuario.isPending}>
              {deleteUsuario.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Borrar todo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

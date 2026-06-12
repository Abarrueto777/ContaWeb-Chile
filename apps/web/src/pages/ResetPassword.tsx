import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { resetPasswordSchema } from '@contaweb/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useResetPassword } from '@/hooks/useAuth';

const passwordOnly = resetPasswordSchema.pick({ password: true });

function msgError(e: Error | null): string | null {
  if (!e) return null;
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return e.message;
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const { register, handleSubmit, formState: { errors } } = useForm<{ password: string }>({
    resolver: zodResolver(passwordOnly),
  });
  const { mutate, isPending, isSuccess, error } = useResetPassword();

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-14 w-14 rounded-2xl shadow-md shadow-primary/30" />
          <h1 className="text-2xl font-bold tracking-tight">ContaCL<span className="text-primary">WEB</span></h1>
        </div>
        {children}
      </div>
    </div>
  );

  if (!token) {
    return (
      <Shell>
        <Card><CardContent className="flex flex-col items-center text-center gap-3 py-10">
          <AlertTriangle className="h-12 w-12 text-orange-500" />
          <p className="font-medium">Enlace inválido</p>
          <p className="text-sm text-muted-foreground">Este enlace de recuperación no es válido. Pedí uno nuevo.</p>
          <Button asChild variant="outline" className="mt-2"><Link to="/forgot-password">Pedir otro enlace</Link></Button>
        </CardContent></Card>
      </Shell>
    );
  }

  if (isSuccess) {
    return (
      <Shell>
        <Card><CardContent className="flex flex-col items-center text-center gap-3 py-10">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <p className="font-medium">¡Contraseña actualizada!</p>
          <p className="text-sm text-muted-foreground">Ya podés iniciar sesión con tu nueva contraseña.</p>
          <Button asChild className="mt-2"><Link to="/">Iniciar sesión</Link></Button>
        </CardContent></Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Nueva contraseña</CardTitle>
          <CardDescription>Elegí una contraseña nueva para tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(({ password }) => mutate({ token, password }))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña nueva</Label>
              <Input id="password" {...register('password')} type="password" autoComplete="new-password" placeholder="Mínimo 8, una mayúscula y un número" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(error)}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground">Volver al inicio de sesión</Link>
      </p>
    </Shell>
  );
}

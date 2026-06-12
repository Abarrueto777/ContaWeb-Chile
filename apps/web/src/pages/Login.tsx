import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { loginSchema, type LoginInput } from '@contaweb/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin } from '@/hooks/useAuth';

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const { mutate, isPending, error } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-14 w-14 rounded-2xl shadow-md shadow-primary/30" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">ContaCL<span className="text-primary">WEB</span></h1>
            <p className="text-sm text-muted-foreground">Sistema contable para contadores chilenos</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Iniciar sesión</CardTitle>
            <CardDescription>Ingresa tu email y contraseña para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  {...register('email')}
                  type="email"
                  placeholder="contador@ejemplo.cl"
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                <div className="text-right">
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">¿Olvidaste tu contraseña?</Link>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error.message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Ingresando…' : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-primary font-medium hover:underline">
            Registrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

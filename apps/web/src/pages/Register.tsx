import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Calculator, Loader2 } from 'lucide-react';
import { registroSchema, type RegistroInput } from '@contaweb/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegistro } from '@/hooks/useAuth';

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroInput>({ resolver: zodResolver(registroSchema) });

  const { mutate, isPending, error } = useRegistro();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-md">
            <Calculator className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">ContaWeb Chile</h1>
            <p className="text-sm text-muted-foreground">Creá tu cuenta de contador</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Crear cuenta</CardTitle>
            <CardDescription>Completá tus datos para registrarte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  {...register('nombre')}
                  placeholder="Juan Pérez González"
                  autoComplete="name"
                />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>

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
                  autoComplete="new-password"
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error.message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

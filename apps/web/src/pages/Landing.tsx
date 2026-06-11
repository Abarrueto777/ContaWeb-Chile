import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { loginSchema, type LoginInput } from '@contaweb/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/useAuth';

const FEATURES = [
  'Plan de cuentas chileno listo para usar',
  'Documentos, F29 y F22 en un solo lugar',
  'Honorarios, RRHH y libros de IVA',
];

export default function Landing() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const { mutate, isPending, error } = useLogin();

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo — marca y propuesta de valor */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-primary to-emerald-700 text-primary-foreground overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-emerald-900/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <LogoMark className="h-11 w-11 rounded-2xl shadow-lg shadow-black/20" />
          <span className="text-xl font-bold tracking-tight">ContaCL<span className="text-white/80">WEB</span></span>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            La contabilidad de tus pymes,<br />ordenada y al día.
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            El sistema pensado para contadores chilenos que atienden clientes pequeños.
          </p>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-primary-foreground/90">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} ContaCLWEB · Hecho para Chile
        </p>
      </div>

      {/* Panel derecho — login */}
      <div className="flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Marca compacta (solo mobile, donde el panel izquierdo se oculta) */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <LogoMark className="h-14 w-14 rounded-2xl shadow-md shadow-primary/30" />
            <h1 className="text-2xl font-bold tracking-tight">ContaCL<span className="text-primary">WEB</span></h1>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">Iniciá sesión</h2>
            <p className="text-sm text-muted-foreground">Ingresá a tu cuenta para administrar tus empresas.</p>
          </div>

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

          <p className="text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="text-primary font-medium hover:underline">
              Registrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@contaweb/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForgotPassword } from '@/hooks/useAuth';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const { mutate, isPending, isSuccess, data } = useForgotPassword();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-14 w-14 rounded-2xl shadow-md shadow-primary/30" />
          <h1 className="text-2xl font-bold tracking-tight">ContaCL<span className="text-primary">WEB</span></h1>
        </div>

        <Card>
          {isSuccess ? (
            <CardContent className="flex flex-col items-center text-center gap-3 py-10">
              <MailCheck className="h-12 w-12 text-primary" />
              <p className="font-medium">Revisa tu correo</p>
              <p className="text-sm text-muted-foreground">{data?.message}</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Recuperar contraseña</CardTitle>
                <CardDescription>Ingresa tu email y te enviamos un enlace para restablecerla.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" {...register('email')} type="email" placeholder="contador@ejemplo.cl" autoComplete="email" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? 'Enviando…' : 'Enviar enlace'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

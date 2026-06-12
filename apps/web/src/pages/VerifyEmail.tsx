import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerifyEmail } from '@/hooks/useAuth';

function msgError(e: Error | null): string | null {
  if (!e) return null;
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return e.message;
}

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { mutate, isPending, isSuccess, isError, error, data } = useVerifyEmail();
  const fired = useRef(false);

  useEffect(() => {
    if (token && !fired.current) {
      fired.current = true;
      mutate({ token });
    }
  }, [token, mutate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-14 w-14 rounded-2xl shadow-md shadow-primary/30" />
          <h1 className="text-2xl font-bold tracking-tight">ContaCL<span className="text-primary">WEB</span></h1>
        </div>

        <Card><CardContent className="flex flex-col items-center text-center gap-3 py-10">
          {!token || isError ? (
            <>
              <AlertTriangle className="h-12 w-12 text-orange-500" />
              <p className="font-medium">No pudimos verificar tu email</p>
              <p className="text-sm text-muted-foreground">{!token ? 'El enlace no es válido.' : msgError(error)}</p>
              <Button asChild variant="outline" className="mt-2"><Link to="/">Ir al inicio</Link></Button>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <p className="font-medium">¡Email verificado!</p>
              <p className="text-sm text-muted-foreground">{data?.message}</p>
              <Button asChild className="mt-2"><Link to="/dashboard">Ir a mi panel</Link></Button>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="font-medium">Verificando tu email…</p>
            </>
          )}
          {isPending && null}
        </CardContent></Card>
      </div>
    </div>
  );
}

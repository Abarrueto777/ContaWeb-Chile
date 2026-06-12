import { MailWarning, Loader2, CheckCircle2 } from 'lucide-react';
import { useMe, useResendVerification } from '@/hooks/useAuth';

export default function VerifyEmailBanner() {
  const { data } = useMe();
  const usuario = data?.data;
  const resend = useResendVerification();

  if (!usuario || usuario.emailVerificado) return null;

  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-700 dark:text-amber-400">
      <MailWarning className="h-4 w-4 shrink-0" />
      <p className="text-sm flex-1">
        Verifica tu email <span className="font-medium">{usuario.email}</span> para asegurar tu cuenta. Revisa tu bandeja de entrada.
      </p>
      {resend.isSuccess ? (
        <span className="text-sm font-medium inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />{resend.data?.message}</span>
      ) : (
        <button
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
          className="text-sm font-medium underline underline-offset-2 hover:no-underline inline-flex items-center gap-1.5 shrink-0 disabled:opacity-60"
        >
          {resend.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Reenviar email
        </button>
      )}
    </div>
  );
}

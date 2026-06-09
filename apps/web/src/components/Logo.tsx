import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Marca isotipo: tile redondeado con degradado esmeralda y barras ascendentes (crecimiento/finanzas). */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <rect x="7.5" y="17" width="3.6" height="7.5" rx="1.4" fill="#fff" fillOpacity="0.95" />
      <rect x="14.2" y="12.5" width="3.6" height="12" rx="1.4" fill="#fff" fillOpacity="0.95" />
      <rect x="20.9" y="8" width="3.6" height="16.5" rx="1.4" fill="#fff" fillOpacity="0.95" />
    </svg>
  );
}

/** Logo completo: isotipo + wordmark "ContaCLWEB". */
export function Logo({
  className,
  markClassName,
  subtitle = true,
}: {
  className?: string;
  markClassName?: string;
  subtitle?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={cn('h-8 w-8 shrink-0 rounded-lg shadow-sm shadow-primary/30', markClassName)} />
      <div className="min-w-0">
        <p className="text-sm font-bold leading-none tracking-tight">
          ContaCL<span className="text-primary">WEB</span>
        </p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground leading-none mt-1 uppercase tracking-[0.18em]">
            Contabilidad
          </p>
        )}
      </div>
    </div>
  );
}

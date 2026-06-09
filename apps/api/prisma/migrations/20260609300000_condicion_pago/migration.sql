-- Condición de pago (contado / crédito) en ventas y compras
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CondicionPago') THEN
    CREATE TYPE "CondicionPago" AS ENUM ('CONTADO', 'CREDITO');
  END IF;
END$$;

ALTER TABLE "documentos_tributarios" ADD COLUMN IF NOT EXISTS "condicionPago" "CondicionPago" NOT NULL DEFAULT 'CONTADO';
ALTER TABLE "facturas_recibidas"     ADD COLUMN IF NOT EXISTS "condicionPago" "CondicionPago" NOT NULL DEFAULT 'CONTADO';

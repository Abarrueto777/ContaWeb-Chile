-- Campos conectividad y asignación familiar en trabajadores y liquidaciones
ALTER TABLE "trabajadores" ADD COLUMN IF NOT EXISTS "tiene_conectividad" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "trabajadores" ADD COLUMN IF NOT EXISTS "cargas_familiares" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "liquidaciones" ADD COLUMN IF NOT EXISTS "conectividad" DECIMAL(19,4) NOT NULL DEFAULT 0;
ALTER TABLE "liquidaciones" ADD COLUMN IF NOT EXISTS "asig_familiar" DECIMAL(19,4) NOT NULL DEFAULT 0;

-- Aumentar precisión de montoIsapre para 3 decimales (plan ISAPRE en UF)
ALTER TABLE "trabajadores" ALTER COLUMN "monto_isapre" TYPE DECIMAL(10,4);

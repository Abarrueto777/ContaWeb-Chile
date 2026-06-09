-- Enum tipo de licencia médica
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoLicencia') THEN
    CREATE TYPE "TipoLicencia" AS ENUM ('COMUN', 'ACCIDENTE_LABORAL', 'PRENATAL', 'POSTNATAL', 'MENTAL');
  END IF;
END$$;

-- Tabla licencias médicas
CREATE TABLE IF NOT EXISTS "licencias_medicas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoLicencia" NOT NULL DEFAULT 'COMUN',
    "numLicencia" TEXT NOT NULL DEFAULT '',
    "entidad" TEXT NOT NULL DEFAULT 'FONASA',
    "diasLicencia" INTEGER NOT NULL DEFAULT 0,
    "subsidioMonto" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "subsidioPagado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "licencias_medicas_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'licencias_medicas_empresaId_fkey') THEN
    ALTER TABLE "licencias_medicas" ADD CONSTRAINT "licencias_medicas_empresaId_fkey"
      FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'licencias_medicas_trabajadorId_fkey') THEN
    ALTER TABLE "licencias_medicas" ADD CONSTRAINT "licencias_medicas_trabajadorId_fkey"
      FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

-- Campos de licencia médica en liquidaciones (días descontados + subsidio FONASA/ISAPRE)
ALTER TABLE "liquidaciones" ADD COLUMN IF NOT EXISTS "diasLicenciaMedica" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "liquidaciones" ADD COLUMN IF NOT EXISTS "subsidioLm" DECIMAL(19,4) NOT NULL DEFAULT 0;

ALTER TABLE "trabajadores" ADD COLUMN IF NOT EXISTS "domicilio" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN IF NOT EXISTS "fechaNacimiento" TIMESTAMP(3);
ALTER TABLE "trabajadores" ADD COLUMN IF NOT EXISTS "estadoCivil" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN IF NOT EXISTS "nacionalidad" TEXT DEFAULT 'Chilena';
ALTER TABLE "trabajadores" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN IF NOT EXISTS "comuna" TEXT;

CREATE TABLE IF NOT EXISTS "finiquitos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "fechaTermino" TIMESTAMP(3) NOT NULL,
    "causal" TEXT NOT NULL,
    "diasVacaciones" DECIMAL(8,2) NOT NULL,
    "montoVacaciones" DECIMAL(19,4) NOT NULL,
    "aniosServicio" DECIMAL(5,2) NOT NULL,
    "indemnizacion" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "avisoPrevio" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "otrosDescuentos" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalBruto" DECIMAL(19,4) NOT NULL,
    "totalNeto" DECIMAL(19,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "finiquitos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "finiquitos" ADD CONSTRAINT "finiquitos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finiquitos" ADD CONSTRAINT "finiquitos_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

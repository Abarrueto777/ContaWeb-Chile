-- Enum tipo de renta del retiro
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoRentaRetiro') THEN
    CREATE TYPE "TipoRentaRetiro" AS ENUM ('AFECTA', 'EXENTA', 'NO_RENTA');
  END IF;
END$$;

-- Tabla socios
CREATE TABLE IF NOT EXISTS "socios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'SOCIO',
    "porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "socios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "socios_empresaId_rut_key" ON "socios"("empresaId", "rut");

-- Tabla retiros
CREATE TABLE IF NOT EXISTS "retiros" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(19,4) NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT '',
    "factorIpc" DECIMAL(8,4) NOT NULL DEFAULT 1.0,
    "montoCorregido" DECIMAL(19,4) NOT NULL,
    "tipoRenta" "TipoRentaRetiro" NOT NULL DEFAULT 'AFECTA',
    "creditoIdpc" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "retiros_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'socios_empresaId_fkey') THEN
    ALTER TABLE "socios" ADD CONSTRAINT "socios_empresaId_fkey"
      FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'retiros_empresaId_fkey') THEN
    ALTER TABLE "retiros" ADD CONSTRAINT "retiros_empresaId_fkey"
      FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'retiros_socioId_fkey') THEN
    ALTER TABLE "retiros" ADD CONSTRAINT "retiros_socioId_fkey"
      FOREIGN KEY ("socioId") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

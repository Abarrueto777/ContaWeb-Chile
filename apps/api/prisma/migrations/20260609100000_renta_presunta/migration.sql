-- Enum tipo de bien renta presunta
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoBienRP') THEN
    CREATE TYPE "TipoBienRP" AS ENUM ('AGRICOLA', 'TRANSPORTE');
  END IF;
END$$;

-- Bienes de renta presunta (predios agrícolas / vehículos de transporte)
CREATE TABLE IF NOT EXISTS "rp_bienes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoBienRP" NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "rolAvaluo" TEXT,
    "municipio" TEXT,
    "avaluoFiscal" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "anioAvaluo" INTEGER,
    "patente" TEXT,
    "tipoVehiculo" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "anioVehiculo" INTEGER,
    "valorTasacion" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "anioTasacion" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rp_bienes_pkey" PRIMARY KEY ("id")
);

-- PPM mensual de renta presunta
CREATE TABLE IF NOT EXISTS "rp_ppm" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "ventasPeriodo" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "ppmTasa" DECIMAL(8,4) NOT NULL DEFAULT 0.0025,
    "ppmMonto" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "observacion" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rp_ppm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rp_ppm_empresaId_anio_mes_key" ON "rp_ppm"("empresaId", "anio", "mes");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rp_bienes_empresaId_fkey') THEN
    ALTER TABLE "rp_bienes" ADD CONSTRAINT "rp_bienes_empresaId_fkey"
      FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rp_ppm_empresaId_fkey') THEN
    ALTER TABLE "rp_ppm" ADD CONSTRAINT "rp_ppm_empresaId_fkey"
      FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

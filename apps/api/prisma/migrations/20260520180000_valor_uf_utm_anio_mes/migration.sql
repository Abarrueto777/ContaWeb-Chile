-- AlterTable: replace fecha with anio/mes on valores_uf_utm
ALTER TABLE "valores_uf_utm" DROP COLUMN IF EXISTS "fecha";
ALTER TABLE "valores_uf_utm" ADD COLUMN IF NOT EXISTS "anio" INTEGER NOT NULL DEFAULT 2024;
ALTER TABLE "valores_uf_utm" ADD COLUMN IF NOT EXISTS "mes" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "valores_uf_utm_anio_mes_key" ON "valores_uf_utm"("anio", "mes");

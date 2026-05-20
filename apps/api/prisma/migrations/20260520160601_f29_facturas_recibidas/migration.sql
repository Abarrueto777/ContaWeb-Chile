-- CreateEnum
CREATE TYPE "TipoDocCompra" AS ENUM ('FACTURA', 'NOTA_CREDITO', 'LIQUIDACION_FACTURA');

-- CreateEnum
CREATE TYPE "TipoImpuesto" AS ENUM ('NINGUNO', 'BEBIDAS_20', 'BEBIDAS_31', 'LUJO', 'CARNE', 'HARINA', 'DIESEL');

-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "ppmRate" DECIMAL(6,4) NOT NULL DEFAULT 0.0020;

-- CreateTable
CREATE TABLE "facturas_recibidas" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "proveedorRut" TEXT NOT NULL,
    "proveedorNombre" TEXT NOT NULL,
    "tipo" "TipoDocCompra" NOT NULL DEFAULT 'FACTURA',
    "folio" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "neto" DECIMAL(19,4) NOT NULL,
    "iva" DECIMAL(19,4) NOT NULL,
    "impAdicional" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "retencion" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(19,4) NOT NULL,
    "tipoImpuesto" "TipoImpuesto" NOT NULL DEFAULT 'NINGUNO',
    "glosa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_recibidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "honorarios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "prestadorRut" TEXT NOT NULL,
    "prestadorNombre" TEXT NOT NULL,
    "folio" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(19,4) NOT NULL,
    "retencion" DECIMAL(19,4) NOT NULL,
    "retiene" BOOLEAN NOT NULL DEFAULT true,
    "glosa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "honorarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facturas_recibidas_empresaId_proveedorRut_tipo_folio_key" ON "facturas_recibidas"("empresaId", "proveedorRut", "tipo", "folio");

-- AddForeignKey
ALTER TABLE "facturas_recibidas" ADD CONSTRAINT "facturas_recibidas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honorarios" ADD CONSTRAINT "honorarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

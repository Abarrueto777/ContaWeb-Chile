-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'CONTADOR', 'VISOR');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('BOLETA_ELECTRONICA', 'FACTURA_ELECTRONICA', 'NOTA_CREDITO', 'NOTA_DEBITO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('BORRADOR', 'EMITIDO', 'ACEPTADO_SII', 'RECHAZADO_SII', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO');

-- CreateEnum
CREATE TYPE "NaturalezaCuenta" AS ENUM ('DEUDORA', 'ACREEDORA');

-- CreateEnum
CREATE TYPE "EstadoAsiento" AS ENUM ('BORRADOR', 'CONTABILIZADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CONTADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "giro" TEXT NOT NULL,
    "actividadEconomica" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_tributarios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "tipo" "TipoDocumento" NOT NULL,
    "folio" INTEGER NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'BORRADOR',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "neto" DECIMAL(19,4) NOT NULL,
    "iva" DECIMAL(19,4) NOT NULL,
    "total" DECIMAL(19,4) NOT NULL,
    "glosa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_tributarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_documento" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(19,4) NOT NULL,
    "precioUnitario" DECIMAL(19,4) NOT NULL,
    "descuento" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(19,4) NOT NULL,

    CONSTRAINT "lineas_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_contables" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "naturaleza" "NaturalezaCuenta" NOT NULL,
    "nivel" INTEGER NOT NULL,
    "cuentaPadreId" TEXT,
    "permiteMovimientos" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos_contables" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "documentoId" TEXT,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "glosa" TEXT NOT NULL,
    "estado" "EstadoAsiento" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asientos_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_asiento" (
    "id" TEXT NOT NULL,
    "asientoId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "debe" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "haber" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "glosa" TEXT,

    CONSTRAINT "lineas_asiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_rut_key" ON "empresas"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresaId_rut_key" ON "clientes"("empresaId", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_tributarios_empresaId_tipo_folio_key" ON "documentos_tributarios"("empresaId", "tipo", "folio");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_contables_empresaId_codigo_key" ON "cuentas_contables"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "asientos_contables_empresaId_numero_key" ON "asientos_contables"("empresaId", "numero");

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_tributarios" ADD CONSTRAINT "documentos_tributarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_tributarios" ADD CONSTRAINT "documentos_tributarios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_documento" ADD CONSTRAINT "lineas_documento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos_tributarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_cuentaPadreId_fkey" FOREIGN KEY ("cuentaPadreId") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_contables" ADD CONSTRAINT "asientos_contables_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_contables" ADD CONSTRAINT "asientos_contables_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos_tributarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "asientos_contables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas_contables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

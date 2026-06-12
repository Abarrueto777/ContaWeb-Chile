-- CreateEnum
CREATE TYPE "TipoVacacion" AS ENUM ('NORMAL', 'PROGRESIVO', 'COLECTIVO');

-- CreateEnum
CREATE TYPE "EstadoVacacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "TipoPermiso" AS ENUM ('MATRIMONIO', 'UNION_CIVIL', 'FALLECIMIENTO', 'SIN_GOCE', 'ADMINISTRATIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'SUSPENDIDO');

-- DropForeignKey
ALTER TABLE "activos_fijos" DROP CONSTRAINT "activos_fijos_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "asientos_contables" DROP CONSTRAINT "asientos_contables_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "clientes" DROP CONSTRAINT "clientes_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "config_empresa" DROP CONSTRAINT "config_empresa_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "cuentas_bancarias" DROP CONSTRAINT "cuentas_bancarias_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "cuentas_contables" DROP CONSTRAINT "cuentas_contables_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "documentos_tributarios" DROP CONSTRAINT "documentos_tributarios_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "empresas" DROP CONSTRAINT "empresas_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "facturas_recibidas" DROP CONSTRAINT "facturas_recibidas_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "finiquitos" DROP CONSTRAINT "finiquitos_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "finiquitos" DROP CONSTRAINT "finiquitos_trabajadorId_fkey";

-- DropForeignKey
ALTER TABLE "honorarios" DROP CONSTRAINT "honorarios_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "licencias_medicas" DROP CONSTRAINT "licencias_medicas_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "licencias_medicas" DROP CONSTRAINT "licencias_medicas_trabajadorId_fkey";

-- DropForeignKey
ALTER TABLE "lineas_asiento" DROP CONSTRAINT "lineas_asiento_cuentaId_fkey";

-- DropForeignKey
ALTER TABLE "liquidaciones" DROP CONSTRAINT "liquidaciones_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "liquidaciones" DROP CONSTRAINT "liquidaciones_trabajadorId_fkey";

-- DropForeignKey
ALTER TABLE "movimientos_banco" DROP CONSTRAINT "movimientos_banco_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "retiros" DROP CONSTRAINT "retiros_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "retiros" DROP CONSTRAINT "retiros_socioId_fkey";

-- DropForeignKey
ALTER TABLE "rp_bienes" DROP CONSTRAINT "rp_bienes_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "rp_ppm" DROP CONSTRAINT "rp_ppm_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "socios" DROP CONSTRAINT "socios_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "trabajadores" DROP CONSTRAINT "trabajadores_empresaId_fkey";

-- AlterTable
ALTER TABLE "facturas_recibidas" DROP COLUMN "condicionPago";

-- AlterTable
ALTER TABLE "liquidaciones" DROP COLUMN "asig_familiar",
ADD COLUMN     "asigFamiliar" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "cantHorasExtra" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "cantHorasExtraFeriado" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "diasSinGoce" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "horasDescuento" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "horasExtraFeriado" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "montoSinGoce" DECIMAL(19,4) NOT NULL DEFAULT 0,
ADD COLUMN     "otrosDescuentos" DECIMAL(19,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "trabajadores" DROP COLUMN "cargas_familiares",
DROP COLUMN "tiene_conectividad",
ADD COLUMN     "cargasFamiliares" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tieneConectividad" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trabajaFinSemana" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT,
ADD COLUMN     "verifyTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verifyTokenHash" TEXT;

-- AlterTable
ALTER TABLE "valores_uf_utm" ALTER COLUMN "anio" DROP DEFAULT,
ALTER COLUMN "mes" DROP DEFAULT,
ALTER COLUMN "previredSyncAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "vacaciones" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "diasHabiles" INTEGER NOT NULL,
    "saldoPrevio" DECIMAL(8,2) NOT NULL,
    "saldoPosterior" DECIMAL(8,2) NOT NULL,
    "periodoAnual" TEXT,
    "tipo" "TipoVacacion" NOT NULL DEFAULT 'NORMAL',
    "estado" "EstadoVacacion" NOT NULL DEFAULT 'APROBADA',
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "tipo" "TipoPermiso" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "diasHabiles" INTEGER NOT NULL,
    "conGoce" BOOLEAN NOT NULL DEFAULT true,
    "parentesco" TEXT,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_tributarios" ADD CONSTRAINT "documentos_tributarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_contables" ADD CONSTRAINT "asientos_contables_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_recibidas" ADD CONSTRAINT "facturas_recibidas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honorarios" ADD CONSTRAINT "honorarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_asiento" ADD CONSTRAINT "lineas_asiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas_contables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_bancarias" ADD CONSTRAINT "cuentas_bancarias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_banco" ADD CONSTRAINT "movimientos_banco_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finiquitos" ADD CONSTRAINT "finiquitos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finiquitos" ADD CONSTRAINT "finiquitos_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activos_fijos" ADD CONSTRAINT "activos_fijos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_empresa" ADD CONSTRAINT "config_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacaciones" ADD CONSTRAINT "vacaciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacaciones" ADD CONSTRAINT "vacaciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rp_bienes" ADD CONSTRAINT "rp_bienes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rp_ppm" ADD CONSTRAINT "rp_ppm_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "socios" ADD CONSTRAINT "socios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiros" ADD CONSTRAINT "retiros_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiros" ADD CONSTRAINT "retiros_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "socios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licencias_medicas" ADD CONSTRAINT "licencias_medicas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licencias_medicas" ADD CONSTRAINT "licencias_medicas_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;


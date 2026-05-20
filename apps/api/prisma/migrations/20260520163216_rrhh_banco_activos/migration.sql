-- CreateEnum
CREATE TYPE "TipoAFP" AS ENUM ('CAPITAL', 'CUPRUM', 'HABITAT', 'PLANVITAL', 'PROVIDA', 'MODELO', 'UNO');

-- CreateEnum
CREATE TYPE "TipoTrabajador" AS ENUM ('DEPENDIENTE', 'SUELDO_EMPRESARIAL');

-- CreateEnum
CREATE TYPE "TipoGratificacion" AS ENUM ('ART_50', 'ART_50_LIBRE', 'ART_47', 'NINGUNA');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'OBRA_FAENA');

-- CreateEnum
CREATE TYPE "TipoMovimientoBanco" AS ENUM ('COBRO_CLIENTE', 'PAGO_PROVEEDOR', 'PAGO_IVA', 'PAGO_PPM', 'PAGO_REMUNERACIONES', 'PAGO_HONORARIO', 'TRANSFERENCIA', 'COMISION_BANCO', 'INTERES_BANCO', 'INTERES_GANADO', 'RETIRO_DUENO', 'APORTE_CAPITAL', 'GASTO_GENERAL', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaActivo" AS ENUM ('MAQUINARIA', 'VEHICULO', 'MUEBLES', 'EQUIPOS_COMPUTACION', 'CONSTRUCCION', 'TERRENO', 'OTRO');

-- CreateTable
CREATE TABLE "cuentas_bancarias" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "tipoCuenta" TEXT NOT NULL DEFAULT 'CORRIENTE',
    "numero" TEXT NOT NULL,
    "saldoInicial" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_banco" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cargo" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "abono" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(19,4) NOT NULL,
    "tipo" "TipoMovimientoBanco" NOT NULL DEFAULT 'OTRO',
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "glosa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimientos_banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajadores" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT,
    "tipo" "TipoTrabajador" NOT NULL DEFAULT 'DEPENDIENTE',
    "sueldoBase" DECIMAL(19,4) NOT NULL,
    "afp" "TipoAFP" NOT NULL DEFAULT 'HABITAT',
    "salud" TEXT NOT NULL DEFAULT 'FONASA',
    "pctSalud" DECIMAL(5,4) NOT NULL DEFAULT 0.07,
    "tieneCes" BOOLEAN NOT NULL DEFAULT false,
    "tipoGratificacion" "TipoGratificacion" NOT NULL DEFAULT 'ART_50',
    "tieneMovilizacion" BOOLEAN NOT NULL DEFAULT false,
    "tieneColacion" BOOLEAN NOT NULL DEFAULT false,
    "montoMovilizacion" DECIMAL(19,4),
    "montoColacion" DECIMAL(19,4),
    "jornadaHoras" INTEGER NOT NULL DEFAULT 42,
    "tipoContrato" "TipoContrato" NOT NULL DEFAULT 'INDEFINIDO',
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "sueldoBase" DECIMAL(19,4) NOT NULL,
    "horasExtra" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "bono" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "diasTrabajados" INTEGER NOT NULL DEFAULT 30,
    "imponible" DECIMAL(19,4) NOT NULL,
    "cotizAfp" DECIMAL(19,4) NOT NULL,
    "cotizSis" DECIMAL(19,4) NOT NULL,
    "cotizSalud" DECIMAL(19,4) NOT NULL,
    "cotizCes" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "impuestoUnico" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "gratificacion" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "movilizacion" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "colacion" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "anticipo" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "liquido" DECIMAL(19,4) NOT NULL,
    "costoEmpleador" DECIMAL(19,4) NOT NULL,
    "pagada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activos_fijos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaActivo" NOT NULL DEFAULT 'OTRO',
    "fechaCompra" TIMESTAMP(3) NOT NULL,
    "costoCompra" DECIMAL(19,4) NOT NULL,
    "vidaUtilAnios" INTEGER NOT NULL,
    "valorResidual" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "depreciacionMes" DECIMAL(19,4) NOT NULL,
    "acumDepreciacion" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activos_fijos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valores_uf_utm" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "uf" DECIMAL(10,4) NOT NULL,
    "utm" DECIMAL(10,2) NOT NULL,
    "imm" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "valores_uf_utm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_bancarias_empresaId_banco_numero_key" ON "cuentas_bancarias"("empresaId", "banco", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_empresaId_rut_key" ON "trabajadores"("empresaId", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "liquidaciones_empresaId_trabajadorId_anio_mes_key" ON "liquidaciones"("empresaId", "trabajadorId", "anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "valores_uf_utm_fecha_key" ON "valores_uf_utm"("fecha");

-- AddForeignKey
ALTER TABLE "cuentas_bancarias" ADD CONSTRAINT "cuentas_bancarias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_banco" ADD CONSTRAINT "movimientos_banco_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_banco" ADD CONSTRAINT "movimientos_banco_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas_bancarias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activos_fijos" ADD CONSTRAINT "activos_fijos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

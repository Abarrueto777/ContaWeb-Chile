-- CreateTable
CREATE TABLE "config_empresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "config_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "config_empresa_empresaId_clave_key" ON "config_empresa"("empresaId", "clave");

-- AddForeignKey
ALTER TABLE "config_empresa" ADD CONSTRAINT "config_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

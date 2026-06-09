-- Factores de actualización IPC (tabla global, sin empresa)
CREATE TABLE IF NOT EXISTS "factores_ipc" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "factor" DECIMAL(8,4) NOT NULL DEFAULT 1.0,
    CONSTRAINT "factores_ipc_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "factores_ipc_anio_mes_key" ON "factores_ipc"("anio", "mes");

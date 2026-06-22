-- CreateIndex
CREATE INDEX "cuentas_contables_cuentaPadreId_idx" ON "cuentas_contables"("cuentaPadreId");

-- CreateIndex
CREATE INDEX "lineas_asiento_asientoId_idx" ON "lineas_asiento"("asientoId");

-- CreateIndex
CREATE INDEX "lineas_asiento_cuentaId_idx" ON "lineas_asiento"("cuentaId");

-- CreateIndex
CREATE INDEX "lineas_documento_documentoId_idx" ON "lineas_documento"("documentoId");

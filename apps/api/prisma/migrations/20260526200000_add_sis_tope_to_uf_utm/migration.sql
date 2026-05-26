ALTER TABLE "valores_uf_utm" ADD COLUMN "sisEmpleador"    DECIMAL(6,4) NOT NULL DEFAULT 0.0162;
ALTER TABLE "valores_uf_utm" ADD COLUMN "topeImponibleUf" DECIMAL(6,2) NOT NULL DEFAULT 90.0;
ALTER TABLE "valores_uf_utm" ADD COLUMN "previredSyncAt"  TIMESTAMP;

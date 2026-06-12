-- Trial de 45 días + suscripción paga con activación manual desde el panel admin.
ALTER TABLE "usuarios" ADD COLUMN "trialFin" TIMESTAMP(3);
ALTER TABLE "usuarios" ADD COLUMN "suscripcionHasta" TIMESTAMP(3);

-- Backfill: los usuarios existentes arrancan su trial desde su fecha de registro.
UPDATE "usuarios" SET "trialFin" = "createdAt" + interval '45 days' WHERE "trialFin" IS NULL;

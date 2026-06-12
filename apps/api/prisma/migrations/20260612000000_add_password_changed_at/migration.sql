-- Invalida JWT emitidos antes de un cambio de contraseña (reset).
ALTER TABLE "usuarios" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

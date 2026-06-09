import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedPlanDeCuentas } from '../../src/services/seedCuentas.service';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin1234!', 12);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@contaclweb.cl' },
    create: { email: 'admin@contaclweb.cl', nombre: 'Administrador', password, rol: 'ADMIN' },
    update: {},
  });

  const empresa = await prisma.empresa.upsert({
    where: { rut: '76.123.456-7' },
    create: {
      rut: '76.123.456-7',
      razonSocial: 'Empresa Demo Ltda.',
      giro: 'Servicios de Contabilidad',
      actividadEconomica: '6920',
      usuarioId: admin.id,
    },
    update: {},
  });

  await seedPlanDeCuentas(empresa.id, prisma);

  console.log(`Seed completado — empresa: ${empresa.razonSocial}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

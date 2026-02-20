import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { dbConfig } from '../src/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: dbConfig.postgres.url,
  }),
});

async function main() {
  // ===== TENANT 1 =====
  const tenant1 = await prisma.tenant.upsert({
    where: { name: 'localhost' },
    update: {},
    create: {
      name: 'localhost',
    },
  });

  await prisma.tenantDomain.upsert({
    where: { domain: 'localhost:3001' },
    update: {},
    create: {
      domain: 'localhost:3001',
      tenantId: tenant1.id,
    },
  });

  await prisma.tenantDomain.upsert({
    where: { domain: 'localhost:3000' },
    update: {},
    create: {
      domain: 'localhost:3000',
      tenantId: tenant1.id,
    },
  });

  // ===== TENANT 2 =====
  const tenant2 = await prisma.tenant.upsert({
    where: { name: 'aliceDev' },
    update: {},
    create: {
      name: 'aliceDev',
    },
  });

  await prisma.tenantDomain.upsert({
    where: { domain: 'dev-api.alicesocial.pp.ua' },
    update: {},
    create: {
      domain: 'dev-api.alicesocial.pp.ua',
      tenantId: tenant2.id,
    },
  });

  // ===== TENANT 2 =====
  const tenant3 = await prisma.tenant.upsert({
    where: { name: 'aliceTest' },
    update: {},
    create: {
      name: 'aliceTest',
    },
  });

  await prisma.tenantDomain.upsert({
    where: { domain: 'test-api.alicesocial.pp.ua' },
    update: {},
    create: {
      domain: 'test-api.alicesocial.pp.ua',
      tenantId: tenant3.id,
    },
  });
  await prisma.tenantDomain.upsert({
    where: { domain: 'test1-api.alicesocial.pp.ua' },
    update: {},
    create: {
      domain: 'test1-api.alicesocial.pp.ua',
      tenantId: tenant3.id,
    },
  });
  await prisma.tenantDomain.upsert({
    where: { domain: 'test2-api.alicesocial.pp.ua' },
    update: {},
    create: {
      domain: 'test2-api.alicesocial.pp.ua',
      tenantId: tenant3.id,
    },
  });
  await prisma.tenantDomain.upsert({
    where: { domain: 'test3-api.alicesocial.pp.ua' },
    update: {},
    create: {
      domain: 'test3-api.alicesocial.pp.ua',
      tenantId: tenant3.id,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

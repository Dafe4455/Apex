// prisma/seed.ts
// Run with: npx ts-node prisma/seed.ts
// Or add to package.json: "prisma": { "seed": "ts-node prisma/seed.ts" }
// Then run: npx prisma db seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email    = 'admin@apexmarkets.com';   // change this
  const password = 'Escudero1';            // change this — use a strong password
  const name     = 'Admin';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Update existing user to ADMIN role
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`✓ Existing user ${email} promoted to ADMIN`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: 'ADMIN',
    },
  });

  console.log(`✓ Admin user created: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  ⚠️  Change the password after first login.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

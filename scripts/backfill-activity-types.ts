// scripts/backfill-activity-types.ts
import { PrismaClient, ActivityLogType } from '@prisma/client';

const prisma = new PrismaClient();

async function backfill() {
  const logs = await prisma.activityLog.findMany();
  
  for (const log of logs) {
    const desc = log.description.toLowerCase();
    let type: ActivityLogType = 'OTHER';
    
    if (desc.includes('buy') || desc.includes('sell') || desc.includes('trade')) type = 'TRADE';
    else if (desc.includes('deposit')) type = 'DEPOSIT';
    else if (desc.includes('withdraw')) type = 'WITHDRAWAL';
    else if (desc.includes('kyc')) type = 'KYC';
    
    // Parse detail from description
    let detail: string | null = null;
    const match = log.description.match(/[\$€£]?[\d,]+\.?\d*[^@]*@?[\s\$€£]?[\d,]+\.?\d*/);
    if (match) detail = match[0].trim();
    
    await prisma.activityLog.update({
      where: { id: log.id },
      data: { type, detail },
    });
  }
  
  console.log(`✓ Backfilled ${logs.length} activity logs`);
}

backfill()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

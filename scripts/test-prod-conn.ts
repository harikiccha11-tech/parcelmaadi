import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['error', 'warn'] });
async function main() {
  const result = await prisma.$queryRaw`SELECT NOW() as now, current_database() as db, current_user as user`;
  console.log('✅ Connected to Supabase OK');
  console.log(JSON.stringify(result, null, 2));
}
main().catch(e => { console.error('❌ CONN FAIL:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());

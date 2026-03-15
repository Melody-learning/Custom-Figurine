const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFailedAssets() {
  const assets = await prisma.generatedAsset.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(assets, null, 2));
}

checkFailedAssets().catch(console.error).finally(() => prisma.$disconnect());

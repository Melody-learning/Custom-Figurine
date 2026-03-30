const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Production Seed Script
 * Run after prisma db push to initialize:
 * 1. Admin user (promote existing Google account)
 * 2. Default Hero slides
 *
 * Usage: npx dotenv -e .env.local -- node prisma/seed.js
 * Or on Vercel: set in package.json "prisma.seed"
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  // === 1. Promote admin user ===
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'chenjing00952846@gmail.com';

  const adminUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (adminUser) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { role: 'ADMIN', isWhitelisted: true, maxTotalGenerations: 999 },
    });
    console.log(`✅ Promoted ${ADMIN_EMAIL} to ADMIN (whitelisted)`);
  } else {
    console.log(`⚠️  User ${ADMIN_EMAIL} not found. Log in with Google first, then re-run seed.`);
  }

  // === 2. Seed Hero Slides (skip if already exist) ===
  const existingSlides = await prisma.heroSlide.count();
  if (existingSlides > 0) {
    console.log(`✅ Hero slides already exist (${existingSlides}), skipping.`);
  } else {
    const slides = [
      {
        sortOrder: 0,
        tag: "Children's Doodles",
        tagZh: '童真涂鸦',
        title: 'Doodles Come Alive',
        titleZh: '涂鸦成真',
        description: "Turn your child's wildest drawings into tangible, one-of-a-kind figurines — a childhood memory you can hold.",
        descriptionZh: '将孩子们天马行空的画作，化为触手可及的童年纪念。',
        imageUrl: '/images/hero/image/tongzhen-bg.jpg',
        thumbUrl: '/images/hero/image/tongzhen-thumb.jpg',
        accent: 'from-amber-500/20 via-orange-400/10 to-transparent',
        isActive: true,
      },
      {
        sortOrder: 1,
        tag: 'Portrait Figurines',
        tagZh: '真人手办',
        title: 'Your Photo, Your Figurine',
        titleZh: '真人手办',
        description: "Upload a photo of yourself or someone special — we'll turn it into a stunning, museum-quality collectible.",
        descriptionZh: '上传一张照片，我们将它变成博物馆级别的精致收藏品。',
        imageUrl: '/images/hero/image/zhenren-bg.jpg',
        thumbUrl: '/images/hero/image/zhenren-thumb.jpg',
        accent: 'from-pink-500/20 via-rose-400/10 to-transparent',
        isActive: true,
      },
      {
        sortOrder: 2,
        tag: 'Game Characters',
        tagZh: '游戏角色',
        title: 'Level-Up to Reality',
        titleZh: '游戏角色现实化',
        description: "Bring your legendary in-game avatar to your desktop — every armor detail, perfectly replicated.",
        descriptionZh: '把你在虚拟世界中的无敌神装角色，完美复现到现实桌面。',
        imageUrl: '/images/hero/image/youxi-bg.jpg',
        thumbUrl: '/images/hero/image/youxi-thumb.jpg',
        accent: 'from-violet-500/20 via-purple-400/10 to-transparent',
        isActive: true,
      },
    ];

    for (const slide of slides) {
      await prisma.heroSlide.create({ data: slide });
    }
    console.log(`✅ Seeded ${slides.length} Hero slides`);
  }

  // === 3. Seed AI Models (upsert to avoid duplicates) ===
  const aiModels = [
    {
      modelId: 'gemini-3.1-flash-image-preview',
      name: 'Gemini 3.1 Flash',
      description: 'Pro-level visual intelligence with Flash-speed efficiency',
      provider: 'gemini',
      isActive: true,
      sortOrder: 0,
      config: {},
    },
    {
      modelId: 'gemini-3-pro-image-preview',
      name: 'Gemini 3 Pro',
      description: 'Highest quality image generation model',
      provider: 'gemini',
      isActive: true,
      sortOrder: 1,
      config: {},
    },
    {
      modelId: 'gemini-2.5-flash-image',
      name: 'Gemini 2.5 Flash',
      description: 'Stable generation with free tier quota',
      provider: 'gemini',
      isActive: true,
      sortOrder: 2,
      config: {},
    },
    {
      modelId: 'seedream-5.0-lite',
      name: 'Seedream 5.0 Lite',
      description: 'Latest Jimeng 5.0, high quality generation',
      provider: 'jimeng',
      isActive: true,
      sortOrder: 10,
      config: { endpointEnvKey: 'ARK_EP_SEEDREAM_5_0', minDimension: 1920 },
    },
    {
      modelId: 'seedream-4.5',
      name: 'Seedream 4.5',
      description: 'Jimeng 4.5, excellent for Asian faces',
      provider: 'jimeng',
      isActive: true,
      sortOrder: 11,
      config: { endpointEnvKey: 'ARK_EP_SEEDREAM_4_5', minDimension: 1920 },
    },
    {
      modelId: 'seedream-4.0',
      name: 'Seedream 4.0',
      description: 'Jimeng 4.0, multimodal image generation',
      provider: 'jimeng',
      isActive: true,
      sortOrder: 12,
      config: { endpointEnvKey: 'ARK_EP_SEEDREAM_4_0', minDimension: 1024 },
    },
  ];

  for (const model of aiModels) {
    await prisma.aiModel.upsert({
      where: { modelId: model.modelId },
      update: {
        name: model.name,
        description: model.description,
        provider: model.provider,
        isActive: model.isActive,
        sortOrder: model.sortOrder,
        config: model.config,
      },
      create: model,
    });
  }
  console.log(`✅ Seeded/updated ${aiModels.length} AI models`);

  console.log('\n🎉 Seed complete!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    prisma.$disconnect();
    process.exit(1);
  });

import prisma from '@/lib/prisma';
import { BarChart3, Image, Users, Layers } from 'lucide-react';

async function getStats() {
  const [totalUsers, totalGenerations, pendingGenerations, activeSlides, whitelistedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.generatedAsset.count(),
    prisma.generatedAsset.count({ where: { status: 'PENDING' } }),
    prisma.heroSlide.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isWhitelisted: true } }),
  ]);

  return { totalUsers, totalGenerations, pendingGenerations, activeSlides, whitelistedUsers };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500/20 to-blue-600/5' },
    { label: 'Total Generations', value: stats.totalGenerations, icon: Layers, color: 'from-violet-500/20 to-violet-600/5' },
    { label: 'Pending Jobs', value: stats.pendingGenerations, icon: BarChart3, color: 'from-amber-500/20 to-amber-600/5' },
    { label: 'Active Hero Slides', value: stats.activeSlides, icon: Image, color: 'from-emerald-500/20 to-emerald-600/5' },
    { label: 'Whitelisted Users', value: stats.whitelistedUsers, icon: Users, color: 'from-pink-500/20 to-pink-600/5' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} border border-white/5 rounded-xl p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className="h-5 w-5 text-white/40" />
            </div>
            <div className="text-3xl font-bold text-white tabular-nums">{card.value}</div>
            <div className="text-xs text-white/40 mt-1 font-medium">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

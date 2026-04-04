import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { DynamicCouponCard } from "@/components/marketing/DynamicCouponCard";
import GenerationVaultList from '@/components/profile/GenerationVaultList';
import LogoutButton from '@/components/profile/LogoutButton';
import OrderList from '@/components/profile/OrderList';

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch the user's generated AI assets from Postgres
  const generatedAssets = await prisma.generatedAsset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch the user's orders with item count and preview
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        select: {
          id: true,
          generatedImageUrl: true,
          originalImageUrl: true,
        },
      },
    },
  });

  // Transform orders for the client component
  const orderList = orders.map((order) => {
    const firstItem = order.items[0];
    const previewImageUrl = firstItem?.generatedImageUrl || firstItem?.originalImageUrl || null;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      currency: order.currency,
      itemCount: order.items.length,
      previewImageUrl,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
    };
  });

  // Computations for Avatar and Name Fallback
  const fallbackName = session.user.name || session.user.email?.split('@')[0] || "Creator";
  const initial = fallbackName.charAt(0).toUpperCase();
  const hasImage = !!session.user.image;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--background)] pt-20 pb-8 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-6">
             {hasImage ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[var(--surface-sunken)] ring-2 ring-[var(--brand-primary)] p-1">
                  <Image 
                    src={session.user.image!} 
                    alt="Avatar" 
                    fill 
                    className="rounded-full object-cover" 
                  />
                </div>
             ) : (
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--background)]">
                  {initial}
                </div>
             )}
             
             <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">{fallbackName}</h1>
                <p className="text-[var(--text-secondary)]">{session.user.email}</p>
             </div>
          </div>
          <LogoutButton />
        </div>

        {/* Coupons & Redeem */}
        <DynamicCouponCard />

        {/* Dashboards Stack */}
        <div className="flex flex-col gap-8">
           
           {/* Top Section: Orders */}
           <OrderList orders={orderList} />

           {/* Bottom Section: AI Gallery */}
           <div className="space-y-4 w-full">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                     <Sparkles className="w-5 h-5" />
                 </div>
                 <h2 className="text-2xl font-bold text-[var(--text-primary)]">Your Generation Vault</h2>
              </div>
              
              <GenerationVaultList initialAssets={generatedAssets as any} />
           </div>

        </div>
      </div>
    </div>
  );
}

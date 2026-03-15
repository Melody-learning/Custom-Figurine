import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { redirect } from "next/navigation";
import { PackageOpen, Sparkles, LogOut, Loader2 } from "lucide-react";
import { logoutUser } from "@/app/actions/auth";
import type { GeneratedAsset, StoreOrder } from "@prisma/client";
import { DynamicCouponCard } from "@/components/marketing/DynamicCouponCard";
import GenerationVaultList from '@/components/profile/GenerationVaultList';

export default async function ProfilePage() {
  const session = await auth();
  
  // This is technically caught by middleware, but NextAuth recommends double-checking
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch the user's generated AI assets from Postgres
  const generatedAssets = await prisma.generatedAsset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch the user's saved physical orders from Shopify Webhook Syncs
  const physicalOrders = await prisma.storeOrder.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
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
          <form action={logoutUser}>
             <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-red-500/50 hover:text-red-500 text-[var(--text-secondary)] font-medium transition-colors text-sm cursor-pointer">
                <LogOut className="w-4 h-4" />
                Sign Out
             </button>
          </form>
        </div>

        {/* Coupon Asset Wall */}
        {(session.user as any).hasWelcomeCoupon && (
          <DynamicCouponCard />
        )}

        {/* Dashboards Stack */}
        <div className="flex flex-col gap-8">
           
           {/* Top Section: Orders Tracking */}
           <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
                    <PackageOpen className="w-5 h-5" />
                 </div>
                 <h2 className="text-2xl font-bold text-[var(--text-primary)]">Physical Figurine Orders</h2>
              </div>
              
              {physicalOrders.length === 0 ? (
                 <div className="w-full flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
                    <PackageOpen className="w-6 h-6 text-[var(--text-tertiary)] mb-3 opacity-50" />
                    <p className="text-[var(--text-secondary)] text-center text-sm">No orders placed yet. Your figures are waiting to be birthed.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {physicalOrders.map((order: StoreOrder) => (
                       <div key={order.id} className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] flex flex-col gap-4 shadow-sm">
                          <div className="flex items-center justify-between">
                             <span className="text-sm font-mono text-[var(--text-secondary)]">#{order.shopifyOrderId.slice(-6)}</span>
                             <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${order.status === 'placed' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                {order.status.toUpperCase()}
                             </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                             <div className="text-[var(--text-secondary)]">
                                {new Date(order.createdAt).toLocaleDateString()}
                             </div>
                             {order.trackingUrl ? (
                                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-[var(--brand-primary)] hover:underline font-medium flex items-center gap-1">
                                   Track Package &rarr;
                                </a>
                             ) : (
                                <span className="text-[var(--text-tertiary)] flex items-center gap-1 text-xs">
                                   <Loader2 className="w-3 h-3 animate-spin" /> Preparing Box
                                </span>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>

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

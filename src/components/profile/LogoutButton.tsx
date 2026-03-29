'use client';

import { LogOut } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { useStore } from '@/lib/store';

export default function LogoutButton() {
  const clearCart = useStore((s) => s.clearCart);

  const handleLogout = async () => {
    // Clear cart from IndexedDB before logging out
    // Prevents cart data leaking across different user accounts on the same browser
    clearCart();
    await logoutUser();
  };

  return (
    <form action={handleLogout}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-red-500/50 hover:text-red-500 text-[var(--text-secondary)] font-medium transition-colors text-sm cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </form>
  );
}

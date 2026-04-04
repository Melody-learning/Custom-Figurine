'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, Shield, ShieldOff, Save, UserCog } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;

  maxTotalGenerations: number;
  isWhitelisted: boolean;
  createdAt: string;
  _count: { generatedAssets: number };
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ maxTotalGenerations: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [callerIsSuperAdmin, setCallerIsSuperAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);

    const res = await adminFetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setCallerIsSuperAdmin(data.callerIsSuperAdmin || false);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleWhitelist = async (user: UserItem) => {
    await adminFetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isWhitelisted: !user.isWhitelisted }),
    });
    fetchData();
  };

  const startEditing = (user: UserItem) => {
    setEditingId(user.id);
    setEditForm({ maxTotalGenerations: user.maxTotalGenerations });
  };

  const saveEditing = async () => {
    if (!editingId || !editForm) return;
    setSaving(true);
    await adminFetch(`/api/admin/users/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    setEditForm(null);
    setSaving(false);
    fetchData();
  };

  const toggleRole = async (user: UserItem) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await adminFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update role');
        return;
      }
      toast.success(`User ${user.email} is now ${newRole}`);
      fetchData();
    } catch {
      // adminFetch handles 403 redirect
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Users ({total})</h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-white/40 font-medium">User</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium">Role</th>
              <th className="text-center px-4 py-3 text-white/40 font-medium">Generations</th>
              <th className="text-center px-4 py-3 text-white/40 font-medium">Max Total</th>
              <th className="text-center px-4 py-3 text-white/40 font-medium">Whitelist</th>
              {callerIsSuperAdmin && <th className="text-center px-4 py-3 text-white/40 font-medium">Role</th>}
              <th className="text-right px-4 py-3 text-white/40 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30">No users found</td></tr>
            ) : items.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">
                        {(user.name || user.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-white text-sm">{user.name || 'Anonymous'}</div>
                      <div className="text-white/30 text-xs">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                    user.role === 'ADMIN' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-white/5 text-white/40 border-white/10'
                  }`}>{user.role}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-white/60 tabular-nums">{user._count.generatedAssets}</span>
                </td>

                <td className="px-4 py-3 text-center">
                  {editingId === user.id ? (
                    <input type="number" min={1} max={999} value={editForm?.maxTotalGenerations || 3}
                      onChange={e => setEditForm(f => f ? { ...f, maxTotalGenerations: parseInt(e.target.value) || 3 } : f)}
                      className="w-16 px-2 py-1 bg-white/5 border border-white/20 rounded text-center text-sm text-white"
                    />
                  ) : (
                    <span className="text-white/60 tabular-nums">{user.maxTotalGenerations}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleWhitelist(user)}
                    className={`p-1.5 rounded-md transition-all ${
                      user.isWhitelisted
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                    }`}
                    title={user.isWhitelisted ? 'Remove from whitelist' : 'Add to whitelist'}
                  >
                    {user.isWhitelisted ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                  </button>
                </td>
                {callerIsSuperAdmin && (
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleRole(user)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        user.role === 'ADMIN'
                          ? 'text-amber-400 hover:bg-amber-500/10'
                          : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                      }`}
                      title={user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                    </button>
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  {editingId === user.id ? (
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setEditingId(null); setEditForm(null); }} className="px-2 py-1 text-xs text-white/30 hover:text-white/60">Cancel</button>
                      <button onClick={saveEditing} disabled={saving} className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-md transition-all disabled:opacity-50">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(user)}
                      className="px-3 py-1 text-xs text-white/30 hover:text-white/60 hover:bg-white/5 rounded-md transition-all"
                    >
                      Edit Limits
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-white/30">Page {page} of {totalPages}</div>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-1.5 rounded-md border border-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

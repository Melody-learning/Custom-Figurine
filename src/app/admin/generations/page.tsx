'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Trash2, Search, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

interface Generation {
  id: string;
  originalImage: string | null;
  resultImage: string | null;
  backImage: string | null;
  sideImage: string | null;
  showcaseImage: string | null;
  status: string;
  prompt: string | null;
  modelId: string | null;              // [Deprecated] 旧字段，向后兼容
  primaryModelId: string | null;       // Task 1 (primary render) 使用的模型
  secondaryModelId: string | null;     // Task 2/3/4 使用的模型
  styleCategorySlug: string | null;    // 风格大类 slug
  stylePresetSlug: string | null;      // 风格子类 slug
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

/** 根据 modelId 前缀返回不同颜色的 badge */
function getModelBadge(modelId: string | null) {
  if (!modelId) return { label: 'N/A', color: 'text-white/20' };
  if (modelId.startsWith('gemini')) return { label: modelId, color: 'text-blue-400' };
  if (modelId.startsWith('seedream')) return { label: modelId, color: 'text-orange-400' };
  return { label: modelId, color: 'text-purple-400' };
}

/** 获取有效的 primary 模型 ID（新字段优先，fallback 旧字段） */
function getEffectivePrimaryModel(item: Generation): string | null {
  return item.primaryModelId || item.modelId || null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETE', label: 'Complete' },
  { value: 'FAILED', label: 'Failed' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  COMPLETE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AdminGenerationsPage() {
  const [items, setItems] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await adminFetch(`/api/admin/generations?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this generation record?')) return;
    await adminFetch(`/api/admin/generations/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Generations ({total})</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Status Filter */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === opt.value
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
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
              <th className="text-left px-4 py-3 text-white/40 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium">Model</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium">Style</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium">Created</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30">No records found</td></tr>
            ) : items.map((item) => {
              const effectivePrimary = getEffectivePrimaryModel(item);
              const primaryBadge = getModelBadge(effectivePrimary);
              const hasDualModel = item.primaryModelId && item.secondaryModelId && item.primaryModelId !== item.secondaryModelId;

              return (
              <React.Fragment key={item.id}>
                <tr
                  className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.user.image ? (
                        <img src={item.user.image} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">
                          {(item.user.name || item.user.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-white text-sm">{item.user.name || 'Anonymous'}</div>
                        <div className="text-white/30 text-xs">{item.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[item.status] || 'text-white/40'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <code className={`text-[11px] font-mono ${primaryBadge.color}`}>
                        {primaryBadge.label}
                      </code>
                      {hasDualModel && (
                        <span className="text-[10px] text-white/20" title={`Secondary: ${item.secondaryModelId}`}>
                          +secondary: <code className="text-white/30">{item.secondaryModelId}</code>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.styleCategorySlug ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-white/60">{item.styleCategorySlug}</span>
                        {item.stylePresetSlug && item.stylePresetSlug !== item.styleCategorySlug && (
                          <span className="text-[10px] text-white/30">{item.stylePresetSlug}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-white/15 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>

                {/* Expanded Detail Row */}
                {expandedId === item.id && (
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Primary', src: item.resultImage, model: effectivePrimary },
                          { label: 'Back', src: item.backImage, model: item.secondaryModelId || effectivePrimary },
                          { label: 'Side', src: item.sideImage, model: item.secondaryModelId || effectivePrimary },
                          { label: 'Showcase', src: item.showcaseImage, model: item.secondaryModelId || effectivePrimary },
                        ].map((view) => {
                          const viewBadge = getModelBadge(view.model);
                          return (
                          <div key={view.label} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/30">{view.label}</span>
                              <code className={`text-[9px] font-mono ${viewBadge.color} opacity-60`} title={viewBadge.label}>
                                {viewBadge.label.length > 20 ? viewBadge.label.slice(0, 18) + '…' : viewBadge.label}
                              </code>
                            </div>
                            {view.src ? (
                              <a href={view.src} target="_blank" rel="noopener noreferrer" className="block relative group">
                                <img src={view.src} alt={view.label} className="w-full aspect-square object-cover rounded-lg border border-white/5" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <ExternalLink className="h-4 w-4 text-white" />
                                </div>
                              </a>
                            ) : (
                              <div className="w-full aspect-square rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/10 text-xs">N/A</div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-white/30">Page {page} of {totalPages}</div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-white/10 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


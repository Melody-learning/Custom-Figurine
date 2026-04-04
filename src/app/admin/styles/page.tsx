'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Upload, X, Check, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';

interface AiModelOption {
  id: string;
  name: string;
  modelId: string;
  provider: string;
}

interface StylePreset {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  primaryPrompt: string;
  previewImageUrl: string | null;
  aiModelId: string | null;
  sortOrder: number;
  isActive: boolean;
  aiModel?: { id: string; name: string; modelId: string; provider: string } | null;
}

interface StyleCategory {
  id: string;
  slug: string;
  displayName: string;
  name: string;
  isOrderable: boolean;
  accentColor: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  presets: StylePreset[];
}

// ─── PresetEditModal ──────────────────────────────────────────────────────────
function PresetEditModal({
  preset,
  category,
  aiModels,
  onClose,
  onSave,
}: {
  preset: StylePreset | null; // null = 新建
  category: StyleCategory;
  aiModels: AiModelOption[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isNew = !preset;
  const [name, setName] = useState(preset?.name ?? '');
  const [slug, setSlug] = useState(preset?.slug ?? '');
  const [primaryPrompt, setPrimaryPrompt] = useState(preset?.primaryPrompt ?? '');
  const [previewImageUrl, setPreviewImageUrl] = useState(preset?.previewImageUrl ?? '');
  const [aiModelId, setAiModelId] = useState(preset?.aiModelId ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      // 获取 Blob 直传令牌
      const tokenRes = await fetch('/api/upload-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { url, uploadUrl } = await tokenRes.json();
      // 直传到 Blob
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setPreviewImageUrl(url);
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !primaryPrompt.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        if (!slug.trim()) return;
        await adminFetch('/api/admin/style-presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: category.id,
            slug: slug.trim(),
            name: name.trim(),
            primaryPrompt: primaryPrompt.trim(),
            previewImageUrl: previewImageUrl || null,
            aiModelId: aiModelId || null,
          }),
        });
      } else {
        await adminFetch(`/api/admin/style-presets/${preset!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            primaryPrompt: primaryPrompt.trim(),
            previewImageUrl: previewImageUrl || null,
            aiModelId: aiModelId || null,
          }),
        });
      }
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">
            {isNew ? `Add Preset to "${category.displayName}"` : `Edit Preset: ${preset!.name}`}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isNew && (
            <div>
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Slug (unique, e.g. cartoon-chibi)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. cartoon-special"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Primary Prompt</label>
            <textarea
              value={primaryPrompt}
              onChange={(e) => setPrimaryPrompt(e.target.value)}
              rows={8}
              placeholder="A professional studio product shot of a 1/7 scale figurine..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none leading-relaxed"
            />
            <p className="text-xs text-white/30 mt-1">{primaryPrompt.length} characters</p>
          </div>

          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Preview Image</label>
            <div className="flex items-center gap-3">
              {previewImageUrl && (
                <img src={previewImageUrl} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading…' : 'Upload Image'}
              </button>
              {previewImageUrl && (
                <button onClick={() => setPreviewImageUrl('')} className="text-white/30 hover:text-red-400 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
          </div>

          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">AI Model Override (optional)</label>
            <select
              value={aiModelId}
              onChange={(e) => setAiModelId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="">— Use system default —</option>
              {aiModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !primaryPrompt.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isNew ? 'Create Preset' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StyleCategoryBlock ───────────────────────────────────────────────────────
function StyleCategoryBlock({
  category,
  aiModels,
  onRefresh,
}: {
  category: StyleCategory;
  aiModels: AiModelOption[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingPreset, setEditingPreset] = useState<StylePreset | null | undefined>(undefined); // undefined = closed
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function movePreset(preset: StylePreset, dir: 'up' | 'down') {
    const siblings = [...category.presets].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = siblings.findIndex((p) => p.id === preset.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const swap = siblings[swapIdx];
    await Promise.all([
      adminFetch(`/api/admin/style-presets/${preset.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: swap.sortOrder }) }),
      adminFetch(`/api/admin/style-presets/${swap.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: preset.sortOrder }) }),
    ]);
    onRefresh();
  }

  async function deletePreset(id: string) {
    if (!confirm('Delete this preset? This cannot be undone.')) return;
    setDeletingId(id);
    await adminFetch(`/api/admin/style-presets/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    onRefresh();
  }

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
      >
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.accentColor }} />
        <div className="flex-1 flex items-center gap-3 text-left">
          <span className="text-sm font-bold text-white">{category.displayName}</span>
          <span className="text-xs text-white/40">{category.name}</span>
          {!category.isOrderable && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Preview Only</span>
          )}
          {!category.isActive && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Inactive</span>
          )}
        </div>
        <span className="text-xs text-white/30">{category.presets.length} presets</span>
        {open ? <ChevronDown className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />}
      </button>

      {/* Presets List */}
      {open && (
        <div className="divide-y divide-white/5">
          {[...category.presets].sort((a, b) => a.sortOrder - b.sortOrder).map((preset, idx, arr) => (
            <div key={preset.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
              {/* Preview image or color dot */}
              {preset.previewImageUrl
                ? <img src={preset.previewImageUrl} alt={preset.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" />
                : <div className="w-10 h-10 rounded-lg shrink-0 opacity-30" style={{ backgroundColor: category.accentColor }} />
              }

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-white">{preset.name}</span>
                  <span className="text-[10px] text-white/30 font-mono">{preset.slug}</span>
                  {preset.aiModel && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">{preset.aiModel.name}</span>
                  )}
                  {!preset.isActive && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-white/30 truncate max-w-xl leading-relaxed">
                  {preset.primaryPrompt.slice(0, 120)}{preset.primaryPrompt.length > 120 ? '…' : ''}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => movePreset(preset, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer transition-all"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => movePreset(preset, 'down')} disabled={idx === arr.length - 1} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer transition-all"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingPreset(preset)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 cursor-pointer transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deletePreset(preset.id)} disabled={deletingId === preset.id} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all disabled:opacity-50">
                  {deletingId === preset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}

          {/* Add preset button */}
          <div className="px-5 py-3">
            <button
              onClick={() => setEditingPreset(null)}
              className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Preset
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPreset !== undefined && (
        <PresetEditModal
          preset={editingPreset}
          category={category}
          aiModels={aiModels}
          onClose={() => setEditingPreset(undefined)}
          onSave={onRefresh}
        />
      )}
    </div>
  );
}

// ─── AddCategoryModal ─────────────────────────────────────────────────────────
function AddCategoryModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState('');
  const [accentColor, setAccentColor] = useState('#6B7280');
  const [icon, setIcon] = useState('Box');
  const [isOrderable, setIsOrderable] = useState(true);
  const [saving, setSaving] = useState(false);

  const ICONS = ['Box', 'Smile', 'Triangle', 'Aperture', 'Star', 'Sparkles', 'Zap', 'Heart'];

  async function handleSave() {
    if (!slug.trim() || !displayName.trim()) return;
    setSaving(true);
    try {
      await adminFetch('/api/admin/style-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim(), displayName: displayName.trim(), name: name.trim() || displayName.trim(), accentColor, icon, isOrderable }),
      });
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">New Style Category</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. chibi-art" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Display Name (EN)</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Chibi Art" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Original Name (optional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q版风格" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent" />
                <span className="text-sm text-white/50 font-mono">{accentColor}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-white/50 font-medium mb-1.5 uppercase tracking-wider">Icon</label>
              <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
                {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOrderable((v) => !v)}
              className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${isOrderable ? 'bg-emerald-500' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow mx-1 transition-transform ${isOrderable ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm text-white/60">{isOrderable ? 'Orderable (users can purchase)' : 'Preview only (cannot order)'}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={saving || !slug.trim() || !displayName.trim()} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Category
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StylesAdminPage() {
  const [categories, setCategories] = useState<StyleCategory[]>([]);
  const [aiModels, setAiModels] = useState<AiModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);

  async function loadData() {
    setLoading(true);
    const [catRes, modelRes] = await Promise.all([
      adminFetch('/api/admin/style-categories'),
      adminFetch('/api/admin/ai-models'),
    ]);
    setCategories(await catRes.json());
    setAiModels(await modelRes.json());
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Style Presets</h1>
          <p className="text-sm text-white/40 mt-1">Manage style categories and their generation prompts</p>
        </div>
        <button
          onClick={() => setShowAddCategory(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2,3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <p className="text-lg font-medium">No style categories found.</p>
          <p className="text-sm mt-1">Run the seed script or create a category above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...categories].sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => (
            <StyleCategoryBlock key={cat.id} category={cat} aiModels={aiModels} onRefresh={loadData} />
          ))}
        </div>
      )}

      {showAddCategory && (
        <AddCategoryModal onClose={() => setShowAddCategory(false)} onSave={loadData} />
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Pencil, X, Loader2, Save } from 'lucide-react';

interface HeroSlide {
  id: string;
  sortOrder: number;
  tag: string;
  tagZh: string | null;
  title: string;
  titleZh: string | null;
  description: string;
  descriptionZh: string | null;
  imageUrl: string;
  thumbUrl: string;
  accent: string;
  isActive: boolean;
}

const ACCENT_OPTIONS = [
  { value: 'from-amber-500/20 via-orange-400/10 to-transparent', label: 'Amber' },
  { value: 'from-pink-500/20 via-rose-400/10 to-transparent', label: 'Pink' },
  { value: 'from-violet-500/20 via-purple-400/10 to-transparent', label: 'Violet' },
  { value: 'from-blue-500/20 via-cyan-400/10 to-transparent', label: 'Blue' },
  { value: 'from-emerald-500/20 via-green-400/10 to-transparent', label: 'Emerald' },
];

function SlideForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<HeroSlide>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    tag: initial?.tag || '',
    tagZh: initial?.tagZh || '',
    title: initial?.title || '',
    titleZh: initial?.titleZh || '',
    description: initial?.description || '',
    descriptionZh: initial?.descriptionZh || '',
    imageUrl: initial?.imageUrl || '',
    thumbUrl: initial?.thumbUrl || '',
    accent: initial?.accent || ACCENT_OPTIONS[0].value,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20';
  const labelCls = 'block text-xs font-medium text-white/40 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{initial?.id ? 'Edit Slide' : 'New Slide'}</h3>
        <button type="button" onClick={onCancel} className="p-1 text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelCls}>Tag (EN)</label><input className={inputCls} value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} required /></div>
        <div><label className={labelCls}>Tag (ZH)</label><input className={inputCls} value={form.tagZh} onChange={e => setForm({...form, tagZh: e.target.value})} /></div>
        <div><label className={labelCls}>Title (EN)</label><input className={inputCls} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
        <div><label className={labelCls}>Title (ZH)</label><input className={inputCls} value={form.titleZh} onChange={e => setForm({...form, titleZh: e.target.value})} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Description (EN)</label><textarea className={inputCls + ' h-20 resize-none'} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Description (ZH)</label><textarea className={inputCls + ' h-20 resize-none'} value={form.descriptionZh} onChange={e => setForm({...form, descriptionZh: e.target.value})} /></div>
        <div><label className={labelCls}>Background Image URL</label><input className={inputCls} value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} required placeholder="https://..." /></div>
        <div><label className={labelCls}>Thumbnail URL</label><input className={inputCls} value={form.thumbUrl} onChange={e => setForm({...form, thumbUrl: e.target.value})} required placeholder="https://..." /></div>
        <div>
          <label className={labelCls}>Accent Color</label>
          <select className={inputCls + ' appearance-none'} value={form.accent} onChange={e => setForm({...form, accent: e.target.value})}>
            {ACCENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Preview */}
      {form.imageUrl && (
        <div className="flex gap-3 items-end">
          <div>
            <div className="text-xs text-white/30 mb-1">Background Preview</div>
            <img src={form.imageUrl} alt="bg" className="w-40 h-24 object-cover rounded-lg border border-white/10" />
          </div>
          {form.thumbUrl && (
            <div>
              <div className="text-xs text-white/30 mb-1">Thumb Preview</div>
              <img src={form.thumbUrl} alt="thumb" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-white/40 hover:text-white/60 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/hero');
    const data = await res.json();
    setSlides(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  const handleCreate = async (data: any) => {
    await fetch('/api/admin/hero', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowForm(false);
    fetchSlides();
  };

  const handleUpdate = async (data: any) => {
    if (!editingSlide) return;
    await fetch(`/api/admin/hero/${editingSlide.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setEditingSlide(null);
    fetchSlides();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    await fetch(`/api/admin/hero/${id}`, { method: 'DELETE' });
    fetchSlides();
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    await fetch(`/api/admin/hero/${slide.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !slide.isActive }) });
    fetchSlides();
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSlides.length) return;

    // Swap sortOrder values
    const order = newSlides.map((s, i) => {
      if (i === index) return { id: s.id, sortOrder: newSlides[swapIdx].sortOrder };
      if (i === swapIdx) return { id: s.id, sortOrder: newSlides[index].sortOrder };
      return { id: s.id, sortOrder: s.sortOrder };
    });

    await fetch('/api/admin/hero', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) });
    fetchSlides();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Hero Slides ({slides.length})</h1>
        <button onClick={() => { setShowForm(true); setEditingSlide(null); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-all">
          <Plus className="h-4 w-4" /> New Slide
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showForm || editingSlide) && (
        <div className="mb-6">
          <SlideForm
            initial={editingSlide || undefined}
            onSave={editingSlide ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingSlide(null); }}
          />
        </div>
      )}

      {/* Slides List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No slides yet. Create your first hero slide.</div>
      ) : (
        <div className="space-y-2">
          {slides.map((slide, index) => (
            <div key={slide.id} className={`flex items-center gap-4 p-4 border rounded-xl transition-all ${slide.isActive ? 'border-white/10 bg-white/[0.02]' : 'border-white/5 bg-white/[0.01] opacity-50'}`}>
              {/* Thumbnail */}
              <img src={slide.thumbUrl} alt={slide.title} className="w-16 h-16 rounded-lg object-cover border border-white/10 flex-shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/40 font-medium">{slide.tag}</span>
                  {!slide.isActive && <span className="text-xs px-2 py-0.5 bg-red-500/10 rounded text-red-400">Hidden</span>}
                </div>
                <div className="text-sm font-medium text-white mt-1 truncate">{slide.title}</div>
                <div className="text-xs text-white/30 truncate">{slide.description}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1.5 rounded-md text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed"><ChevronUp className="h-4 w-4" /></button>
                <button onClick={() => handleMove(index, 'down')} disabled={index === slides.length - 1} className="p-1.5 rounded-md text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed"><ChevronDown className="h-4 w-4" /></button>
                <button onClick={() => handleToggleActive(slide)} className="p-1.5 rounded-md text-white/20 hover:text-white/60" title={slide.isActive ? 'Hide' : 'Show'}>{slide.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                <button onClick={() => { setEditingSlide(slide); setShowForm(false); }} className="p-1.5 rounded-md text-white/20 hover:text-white/60"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(slide.id)} className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Pencil, X, Loader2, Save } from 'lucide-react';

interface AiModel {
  id: string;
  modelId: string;
  name: string;
  description: string | null;
  provider: string;
  isActive: boolean;
  sortOrder: number;
  config: Record<string, unknown> | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  jimeng: '即梦 Seedream',
};

const PROVIDER_COLORS: Record<string, string> = {
  gemini: 'bg-blue-500/10 text-blue-400',
  jimeng: 'bg-orange-500/10 text-orange-400',
};

function ModelForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<AiModel>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    modelId: initial?.modelId || '',
    name: initial?.name || '',
    description: initial?.description || '',
    provider: initial?.provider || 'gemini',
    isActive: initial?.isActive ?? true,
    sortOrder: initial?.sortOrder ?? 0,
    config: initial?.config ? JSON.stringify(initial.config, null, 2) : '{}',
  });
  const [saving, setSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      JSON.parse(form.config);
      setConfigError(null);
    } catch {
      setConfigError('Invalid JSON');
      return;
    }
    setSaving(true);
    await onSave({ ...form, config: JSON.parse(form.config), sortOrder: Number(form.sortOrder) });
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20';
  const labelCls = 'block text-xs font-medium text-white/40 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{initial?.id ? 'Edit Model' : 'New Model'}</h3>
        <button type="button" onClick={onCancel} className="p-1 text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Model ID (API identifier)</label>
          <input className={inputCls} value={form.modelId} onChange={e => setForm({...form, modelId: e.target.value})} required placeholder="e.g. gemini-3.1-flash-image-preview" disabled={!!initial?.id} />
          {initial?.id && <p className="text-[10px] text-white/20 mt-1">Model ID cannot be changed after creation</p>}
        </div>
        <div>
          <label className={labelCls}>Display Name</label>
          <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Gemini 3.1 Flash" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <input className={inputCls} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description of model capabilities" />
        </div>
        <div>
          <label className={labelCls}>Provider</label>
          <select className={inputCls + ' appearance-none'} value={form.provider} onChange={e => setForm({...form, provider: e.target.value})}>
            <option value="gemini">Google Gemini</option>
            <option value="jimeng">即梦 Seedream</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Sort Order</label>
          <input type="number" className={inputCls} value={form.sortOrder} onChange={e => setForm({...form, sortOrder: Number(e.target.value) as any})} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Config (JSON) — provider-specific settings</label>
          <textarea className={inputCls + ' h-20 resize-none font-mono text-xs'} value={form.config} onChange={e => { setForm({...form, config: e.target.value}); setConfigError(null); }} />
          {configError && <p className="text-xs text-red-400 mt-1">{configError}</p>}
          {form.provider === 'jimeng' && <p className="text-[10px] text-white/20 mt-1">即梦需要: {`{"endpointEnvKey": "ARK_EP_SEEDREAM_X_X", "minDimension": 1920}`}</p>}
        </div>
      </div>

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

export default function AdminAiModelsPage() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-models');
      const data = await res.json();
      setModels(Array.isArray(data) ? data : []);
    } catch {
      setModels([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const handleCreate = async (data: any) => {
    await fetch('/api/admin/ai-models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowForm(false);
    fetchModels();
  };

  const handleUpdate = async (data: any) => {
    if (!editingModel) return;
    await fetch(`/api/admin/ai-models/${editingModel.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setEditingModel(null);
    fetchModels();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this AI model? This cannot be undone.')) return;
    await fetch(`/api/admin/ai-models/${id}`, { method: 'DELETE' });
    fetchModels();
  };

  const handleToggleActive = async (model: AiModel) => {
    await fetch(`/api/admin/ai-models/${model.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !model.isActive }) });
    fetchModels();
  };

  // Group by provider for display
  const groupedModels = models.reduce((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = [];
    acc[m.provider].push(m);
    return acc;
  }, {} as Record<string, AiModel[]>);

  // 当前生效的模型 = sortOrder 最小的 isActive 模型
  const activeModels = models.filter(m => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentModel = activeModels[0] || null;

  // 「设为当前」：将目标模型的 sortOrder 设为最小
  const handleSetAsCurrent = async (model: AiModel) => {
    const minSort = Math.min(...models.map(m => m.sortOrder)) - 1;
    await fetch(`/api/admin/ai-models/${model.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true, sortOrder: minSort }),
    });
    fetchModels();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Models ({models.length})</h1>
          <p className="text-sm text-white/30 mt-1">管理定制流程中生成图片使用的 AI 模型。排序第一的启用模型将被自动用于所有生图。</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingModel(null); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-all">
          <Plus className="h-4 w-4" /> New Model
        </button>
      </div>

      {/* Current Active Model Banner */}
      {currentModel && (
        <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-emerald-400/60 font-medium uppercase tracking-wider">当前使用模型</div>
            <div className="text-sm text-white font-semibold mt-0.5">{currentModel.name} <span className="text-white/30 font-normal">({PROVIDER_LABELS[currentModel.provider]})</span></div>
          </div>
          <code className="text-xs text-white/20">{currentModel.modelId}</code>
        </div>
      )}

      {/* Create / Edit Form */}
      {(showForm || editingModel) && (
        <div className="mb-6">
          <ModelForm
            initial={editingModel || undefined}
            onSave={editingModel ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingModel(null); }}
          />
        </div>
      )}

      {/* Models List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : models.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No AI models configured. Run seed or create your first model.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider}>
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
                {PROVIDER_LABELS[provider] || provider} ({providerModels.length})
              </h2>
              <div className="space-y-2">
                {providerModels.map((model) => {
                  const isCurrent = currentModel?.id === model.id;
                  return (
                  <div key={model.id} className={`flex items-center gap-4 p-4 border rounded-xl transition-all ${isCurrent ? 'border-emerald-500/30 bg-emerald-500/[0.03] ring-1 ring-emerald-500/10' : model.isActive ? 'border-white/10 bg-white/[0.02]' : 'border-white/5 bg-white/[0.01] opacity-50'}`}>
                    {/* Provider badge */}
                    <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex-shrink-0 ${PROVIDER_COLORS[model.provider] || 'bg-white/5 text-white/40'}`}>
                      {model.provider}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{model.name}</span>
                        {isCurrent && <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 rounded-full text-emerald-400 font-semibold">● 当前使用</span>}
                        {!model.isActive && <span className="text-xs px-2 py-0.5 bg-red-500/10 rounded text-red-400">Disabled</span>}
                      </div>
                      <div className="text-xs text-white/30 truncate mt-0.5">
                        <code className="text-white/20">{model.modelId}</code>
                        {model.description && <> · {model.description}</>}
                      </div>
                    </div>

                    {/* Sort Order */}
                    <div className="text-xs text-white/20 flex-shrink-0 font-mono">#{model.sortOrder}</div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isCurrent && model.isActive && (
                        <button onClick={() => handleSetAsCurrent(model)} className="px-2.5 py-1 rounded-md text-xs font-medium text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="设为当前使用模型">
                          设为当前
                        </button>
                      )}
                      <button onClick={() => handleToggleActive(model)} className="p-1.5 rounded-md text-white/20 hover:text-white/60" title={model.isActive ? 'Disable' : 'Enable'}>{model.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                      <button onClick={() => { setEditingModel(model); setShowForm(false); }} className="p-1.5 rounded-md text-white/20 hover:text-white/60"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(model.id)} className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

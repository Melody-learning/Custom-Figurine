/**
 * Style Presets — Phase 1 Constants
 *
 * 风格大类与子类的静态配置。Phase 2 将迁移到数据库 + Admin 后台管理。
 * 数据结构设计与 Phase 2 的 DB Schema 兼容，届时只需改数据来源，不改消费侧代码。
 */

// ============================================================
// 类型定义
// ============================================================

export interface StylePreset {
  /** 全局唯一 ID，如 "cartoon-standard" */
  id: string;
  /** 所属大类 ID */
  categoryId: string;
  /** 用户可见显示名 */
  name: string;
  /** 主视图生成提示词（Phase 2 从 DB 读取） */
  primaryPrompt: string;
  /** 示意图 URL（Phase 2 由 Admin 上传配置） */
  previewImageUrl?: string;
}

export interface StyleCategory {
  /** 唯一标识，如 "cartoon" */
  id: string;
  /** 用户可见显示名（中文，i18n 备用） */
  name: string;
  /** 英文简称，用于 UI 卡片显示 */
  displayName: string;
  /** false 表示该大类生成结果无法下单（Step 3/4 禁止购物车操作） */
  isOrderable: boolean;
  /** 视觉占位色（Phase 2 替换为真实示意图后仍保留作辅助色） */
  accentColor: string;
  /** Lucide icon 名称，用于 Phase 1 占位展示 */
  icon: string;
  /** 子类列表 */
  presets: StylePreset[];
}

// ============================================================
// 提示词内容
// ============================================================

// 卡通风格 — 常规
const PROMPT_CARTOON_STANDARD = `A professional studio product shot of a 1/7 scale premium ACG figurine featuring the characters in the reference image. The style is a modern pop-art blind box aesthetic, similar to trendy designer toys. The sculpting emphasizes ultra-smooth, rounded forms, simplified chunky hair volumes, and exaggerated cute proportions (1:4 head-to-body ratio). The color palette uses solid, vibrant pastel colors with a glossy porcelain-like finish, avoiding micro-details to ensure extremely clean and easy manufacturing. The characters feature expressive, simplified anime-style faces and distinctly stylized, thick clothing folds optimized for physical production. They are standing on a simple, elegant display base under soft studio lighting that perfectly highlights the smooth material texture. High resolution, masterpiece, official merchandise photography.`;

// 卡通风格 — Q版（Chibi）
const PROMPT_CARTOON_CHIBI = `A professional studio product shot of a premium ACG figurine featuring the characters in the reference image. The style is a modern pop-art blind box aesthetic. The body proportions are highly stylized into a cute chibi 1:3 head-to-body ratio, featuring short stubby limbs, chubby cheeks, and ultra-smooth, rounded forms without any realistic muscle definitions. The color palette uses solid, vibrant pastel colors with a glossy porcelain-like finish. The characters feature simplified, exaggerated cute anime faces with large, decal-like round eyes and tiny noses. The chunky hair volumes and distinctly thick clothing folds are optimized for clean manufacturing. They are standing on a simple, elegant display base under soft studio lighting. High resolution, masterpiece, official merchandise photography.`;

// 低多边形 — TODO
const PROMPT_LOWPOLY_STANDARD = `TODO: Low-poly standard style prompt — to be configured by admin.`;
const PROMPT_LOWPOLY_ROUGH = `TODO: Low-poly rough/raw style prompt — to be configured by admin.`;

// 雕塑 — TODO
const PROMPT_SCULPTURE_STANDARD = `TODO: Sculpture standard style prompt — to be configured by admin.`;
const PROMPT_SCULPTURE_FACELESS = `TODO: Faceless sculpture style prompt — to be configured by admin.`;

// 写实（当前系统默认提示词）
const PROMPT_REALISTIC_STANDARD = `A professional studio product shot of a 1/7 scale premium ACG figurine featuring the characters in the reference image. The style is a highly detailed, mature stylized anime aesthetic. The figurine showcases masterful sculpting with crisp, clean edges, smooth matte skin, and vibrant, solid coloring. The characters feature expressive anime-style faces and distinct, stylized hair and clothing folds optimized for physical production. They are standing on a simple, elegant display base under soft studio lighting that perfectly highlights the PVC material texture. High resolution, masterpiece, official merchandise photography.`;

// ============================================================
// 大类 + 子类配置
// ============================================================

export const STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: 'cartoon',
    name: '卡通风格',
    displayName: 'Cartoon',
    isOrderable: true,
    accentColor: '#FF6B9D',
    icon: 'Smile',
    presets: [
      { id: 'cartoon-standard', categoryId: 'cartoon', name: 'Standard', primaryPrompt: PROMPT_CARTOON_STANDARD },
      { id: 'cartoon-chibi', categoryId: 'cartoon', name: 'Chibi', primaryPrompt: PROMPT_CARTOON_CHIBI },
    ],
  },
  {
    id: 'low-poly',
    name: '低多边形风格',
    displayName: 'Low Poly',
    isOrderable: true,
    accentColor: '#5BC0EB',
    icon: 'Triangle',
    presets: [
      { id: 'lowpoly-standard', categoryId: 'low-poly', name: 'Standard', primaryPrompt: PROMPT_LOWPOLY_STANDARD },
      { id: 'lowpoly-rough', categoryId: 'low-poly', name: 'Rough', primaryPrompt: PROMPT_LOWPOLY_ROUGH },
    ],
  },
  {
    id: 'sculpture',
    name: '雕塑风格',
    displayName: 'Sculpture',
    isOrderable: true,
    accentColor: '#C4A882',
    icon: 'Box',
    presets: [
      { id: 'sculpture-standard', categoryId: 'sculpture', name: 'Standard', primaryPrompt: PROMPT_SCULPTURE_STANDARD },
      { id: 'sculpture-faceless', categoryId: 'sculpture', name: 'Faceless', primaryPrompt: PROMPT_SCULPTURE_FACELESS },
    ],
  },
  {
    id: 'realistic',
    name: '写实风格',
    displayName: 'Realistic',
    isOrderable: false,
    accentColor: '#6B7280',
    icon: 'Aperture',
    presets: [
      { id: 'realistic-standard', categoryId: 'realistic', name: 'Standard', primaryPrompt: PROMPT_REALISTIC_STANDARD },
    ],
  },
];

// ============================================================
// 辅助函数
// ============================================================

/** 返回系统默认预设（卡通风格 → 常规） */
export function getDefaultPreset(): StylePreset {
  return STYLE_CATEGORIES[0].presets[0];
}

/** 根据 presetId 查找子类 */
export function findPresetById(presetId: string): StylePreset | undefined {
  for (const category of STYLE_CATEGORIES) {
    const found = category.presets.find((p) => p.id === presetId);
    if (found) return found;
  }
  return undefined;
}

/** 根据 presetId 查找其所属大类 */
export function findCategoryByPresetId(presetId: string): StyleCategory | undefined {
  return STYLE_CATEGORIES.find((cat) => cat.presets.some((p) => p.id === presetId));
}

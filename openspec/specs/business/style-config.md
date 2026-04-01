# 风格配置规范 (Style Configuration)

> 此文档是风格大类/子类配置系统的 Source of Truth，反映 Phase 2 完成后的生产实现状态。

## 1. 概述

风格大类（StyleCategory）和风格子类（StylePreset）的配置由数据库驱动，通过 Admin 后台管理。运营人员可在 `/admin/styles` 中实时更新提示词，无需代码部署。

前端代码通过 `/api/style-presets` 公共接口读取配置，兼容本地静态常量作为降级兜底。

## 2. 数据模型

### StyleCategory
| 字段 | 类型 | 说明 |
|------|------|------|
| id | cuid | 主键 |
| slug | String unique | 兼容 Phase 1 的 ID（"cartoon"/"low-poly" 等），作为前台消费侧的字符串 ID |
| displayName | String | 英文显示名（"Cartoon"） |
| name | String | 原始名称（"卡通风格"，备用） |
| isOrderable | Boolean | false 时前台禁止下单，显示 "Preview Only" 徽章 |
| accentColor | String | HEX 色值，用于卡片高亮与子类选中态 |
| icon | String | Lucide icon 名称（前台映射到 React 组件） |
| sortOrder | Int | 排列顺序（升序），Admin 可手动调整 |
| isActive | Boolean | false 时前台不显示该大类 |

### StylePreset
| 字段 | 类型 | 说明 |
|------|------|------|
| id | cuid | 主键 |
| slug | String | 大类内唯一（如 "cartoon-standard"），作为前台消费侧的字符串 ID |
| categoryId | String FK | 所属大类 |
| name | String | 子类显示名（"Standard"/"Chibi"） |
| primaryPrompt | Text | 生成主视图的提示词，透传到 AI 生成管线的 `promptOverride` |
| previewImageUrl | Text? | 示意图 URL（Vercel Blob），由 Admin 上传 |
| aiModelId | String? FK | 可选绑定特定 AI 模型（null 时使用系统默认 active 模型） |
| sortOrder | Int | 大类内排序 |
| isActive | Boolean | false 时前台不显示该子类 |

## 3. 当前预设数据（Seed）

| 大类 | slug | isOrderable | 子类 |
|------|------|-------------|------|
| Cartoon | cartoon | ✅ | Standard (cartoon-standard), Chibi (cartoon-chibi) |
| Low Poly | low-poly | ✅ | Standard (lowpoly-standard), Rough (lowpoly-rough) |
| Sculpture | sculpture | ✅ | Standard (sculpture-standard), Faceless (sculpture-faceless) |
| Realistic | realistic | ❌ Preview only | Standard (realistic-standard) |

> Low Poly / Sculpture 的提示词当前为 TODO 占位，需在 Admin 后台配置后方可使用。

## 4. API 契约

### 前台（无鉴权）
```
GET /api/style-presets
Response: StyleCategory[] (含 nested presets[])
  - 仅返回 isActive=true 的大类和子类
  - 按 sortOrder 升序排列
  - DB 为空或异常时返回 [] （前台静默降级到静态常量）
  - slug 字段映射为返回 JSON 的 id 字段（保持与 Phase 1 静态常量兼容）
```

### Admin（需 ADMIN 角色）
```
GET    /api/admin/style-categories           → 所有大类（含子类，含停用）
POST   /api/admin/style-categories           → 新建大类
PATCH  /api/admin/style-categories/[id]      → 更新大类字段
DELETE /api/admin/style-categories/[id]      → 删除大类（级联删子类）
POST   /api/admin/style-presets              → 新建子类（body: categoryId + 其他字段）
PATCH  /api/admin/style-presets/[id]         → 更新子类（提示词/模型绑定/图片URL）
DELETE /api/admin/style-presets/[id]         → 删除子类
```

## 5. 行为规范

- **前台读取**：`/api/style-presets` 失败或返回空数组时，`customize/page.tsx` 降级到 `STYLE_CATEGORIES` 静态常量，用户无感知
- **提示词透传**：`StylePreset.primaryPrompt` → `stylePrompt prop` → `startAsyncGeneration(promptOverride)` → Webhook body → `generatePrimaryRender(promptOverride)` → `callImageGenAPI`
- **模型绑定**：`StylePreset.aiModelId` 非空时优先使用该模型；否则使用系统 active 默认模型
- **排序**：Admin 调整 `sortOrder` 后，前台刷新即生效（API 总是按 sortOrder 升序返回）
- **示意图**：Admin 上传图片调用 `/api/upload-token` Blob 直传，仅 URL 存 DB；前台 Phase 2 暂不渲染示意图（留 Phase 3）

## 6. 静态兜底（Fallback）

- 文件：`src/lib/constants/style-presets.ts`
- 保留全量 Phase 1 数据，作为 API 异常时的静默降级
- `getDefaultPreset()` 始终返回 `cartoon-standard`，用于初始化 Customize 页状态

## 7. Admin 后台 UI

- 入口：`/admin/styles`（侧边栏 Palette 图标）
- 功能：大类列表（展开/折叠 → 子类行）、新建大类 Modal、Preset 编辑 Modal（提示词 textarea + AI 模型下拉 + 图片上传）、上移/下移排序按钮
- 图片上传：复用 `/api/upload-token` Blob 直传，4.5MB Vercel 限制适用

## 8. 已知限制与后续计划

- **[Phase 3]** 后视图/侧视图提示词（PROMPT_BACK/PROMPT_LEFT）尚未按风格定制，仍为全局共享
- **[Phase 3]** StylePreset ID 未记录到 GeneratedAsset，Vault 中无法展示使用了哪个风格
- **[Phase 3]** Low Poly / Sculpture 风格的提示词尚为 TODO，需在 Admin 填写后方可进入生产使用
- **[Phase 3]** 前台风格卡片尚未渲染 `previewImageUrl` 示意图（留给 Phase 3 视觉升级）

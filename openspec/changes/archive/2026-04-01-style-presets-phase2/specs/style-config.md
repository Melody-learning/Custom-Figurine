# Style Configuration Specification (Phase 2)

## Overview

风格大类（StyleCategory）和风格子类（StylePreset）的配置从代码静态常量迁移到数据库，由 Admin 后台管理。

## Data Model

### StyleCategory
| 字段 | 类型 | 说明 |
|------|------|------|
| id | cuid | 主键 |
| slug | String unique | 兼容 Phase 1 的 ID（"cartoon"/"low-poly" 等） |
| displayName | String | 英文显示名（"Cartoon"） |
| name | String | 原始名称（"卡通风格"，备用） |
| isOrderable | Boolean | false 时前台禁止下单 |
| accentColor | String | HEX 色值，用于卡片高亮 |
| icon | String | Lucide icon 名称 |
| sortOrder | Int | 排列顺序（升序） |
| isActive | Boolean | 停用时前台不显示 |

### StylePreset
| 字段 | 类型 | 说明 |
|------|------|------|
| id | cuid | 主键 |
| slug | String | 兼容 Phase 1 的 ID（"cartoon-standard"），大类内唯一 |
| categoryId | String FK | 所属大类 |
| name | String | 子类显示名（"Standard"/"Chibi"） |
| primaryPrompt | Text | 生成主视图的提示词 |
| previewImageUrl | Text? | 示意图 URL（Blob） |
| aiModelId | String? FK | 绑定 AI 模型（可选，null 时用系统默认） |
| sortOrder | Int | 大类内排序 |
| isActive | Boolean | 停用时前台不显示 |

## API Contracts

### 前台（无鉴权）
```
GET /api/style-presets
Response: StyleCategory[] (含 nested presets[])
  - 仅返回 isActive=true 的大类和子类
  - 按 sortOrder 升序排列
  - DB 为空时返回 [] （前台降级到静态常量）
```

### Admin（需 ADMIN 角色）
```
GET    /api/admin/style-categories           → 所有大类（含子类，含停用）
POST   /api/admin/style-categories           → 新建大类
PATCH  /api/admin/style-categories/[id]      → 更新大类字段
DELETE /api/admin/style-categories/[id]      → 删除大类（级联删子类）
POST   /api/admin/style-presets              → 新建子类（body: categoryId + 其他字段）
PATCH  /api/admin/style-presets/[id]         → 更新子类
DELETE /api/admin/style-presets/[id]         → 删除子类
```

## Behaviors

- **前台读取**：`/api/style-presets` 失败或返回空数组时，`customize/page.tsx` 降级到 `STYLE_CATEGORIES` 静态常量，用户无感知
- **提示词透传**：生成管线已通过 `promptOverride` 传递提示词，Phase 2 DB 数据格式与 Phase 1 完全兼容，无需修改管线
- **模型绑定**：StylePreset 可选绑定 `aiModelId`；生成时若存在，优先使用该模型；否则使用系统 active 默认模型
- **排序**：Admin 可手动调整 sortOrder，前台即时生效（API 总是按 sortOrder 升序返回）
- **示意图**：Admin 上传图片时调用 `/api/upload-token` 获取 Blob 直传令牌，存储 URL 到 `previewImageUrl`；前台 Phase 2 暂不渲染示意图（UI 展示留给 Phase 3）

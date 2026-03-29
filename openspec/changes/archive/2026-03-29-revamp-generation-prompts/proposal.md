## Why

当前生图流程的主提示词（提示词1）混合了"生成手办"和"放置在餐桌上展示"两个概念，导致 AI 模型负担过重，生成效果不稳定。用户希望将两个目标分离：

1. **提示词1** 专注于"纯手办产品照"（专业摄影棚拍摄风格），生成高质量的正面手办图
2. **提示词2** 专注于"效果展示场景"（桌面摆拍风格），使用手办图 + 原图合成展示效果

此外，当前流程没有利用抠图结果：即使用户开启了抠图，输入给 AI 的仍然是处理前的图片。新流程应使用抠图后的干净图片作为手办生成的输入。

## What Changes

### 1. 提示词替换

- **提示词1**（手办生图，替换 `generatePrimaryRender` 中的 prompt）：  
  英文专业ACG手办产品照提示词，专注于手办品质描述（1/7 scale, PVC, studio lighting），不再包含场景信息。

- **提示词2**（效果展示图，新增 `generateShowcaseImage`）：  
  中文提示词，将手办模型放置在餐桌上，手办旁放着原图和铅笔，展示"从画到手办"的故事性。

### 2. 新增效果展示图生成（第 4 张图）

- 在阶段二（后视图 + 侧视图）并行中再加一个任务：用**原始输入图**（不经过抠图） + 提示词2 生成效果展示图
- 新增 `showcaseImage` 字段，贯穿整个数据流（DB → API → 前端展示）

### 3. 生图输入优化

- 如果用户开启了抠图，提示词1 的输入图应为**抠图后的图**（而非原图），以获得更好的手办轮廓提取
- 提示词2 的输入图始终使用**用户的原始输入图**（不管是否抠图）

## Capabilities

### Modified Capabilities

- `integrations/ai-generation`: 提示词替换、新增效果展示图生成阶段、抠图后图片作为生图输入
- `backend/database`: GeneratedAsset 模型新增 `showcaseImage` 字段

## Impact

- **修改文件**：
  - `src/app/actions/image-to-3d.ts` — 替换提示词1、新增 `generateShowcaseImage` 函数
  - `src/app/api/webhooks/generate/route.ts` — 流程中新增效果展示图生成 + 上传 + 存储
  - `src/app/actions/start-generation.ts` — 传递抠图后图片 URL（如适用）
  - `src/components/ai/FigurineGenerationGallery.tsx` — 展示第 4 张图
  - `src/app/customize/page.tsx` — 将抠图后图片传给生图、传递原图 URL
  - `prisma/schema.prisma` — `GeneratedAsset` 新增 `showcaseImage` 字段
  - `src/app/api/assets/[id]/route.ts` — 返回 showcaseImage 字段
  - `src/app/actions/save-asset.ts` — 支持 showcaseImage
- **依赖**：无新 npm 依赖
- **数据库迁移**：需要 `npx prisma db push`（新增可空字段，不影响现有数据）

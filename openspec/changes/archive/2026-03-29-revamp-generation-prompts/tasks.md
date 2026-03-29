## 1. 数据库 Schema 变更

- [x] 1.1 在 `prisma/schema.prisma` 的 `GeneratedAsset` 模型中新增 `showcaseImage String? @db.Text` 字段
- [x] 1.2 执行 `npx prisma db push` 推送 Schema 变更 ✓ (Done in 124ms)
- [x] 1.3 `npx prisma generate` — DLL 被 dev server 锁定，重启后自动生效

## 2. 提示词替换与效果展示图函数

- [x] 2.1 在 `image-to-3d.ts` 中将 `generatePrimaryRender` 的提示词替换为提示词1（英文 ACG 手办产品照）
- [x] 2.2 新增 `generateShowcaseImage(originalImageB64, modelId)` 函数，使用提示词2（中文餐桌展示场景）
- [x] 2.3 修改 `generateSecondaryViews`：接受额外参数 `originalImageB64`，新增第 3 路并行调用 `generateShowcaseImage`
- [x] 2.4 `generateSecondaryViews` 返回值新增 `showcaseB64` 字段，showcase 失败时 Graceful Fallback（不阻塞 back/side）

## 3. Webhook 流程更新

- [x] 3.1 修改 `webhooks/generate/route.ts`：从 request body 读取 `processedImageUrl`（可选）
- [x] 3.2 提示词1 的输入使用 `processedImageUrl || originalImageUrl` 对应的 base64
- [x] 3.3 将 `originalImageUrl` 的 base64 作为额外参数传入 `generateSecondaryViews`
- [x] 3.4 新增 showcaseImage 的 Blob 上传，写入 DB 的 `showcaseImage` 字段

## 4. 前端传递抠图后图片

- [x] 4.1 修改 `startAsyncGeneration` 接口：新增 `processedImageB64` 可选参数
- [x] 4.2 如果提供了 `processedImageB64`，上传至 Blob 获取 `processedImageUrl`，传给 webhook
- [x] 4.3 修改 `customize/page.tsx` 的 Gallery 调用：传递 `originalImageForShowcase={bgOriginal || uploadedImage}`
- [x] 4.4 Gallery 中根据 `originalImageForShowcase` 判断是否有抠图，正确分配 `originalImageB64` 和 `processedImageB64`

## 5. Gallery 展示第 4 张图

- [x] 5.1 `FigurineGenerationGallery` 新增 `showcaseImage` state + `activeTab` 增加 `'showcase'` 选项
- [x] 5.2 Views 面板缩略图新增 "Showcase" tab（条件渲染，只在有 showcaseImage 时显示）
- [x] 5.3 `onComplete` 回调的 generatedImages 对象新增 `showcase` 字段
- [x] 5.4 Polling 逻辑中从 API 响应读取 `showcaseImage` 字段
- [x] 5.5 API route `assets/[id]` 自动返回 `showcaseImage` 字段（Prisma findUnique 默认包含所有字段）

## 6. 验证

- [x] 6.1 TypeScript 编译通过
- [x] 6.2 `prisma db push` 成功
- [ ] 6.3 手动验证：生图完成后 Gallery 展示 4 个 tab（正面、后面、侧面、效果展示）

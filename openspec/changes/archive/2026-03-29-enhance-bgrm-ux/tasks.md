## 1. ImageLightbox 组件

- [x] 1.1 创建 `src/components/ImageLightbox.tsx`，实现 `ImageLightbox` 组件（React Portal + 遮罩 + 居中图片 + fade/scale 动画）
- [x] 1.2 实现 ESC 键关闭（`useEffect` 注册 keydown 事件）
- [x] 1.3 实现点击遮罩关闭（`onClick` on backdrop，`stopPropagation` on image）
- [x] 1.4 实现关闭按钮（X icon，右上角定位）
- [x] 1.5 使用 `useThemeConfig()` 适配遮罩层和关闭按钮的主题色
- [x] 1.6 导出 `ClickableImage` 包装组件，自动管理 Lightbox 开关状态，添加 cursor-pointer + hover 放大图标

## 2. 抠图 UI Toggle 开关

- [x] 2.1 在 `customize/page.tsx` 添加 `bgFilterEnabled` 本地 state（默认 `true`）
- [x] 2.2 在上传区域下方渲染 Toggle Switch UI（仅当 `isBgRemovalEnabled()` 返回 `true` 时显示）
- [x] 2.3 修改 `handleFileUpload`：将 `isBgRemovalEnabled()` 判断改为 `isBgRemovalEnabled() && bgFilterEnabled`
- [x] 2.4 添加 i18n 文案：EN "Smart Background Filter" / ZH "智能背景过滤" + 描述文字

## 3. 接入 Lightbox — 上传步骤

- [x] 3.1 上传预览图（`uploadedImage`）替换为 `ClickableImage`
- [x] 3.2 抠图 Before/After 对比的两张图替换为 `ClickableImage`

## 4. 接入 Lightbox — 生图展厅

- [x] 4.1 `FigurineGenerationGallery.tsx` 中主视觉大图添加点击事件 + hover ZoomIn 图标，打开 `ImageLightbox`
- [x] 4.2 三视图缩略图通过 tab 切换（点击切换主视觉），主视觉支持 Lightbox 查看

## 5. 接入 Lightbox — 确认步骤

- [x] 5.1 确认页生成结果图替换为 `ClickableImage`
- [x] 5.2 确认页原图缩略图替换为 `ClickableImage`

## 6. 验证

- [x] 6.1 TypeScript 编译通过
- [ ] 6.2 手动验证：Lightbox 打开/关闭/ESC/遮罩点击正常
- [ ] 6.3 手动验证：Toggle 关闭后上传不触发抠图
- [ ] 6.4 手动验证：Toggle 在 `ENABLE_BG_REMOVAL=false` 时不显示

## 1. 信息架构：新增 Entry 步骤（风格优先）

- [x] 1.1 在 `page.tsx` 的 `Step` 类型中新增 `'entry'`，初始 step 改为 `'entry'`
- [x] 1.2 在 Entry 阶段渲染风格大类卡片（复用 `styleCategories` 数据），横向滚动布局（`grid-cols-2 sm:flex overflow-x-auto`）
- [x] 1.3 点击风格卡片后，更新 `selectedCategoryId` / `selectedPresetId`，step 切至 `'upload'`
- [x] 1.4 Upload 步骤顶部新增"已选风格"badge（显示当前 category 名 + accent 颜色），点击可返回 `'entry'` 修改

## 2. 信息架构：简化 Step 1（Upload 极简化）

- [x] 2.1 从 Step 1 中移除风格选取面板（该逻辑已移至 Entry 阶段）
- [x] 2.2 确认 `styleCategories` 加载和默认预设选取逻辑不受影响（在 entry 阶段完成选取）

## 3. 抠图默认关闭 & 状态明确

- [x] 3.1 `bgFilterEnabled` 初始值改为 `false`（`useState(false)`）
- [x] 3.2 上传文件时默认使用 JPEG 非抠图路径（`bgEnabled` 判断为 false 时跳过 WASM）
- [x] 3.3 抠图进行中（`bgProcessing === true`）时，「继续生成」按钮改为 `disabled` + 文案 "Processing photo..."
- [ ] 3.4 "Remove Background" 开关下方新增说明文字："Removes photo background for cleaner results"

## 4. Gallery：生成自动触发

- [x] 4.1 `FigurineGenerationGallery` 中新增 `useEffect(() => { if (!initialViews) { startGenerationFlow(); } }, [])` 自动触发逻辑
- [x] 4.2 移除 Header 区域的"Initialize Canvas"按钮（正常流程中不再需要）
- [x] 4.3 在 `status === 'ERROR'` 时，Header 区域改为显示"Retry"按钮，点击重新调用 `startGenerationFlow()`
- [x] 4.4 `status === 'IDLE'` 的占位文案调整（仅在 initialViews 存在时用户才会停留在此状态）

## 5. 步骤合并：删除 Select 步骤

- [x] 5.1 删除 `page.tsx` 中 Step 3（select）的 JSX 渲染块
- [x] 5.2 `Step` 类型中移除 `'select'`，类型变为 `'entry' | 'upload' | 'generate' | 'confirm'`
- [x] 5.3 Gallery `onComplete` 回调中将 `setStep('select')` 改为 `setStep('confirm')`
- [x] 5.4 Confirm 页面新增商品规格选项区域（复用原 Select 页的 product options 渲染逻辑）
- [ ] 5.5 Confirm 页面布局调整为：左栏（生成图 + 原图）/ 右栏（规格选项 → 价格 → 流程说明 → 购物车按钮），移动端垂直堆叠

## 6. Gallery：按钮语义修正

- [x] 6.1 底部右侧按钮文案改为 "View Results & Order"，图标从 `Download` 改为 `ArrowRight`
- [x] 6.2 底部左侧按钮文案确认逻辑正确（COMPLETE："Discard & Retake"，非 COMPLETE："Cancel & Return"）

## 7. 文案去技术化（包装层）

- [x] 7.1 `page.tsx` 步骤标题替换：
  - `generate` 步骤标题：`'Virtualize Model'` → `'Crafting Your Figurine'`
  - `confirm` 步骤标题：`'Review Assets'` → `'Review & Order'`
- [x] 7.2 `page.tsx` 步骤描述文案替换（对应副标题段落）
- [x] 7.3 `FigurineGenerationGallery.tsx` 文案替换：
  - Loading 主标题：`'Virtualizing 3D Scene...'` → `'Bringing your photo to life...'`
  - Loading 描述：`'Calculating depth maps...'` → `'Capturing every detail to craft your figurine'`
  - IDLE 主标题：`'Awaiting Render Command'` → `'Ready to craft your figurine'`
  - 组件顶部标题：`'3D Figurine Studio'` 保留（品牌感可以接受）

## 8. 步骤指示条更新

- [x] 8.1 步骤指示条从 4 步（upload/generate/select/confirm）更新为 3 步（upload/generate/confirm）
- [x] 8.2 Entry 步骤不显示步骤指示条（它在流程开始之前）

## 9. 验收测试

- [x] 9.1 新用户流程：首屏展示风格 → 选择 → 上传图片 → 自动生成 → confirm 页下单，全程无阻断
- [x] 9.2 抠图流程：手动开启 Remove BG → 进度中按钮 disabled → 完成后按钮恢复
- [x] 9.3 Vault 流程：从 profile 点击编辑 → 跳过 entry/upload → 直接进 generate（COMPLETE 状态）
- [ ] 9.4 Error 恢复：生成失败 → 显示 Retry 按钮 → 点击重新生成
- [ ] 9.5 移动端确认：entry 风格卡片可横向滚动，confirm 页规格/价格/按钮可见不裁切

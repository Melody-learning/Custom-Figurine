## 1. 重构 compressImage 函数

- [x] 1.1 为 `compressImage` 添加 `outputFormat` 参数（`'jpeg' | 'png'`），默认 `'jpeg'` 保持向后兼容
- [x] 1.2 当 `outputFormat === 'png'` 时，跳过白色背景填充，直接 `drawImage`，输出 `image/png`
- [x] 1.3 当 `outputFormat === 'jpeg'` 时，保持现有行为（填白底 + `image/jpeg` 0.8）

## 2. 添加透明度检测工具函数

- [x] 2.1 在 `handleFileUpload` 内新增 `hasTransparentBackground(canvas)` 辅助函数
- [x] 2.2 实现边缘像素采样逻辑：扫描四边各一行/列像素，统计 alpha < 250 的比例
- [x] 2.3 设定阈值：边缘透明像素占比 > 5% 时判定为已有透明背景

## 3. 重构 handleFileUpload 流程

- [x] 3.1 根据 `isBgRemovalEnabled()` 选择压缩模式：开启时用 PNG，关闭时用 JPEG
- [x] 3.2 在抠图路径中，压缩后执行透明度检测：若已透明则跳过 `removeImageBackground`
- [x] 3.3 添加抠图后的 JPEG 降级步骤：将透明 PNG 结果转为 JPEG（白底 0.8）再写入 state
- [x] 3.4 确保 `bgOriginal` state 仍保存抠图前的图片用于 Before/After 对比 UI

## 4. 验证

- [x] 4.1 测试场景：抠图关闭 + JPEG 上传 → 行为与变更前一致（代码路径审查通过）
- [x] 4.2 测试场景：抠图开启 + 普通照片 → PNG 传给抠图 → 结果转 JPEG 存入 state（代码路径审查通过）
- [x] 4.3 测试场景：抠图开启 + 透明 PNG → 跳过抠图 → 转 JPEG 存入 state（代码路径审查通过）
- [x] 4.4 检查 localStorage 体积：最终 state 中的 base64 格式为 JPEG 1024px 0.8，与变更前一致（TypeScript 编译通过）

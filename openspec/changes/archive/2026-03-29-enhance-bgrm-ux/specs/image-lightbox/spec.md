## ADDED Requirements

### Requirement: ImageLightbox 全屏图片查看组件

系统 SHALL 提供一个 `ImageLightbox` 组件，用于在模态框中展示图片原图。

- 组件 SHALL 通过 React Portal 挂载到 `document.body`，不受父容器 overflow 限制
- 组件 SHALL 接受 `src`（图片地址）、`alt`（描述文字）、`isOpen`（显示状态）、`onClose`（关闭回调）四个 props
- 图片 SHALL 自适应视口尺寸（`max-width: 90vw; max-height: 85vh`），保持宽高比
- 组件 SHALL 使用 `useThemeConfig()` 读取主题色适配遮罩层和关闭按钮样式
- 组件 SHALL 支持进入/退出的 fade + scale 过渡动画

#### Scenario: 打开 Lightbox 查看图片
- **WHEN** 用户点击一个接入了 Lightbox 的图片
- **THEN** 系统以模态框形式展示该图片原图，图片居中显示并自适应视口

#### Scenario: 点击遮罩关闭
- **WHEN** 用户点击 Lightbox 的遮罩层（图片外的暗色区域）
- **THEN** Lightbox 关闭，回到先前 UI 状态

#### Scenario: ESC 键关闭
- **WHEN** Lightbox 处于打开状态，用户按下 ESC 键
- **THEN** Lightbox 关闭

#### Scenario: 关闭按钮关闭
- **WHEN** 用户点击 Lightbox 右上角的关闭按钮（X）
- **THEN** Lightbox 关闭

### Requirement: ClickableImage 包装组件

系统 SHALL 提供一个 `ClickableImage` 包装组件，简化 Lightbox 的使用。

- 组件 SHALL 接受与 `<img>` 相同的 props（src、alt、className 等）
- 组件 SHALL 在图片上添加 `cursor-pointer` 样式和悬停放大图标提示
- 点击时 SHALL 自动打开内嵌的 `ImageLightbox` 展示原图

#### Scenario: ClickableImage 自动管理 Lightbox 状态
- **WHEN** 开发者使用 `<ClickableImage src="..." alt="..." className="..." />` 替换 `<img>`
- **THEN** 图片展示效果与原 `<img>` 一致，但可点击打开 Lightbox 查看大图

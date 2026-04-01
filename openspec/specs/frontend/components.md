# 前端组件与微交互规范 (Components & Micro-interactions)

## 1. 登录注册模块组件 (Auth Components)
[ADDED] 本节新增于 2026-03-13。

### 1.1 第三方授权按钮 (e.g. Google Login Button)
为了提供极致的用户体验和现代化的视觉感受，主要的授权登录按钮必须包含以下高品质微交互（Micro-interactions）：
- **Hover 层级提升**: 鼠标悬浮时需要伴随着轻微的 Y 轴上浮（`-translate-y-0.5` 或 `-translate-y-1`）以及更深的泛光阴影 (`shadow-lg` 配合主题色)。
- **光晕流转/边框反馈**: 需要在被交互时（Hover/Focus）提供边框高亮，或是利用 `group-hover` 机制在按钮边框产生一圈柔和的扩张动画 (Ring expansion)。
- **Icon 动效**: 左侧的品牌 Icon（如 Google 标志）可以在 Hover 时产生极轻微的缩放（`scale-105` 或 `scale-110`）。
- **Click 反馈**: 激活 (Active) 状态下必须有真实的物理下压感（`active:scale-95` 或 `active:translate-y-0`）。

### 1.2 邮件查收过度页提示框 (Verify Request Card)
- **视觉风格**: 以深色 Glassmorphism 或与 `/login` 匹配的下沉面版 (`var(--surface-sunken)`) 构建居中卡片。
- **动态图标**: 必须使用包裹着 `--animate-pulse-glow` 发光背景环形的 Mail/Check 图标，提供视觉焦点。
- **返回按钮**: 底部的“Back to Login”按钮需维持 1.1 的交互标准。

### 1.3 输入框与表单 (Input Fields)
- **视觉风格**: 深色主题下禁用大面积白色高亮底色背景。应使用透明或极暗透底 (`bg-white/5` 或 `bg-transparent`) 配合精细白边 (`border-white/10`)。
- **交互规范**: `Focus` 状态下需要利用 `ring` 属性激发柔和的品牌色光晕或平滑的输入高亮（例如 `focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent`）。Icon 等附属元素在聚焦时应由灰变亮。

## 2. 个人中心 UI 组件 (Profile Components)
### 2.1 个人信息卡片头像与名称回退机制 (Avatar & Name Fallback)
由于邮箱魔术链接无法提供第三方 OAuth 的完整资料，当用户只拥有邮箱数据时：
- **名称渲染**: 如果 `user.name` 为空，应提取 `user.email` 的前缀（`@`前面的内容）作为显式的 "Name" 替代。
- **头像渲染**: 如果 `user.image` 为空，应当提取其计算出名称的第一个字母，并将其居中放置于一个带有品牌色渐变/纯色的圆形容器中（例如 `bg-gradient-to-br from-[var(--brand-primary)] to-purple-600`）。绝不可出现破碎图片或默认呆板的占位图。

## 3. 全局反馈与异常监控 (Global App Feedback)
### 3.1 底部弹出提示框组件 (Toast Notifications)
系统底层集成了极具现代感质感的交互通知库 `sonner`，并作为 `<Toaster />` 植入在全站 `RootLayout`。
- **定位**: 必须挂载在屏幕左下方 (bottom-left)，这是为了拟合开发者本地终端/错误控制台经常出现的位置，符合心理模型。
- **主题风格**: 强制开启 `richColors` 与 `theme="dark"` (或跟随系统深色主题)，保证深色模式下的流光极简质感。
- **应用场景**: 用于所有 Server Component, Server Actions 以及 Client Component 中需要跳出边界，给予用户的**结果级非阻塞警告**（例如：API 密钥未配置、获取 3D 模型失败等线上静默报错）。

## 4. 营销与引流组件 (Marketing Components)
### 4.1 首访弹窗 (Welcome Login Modal)
- **触发机制**: 针对未登录 (`session === null`) 且本地离线存储未打标查阅 (`welcome_modal_seen`) 的用户。在停留适当时间或页面离开意图 (Exit Intent) 时触发。
- **视觉风格**:
  - Backdrop: 采用大面积高斯模糊 `backdrop-blur-md` 和极低透明度的深色遮罩。
  - Modal 本体: 左侧图文区展示高品质 3D 渲染产物；右侧为表单区，引导用户获取优惠（例如 10% Off）。
  - 色彩: 使用 `brand-primary` 作为高亮行动号召 (CTA) 的底色，整体搭配 Glassmorphism (白纱透底 `bg-white/5` 等)。
- **交互规范**:
  - 由于我们是 Headless 架构，该弹窗右侧必须嵌入 `auth/server-action` 构建的 Magic Link （邮箱发信）表单。
  - **[核心体验] 全局 Toast 提示流 (Global Toast Flow)**：发信成功后，为了最快速地释放用户的屏幕焦点并允许继续浏览，弹窗应当**立刻关闭**。不进行任何形式的跳转或原地重绘，而是静默调用 `toast.success` 显示长达 6 秒的全局通知。全局化的提示组件更统一、不打扰用户浏览。
  - **[解耦业务] 优惠券本地派发**: 弹窗在发信成功的同时，会静默地向 `localStorage` 中写入 `active_discount_code = "WELCOME10"`。`CartSidebar` 会全局监听该值并自动给全车商品九折呈现，并最终挂载到 Shopify Checkout 请求上。
  - **[坑点预警] 弹窗防闪烁安全线**: 在编写此类的自动开启弹窗时，由于 React 开发模式的 Strict Mode 会触发两次 `useEffect` 挂载，如果不在 `setTimeout` **前**和**内**同时加入 `localStorage.getItem` 阻断器，会导致闭包作用域泄露，引发多个弹窗堆叠或关不掉的 Bug。所有类似弹窗必须实施此类极致的 `localStorage` 同步拦截。

### 4.2 登入后交互体验增强 (Post-Login UX)
为了解决用户通过邮件重定向回原始页面后感知太弱的问题，并提高转化率：
- **[迎宾 Toast] Session Welcome Toast**: 必须通过前端的 `Session` 监听结合浏览器临时的 `sessionStorage` 拦截。当访客拥有 Session 且是当前 Tab 生命周期内的“首次登入”时，在左下角爆发 `toast.success` 以告知用户资产状态。
- **[促单挂件] Global Header Coupon Badge**: 在全站右上方 Header (购物车旁边) ，当 `session.user.hasWelcomeCoupon === true` 时需常亮展示一个药丸徽章。要求带发光呼吸效，点击直接弹出 `CartSidebar`。
- **[全息卡片] Dynamic Profile Card**: 个人中心的卡包UI严禁使用纯静态块。必须依托 `framer-motion` (例如 `whileHover={{ scale: 1.02, rotateY: 5 }}`)，加入 CSS 的 `radial-gradient` 鼠标追踪光晕，甚至一键点击复制 (`navigator.clipboard.writeText`) 动作，打造高级数字资产感。

## 5. 图片查看与 Lightbox (Image Viewing)
### 5.1 定制流程图片接入 Lightbox
[ADDED] 本节新增于 2026-03-29。

定制流程中的以下图片使用 `ClickableImage` 组件（来自 `src/components/ImageLightbox.tsx`）替换原 `<img>` 标签，支持点击查看大图：

1. **上传步骤**：上传后的预览图、抠图 Before/After 对比图
2. **生图展厅**（FigurineGenerationGallery）：主视觉大图（通过 `ImageLightbox` 直接集成）
3. **选项步骤**：生成预览图
4. **确认步骤**：生成结果图、原图缩略图

组件详细规范见 `openspec/specs/image-lightbox/spec.md`。

### 5.2 ImageLightbox 空 src 防护
[ADDED] 本节更新于 2026-04-02。

`ImageLightbox` 在关闭动画期间（200ms）组件仍挂载，若父组件传入空字符串 `src`，会触发浏览器重新下载页面的警告。
- **规范**：`<img>` 元素必须使用 `{src && <img src={src} />}` 条件渲染，确保 `src` 为空时不渲染 `<img>` 节点。

---

## 6. 定制流程步骤架构 (Customize Flow Step Architecture)
[ADDED] 本节新增于 2026-04-02，源自 customize-revamp 变更。

### 6.1 步骤流程定义

定制流程采用 4 步状态机：`upload → style → generate → confirm`

| Step | 职责 |
|---|---|
| `upload` | 用户上传照片（支持可选抠图），提交进入风格选取 |
| `style` | 选择风格大类（Cartoon / Low Poly / Sculpture / Realistic）及子变体；点击「Start Crafting My Figurine」进入生成 |
| `generate` | FigurineGenerationGallery 挂载后**自动触发**生成，生成完成后点击进入确认 |
| `confirm` | 展示生成结果预览、商品规格选项（合并原 select 步骤）、价格与加入购物车按钮 |

### 6.2 抠图（BG Removal）默认关闭
- `bgFilterEnabled` 初始值为 `false`，用户需手动开启 Remove Background 功能。
- 抠图进行中（`bgProcessing === true`）时，「Continue」按钮处于 `disabled` 状态，文案改为「Processing photo...」，防止用户在处理期间进入下一步。

### 6.3 生成自动触发规则
- `FigurineGenerationGallery` 挂载时，若 `initialViews` 为 `null`（全新生成），立即调用 `startGenerationFlow()`。
- 若 `initialViews` 不为空（从 Vault 进入），直接展示历史视图，不触发自动生成。
- 生成失败（`status === 'ERROR'`）时展示「Retry」按钮，用户手动点击后重试。

### 6.4 预览风格下单限制（isOrderable）
- `isOrderable = false` 的风格（如 Realistic）允许正常进入生成并完成渲染。
- 在 `style` 步骤中，「Start Crafting My Figurine」按钮**不禁用**，仅在按钮下方展示灰色小字提示。
- 在 `confirm` 步骤中，「Add to Cart」按钮 `disabled`，展示「Ordering not yet available for this style」说明。

### 6.5 Gallery 按钮语义
- 生成进行中：右侧进入确认的按钮不可见或 `disabled`。
- 生成完成：右侧按钮文案「View Results & Order」，图标 `ArrowRight`。
- 「Initialize Canvas」和「Finalize Tri-View Model」按钮已移除；ERROR 状态改为显示「Retry」按钮。

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
  - **[坑点预警] 弹窗防闪烁安全线**: 在编写此类的自动开启弹窗时，由于 React 开发模式的 Strict Mode 会触发两次 `useEffect` 挂载，如果不在 `setTimeout` **前**和**内**同时加入 `localStorage.getItem` 阻断器，会导致闭包作用域泄露，引发多个弹窗堆叠或关不掉的 Bug。所有类似弹窗必须实施此类极致的 `localStorage` 同步拦截。

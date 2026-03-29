# 新增变更提议模板 (Proposal)

---

# 提议名称：UX 打磨与鉴权边缘 Case 修复 (2026-03-14 补丁集)

## 1. 背景与意图 (Context & Intent)
在经历了一系列密集的重构（如营销弹窗引入、Session Toast 生效、全局优惠券开发）后，线上 Vercel 环境与本地出现了一些渲染差异，同时暴露出了部分深层的 Auth 鉴权体验割裂。为了保证交互流畅度与系统稳定性，在过去的两小时内，我们对以下三个核心模块进行了物理层面的重塑：

- **痛点/需求**: 
  - Vercel 生产环境对大图处理导致的 Next.js Image Optimization 崩溃。
  - SSR 与客户端 Theme 不一致导致的背景严重透明化。
  - Google 原生登录因为账号已存在（Magic Link 占坑）而崩溃 (`OAuthAccountNotLinked`)。
  - 授权登录完成后经常错误地跳回登录页死循环。
  - “撒花”特效过度滥用，在后续非首登时依然出现，破坏极简体验。
- **核心目标**: 彻底根除以上断点，落地一套稳定、极简且具备“只庆祝一次”生命周期的闭环 UX。

## 2. 受影响的规范文件 (Impacted Specs)
- [x] `specs/frontend/components.md` (修改了 Header Badge, Modal 和 Toast 的封装标准)
- [x] `specs/backend/auth.md` (引入了危险账号链接允许规则和动态 Callback 推断)

## 3. 详细改动规格 (Proposed Deltas)

### 针对 Auth 鉴权链路的体验修改：
- `[MODIFIED]` `src/auth.config.ts`: 给 Google Provider 添加 `allowDangerousEmailAccountLinking: true`，允许拥有同名邮箱的第三方社交账号直接绑定并接管无密码（Magic Link）账户。
- `[MODIFIED]` `src/app/login/page.tsx` & `src/app/actions/auth.ts`: 在登录界面增加 `window.location.search` 拦截代码。自动捕获 `callbackUrl` 并以隐藏域传入服务端防丢参数，防止出现登录后无限死循环跳回 `/login`。

### 针对全局提示 Toast 和首登庆典修改：
- `[MODIFIED]` `src/components/SessionToastProvider.tsx`:
  - 弃用之前的每次 Session 刷新就撒花的逻辑，彻底劈成两截。
  - **首登专属 (First Time Ever)**: 基于长效的 `localStorage.getItem("has_ever_celebrated_login")` 触发。再次精简了彩带特效，移除可能阻碍特效渲染的 `disableForReducedMotion`，调整发射范围 (`spread: 60`, `particleCount: 30`)，并将爆炸中心锁定在右上角 Toast 弹窗的绝对视觉中心 (`origin: { x: 0.9, y: 0.15 }`)，杜绝满屏乱飞或在左下角迷失的问题。
  - **日常登录 (Returning)**: 基于 `sessionStorage` 拦截。不触发任何炫技动画，仅使用最基础的 Sonner Green Success 样式 `Welcome back!` 秒现秒没。
  - **样式真理层修复 (Sonner Architecture)**: 以往依赖 `className` 和 `style` 被系统默认颜色覆盖（导致截图中的白底白字），现在彻底启用 Sonner 官方标准的深浅映射机制 `classNames: { toast: "...", title: "text-zinc-900 dark:text-zinc-100", description: "..." }`，在最底层的 DOM 节点上强制锁死 Light/Dark 模式下的最高对比级纯度。
 
### 针对 Header 与营销弹窗的 UI 断层修改：
- `[MODIFIED]` `src/components/marketing/WelcomeModal.tsx`:
  - 把容易被 Vercel Edge Server 搞崩的 Next.js `<Image src="after.jpg">` 直接降级成了原生的 HTML `<img>` 标签，用物理渲染绕过配额错误。
  - Modal 底板背景由依赖客户端动态变量的 `var(--surface-sunken)` 替换为绝对静止的 `bg-white dark:bg-zinc-950`，解决线上极度透明问题。
  - 移除了 Email 输入框的 `backdrop-blur-sm` 以及强制注入的 `bg-white/5`。改用具有实色回退保护的 `bg-black/5 dark:bg-white/5`，根除了线上 Safari/端侧浏览器因为多重高斯模糊导致的输入框左侧黑灰块异常渲染 `(Artifact Bug)`。
- `[MODIFIED]` `src/components/layout/HeaderClient.tsx`:
  - 废除了 10% 优惠券胶囊的 `mix-blend-overlay` 和 `bg-[accent]` 背景，使其退回完全 2D 极简的透明线框状态（`border-accent`）。同时 4s 的扫光特效退格为 `opacity-20` 的扁平色块移动。
  - 给所有功能性按钮（语言、主题、购物车、卡券复制区、下线）补全了 `cursor-pointer`。

## 4. 实施 Checklist (Implementation Plan)
- [x] 1. 物理代码修改（已通过最近 15 个 commits 全量并入 GitHub `main` 分支）。
- [x] 2. 线上 Vercel 自动重部署并通过 Review。
- [x] 3. 归档本周期的 Task 并更新相关 Spec 规范记录。
- [x] 4. 完成闭环 (Done)

---
## 状态区
- [ ] 提出中 (Draft)
- [x] 用户已审查并同意 Specs 修改 (Specs Approved)
- [x] 代码实施完成待验收 (Implemented)
- [x] **完成闭环 (Done)**

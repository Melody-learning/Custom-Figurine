# 提案：登入后感知增强与全局优惠券交互升维 (Post-Login UX & Dynamic Coupon)

## 1. 核心问题诉求
根据我们刚才“原地复活”的最新体验测试，您敏锐地指出了三个影响商业转化感知的问题：
1. **登入后缺乏“胜利感” (Lack of Perception)**：用户点开邮件链接跳回首页后，由于页面内容没变，没注意到右上角的 Login 变成了头像，导致他们不知道自己经历了什么，缺乏明确的反馈。
2. **资产墙过于静态 (Static Coupon UI)**：Profile 页面那个巨大的 10% 优惠券缺乏“高价值资产”该有的灵动感和交互欲。
3. **全局提醒缺失 (Global Entry)**：用户离开 Profile 回到定制页时，可能会忘记自己有券，头部导航栏缺少一个强有力的促单锚点。

---

## 2. 升维改造方案

### A. 登入成功强感知 (Post-Login Perception)
- **方案**：引入**首登会话级迎宾 Toast (Session Welcome Toast)**。
- **机制**：在 `RootLayout` 或者统一的 Client Provider 中检测 `session`。利用浏览器的临时 `sessionStorage` 记录状态。一旦检测到用户刚从“未登录”切换为“已登录”（获取到了 Session，且当前页面的 `sessionStorage.getItem('has_welcomed')` 为空），我们就立即从屏幕下方升起一个璀璨的 `toast.success`：
  > *"🎉 Welcome back! Your 10% Welcome Discount is now active and securely stored in your vault."*
- **效果**：无论由于 Magic Link 跳回哪个页面，用户落地第一秒就会被这个华丽的全局 Toast 震撼并告知其资产已到账。

### B. 会员中心资产“活”起来 (Dynamic Profile Coupon)
- **方案**：全面重构 `/profile` 页面的 Coupon 卡片，植入基于 `framer-motion` 和原生 CSS 魔法的高端动效。
- **机制**：
  1. **全息卡片悬浮 (Holographic Hover)**：通过 Framer Motion 让卡片带有呼吸感，鼠标悬浮在卡片上时会有极为丝滑的物理放大和光波流转。
  2. **流光边框 (Radiant Border)**：利用 CSS `@keyframes` 制作一条环绕卡片边缘持续跑动的发光细线，强调其“正在生效（Active）”的神圣感。
  3. **一键复制微交互 (Click to Copy)**：给 `WELCOME10` 密码框加上一键复制功能。虽然我们会在结算时自动打折，但“复制”动作本身能给买家提供极强的“掌控感”和“占便宜”的暗示。

### C. 顶栏常驻“促单”挂件 (Global Header Coupon Badge)
- **方案**：在全站最显眼的 `Header.tsx` 右侧（购物车与头像之间），新增一个常驻的呼吸态专属挂件。
- **机制**：
  - 只有当 `session.user.hasWelcomeCoupon === true` 时才会渲染。
  - **视觉呈现**：一个带有极微动效的高级小药丸 (Pill) 按钮，文字显示 `🎁 10% Off Active`，带有微弱的发光 (Glow) 效果。
  - **点击行为**：点击该按钮直接呼出 `CartSidebar`（购物车侧边栏），并自动将视线引导至底部的折扣结算区（这里我们已经在上一步做好了自动扣减 UI）。

---

## 3. 落地实施步骤 (Implementation Plan)
1. **更新 `Header.tsx`**: 订阅 `useSession`，在右上角渲染动态打折 Badge，点击调用 `useStore().setCartOpen(true)`。
2. **拦截并注入全局 Toast**: 创建一个新的客户端上下文组件 `SessionToastProvider.tsx`，监听状态并利用 `sessionStorage` 触发首登流光提示。
3. **改造 `ProfilePage`**: 剥离原有的静态 HTML Coupon，封装成名为 `DynamicCouponCard.tsx` 的客户端组件，狂堆视觉特效和复制功能。

---

**请您批阅此提案。** 如果这个“感知轰炸+全息特效+促单挂件”的连招符合您的心意，我们即刻更新 Task Tracker 并开始写码！

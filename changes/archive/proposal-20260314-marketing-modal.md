# 提案：首次访问营销登录弹窗 (Welcome Marketing Modal)

## 1. 架构与设计思路 (Headless Shopify 模式)

在 Next.js 无头电商 + Shopify 架构下，关于**优惠券**的派发和校验，最优雅且安全的做法是将**核销权交给 Shopify 底层**。

结合我们刚刚打通的魔术链接 (Magic Link)，整个闭环流转设计如下：

### A. 折扣券机制 (Shopify 侧)
不建议在前端随机生成折扣码去 Shopify 注册（会极其消耗 API 并增加复杂性）。
**最佳实践**：在 Shopify Admin 后台（Discounts 选项卡）手动创建一个**全局迎新折扣码**（例如 `WELCOME10` 或 `NEWUSER2026`）。
- **规则设置**：设定为 "% 折扣" 或 "固定金额抵扣"。
- **限制条件**：勾选 **"Limit to one use per customer" (每个客户限用一次)**。由于 Shopify 结账时强制要求邮箱，它可以完美控制恶意刷单。

### B. 弹窗交互链 (Frontend 侧)
1. **触发展示**：
   - 针对未登录 (`session === null`) 且本地未标记已看过的用户（`localStorage.getItem('welcome_modal_seen') !== 'true'`）。
   - 用户在首页停留超过 3~5 秒，或鼠标向上移动产生离开意图 (Exit Intent) 时展示。
2. **精美 UI**：
   - 左侧：极具诱惑力的 3D 定制手办实拍图（高级感）。
   - 右侧：文案 "Unlock 10% Off Your First Custom Figurine" + **邮箱登录框**。
3. **融合登录闭环**：
   - 这个输入框本质上是我们刚做好的**魔术链接登录口**！
   - 用户输入邮箱点击 "Claim Offer"，系统内部直接调用 `loginWithEmail` Server Action 向其邮箱发送魔术链接。
   - 并给出成功提示：“请去邮箱点击专属链接登录，登录后优惠码将自动解锁！”

### C. 消费优惠 (Cart 整合)
当用户从邮箱里的 Magic Link 跳转回网站并成功产生 Session 时：
- 我们可以在前端顶部的通知条 (Banner) 或 个人中心 告诉他折扣码 `WELCOME10`。
- 更高级的做法：当他把商品加入购物车 (Cart) 后，我们直接通过 Shopify Storefront API 的 `cartDiscountCodesUpdate` Mutation，**在后台静默把 `WELCOME10` 自动应用到他的购物车上**，实现终极的“无感打折，结账直接减钱”效果。

---

## 2. 涉及代码与模块规划

#### 1. 新增 UI 组件
- **`src/components/marketing/WelcomeModal.tsx`**
  - 使用 `framer-motion` 实现高级感弹升浮现效果与背景毛玻璃模糊。
  - 内置客户端表单与 Sonner 错误捕捉（完美复用之前的登录逻辑）。

#### 2. 全局状态接入
- **`src/app/layout.tsx`** 或一个全局的 `ClientProvider` 中注入该 `<WelcomeModal />`。
- 监听并检查 `localStorage` 与 NextAuth `useSession()` 状态。

#### 3. Shopify 优惠券自动化 API (后续可选进阶步骤)
- **`src/lib/shopify/mutations/cart.ts`**
  - 补充 `cartDiscountCodesUpdate` 方法，用于在一键结账时把配置好的优惠码写入 Shopify Checkout。

---

## 4. 衍生的体验与环境 Bug (Derived Bugs)

在物理代码落地首访营销弹窗后，我们一并修复和确认了两个衍生问题：

1. **React Strict Mode 导致的无限弹窗泄漏 (Frontend)**：
   - **问题**: 在本地开发模式下，React 会执行两次 `useEffect` 挂载。如果在 `setTimeout` 触发前没有实施严格的闭包阻断，会产生多个并行计时器，导致弹窗即使被关闭后也会在几秒后再次“复活”。
   - **方案**: 在设置状态前强制 `localStorage.getItem("welcome_modal_seen") !== "true"` 作为最后一道物理闸门，并在 `closeModal` 内部强制同步更新，从而掐断并发渲染带来的旧作用域重读问题。

2. **腾讯邮箱 (QQ/WeChat) 魔术链接拦截报错 (Backend/Local Dev)**：
   - **问题**: 开发者在本地 (`localhost:3000`) 借助真实邮箱（如 QQ 邮箱）测试 Magic Link 时，点击邮件中的登录按钮会抛出类似 `{"head":{"ret":-5002,"cgi":"xmspamchecklogicsvr/xmsafejump","msg":"","stack":"Invalid url"}}` 的服务器报错页面。
   - **方案**: 这是一个纯粹的**本地测试环境局限**。这是因为国内邮箱厂商（尤其是腾讯的 SafeJump 服务）会在用户点击外链前，派发探测服务器去校验 URL 安全性。但腾讯的公网服务器无法解析我们开发地址中的 `localhost:3000`，因此直接抛出 "Invalid url" 并阻断了挑战。
   - **解法**: 仅需将其文档化。在本地测试魔术链接时，测试者不要去“点击”绿色按钮，而是需要**右键按钮复制链接地址**，然后手动粘贴回浏览器中；或者直接将项目部署到拥有公网域名的 Vercel 上进行点击测试。

---

## 5. 归档声明 (Archive Notice)
本提案的核心目标——**“UI 展示交互 (Framer Motion) 与 邮件注册引流闭环 (NextAuth Magic Link)”**已经 100% 落地并整合。
**注：** 关于自动将 `WELCOME10` 填充至购物车的逻辑，因其高度的复用性，已被**抽离并升级为全局独立的《全局优惠券系统》提案 (`changes/proposal-20260314-coupon-system.md`)** 进行专门研发。
本提案本身正式归档。

# 提案：优惠券中心与跨端魔术链接重定向补全

## 1. 核心问题定位
您测试非常精准！确实遗漏了两个极为关键的体验闭环：
- **重定向跑偏 (Redirect Fallback)**：当服务器上的 Server Action 触发 `signIn("resend")` 时，如果不加强制参数，NextAuth 会默认把发信时的当前页面（首页 `/`）作为点击邮箱链接后的回归地址。
- **跨端券丢弃 (Cross-Device Issue)**：如果您在电脑上看网页填了邮箱，但是用手机打开了邮件点链接，由于 `localStorage` 不互通，手机浏览器上虽然登入了，但刚才发的券就弄丢了！

# 提案：基于服务端的全局优惠券与精准重定向体系

## 1. 核心体验痛点与反思
您刚刚指出的两点极其切中要害，完全推翻了原先基于客户端的“投机”做法：

1. **“为什么回到了个人中心？”** 
   - **痛点**：对于电商网站来说，用户在浏览商品 (首页定制器) 时被弹窗吸引登录，登录后强行把他拽到“个人中心”，**破坏了买家心流**。他得重新点两下导航栏才能回到刚才的定制页面。更好的体验是**“从哪来，回哪去”**。
2. **“怎么会存本地？”**
   - **痛点**：这是绝对的架构硬伤！优惠券作为核心商业资产，完全依赖前端 `localStorage` (或者 URL 传递) 去发券是极其脆弱和不安全的。用户清缓存就丢了，或者跨设备 (电脑填邮箱，手机点邮箱) 根本吃不到这波优惠。发券必须由**服务端掌控**。

---

## 2. 破局方案：服务端双向绑定 (Backend Driven Architecture)

综上，我们需要彻底重构之前的优惠券派发链路，将其实体化：

### A. 数据库级优惠券留存 (Prisma Schema Update)
修改 `prisma/schema.prisma`，在 `User` 模型中增加一个字段 `hasWelcomeCoupon Boolean @default(false)`。
- **派发时机**：当我们在 `auth.ts` 中拦截到某个邮箱完成了**首次创建注册 (createUser)** 时，或者是我们特定的发券 API 被调用且验证通过时，我们在服务器上直接将该用户的 `hasWelcomeCoupon` 标记为 `true`。不存在跨端丢失的问题。

### B. 会话级折扣传递 (JWT Session Payload)
为了避免每个页面都去查数据库，我们将 `hasWelcomeCoupon` 注入到 **NextAuth 的 JWT 和 Session** 载荷中。
前端的 `CartSidebar` 只需要通过 `useSession()` 读取 `session.user.hasWelcomeCoupon`，就能物理安全地决定是否在 UI 端和 Checkout URL 尾部带上 `?discount=WELCOME10`。

### C. “从哪来回哪去”的正宗重定向 (Callback URL Strategy)
修改 `WelcomeModal` 的发信请求代码：
- 当用户在 `/` 首页触发弹窗时，我们将当前路径 `pathname` 或者预设好的 `callbackUrl="/"` 发送给 `signIn("resend", { callbackUrl: window.location.href })`。
- NextAuth 内部的回调机制会忠实地记录这个出发地，当用户在手机邮箱里点击 Magic Link 成功落库后，会自动原路重装空降回最初的定制页面！

### D. 个人中心的展示呈现
由于它现在已经是服务端会话属性了，即使登入后回到了首页，用户主动进入 `/profile` 时，我们依然可以通过判断 `session.user.hasWelcomeCoupon === true`，在页面上常亮渲染出一个“优惠券资产包” UI。

---

## 3. 涉及代码与模块修改
1. **`prisma/schema.prisma`**: 向 `User` Model 追加 `hasWelcomeCoupon Boolean @default(false)`。并执行 `npx prisma db push`。
2. **`src/auth.config.ts`**: 在 `callbacks.jwt` 和 `callbacks.session` 中，将 db 里的 `hasWelcomeCoupon` 附加给浏览器 session。
3. **`src/app/actions/auth.ts` 与 `WelcomeModal.tsx`**: 
   - 发送魔术链接时带上 `redirectTo: callbackUrl`，并在这个特定的 Action 触发时，更新该邮箱绑定用户的发券标记（如果他已存在但在发券前注册的）。
4. **`src/components/CartSidebar.tsx`**: 将原来的 `localStorage` 读取废弃，改为订阅安全的 `session` 状态。
5. **`src/app/profile/page.tsx`**: 增加实体的卡包/资产墙视图。

---

## 4. 请您审核
以上由服务端风控驱动的“坚固资产架构”以及顺滑无缝的“原地复活”重定向逻辑，是否才是您真正期望的商业级体验？
如无异议，我将立刻开始这套前后端闭环的代码物理重构！

---
## 状态区
- [ ] 提出中 (Draft)
- [x] 用户已审查并同意 Specs 修改 (Specs Approved)
- [x] 代码实施完成待验收 (Implemented)
- [x] **完成闭环 (Done)**

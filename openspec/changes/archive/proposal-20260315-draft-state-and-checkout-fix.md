# 提案：生成态全局生命周期管理体验升级与结账环境对齐 (UX State Machine & Checkout Env Fix)

## 1. 深度复盘与意图 (Context & Intent)
根据司令官极具产品嗅觉的反馈，我们重新审视了目前的生成器链路和结账模块。发现了两个深层的架构逻辑缺失：

### 核心痛点 A：割裂的生命周期 (Broken State Machine)
**现象**：“F5 刷新后结果没了，或是旧图一直粘在上面去不掉”。
**根本原因**：目前系统架构上，`uploadedImage` 和 `generatedImage` 存在了全局 IndexedDB（持久化），但是控制界面显示第几步的 `step ('upload' | 'generate' | 'select' | 'confirm')` 仅仅是 `page.tsx` 里的一个 `useState` 局部状态。
**导致破坏性体验**：
- 当用户走到 Step 3 (有了 3D 渲染图)，一按 F5，React `step` 被清零回 `upload`（展示上传区），但底层 Zustand 库里其实还藏着 `generatedImage`。
- 退回时由于缺乏状态清理联动，导致界面残留。

### 核心痛点 B：本地 Checkout 连接阻断 (Local Env Token Mismatch)
**现象**：线上购物车结算正常，但本地 `npm run dev` 报错 `Invalid API key`。
**根本原因**：这说明 Shopify 官方并未封禁该 Token。真正的病因是：本地的 `.env.local` 里的 `SHOPIFY_ADMIN_ACCESS_TOKEN` 是一串旧的、废弃的字符串，而 Vercel 生产环境云端配置的是最新且正确的 Token。本地环境与线上发生“环境脱轨 (Env Drift)”。

---

## 2. 解决方案与 UX 动线重构 (Resolution Strategy)

### 专项一：专业交互设计师视角下的生成链路重塑 (PM & UX State Reconstruction)
我们将废弃原来那种野生拼凑的状态流，将 `step` 状态升级为全局并引入清晰的“状态机 (State Machine)”概念。重新定义 F5 刷新和返回按钮的逻辑：

#### 【环节 1：上传页 (Upload)】
- **状态持有**：空，或只有 `uploadedImage`。
- **刷新 (F5)**：保留 `uploadedImage`（不强迫用户重穿），依然在 Step 1。
- **返回按钮 (Back)**：退回上一页（如主页 /home）。

#### 【环节 2：生成态 (Generating / Gallery)】
- **状态持有**：具有生图请求中的阻塞态。
- **刷新 (F5)**：正在生成的 API 链接会被阻断。安全回退：降级回 Step 1（Upload），`generatedImage` 为空。
- **返回按钮 (Back，通过 Gallery 自带的 Cancel/X 触发)**：取消生成调用，回退至 Step 1，**必须保留** `uploadedImage` 和选区数据，让用户可以马上换个模型重试。

#### 【环节 3：参数选择 (Select Product Options)】
- **状态持有**：已经拥有了昂贵的 `generatedImage` 成果。
- **全局软拦截 (Native Browser Confirmation)**：通过 `beforeunload` 与 `popstate` 钩子拦截页面的 F5 刷新、Tab页关闭、以及浏览器的回退/侧滑返回键。系统会原生地弹出类似 *"离开将丢失未保存的生成资产"* 的二次确认。
  - **确认离开**：Zustand 内存销毁，用户刷新后或下一次访问时老老实实回到 Step 1 (Upload)。
  - **取消离开**：保留在当前展示步骤，资产安全无恙。
- **返回按钮 (BackBtn)**：用户如果在此时点击返回，系统**不会且不应清空**生成的昂贵 3D 资产。而是带着三视图数据，热重载退回到 Step 2 (Gallery) 的 `COMPLETE` 完成态大厅。用户可以在那里重新放大审视主图/侧面/背面。如果他们真的对结果不满意，再通过大厅统一的【Discard & Retake】按钮实行数据销毁并回退到 Step 1 重置。

#### 【环节 4：确认预览 (Confirm & Add to Cart)】
- **刷新 (F5)**：保留所有配置，停留在此。
- **返回按钮 (Back)**：退回 Step 3（Select），保留 `generatedImage`，仅仅是修改变体属性。
- **“加入购物车”的完结时刻 (The Climax)**：一旦成功扔进购物车，**必须彻底销毁**工作区内的所有内存与 IDB 状态 (`uploadedImage` / `generatedImage` / `step`)，让底层回归最纯净的 Step 1。这样用户关掉侧边栏后看到的是一个“全新待开垦”的画布。

#### 【异常边界：孤立数据图裂兜底 (Orphaned Assets Fallback)】
- **现象**：当后端（特别是本地环境因 Prisma Client 热更新滞后导致枚举字段擦除）意外将未生成的图片标记为 `COMPLETE` 时，前端 Vault 会遭遇无数据渲染（图裂）。
- **防御机制**：不仅依赖 `status === 'PENDING'` 的拦截，还在展示层实施“零视图数组”降级：若三维视角图片阵列为空，或者状态被明确标记为 `FAILED`，将其渲染成“**终止/异常面板 (Upload Interrupted)**”，绝不向用户暴露损坏的 `<img>` 标签或白屏报错。

### 专项二：消除本地与线上的环境差异 (Syncing Environments)
既然线上运转良好，我们绝对不应该乱动 Shopify 后台，更无需生成新令牌。
- **处理方式**：通过 `vercel env pull .env.local` 密令，将线上云端的真实 Token 单向同步下拉到本地覆盖。
- **工程韧性**：在 `CartSidebar.tsx` 的请求里接入“本地 Mock 容错拦截”。如果检测到是在 `localhost` 且 `createCheckout` 抛出 Token 异常，不仅拦截崩溃，还可以跳出一个友好的内网提示：> "检测到本地发票令牌过期，线上环境将正常发货，您此次可跳过结账环节继续测试流程..."，避免 Block 您的本地前端样式走查。

---

## 3. 实施 Checklist
- [x] 1. 改造 `src/lib/store.ts`，将 `step` 与生成物进行强聚合，统一控制。
- [x] 2. 依据新的 UX 规范彻底重构 `src/app/customize/page.tsx` 里的状态机路由逻辑、F5 保护与 Back 按钮行为链。
- [ ] 3. *(您或我执行)* 在本地 CLI 执行环境变量拉取对齐，修复 Local Token。
- [ ] 4. (选做) 在 Local Dev 注入购物车报错阻断与友好提示。

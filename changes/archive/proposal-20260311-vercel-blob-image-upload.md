# Vercel Blob 云端图床集成提议

## 1. 变更背景与意图 (Background & Intent)
在目前的定制购物流程中，由于没有持久化的云端存储介质，前端产生的高清用户原图或生成的“AI手办白模模型基准图”均通过几 MB 体积的 **Base64 编码文本串**直接塞入 Shopify 的 `customAttributes`。
这造成了两个严重问题：
1. **拦截风险**：超大体积编码很容易被 WAF (防火墙) 或者网络层中间件拦截报错。
2. **商户/用户体验极差**：结账页面和 Shopify 订单管理后台中，图片属性被渲染成了一大片无法阅读和无法点击查看的乱码文字，极大地影响了业务流水线的流转与订单核对。

**意图**：通过引入轻量且无需额外账号绑定的 Vercel Blob 存储服务，实现结账前的**拦截转存机制**。保证抛送给 Shopify 的都是干净、短小且持久可见的 `https://*.public.blob.vercel-storage.com/...` 图片超链接。

## 2. 影响范围 (Impact Scope)
1. **依赖项增加**：需安装官方云端存储包 `@vercel/blob`。
2. **系统环境变量**：需要增加 `BLOB_READ_WRITE_TOKEN`。
3. **架构变动**：将在 Next.js Serverless 中增加一个新的上传收口端点 `/api/upload`。
4. **购物车拦截更新**：核心组件 `CartSidebar.tsx` 将在触发跳转前拦截执行静默长传。

## 3. 受影响的规范文件 (Impacted Specs)
- `specs/integrations/ai-generation.md`：需要补充关于原图和衍生图的持久生命周期和存储介质规定（暂存于 Vercel Blob）。
- `specs/business/checkout-flow.md`：需要重构“结账生命树”，增加阶段性图床拦截策略。

## 4. 实施清单 (Implementation Steps)

### 第一步：用户鉴权配置介入 (Owner Action Required)
1. 访问并登录您的 [Vercel 仪表盘 (Vercel Dashboard)](https://vercel.com/)。
2. 进入当前绑定的项目（如果未挂载请新建一 Vercel 项目并关联该 GitHub Repo）。
3. 选择顶部标签页栏或侧边栏的 **"Storage"**。
4. 点击 **"Create Database"**，选择 **"Blob"**。
5. 完成创建后，切换到 **".env.local"** 配置指引页卡。
6. 提取 `BLOB_READ_WRITE_TOKEN` 凭证并写入本地的 `.env.local` 环境变量文件。

### 第二步：由 AI 执行代码装配 (AI Implementation)
1. **Install SDK**: 执行 `npm install @vercel/blob` 引入官方套件。
2. **Create REST API**: 创建 `src/app/api/upload/route.ts` 作为安全中间层，接收 Base64 或者 File Blob 流并调用 `@vercel/blob` 的 `put()` 方法转存至远端。
3. **Rewrite Checkout Logic**: 改造前端，剥离原本把 Base64 当作参数扔给 Shopify 的旧逻辑。改为先发起 `Promise.all` 等待云端图床处理完毕拿到真实 `url`，再拼接为极简化属性（如 `{ key: 'Original Image', value: 'https://...' }`）传送建单。

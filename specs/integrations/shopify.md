# Shopify 集成实施核心协议单 (Shopify Integrations Rules)

本文件是项目中关于将我们完全自渲染的前端站内流程，对接到商业核心 Shopify 时所有必须遵守的基础凭据、接口策略和数据模型映射协议。

## 1. 基础权限基址与要求 (Environment Credentials)
以下环境变量密钥为连通全案的基础底盘，必须以静默安全的形式隔离配置在托管商平台 (Vercel Secrets) 或本地安全文件 `.env.local` 并在 Next.js 服务端进行环境剥离编译：

- `SHOPIFY_STORE_DOMAIN` (必填指引: Shopify提供的系统级三级域名，例如: `custom-figurine.myshopify.com`。绝非公开购买的常规运营域名，而是用于网关交互的基础 Domain)。
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (必填指引: 在应用商城自主生成的，权限设定仅仅可用于无头读写前台的商品大纲与装载创建购物车通信凭证，无需具有任何危险的后端管理与破坏权限。)

> [!WARNING]
> 凭证缺位应对措施: 根据历史追认，当系统未能从终端拥有者 (`USER`) 拿到实质运行的上述两项正式 Token 时。在 UI 开发过程中，允许 API 暂时打回并投出具有结构相同但为 Mocked 随机模拟数据的模拟件以确保视觉流程通过，而不是触发雪崩级 Error 让项目挂起。

## 2. API 通信对接纲领
- **核心架构突变**: 由于 Shopify 结账页面的原生限制，无法将普通的 `Line Item Properties` 渲染为图片。因此，系统必须从纯前端的 Storefront API 创建购物车，全盘迁移到 **Server-Side Admin API 动态生成草稿订单 (Draft Orders)** 的高权限架构。
- 绝不使用厚重的 RESTful 第三方库，所有与 Shopify 的通信均由 Next.js 服务端 (`src/app/api/...`) 发起，使用基于 Node `fetch` 的原生 GraphQL 客户端，直接对接 `admin/api/2024-01/graphql.json` 端点。

## 3. SKU 商业定制泛化模型映射 (Product Payload Mapping)
因为独立站的定调具有 1 个 SKU 等于全世界成千上万可能的变化，在传统的 Shopify 数据库层建构常规独立商品实体去映射我们繁复如星河般的排列组合是不现实的。

必须运用如下技巧（Draft Order + Custom Line Item 策略）：
1. **拦截图片上传**：用户的定制原图和 AI 效果图必须先上传至 Vercel Blob，获取持久化的 `https://...` 短链接。
2. **凭空生成订单实体**：Next.js 后端接管结账请求，携带提取到的 Blob 图片 URL 作为入参。
3. **注入 Admin API**：后端使用带有 `write_draft_orders` 权限的 `SHOPIFY_ADMIN_ACCESS_TOKEN`，使用 GraphQL `draftOrderCreate` mutation。在生成 Draft Order 时，直接为其挂载一个 **Custom Line Item（自定义订单项）**。
4. **绑定专属预览图**：由于这是一个通过 Admin API 从天而降的自定义商业实体，我们可以直接将其 `image: { src: "..." }` 属性赋值为 Vercel Blob 的图片链接。
5. 当 Backend 获取到 Draft Order 专属的 Invoice URL (结账发票链接) 时，将其返回给前端执行跳转。
这样，用户在原生的 Shopify 结账页面中，将能完美看到其专属定制图片的缩略图！

## 4. 后台配置与 PayPal 绑定指南 (Owner Setup Guide)
由于建单强依赖真实的接口互通，需要项目所有者 (Owner) 在 Shopify 界面执行以下手动前置操作：

### 4.1 获取 Storefront API Token
1. 登录 Shopify Admin。
2. 左侧导航进入 **"Settings" (设置)** -> **"Apps and sales channels" (应用和销售渠道)**。
3. 点击 **"Develop apps" (开发应用)**，然后创建一个名为 `Custom Figurine Storefront` 的新应用。
4. 进入应用的 **"Configuration" (配置)** 标签，点击配置 **"Storefront API integration"**。
5. 勾选必要的读取权限（如：`unauthenticated_read_product_listings`, `unauthenticated_read_product_tags`, `unauthenticated_write_checkouts` 等建单必需权限）。
6. 安装应用并获取生成的 **Storefront API access token**。请提供给我或者将其写入项目的 `.env` 配置文件中。

### 4.2 配置 PayPal 企业账户收单
1. 在 Shopify Admin 进入 **"Settings" (设置)** -> **"Payments" (收款)**。
2. 在 **Supported payment methods** 中找到 **PayPal** 模块。
3. 点击激活，并按指引输入您现有的 PayPal 企业账户凭据进行 OAuth 绑定。
4. ** 沙盒测试声明**: 强烈建议在此处首先勾选“Enable test mode”或申请一个 PayPal Sandbox 账户，以便在我们编写前端代码期间能全链路测试整个购买流程而不会扣除您的真实款项。功能全完备验收后再关闭沙盒回到 Live 环境。

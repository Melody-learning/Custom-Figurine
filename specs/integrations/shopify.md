# Shopify 集成实施核心协议单 (Shopify Integrations Rules)

本文件是项目中关于将我们完全自渲染的前端站内流程，对接到商业核心 Shopify 时所有必须遵守的基础凭据、接口策略和数据模型映射协议。

## 1. 基础权限基址与要求 (Environment Credentials)
以下环境变量密钥为连通全案的基础底盘，必须以静默安全的形式隔离配置在托管商平台 (Vercel Secrets) 或本地安全文件 `.env.local` 并在 Next.js 服务端进行环境剥离编译：

- `SHOPIFY_STORE_DOMAIN` (必填指引: Shopify提供的系统级三级域名，例如: `custom-figurine.myshopify.com`。绝非公开购买的常规运营域名，而是用于网关交互的基础 Domain)。
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (必填指引: 在应用商城自主生成的，权限设定仅仅可用于无头读写前台的商品大纲与装载创建购物车通信凭证，无需具有任何危险的后端管理与破坏权限。)

> [!WARNING]
> 凭证缺位应对措施: 根据历史追认，当系统未能从终端拥有者 (`USER`) 拿到实质运行的上述两项正式 Token 时。在 UI 开发过程中，允许 API 暂时打回并投出具有结构相同但为 Mocked 随机模拟数据的模拟件以确保视觉流程通过，而不是触发雪崩级 Error 让项目挂起。

## 2. API 通信对接纲领
- 针对性能最优化和避免长 Payload 开销，所有与大后端域沟通的节点指令**必须要坚决采用**原生的、无冗余的 **GraphQL Queries/Mutations 编排请求格式** 对 Shopify 的 Storefront API 节点施加精准打击。绝对禁止倒退使用厚重的全载式外部第三方陈旧 RESTful 工具库。
- 采用更官方现代并维持轻薄调性的包 `@shopify/shopify-api` 或者是使用构建在内置基于 fetch 规范上的微型封装 Client 发生对话。

## 3. SKU 商业定制泛化模型映射 (Product Payload Mapping)
因为独立站的定调具有 1 个 SKU 等于全世界成千上万可能的变化，在传统的 Shopify 数据库层建构常规独立商品实体去映射我们繁复如星河般的排列组合是几乎不可能的任务。

必须运用如下技巧：
在 Shopify 后台数据库实质建立且且仅且设定一个具有巨大尺寸通用包容性的 "空底盘基座" 定位占位标品产品 (Placeholder Base Custom Product ID)。
将所有由于客户主观创意变化（如自己通过生图提交的高光模型图URL源链接、在文本框留下的诸如：“我需要增加手持盾牌”的手作嘱托细节留言、乃至颜色设定），统一利用 API 调用时将数据打包装载进属于 GraphQL 请求包子项目里的 `Line Item Properties` 字典属性中，伴随购物车一同落锁传送进云端并进入商家的实质订单管理后台系统中供出库审订人员溯源加工。

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

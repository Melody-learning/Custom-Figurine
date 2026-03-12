# 提议名称：[Epic 3 - Vercel 生产环境部署与域名绑定]

## 1. 背景与意图 (Context & Intent)
- **痛点/需求**: 目前所有激动人心的 AI 与订单数据代码仍驻留在本地 `localhost:3000`。我们需要将这艘战舰驶入公海，让全球用户都能通过正式域名访问购买，并让外部系统（如 Shopify Webhooks 和 Google Auth 回调）能够顺利路由返回。
- **核心目标**: 
  - 通过 Vercel CI/CD 实现零配置、自动化持续部署。
  - 将 `minimoi.net` 域名解析至 Vercel Edge Network，启用全自动 HTTPS 安全锁。
  - 同步隔离生产环境所需的环境变量 (DB, OAuth, Shopify Tokens)。

## 2. 架构选型 (Technical Decisions)
- **托管平台**: **Vercel** 面向 Next.js 优化的 Serverless/Edge 天然宿主。
- **代码仓库**: **GitHub** 作为唯一的代码源。Vercel 会在捕获推送到 `main` 分支时自动触发构建 (Build) 流程。
- **域名管理**: 用户在域名注册商处配置 DNS 验证，或将 NS 域名服务器直接移交至 Vercel 托管加速。

## 3. 受影响的规范文件 (Impacted Specs)
- `[NEW]` 提议新建 `specs/infrastructure/deployment.md` —— 定义 CI/CD 流程、环境变量白名单以及域名接入章程。

## 4. 实施阶段拆分 (Implementation Phases)
- **Phase 1: 兵工厂连接 (GitHub)** : 将本地代码进行 Git 提交，并推送到一个新建的私有 GitHub 仓库。
- **Phase 2: 登陆 Vercel (Vercel)** : 授权 Vercel 访问该 GitHub 仓库，授权一键导入项目。
- **Phase 3: 上传变量密钥 (Environment)** : 将本地 `.env.local` 里的安全密钥平移至 Vercel 项目设置面板 (Project Settings -> Environment Variables)。
- **Phase 4: 挂载正式域名 (Domain)** : 在 Vercel Settings -> Domains 填入 `minimoi.net`，并获取 DNS 解析参数供用户前往注册商处配置。
- **Phase 5: 配置反向回调 (Webhooks & Callbacks)** : 
  - 回到 Google Cloud Console 将重定向 URI 改为正式生产地址。
  - 回到 Shopify 把 Webhook 推送地址绑定为 `https://minimoi.net/api/webhooks/shopify`。

---
## 状态区
- [x] 提出中 (Draft)
- [x] 等待用户审查并批复 Proposal (Pending User Approval)
- [x] 修改并合入规范 Specs (Specs Updated)
- [ ] 物理代码实施完成 (Implemented)
- [ ] 完成闭环 (Done)

# 部署与基础设施规范 (Deployment & Infrastructure)

本核心系统依托于 Vercel 全球极速边缘网络 (Edge Network) 以及 GitHub 作为版本资产控制核心。本规范约束了代码上云的标准作业流程 (SOP)。

## 1. 持续集成与部署 (CI/CD)
- **代码唯一真理源 (Single Source of Truth):** 生产环境的所有发布，**必须且只能**通过向 GitHub `main` 分支的 Push 动作触发。**严禁**使用 Vercel CLI 执行 `vercel deploy --prod` 这种绕过代码审查的本地强推。
- **自动化构建:** Vercel 检测到 `main` 分支变动后，会自动执行 `npm run build`。其中包含 TypeScript 严格检查和 ESLint 校验。任何引发 Error 的构建都会被拦截，保证线上环境永不崩溃。

## 2. 环境变量隔离 (Environment Variables)
无论是开发阶段 (`.env.local`) 还是生产阶段 (Vercel Project Settings)，均需要严格保证以下变量对齐：

| 变量键值 (Key) | 作用阈 (Scope) | 是否含机密 (Secret) | 安全要求 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Frontend / Backend | No | 无限制，浏览器可读 |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Frontend / Backend | No | 暴露不影响系统安全 |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Backend Only | Yes | **绝不**允许泄露至前端 |
| `SHOPIFY_WEBHOOK_SECRET` | Backend Only | Yes | 用于校验验签，极其机密 |
| `DATABASE_URL` | Backend Only | Yes | Postgres 命脉，极其机密 |
| `AUTH_SECRET` | Backend Only | Yes | Auth.js 加解密命脉 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Backend Only | Yes | OAuth2 资产 |
| `EMAIL_SERVER` / `EMAIL_FROM` | Backend Only | Yes | SMTP 发信通道 |

## 3. 域名解析章程 (Domain DNS Integration)
为了最大化利用 Vercel CDN 的全球加速与抗 DDoS 属性：
1. 生产域名优先建议在顶级注册商处配置 **CNAME 记录** 指向 `cname.vercel-dns.com.`。
2. 根域名 (Apex Domain，如 `minimoi.net`) 推荐使用 **A 记录** 指向 Vercel 官方高防 IP（或按照 Vercel 后台指南配置 NS 服务器接管）。
3. SSL/TLS 证书（HTTPS 绿锁）由 Vercel 依托 Let's Encrypt 自动颁发并续期，**不需**人工干预。

## 4. 后续保障规划 (Post-Deployment)
部署完成后，必须回溯确保：
- 第三方服务（Google Cloud Console 等）的重定向回调白名单中，追加完整的生产网址（如 `https://minimoi.net/api/auth/callback/google`）。

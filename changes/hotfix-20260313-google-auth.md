# Hotfix 追踪：生产环境 Google OAuth 授权失败

## 1. 故障描述 (Context & Bug Report)
- **触发条件**: 用户在正式环境 (`minimoi.net`) 尝试点击 Google 登录。
- **表面现象**: 发生报错，授权中断。
- **排查方向**: 
  - 1. **Google 侧 400 错误 (redirect_uri_mismatch)**: 可能是填写的重定向 URL 在 Google Cloud 还没完全扩散生效，或者带不带 `www` 的问题。
  - 2. **NextAuth 侧 500/403 错误**: Auth.js V5 在 Vercel 环境下有时会由于缺乏 `AUTH_TRUST_HOST=true` 或显式 `AUTH_URL` 而拒绝认证回调。
  - 3. **网络连通性**: 数据库密码未正确挂载导致写入用户表失败。

## 2. 修正规范 (Hotfix Procedure)
- **第一阶段诊断 (已处理)**: Auth.js 生产环境校验拦截 (通过 `AUTH_TRUST_HOST` 与 `AUTH_URL` 已放行回调)。
- **第二阶段诊断 (已处理)**: 司令提供的 Vercel Log 截图显示，请求成功进入了 `/api/auth/callback/google` (Status 302)，但在随后的处理中崩溃导致跳转到 `/api/auth/error` (Status 500)。这极大可能是因为 NextAuth 试图将 Google 获取到的信息**写入云端数据库时失败**（目前环境变量中的 `DATABASE_URL` 仍指向 `localhost:5432`，导致生产环境无法连接数据库）。补丁已生效 (通过连接 Neon Postgres)。
- **第三阶段诊断 (当前排查)**: 最新的 Vercel 日志报出了 `500 Server Error` (无具体 invalid_grant 详情)。这意味着虽然云端库已连通，但**云数据库 Neon 内部是空的一片荒芜，既没有 User 表也没有 Account 表**。NextAuth 在写入数据时遇到了 `Table does not exist` 从而引发崩溃。
- **补丁方案 (Solution)**: 需要让司令在 Vercel 复制出新的云端数据库地址，并在本地执行一次强力的 `npx prisma db push` 操作，将我们在代码里写的表结构“开天辟地”般刻印到云端服务器中。

---
## 状态区
- [x] Bug 报告已立项 (Reported)
- [x] 等待错误日志/截图收集 (Awaiting Logs)
- [/] 补丁方案执行 (Patch Applied - Provisioning Vercel DB)
- [ ] 验证通过 (Verified)

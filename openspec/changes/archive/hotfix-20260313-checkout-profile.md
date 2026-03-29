---
author: "Antigravity"
date: "2026-03-13"
status: "Completed"
type: "Hotfix"
---

# `[Hotfix标题: 修复 Checkout 413 Payload 过大及预埋 Profile 查询逻辑]`

## 1. 痛点描述 (Issue Description)
- **痛点 A (Checkout Vercel 413 报错)**：线上环境点击 Checkout 抛出 `Unexpected token 'R', "Request En"...` 错误。经查实为 Vercel Serverless Function 独有的 4.5MB Payload 限制，导致包含完整带 Base64 图片信息的 JSON 直接被 Vercel Edge 拦截，引发 413 "Request Entity Too Large"。
- **痛点 B (Profile 页面空呈现)**：`/profile` 页面虽然正确连接了 Prisma 数据库且写好了用户历史数据的查询语句，但由于新用户尚未真实走通任何包含支付并推送 WebHook 的闭环订单，且 AI 生图服务尚未建立，呈现出令人困惑的空看板（正常预期）。

## 2. 修正规范 (Hotfix Procedure)
- **痛点 A 修正案 (已处理)**:
  - 为了彻底规避 Vercel 中转 API 的体积限制，抛弃了原本将图像塞进 JSON 请求体一并发送到 `/api/upload` 的逻辑。
  - 直接在前端 `CartSidebar.tsx` 中引入 `@vercel/blob/client` 的 `upload` 接口，借助新增的 `/api/upload-token` 执行安全鉴权，完成了"客户端直传大图"并返回有效轻量化链接的闭环。
  - 随后仅将图片链接作为 Custom Attributes 嵌入，再发起去往 `/api/checkout` 的 JSON 组装。

- **痛点 B 修正案 (已核验)**:
  - 代码审查已经通过（`generatedAssets` 与 `physicalOrders` 的 Prisma Prisma 查询链条完备）。
  - 该现象确认为"数据无残留"，无需代码层面变动，待司令成功完成首次包含图文的 Checkout 且闭环测试后，该看板自然充盈。

---
## 状态区
- [x] 开发阶段:
  - [x] 重构 `CartSidebar.tsx` 加入 Client Upload 替代 Server API 转发。
  - [x] 建立 `/api/upload-token` 安全令牌颁发路由。
- [x] 部署阶段:
  - [x] 将重构后文件推送并等待 Vercel 构建完成。
- [x] 测试与验证:
  - [x] 司令需在线上重新点击 Checkout 走完全部结算流程，并证实不再抛出解析错误。(司令已验证 OK)

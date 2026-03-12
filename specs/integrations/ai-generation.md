# 2D转化核心生图后端系统对接规范 (AI Image Generation Engine)

此项流程主导权归属于将用户原生 2D 画像重塑转化为具有多视角等角投射、带有强烈微缩高光景深与类黏土材质观感的 3D 高维风格化手办渲染全工作流。这也是 SaaS 工具转化成壁垒资产最核心的心脏起搏器。

## 1. 实验性跑通测试阶段基准 (Test-Run & Mocking Env)
当因商业层考量、供应商选型还未尘埃落定或提供实际具有余额 Token 供调用测试前：
- 必须要提供一个用代码伪造写死并带有真实显式延迟量（明确设置一个 `setTimeout(..., 3000)`）的替身 Mock Server 挂接作为测试代理者。
- **阶段一 API 契约协议 (Mocking API Contract)**：
  - **端点路由**: `POST /api/generate`
  - **接收载荷**: `{ image: string (Base64 or Blob URL representing the original 2D photo) }`
  - **返回结果**: 经过 3 秒系统锁死倒数后，固定返回：
    ```json
    {
      "status": "success",
      "resultUrl": "/images/mock-3d-result.webp"
    }
    ```
  - **前端职责**: Frontend `/customize` UI 需要将原本极简的直接状态切换，改为真实的 HTTP 请求，并使用服务端传回的 `resultUrl` 作为下一环节（加入购物车与 Profile 订单展示）的核心渲染素材。这保障了用户心智体验的“黑盒”完全跑通。

## 2. 正式接入与商用层流转规范 (Production Standardized API)
- 备选核心提供商网络层：倾向直接握手利用 Replicate 图像引擎挂载的衍生微调开源库 / 或者直签企业级 Stability API 原生接口服务。
- 业务标准流程串联步骤说明 (The Relay Pipeline)：
  1. Frontend (客户端) 利用用户的文件拾取器和裁切器生成规范的尺寸与比例格式（诸如 Base64 文本或是 Multipart Form 数据流），将其静默 POST 上传提交至我们可控内部隔离在安全沙盒环境的 Next.js 服务端 API 实例中。
  2. 此 Next.js 安全后端实例负责提取位于保密 `.env` 被遮蔽不可示人的 `[供应商对应_API_TOKEN]` 凭证锁。携带原始资料利用长时长轮询或者等待具有异步响应任务编号指调回调的 Webhook 任务分发 (必须建立该排队重试策略，因该高负载生图节点往往需要长逾 15s 到长达恐怖级 60s 间运算才能成功落片)，然后静候回响。
  3. API 得以提取并验证具有多套灯光组合（正面强主光区，后侧冷轮廓光区）、呈现为绝美等角镜头下的最终 3D 高光泽/等距多角度透视渲染多张资产数组结果合集后，重做包装和切变。
  4. 回传回给 Frontend 的生图展示面板和暂存到全局预下单的 `Zustand` 购物车草稿项之中。

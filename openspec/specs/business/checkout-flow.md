# 交易与结账数据流状态规约 (Checkout Component & Logic)

由于本项目在后期订单处理和物理支付链路（信用卡网关、分期支付、风险评估）上深度依赖于 Shopify 的赋能，在前端环境构建中，我们将结账区分为"全完备本地态"与"远端接力流"两个严格阶段。

## 1. 购物车本地纯净态 (Local Zustand State)
在用户点击那枚全局最后的 "Proceed to Checkout" 按钮发生路由跳跃前的所有购物车读写动作，均发生在完全无需网络的本地（Headless Store化），实现绝对响应的零延迟体验。

- **领域模型字典 State Schema (`Store`)**:
  `items`: 以数组形式容纳当前用户试图加入定制的 3D 手办列表实体。
  一个合规的传入型项应当精确包含：
  - `id`: 本地防冲突唯一句柄 UUID
  - `originalImageUrl` / `generated3dUrl`: 用于订单留存追溯的模型视觉材料
  - `size`: (枚举类型: `6cm` | `8cm` | `10cm` | `15cm`)
  - `quantity`: 请求堆叠的数量
  - `customInstructions`: (可选) 用户填写的附加留言文本，如“请在底座印上我的名字”
  - `totalPrice`: 一个基于规格尺寸和基础版型进行联动推导的衍生级动态结算计算器。

- **长时缓存持久化**: 所有状态均必须绑定中间件代理挂载于浏览器的 `window.localStorage`（或者 IndexedDB）中。防止用户因生图期间刷新页面造成的定制资产凭空蒸发和购物车清盘。

## 2. Shopify Mutation (服务端组装与结账跳跃流)
这是一个绝对的单向门事件。当收集到用户坚决去结账的请求后的时序编排如下：

1. **发起拦截代理层**: 将由 Zustand 组装得出的全量 JSON Payload 向站内的 Next.js Serverless API Route (诸如 `/api/checkout`) 发送带有 CSRF 和 Session 保护的 POST 提审。
2. **凭据装填打洞**: 该服务端无界面 API，将提取位于安全环境变量里的高权限机密 Admin/Storefront Access Token。
3. **推远端建单 (GraphQL Mutation)**: 通过官方 GraphQL endpoint 发起调用 (`checkoutCreate` 或 `cartCreate`)。
   - **[MODIFIED] Payload 装载规范**: 
     必须传入预先在 Shopify 后台建立的“通用标品 (Base Custom Product)”的 `variantId`。
     针对定制化数据（如上传的图像 URL、尺寸诉求、用户留言留言），必须被序列化并作为 `customAttributes` 注入到 GraphQL 的对应字段中。
     *示例（概念性）*:
     ```graphql
     mutation cartCreate($input: CartInput!) {
       cartCreate(input: $input) {
         cart {
           checkoutUrl
         }
       }
     }
     # input.lines 将包含 variantId 以及属性 customAttributes: [{key: "3dImage", value: "https://..."}, {key: "size", value: "8cm"}]
     ```
4. **获取回执抛转**: 后端把安全生成的 `checkoutUrl` 透传答复给前端，前端截获后直接通过强路由劫持 `window.location.href = checkoutUrl` 把浏览器的主营上下文主导权推转，完全交还给 Shopify 托管收银台。此界面原生支持预配置的 PayPal 等支付方式。

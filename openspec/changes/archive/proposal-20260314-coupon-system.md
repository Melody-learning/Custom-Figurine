# 提案：全局优惠券系统设计 (Global Coupon System)

## 1. 产品定位与目标
目前我们完成了“营销引流弹窗”的外壳和登录打通，但**真正的实惠（Discount）尚未物理结算**。
与其仅仅做一个“发邮件的弹窗”，我们需要将**优惠券提取为一个独立的全局基础模块**。未来无论是“新人注册”、“节日大促”还是“KOL 专属分享”，都能复用这套体系。

核心目标：**领券即用，无感结算**。避免用户手动复制粘贴长串验证码的糟糕体验。

---

## 2. 核心业务流程与交互 (Business Flow)

### A. 全局发券与本地留存 (Coupon Claiming & Persistence)
1. **领取点**：用户在营销弹窗点击“Claim Offer”并在邮箱点击登录链接后，正式宣告获得 "新人礼包"。
2. **状态留存**：
   - 因为我们是 Headless 架构，不宜在自有数据库中重复造轮子去验证每张券。
   - 解决方案：在前端 `localStorage` 或全局状态管理 (Context/Zustand) 中存入一个 `active_discount_code = 'WELCOME10'`。
3. **全局视觉感知 (UI Visibility)**:
   - 一旦用户持有该全局变量，网站顶部出现横幅 (Banner) 或在购物车抽屉 (Cart Drawer) 顶部提示：“*🎁 您的 10% 新人特权已生效，将在结账时自动抵扣。*”

### B. 购物车静默注入 (Silent Cart Auto-Apply)
1. 传统的电商强迫用户在极度专注的结账结算页 (Checkout Page) 去手填并验证折扣码，极易造成订单流失。
2. 我们要做到 **“前端先斩后奏”**：
   - 每当用户向购物车 (Cart) 增加模型商品，或者打开购物车面板时，如果本地存在 `active_discount_code`。
   - 前端代码主动向 Shopify Storefront API 派发带有该码的更新请求。
   - 购物车返回金额时，直接显示被划掉的原始价格，以及**红色的折扣后价格**。

### C. Shopify 底层核销校验 (Backend Validation)
- 真正决定折扣码生杀大权的在 Shopify 后台。
- 若该用户用其邮箱在历史上已经消费过一次 `WELCOME10`（在 Admin 后台配置了限制每个客户使用 1 次）。
- Shopify API 会拒绝应用该码，此时前端不仅不减钱，同时应清除掉本地持有的 `active_discount_code` 缓存，提示用户“您的优惠已使用或过期”。

---

## 3. 技术架构方案 (Technical Architecture)

主要涉及对现有 Shopify 服务层和前端购物系统的侵入性修改：

#### 1. API 层: 扩展 Storefront Cart Mutations
在 `src/lib/shopify/mutations/cart.ts` (如果有) 或我们的 GraphQL 客户端中，补充和使用 Shopify 的折扣码钩子：
- `cartDiscountCodesUpdate`: 用来给现有的 Cart ID 追加一个 string 数组形式的 discount codes。

#### 2. 客户端机制: 全局打折拦截器 (Discount Interceptor)
- 在 `CartContext` 或者全局的 `AppLayout` 中编写拦截器。
- 逻辑：监听购物车状态，如果 `cart` 不为空，且本地存在待激活的券，且当前购物车 `cart.discountCodes` 没有该券，则发起 `cartDiscountCodesUpdate`。

#### 3. Checkout (结账系统) 的平滑过滤
- 由于折扣信息已经被牢牢绑定在了我们的 Headless Cart Object 上。
- 用户点击 "Checkout" 获取 WebUrl 跳转至 Shopify 托管的支付页面时，页面上会自动带着该折扣额度，做到**前后端金额强一致性**。

---

## 4. 实施阶段 (Implementation Phases)

- **Phase 1: API 联调与 Shopify 设置**：去 Shopify 后台建立测试券，连通 GraphQL 的折扣改写 Mutation。
- **Phase 2: 全局状态收拢**：在前端封装对本地打折码读取和写入的 Hooks。
- **Phase 3: UI 洗礼**：购物车组件 (Cart Drawer) 增加划线价、折扣行 (Subtotal -> Discount -> Total) 以及醒目的绿底提示条。
- **Phase 4: 逻辑组装**：把之前没有做完的 Marketing Modal 的 "Claim" 按钮或者登录回调作为发券的 Trigger (触发源)。

---

## 5. 请您审核 (OpenSpec Review)
1. **核销权设计**：我们将核销和校验压力完全丢回给 Shopify (依赖其强大的风控和单个账户限购规则)，前端只负责“静默派发并发起尝试带券算价”，这是否符合您的期望？
2. 如果同意，我将补充这一子系统的组件和接口规范 (Specs) 并按照四阶段法落入 `task.md` 主表。

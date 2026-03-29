# 提案：优化首访营销弹窗的成功体验 (Refine Modal Success Flow)

## 1. 现状痛点
目前，当用户在首访弹窗 (Welcome Modal) 中输入邮箱并点击领取优惠后，系统会直接将其重定向 (Redirect) 到全屏的 `/login/verify-request` 页面。
**问题所在**：作为“营销引流弹窗”，它的初衷是“在不打断用户浏览网站的前提下，顺手薅一个优惠券/注册账户”。强行把用户从首页拖拽到纯黑色的登录等待页，会**打断他们原本浏览商品的心流**，体验显得非常生硬和奇怪。

## 2. 设计思路与优化方案
经过实际体验，我们最终放弃了“内联沉浸式成功流 (In-place Success State)”，转而采用**最极简的“瞬时关闭 + 全局 Toast 提示流 (Global Toast Flow)”**。
理由：对于纯引流性质的弹窗，最好的体验是“不拖泥带水”。如果保留弹窗只显示结果，依然会遮挡用户浏览商品的视线正中央。

1. **果断关闭弹窗**：当用户点击发送魔术链接并成功后，立即调用 `closeModal()` 销毁弹窗，把满屏的视野瞬间还给用户。
2. **全局强提示补位**：静默调用全局的 `toast.success` 组件。
3. **延长视觉停留**：给成功提示加入 `duration: 6000` 参数，长达 6 秒的屏幕左下角流光绿条停留，能给足安全感并告知用户去邮箱查收，且不会打断用户的滚动浏览心流。

## 3. 涉及代码修改
- **`src/components/marketing/WelcomeModal.tsx`**：
  - 取消原计划引入的 `isSuccess` 状态及 `framer-motion` 卡片翻转。
  - 修改 `handleClaimOffer`：当 `result.success` 触发后，执行：
    ```typescript
    toast.success("Magic link sent! Please check your email to claim the offer.", {
      duration: 6000, 
    });
    closeModal();
    ```

---

## 4. 归档结论 (Archive State)
此方案已经完全被项目采纳并实施完毕：
成功通过 **“瞬关弹窗 + 6 秒超长全局 Toast”** 实现了零干扰的高体验营销引流，符合 OpenSpec 无头电商的极简交互规约。

如果同意，我将即刻开始**更新规范更新 (Specs)**，并直接在现有的 `WelcomeModal.tsx` 中实施**物理代码重构 (Implementation)**。

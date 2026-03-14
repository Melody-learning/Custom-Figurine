# 提案：登入呈现解耦与独立级优惠券强提醒 (Decoupled Auth UX & Coupon Reminder)

## 1. 背景与意图 (Context & Intent)
根据最新线上实测体验，我们发现“豪华版首登带彩带的 Welcome Toast”虽然在视觉上有冲击力，但容易显得拖沓且线上环境渲染存在偶然性 Bug。同时，把“欢迎回来”和“你有一张优惠券”揉在同一个弹出通知里，削弱了促销本身的感知。
因此，您提出：
- **彻底取消豪华版彩带欢迎提示**，所有登录统统采用最极简的常规版 (Welcome back!) Toast。
- **将“打折提醒”彻底剥离**，每次登录后，都在顶部提供一个独立、醒目的优惠券小提醒。

**核心目标**: 
1. 绝对的极简主义，摒除花哨的动效。
2. 剥离提示意图：一个是纯粹的系统通知（登陆成功），一个是纯粹的营销通知（你的资产已就位）。

## 2. 受影响的规范文件 (Impacted Specs)
- [x] `specs/frontend/components.md` (修改了全局 Toast 的触发规范与并发生命周期)

## 3. 详细改动规格 (Proposed Deltas)

### 针对 `SessionToastProvider.tsx` 的彻底精简与重构：
- `[REMOVED]` 彻底移除 `canvas-confetti` 的动态引入与相关物理配置代码。
- `[REMOVED]` 彻底移除 `localStorage.getItem("has_ever_celebrated_login")` 相关的首登特判分支逻辑。
- `[MODIFIED]` 整合登录逻辑：
  一旦用户完成验证进入并拿到了 `session`（且本 Session 尚未弹过）：
  1. **系统回馈通知**：直接在右上角（`top-right`）弹出一个常规版的 `toast.success("Welcome back!", { duration: 3000 })`。
  2. **营销唤醒通知**：如果检测到 `session.user.hasWelcomeCoupon` 为 `true`，则**额外独立在顶部居中位置 (`top-center`) **弹出一个极其醒目的专属 Coupon 提醒：
     - **文案**：`🎁 10% OFF Welcome Discount Active`
     - **样式**：采用高对比度与高级毛玻璃，并允许其停留较长时间（如 6~8 秒）或增加明确的行动号召 (Call to Action)，使其非常显著地提示买家这笔资产的存在。

## 4. 实施 Checklist (Implementation Plan)
- [x] 1. 创建并提交本提案至变更区。
- [x] 2. 在物理层删减 `SessionToastProvider.tsx` 中的无用冗余逻辑，实行两路独立 Toast 并发。
- [x] 3. 验证两个 Toast 分离触发的丝滑性（一个在右上，一个在中上）。
- [x] 4. 人工测试确认，最终关闭本 Proposal。

---
## 状态区
- [ ] 提出中 (Draft)
- [x] 用户已审查并同意 Specs 修改 (Specs Approved)
- [x] 代码实施完成待验收 (Implemented)
- [x] **完成闭环 (Done)**

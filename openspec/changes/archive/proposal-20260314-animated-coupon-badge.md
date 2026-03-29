# 提案：静默态与唤醒态的优惠券微交互 (Silent vs Awake Coupon UI)

## 1. 背景与意图 (Context & Intent)
刚上线的双 Toast 狂轰滥炸虽然达到了“强感知”的目的，但过于突兀，违背了我们追求的极简高级感。您提出了一种更优雅、克制的解法：
- **取消独立突脸的优惠券 Toast**：将其并入常驻的 Header 挂件中。
- **状态分离 (Awake vs Silent)**：
  - **唤醒态 (Awake)**：用户刚登录成功的那一刻，顶部导航栏原本隐藏的 `10% OFF` 按钮不仅会出现，还会伴随一个**短暂且抓人眼球的“登场动画”或“高频闪烁/律动”**，持续几秒钟，完成“提醒资产到账”的历史使命。
  - **静默态 (Silent)**：登场使命完成后，它安静地收敛为极其微弱的光带扫过（目前的现状），不再喧宾夺主，成为一枚精致的系统挂件。

**核心目标**: 既保留资产到账的明确暗示，又绝不通过阻断式的弹窗打扰用户心流。

## 2. 受影响的规范文件 (Impacted Specs)
- [x] `specs/frontend/components.md` (定义了 Header Badge 的状态机与入场动效标准)

## 3. 详细改动规格 (Proposed Deltas)

### 3.1 撤回冗杂 Toast (`SessionToastProvider.tsx`)
- `[REMOVED]` 彻底删去 `top-center` 那个黑底白字的 `10% OFF` 弹窗。
- `[KEEP]` 仅仅保留最存粹的右上角绿标 `Welcome back!`。

### 3.2 引入智能组件 `AnimatedCouponBadge.tsx`
- 原本在 `HeaderClient.tsx` 中直接硬编码的 `<Link className="...10% OFF..."></Link>` 过于静态，无法承载“入场狂暴 + 随后静默”的状态机逻辑。
- `[NEW]` 创建一个客户端子组件 `src/components/layout/AnimatedCouponBadge.tsx`。
  - **组件内部状态**: `const [isAwake, setIsAwake] = useState(false)`
  - **监听机制**: 利用 `sessionStorage.getItem('has_seen_badge_awake')`。如果是本次浏览器会话首次渲染该 Badge，将激发 **Awake 状态**（例如加上 `animate-pulse` 等激烈的高亮动画，或者边框流光加速），并设置一个 Timeout（比如 4 秒）后退回 **Silent 状态**。
  - **降级机制**: 若 `sessionStorage` 证明用户此前已经看过了 Awake 进场，则直接以默认的极简扫光态渲染。

## 4. 实施 Checklist (Implementation Plan)
- [ ] 1. 提交本提议，确认“唤醒 -> 静默”降维打击思路是否准确。
- [ ] 2. 移除 `SessionToastProvider` 的多余弹窗代码。
- [ ] 3. 抽离重组 `AnimatedCouponBadge` 组件并植入 Header。
- [ ] 4. 人工测试确认入场特效。

---
## 状态区
- [ ] 提出中 (Draft)
- [ ] 用户已审查并同意 Specs 修改 (Specs Approved)
- [ ] 代码实施完成待验收 (Implemented)
- [ ] **完成闭环 (Done)**

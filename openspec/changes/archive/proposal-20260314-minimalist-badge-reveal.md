# 提案：纯享版顶栏优惠券加载动效 (Minimalist Badge Reveal)

## 1. 背景与意图 (Context & Intent)
刚上线的 Framer Motion “弹簧跳出+狂暴闪烁”显得操之过急且过于耀眼。您提到了一套最本质的心智解法：
> “隐藏期有点短 2s 试试，然后不要什么惊艳入场，就是一个刻意动态加载效果吸引目光，然后展示出来优惠券就可以了，这些状态之间切换要自然一点。”

**核心目标**: 
抛弃 `isAwake` 狂暴闪光态。将这个长条按钮做成一个**纯粹的实体化 Loading 组件**。网页加载时完全没有，2 秒后像是一个真实的网络请求返回了结果，温柔、自然、平滑地推开旁边的元素，漏出原本那颗安静的 10% OFF 按钮。

## 2. 受影响的规范文件 (Impacted Specs)
- [x] `specs/frontend/components.md` (修正 Badge 的揭露时差机制和动画定调)

## 3. 详细改动规格 (Proposed Deltas)

### 3.1 极简化的 `AnimatedCouponBadge.tsx` 
我们将彻底抹除中间态的 `✨ 10% OFF ACTIVE ✨` 闪烁逻辑，回归本质的 `hidden` -> `visible` 两个状态。
- **阶段 0（绝对隐藏）**: `width: 0, opacity: 0`。网页默认渲染完什么都不占用。
- **阶段 1（蓄水期 2000ms）**: 组件内 `useEffect` 静静等待 2 秒（或者是 `1500ms`）。这给了网页渲染首屏主视觉的充足时间，不抢 C 位。
- **阶段 2（柔和伸展期）**: 经过 2 秒后，自动设为 `visible`。
  - `<motion.div>` 层使用非常平缓、没有任何弹跳侵略性的物理引擎 (如 `type: "tween", ease: "easeInOut", duration: 0.8`) 从宽 `0` 延伸至 `auto`。
  - 伸展的同时，文字和胶囊底版的 `opacity` 柔和地从 `0` 渐变至 `1`。
- **阶段 3（常态静默期）**: 伸展完毕后，它就成了默认的那个缓慢划过白光的静态胶囊。没有 5 秒降级，没有任何发光惩罚，浑然天成。

## 4. 实施 Checklist (Implementation Plan)
- [x] 1. 提交本提案，确立这套完全去除了暴躁光效的极简 loading 延展动效模型。
- [x] 2. 大面积删减 `AnimatedCouponBadge.tsx` 里的三段式复杂逻辑，回归极简的双态 (Hidden / Visible)。
- [x] 3. 调参测试 `width` 的舒展手感和 `2000ms` 延迟的节奏配合。
- [x] 4. 人工测试确认切换天然度。

---
## 状态区
- [ ] 提出中 (Draft)
- [x] 用户已审查并同意 Specs 修改 (Specs Approved)
- [x] 代码实施完成待验收 (Implemented)
- [x] **完成闭环 (Done)**

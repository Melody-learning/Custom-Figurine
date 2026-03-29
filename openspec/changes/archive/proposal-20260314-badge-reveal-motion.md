# 提案：基于 Framer Motion 的顶栏级“无中生有”展开动效 (Entrance Expand Animation)

## 1. 背景与意图 (Context & Intent)
您指出刚刚做的“一进页面直接爆闪”依然有些生硬。您真正期望的是一种更具“加载感”和“惊喜感”的登场方式：默认进入页面时，导航栏顶部是**没有**优惠券入口的，经过一个短暂的系统延迟（仿佛在服务器查询完毕后），这个胶囊按钮像抽屉一样**从无到有地横向滑出（伸展）**，展示优惠信息后，再退化回静默。

**核心目标**: 
抛弃单纯依赖 CSS 的 `scale` 和发光，引入真正的物理展开动效库 (`framer-motion`)，模拟“查询完毕 -> 喜得资产 -> 入库收纳”的实体隐喻。

## 2. 受影响的规范文件 (Impacted Specs)
- [x] `specs/frontend/components.md` (引入 Framer Motion 用于全局状态挂件的展开声明)

## 3. 详细改动规格 (Proposed Deltas)

### 3.1 改造 `AnimatedCouponBadge.tsx`
- **引擎替换**：将极简的 `<Link>` 组件替换为 `<motion.div>` 包装的容器。
- **状态流转 (Motion States)**:
  1. `initial`: `width: 0, opacity: 0, marginLeft: 0` (完全隐藏，不占空间)
  2. `animate (Awake)`: `width: "auto", opacity: 1, marginLeft: 8`，带有弹性回弹 (`spring`) 的动画展开。在这一阶段，文字可能会显示为激昂的 `✨ 10% OFF ACTIVE ✨`，并带有高亮的边框流光。
  3. `animate (Silent)`: 几秒钟后，文字由于变短回到了单纯的 `10% OFF`，边框变暗，宽度自然随着内部文字的收缩而平滑收拢，进入静默态。
- **降级逻辑 (Already seen)**: 如果用户刷新网页或者重新点进来，检测到 `has_seen_badge_awake`，则跳过 `width: 0` 的折叠态，直接展示 `Silent` 形态，避免每次切换页面都抽搐一次。

## 4. 实施 Checklist (Implementation Plan)
- [x] 1. 提交本提案，核对“从无到有、横向拨开”的动作模型。
- [x] 2. 引入 `framer-motion` 并重写 `AnimatedCouponBadge` 组件的渲染核心。
- [x] 3. 微调折叠展开时机（例如设定一个 `1000ms` 的挂载延迟后展开，模拟入账加载）。
- [x] 4. 人工测试确认折叠、发光、衰退三大阶段的平滑度。

---
## 状态区
- [ ] 提出中 (Draft)
- [x] 用户已审查并同意 Specs 修改 (Specs Approved)
- [x] 代码实施完成待验收 (Implemented)
- [x] **完成闭环 (Done)**

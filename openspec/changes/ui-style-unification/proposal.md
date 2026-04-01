# UI Style Unification — Customize 页精致化

## Why

当前 Customize 页（核心转化路径）存在三套设计语言同时撕裂：
1. **技术冷感标题**（"Initialize Core" / "Virtualize Model"）与下方温暖的圆润卡片 UI 矛盾
2. **三个强调色并存**（#3b82f6 / #00D084 / #00f0ff），各自为政，没有语义分工
3. **彩色渐变气泡背景**（淡紫/淡蓝/淡黄）是多主题时代遗留物，在单一 Default 主题下是「孤儿元素」

这些问题在 Phase 1 风格卡片加入后更为明显，因为卡片的彩色 accentColor 让本已混乱的色彩环境更难控制。
目标：最小改动，实现内部一致的「精致感」，不影响转化漏斗结构。

## What Changes

- **文案语气（字符串修改，零风险）**：4 个步骤标题从技术词改为亲切直白描述
- **强调色语义化**：建立 primary（黑）/ success（emerald）/ info（blue）三色语义，移除 #00f0ff
- **移除背景光晕气泡**：3 个浮动的渐变 blur 圆从 Customize 页根节点移除
- **步骤指示条**：统一颜色，只用 primary（黑）和 success（emerald），不引入第三色

## What Does NOT Change

- Customize 页的布局、组件结构
- 首页 Hero 的任何视觉（保留电影感差异化）
- 风格选取 UI（Phase 1 已完成，不动）
- Header 组件（可接受的中性态）

## Requirement Changes

- `frontend/components`: Customize 页的强调色与文案语气规范

# 新增变更提议模板 (Proposal Template)

> 使用说明：AI Agent 或开发者在提出任何架构级、功能级或复杂的 UI 改动前，都必须先复制此文件并重命名为 `proposal-[yyyyMMdd]-[feature-name].md` 进行填写。

---

# 提议名称：[填写简短有力的特性名称]

## 1. 背景与意图 (Context & Intent)
*(清晰说明为什么要进行这个改动。是为了解决什么 Bug，还是用户提出了什么新想法？)*
- **痛点/需求**: ...
- **核心目标**: ...

## 2. 受影响的规范文件 (Impacted Specs)
*(列出这个改动会迫使我们更新哪些处于 `specs/` 目录下的事实来源文件。这有助于在写代码前梳理逻辑副作用。)*
- [ ] `specs/frontend/routing.md` (例如：需要增加基于动态参数的书籍详情页)
- [ ] `specs/business/xxx.md` (例如：影响了下单的价格计算公式)

## 3. 详细改动规格 (Proposed Deltas)
*(在这里简要草拟准备放入对应 Spec 文件的变更段落。)*

### 针对 [文件 A] 的修改：
- `[ADDED]` ...
- `[MODIFIED]` ...

### 针对 [文件 B] 的修改：
- `[REMOVED]` ...

## 4. 实施 Checklist (Implementation Plan)
*(指导后续写代码的验收清单)*
- [ ] 1. 更新 Specs 文件并取得人工 Review 同意。
- [ ] 2. 编写 `src/...` 的 UI 代码。
- [ ] 3. 挂接相应的 API/Hook。
- [ ] 4. 人工测试确认，最终关闭本 Proposal。

---
## 状态区
- [ ] 提出中 (Draft)
- [ ] 用户已审查并同意 Specs 修改 (Specs Approved)
- [ ] 代码实施完成待验收 (Implemented)
- [ ] **完成闭环 (Done)**

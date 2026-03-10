# 智能体协作白皮书 (AGENTS Workflow)

本指南针对任何介入此项目的 AI 编程助手（无论是 Cursor, GitHub Copilot, 还是自定义 Agent）。
**在接触任何实际代码之前，你必须阅读并理解本项目奉行的 OpenSpec (Spec-Driven Development) 规范。**

## 1. 我们的宪法 (The Constitution)

> 💡 **“结构先于代码，文档是唯一的事实来源 (Source of Truth)。”**

任何不在 `specs/` 目录中被记录的功能逻辑，都被视为违章建筑。你不可以直接在项目里“信马由缰”地编写新特性。

## 2. AI 的标准变更工作流

当你收到用户的需求（例如：“我要加一个夜间模式开关”）：

### 第一步：创建提议 (Proposal)
1. 查阅需求对应的现有系统情况。
2. 复制 `changes/template-proposal.md`，并在同目录下创建一个带有日期的实际提议文件，例如 `changes/proposal-20260310-dark-mode.md`。
3. 清晰撰写 **变更意图、目标、以及预期会影响到的 `specs/*.md` 文件**。
4. **中断响应**，要求用户 Review。

### 第二步：修正事实规范 (Update Specs)
1. 获得提议批准后，打开会受到影响的 `specs/` 目录下的具体文件（例如 `specs/frontend/themes.md`）。
2. 在对应位置使用标记词如 `[ADDED]` / `[MODIFIED]` 描述具体的规格改变（不要写代码，写规则和逻辑）。
3. 确保规格文档中的引用正确，上下文不再冲突。
4. **再次中断响应**，要求用户确认规范落地无误。

### 第三步：落地为物理代码 (Implementation)
1. 只有在第二步通过后，你才被授权修改 `src/` 目录下的源码。
2. 代码必须做到与刚才你编写的 Spec **完全一致**。
3. 修改完成后，通知用户构建验证。

### 第四步：归档 (Archive)
1. 确认需求无误且稳定后，将 `changes/proposal-xxx.md` 的状态标记为 `# 状态: [已完成]` 或将文件移动到 `changes/archive/`。

## 3. 防“幻觉”机制
如果在 `specs/` 中未指定明确的第三方库，AI 默认不得擅自引入依赖（如 `npm install xxx`）。必须在向用户提出的 Proposal 里列明需要引入的包名及用途，并在相应的系统库依赖说明 Spec 中存档后，才可安装。

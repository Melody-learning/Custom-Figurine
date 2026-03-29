# 提议：修复 Profile 缺省信息显示与输入框视觉优化

**日期**: 2026-03-13
**状态**: [草稿]
**目标**: 修复由于魔术链接（纯邮箱登录）缺乏名称与头像导致的 Profile 页面显示异常，并优化登录页 Email 输入框在深色主题下的视觉与交互体验。

## 1. 变更意图与背景
基于您的反馈：
1. **Profile 显示问题**: 魔术链接登录仅提供邮箱地址，没有像 Google 授权那样提供名字 (Name) 和头像 (Image)。目前 Profile 页面未妥善处理这种缺省状态，导致显示写死的 "Creator" 和异常的 "Avatar" 占位符。我们需要优雅地提取邮箱前缀作为昵称，并生成首字母作为头像占位符。
2. **输入框视觉问题**: 当前 Login 页面的 Email 输入框在此深色 Glassmorphism 主题下，呈现突兀的浅蓝色/灰白色背景，且图标对比度不足。我们需要将其重构为深色拟态风格，配合 Focus 时的渐变边框或光晕效果。

## 2. 预计变更点

### 2.1 Profile 信息回退机制 (UI Fallback)
- **文件**: `src/app/profile/page.tsx` (或相关的 Header 组件)
- **变更**: 
  - 当 `session.user.name` 为空时，默认截取 `session.user.email` 中 `@` 符号前面的部分作为展示昵称。
  - 当 `session.user.image` 为空时，提取名字或者邮箱的首字母（例如 "Y" 或 "C"），将其渲染在一个带有渐变背景色的圆形占位符中，取代当前错乱的头像 UI。

### 2.2 优化 Email 输入框 (Input Styling)
- **文件**: `src/app/login/page.tsx`
- **变更**: 
  - 移除原有的生硬背景色 (例如自动填充带来的背景或写死的灰白色)。
  - 改为使用透明/极暗背景 (`bg-white/5` 或 `bg-transparent`)，并加上微妙的白框 (`border-white/10`)。
  - 增加 Focus 状态时的流光/高亮边框 (`focus:ring-2 focus:ring-[var(--brand-primary)]`)，确保图标颜色在输入态和空闲态的和谐。

## 3. 影响的 Specs 规范
- **`specs/frontend/components.md`**: 更新输入框（Input fields）在深色主题下的设计反馈规范；增加头像组件（Avatar）的 Fallback 空数据处理设计标准。

## 4. 后续落地步骤
1. 您审核并批准此 Proposal，同时我也将解答您关于“魔术链接是否是一个好的注册方式”的疑惑。
2. 我将更新规范文件并启动代码编写。
3. 修复 Profile 头像/昵称回退逻辑以及 Login 页面输入框样式。
4. 提供最终截图验证并归档。

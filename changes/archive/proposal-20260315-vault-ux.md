# 提案：个人中心画廊体验升级与闭环资产链路重塑 (Vault Lifecycle & Re-engagement UX)

## 1. 深度复盘与意图 (Context & Intent)

根据司令官深刻的产品复盘指出，之前的“修复报错+加个删除按钮”属于典型的“头痛医头”的孤立研发视角。
作为一个**高级定制电商（Custom Figurine）**的个人资产中心（Vault），它的核心业务价值绝不仅是一个“看图的网盘”，而是**促成二次复购、挽回流失订单的核心转化枢纽**。

目前 Vault 存在的**战略级功能缺失与死胡同（Dead-end UX）**：
1. **转化断层 (No Re-engagement Flow)**：用户在画廊里看到了自己昨天非常满意的绝赞生成案，但**没有任何操作按钮**可以让他把这个现成的成果一键拉回购物车并付款！Vault 成了一个只能看不能买的死胡同。
2. **溯源黑盒 (Missing Metadata)**：用户无法回忆起“这张惊艳的图是我昨天用了什么提示词（Prompt）和哪个基础模版生成的”。高阶玩家失去了沉淀 Prompt 经验的土壤。
3. **垃圾场效应 (Missing Deletion & Curating)**：如同此前指出的，缺乏清理（Delete）机制，金库逐渐变成塞满失败品和废弃测试的垃圾场。
4. **失败态视觉过载 (Aggressive Error UI)**：占用了 300px 的大红报错框不仅挤占空间，更严重破坏了该模块“高级艺术陈列”的视觉定位。

---

## 2. 解决方案：打造闭环转化金库 (Product & UX Redesign)

我们将从**业务闭环、溯源展示、生命周期管理、优雅兜底**四个维度，全面重构 `Your Generation Vault`。

### 核心引擎：一键唤醒并下定 (Re-engage to Checkout - The "Order Now" Loop)
这是最重要的业务逻辑重塑。
- **Action Button**：在每一张状态为 `COMPLETE` 的手办卡片底部（或 Hover 态），增加一个极具电商引导力的主按钮，如 **[ ✨ Order This Figurine ]** 或 **[ Load & Checkout ]**。
- **State Injection (热重载)**：当用户点击该按钮时：
  1. 系统提取该卡片绑定的 `assetId` 的全部生成物（三视图 URL、Prompt、原图）写入全局 Zustand `store`。
  2. 强行将 Zustand 的流水线步骤 `step` 设置为 `select`（即第3步：配置变体与选项）。
  3. 执行 `router.push("/customize")`。
- **闭环体验**：用户上一秒还在个人中心，下一秒就直接“穿越”到了定制台的最后一步，右侧变体栏直接弹开，可以直接添加购物车！彻底打通“存图 -> 唤回 -> 结账”的电商飞轮。

### 价值沉淀：精简属性与溯源 (Clean Metadata Visibility)
- **卡片信息层扩容**：卡片下方需展示更具业务价值的信息，但**严格保密底层生图 Prompt**。
  - **信息降噪**：展示 `模型版本` (如 "Gemini 2.5 Flash") 和 `生成日期`标签。
  - **状态徽章**：(可选) 展示一个精致的 "Ready to Produce" 或 "Vaulted" 小标签。

### 资产控制权交还：物理销毁链路 (Asset Deletion Lifecycle)
- **增加抹除接口**：创建专属的 Server Action `deleteGeneratedAsset`，在数据库层面支持对指定 `assetId` 的物理擦除。
- **优雅的悬浮交互**：在卡片右上角植入隐蔽但清晰的 Delete / Trash 按钮。
- **防误删保护 (Confirmation Modal)**：鉴于 3D 资产生成成本高昂，且不可逆，点击删除时弹出一个原生的、轻量的确认微模态框（"Discard this generation?"）。
- **无感剔除**：确认后通过 React 局部 `setState` 平滑移除该卡片，通过 `toast` 提供正向反馈，不刷新整个页面。

### 优雅兜底：极简的“灵感碎片” (Minimalist Error State)
- 对于发生网络截断缺失图片的 `FAILED` 或空数组记录，废除刺眼的大红报错框。
- 将其降格渲染为一个高度骤减（如 100~150px）的光滑深灰色卡片，中间配以断裂链接或沙漏的小图标。
- **文案降权**：将居高临下的 `Upload Interrupted` 降温为诸如 `"Incomplete Concept"`（未完成的构想），并**同样开放删除按钮**，让用户顺手清理掉这块“废片”。

### 专项四：解决唤回流的回退困境 (Re-engagement Navigation Fixes)
司令官提出的两个痛点极其犀利。当用户从 Vault 唤回资产到定制页（`/customize`）后点击返回，目前的表现是反直觉的：
1. **虚假的“防丢失”拦截**：定制页自带原生的弹窗拦截（"离开会丢失数据"），这是为了保护辛苦捏图却没保存的用户。**但 Vault 唤回的记录已经是永久存入数据库的资产**，此时弹窗完全是“过度恐吓”和心智错位。
2. **状态机污染导致卡在环节1**：由于用户如果强行点离开，系统会触发 `resetGenerationFlow()` 清空状态图；而框架检测到图没了，进而自动判定为降级到 Step 1 (上传页)，这阻断了 Next.js 退回 Profile 的历史栈，把用户死死卡在了上传页。

**应对红杉级用户体验的重构方案**：
- **引入上下文免疫 (Context Immunity)**：在 Zustand 增加 `editingVaultAssetId` 锁。当从金库进入定制页时，系统自动识别当前属于“已储存资产唤回模式（Vault Re-engagement Mode）”。
- **撤销隔离墙**：在此模式下，**全面解除所有浏览器弹窗拦截（BeforeUnload / PopState）**。用户想退就退，来去自如。
- **UI 返回键逻辑分离**：在定制台 Step 3（选择属性），底部的【返回修改】按钮，将智能判断：如果是新建画廊，则返回相册；如果是 Vault 唤回，该按钮会变成【返回金库 (Back to Vault)】，点击后平滑退回 `/profile`，不产生任何恐吓弹窗。
- **修复 DOM `src=""` 崩溃**：由于历史旧资产没有存 `originalImage` 原图，注入 Zustand 后产生了 `""` 空字符串。React DOM 原生禁止 `<img>` 加载空串（会导致浏览器无限死循环刷新）。此 Bug 将通过挂载占位图片或条件渲染一并解决。

---

## 3. 实施 Checklist与开发流

- [x] 1. 搭建闭环引擎：编写跨页面 Zustand Injection 逻辑，实现在 Vault 点击卡片直接跳回 `/customize` 并进入 `select` 阶段。
- [x] 2. 补全后端基建：编写 `src/app/actions/delete-asset.ts` 接入 Prisma 的 Delete 行为。
- [x] 3. 重构卡片组件 (`GenerationVaultList.tsx`)：
  - [x] 3.1 接入 Metadata (Prompt & Date) 实体排版。
  - [x] 3.2 植入 "Order Now" 主动线按钮与 "Delete" 维护动作按钮。
  - [x] 3.3 大幅压缩错误状态 (Upload Interrupted) 的 DOM 体积，设计成“废片区”。
- [x] 4. 验证端到端转化流 (Vault -> Checkout)。

---

## 4. Phase 2 补充迭代：结构化排版与去操作化设计 (Layout & Interaction Cleanup)
基于司令官对界面“不兼容感”的精准审查：
- **全屏自适应堆叠 (Full-width Stacked Flow)**
  - 彻底打破左右双栏结构，改为**单列垂直排布**。将高价值密度的【实体订单管理】置顶，【数字金库】横向铺满，下方实施全自适应网格。
- **“隐性可供性”点击域 (Implicit Affordance & Clean UI)**
  - 砍掉卡片下方的实体 Order 按钮，释放视觉版面。当悬停时提供【✨ View Design】暗黑遮罩。点击整卡直接唤回定制台——更符合图片瀑布流产品的直觉。

## 5. Phase 3 补充迭代：唤回目标页更正与负空间瘦身 (Gallery Landing & Layout Tightening)
1. **唤回终点修正为 Gallery (Step 2)**：
   将唤回着陆点（Landing Step）从满是表单选项的 `select`，前置为环境更聚焦的 `generate`（3D 展厅页面）。让用户重温生成时的那一抹惊艳，纯粹享受预览，再由他们主动点击 Finalize 进入表单。并增加 `FigurineGenerationGallery` 对残缺旧数据的兼容渲染（缺省首图）。
2. **个人中心大盘纵向负空间压缩**：
   采用 `min-h-[calc(100vh-...)]` 等流式自适应底板，并压缩全局的外边距（如 `gap-12` 和 `pb-12` 等），确保大屏幕下首屏不再多出尴尬的滚动条。

## 6. Phase 4 发难破局：全局免责宣誓与无缝回退 (Holistic Navigation & Safe Context)
1. **统一返回逻辑修复 (Routing Alignment)**:
   - 既然金库的唤回落点改为了 `generate` (Step 2)，那么原本打在 Step 3 上的“临时补丁”就会导致逻辑错乱。
   - **优化**：Step 3 (Select 表单) 的返回键将老老实实回到 Step 2 (Generate 展厅)。而真正的 `← Back to Vault` 退路，将挂载在 Step 2 展厅页面左下角的 `Cancel & Return` 事件中——当检测到金库唤回模式时，该按钮接管路由，护送用户返回 `/profile`。
2. **废除恐吓式隔离墙 (Removing Aggressive BeforeUnload & PopState Blocks)**:
   - 旧逻辑：因为没打通个人中心，刷新 = 死亡，所以采用 `beforeunload` 弹窗（页面会提示“未保存的数据将丢失”）。
   - 新困局：此时资产早已在云端落盘入库，无论刷新、后退还是关机，数据都不会丢。继续弹窗就是“狼来了”，严重破坏高级感。
   - **极致方案**：
     - **物理拆除** `customize/page.tsx` 中所有的 `beforeunload` 与 `popstate` 原生拦截事件。赋予用户随时刷新、随时后退的绝对自由权。
     - **化堵为疏 (UI 暗示法)**：在定制台最顶部的进程栏旁边（或核心按钮边），动态渲染一个精致的绿灯标识：`🟢 Secured in Vault`（只有当资产已落盘且产生结果图时显示）。以一种安静但极度笃定的方式告诉用户：“你的心血已经存入金库，随便发脾气关页面，我替你兜底”。

## 7. Phase 5 精细化整定补丁 (Refinement & Anti-Duplication)
司令官在此阶段指出了极具杀伤力的 4 个 UX 缺陷与逻辑 Bug。
1. **指示器视觉不协调 (Indicator UI Polish)**：
   - 之前在 Breadcrumb 下方加的绿色胶囊标签显得有点突兀。
   - **重构**：将其位置上移并设计为紧贴着顶部大标题的轻量级 Badge（或是合并到右上角），不再打断中心界面的排版。
2. **次级按钮 Hover 失效 (Secondary Button Hover Hook)**：
   - 在强行引入暗黑模式 `dark:hover:bg-zinc-800` 并取消背景色时，`backBtn` 的 CSS 被覆盖。
   - **修复**：恢复为其原生地 `hover:bg-gray-50/50` 或按 `getThemeStyles()` 动态绑定。
3. **金库唤回时原图失传 (Reference Image Missing)`**：
   - `FigurineGenerationGallery` 的左上角依然期待着一个 Base64 上传图作为参照物 (Target Subject)。由于 `editingVaultAssetId` 模式下 `uploadedImage` 是空，导致原图框发生经典的 `<img src="" />` 碎裂。
   - **修复**：提取 `generatedViews` 中的数据进行渲染，或者在唤回时将原始图 URL 塞入 Zustand 的 `uploadedImage`。如果老数据实在没有原始上传图，左上角的参考位将自动坍缩隐藏 (Display: hidden)，保证展厅洁净。
4. **展厅返回导致数据影分身 (Duplication on Re-entry)**：
   - 用户从 Vault 点进展厅（自动触发了一次 Zustand 写入），当他点击展厅的 `Finalize (Complete)` 按钮时，原有逻辑中的 `onComplete` 会**不分青红皂白再次执行 `saveGeneratedAsset`**。
   - **修复**：在 `onComplete` 派发事件中增加屏障保护。如果 `editingVaultAssetId` 存在，说明该资产本就在库，**坚决杜绝再次执行 DB Save**，只允许状态流转到 `select`。

## 8. Phase 6 全局收尾与极致 UI 重塑 (Final Polish & Navigation Clear)
1. **进程栏与安全标识的大幅重构 (Professional Header Redesign)**：
   - 现有的横向大跨度进程栏加上居中的绿灯显得松散、不具备现代 SaaS 的高级感。
   - **设计理念**：采用“左右分栏的控制台级 Header”。将安全标识（Vault Sync）小巧化并左对齐，与大号字体的当前阶段标题绑在一起；把 1-2-3-4 的步骤球做成极简的 Micro-Steps 组件，右对齐。整体悬浮在主体内容之上，大幅收缩纵向空间的浪费。
2. **彻底解决 `"null"` 幽灵字符串导致的裂图 (Null String Casting Fix)**：
   - 之前老旧记录的 `originalImage` 发往前端时变成了字面量的 `"null"` 字符串，导致了 `cleanB64` 判空失败。
   - **修复**：在进入 `GenerationVaultList` 及 Gallery 时，强制增加 `!== "null"` 的严苛校验流出逻辑。
3. **全局状态的导航切面隔离 (Navigation State Flush)**：
   - 用户从 Vault 点击进来，生成了全局 Context，又离开去首页，此时再点击 Customize 仍然回到了 Vault 数据。这是典型的 SPA Store 泄漏问题。
   - **修复**：在 `HeaderClient.tsx` 中劫持 `/customize` 的导航行为。若用户从顶部通栏点击 Customize 入口，执行一次硬性的 `resetGenerationFlow()`，确保每次从大门进入定制间都是一张纯洁无瑕的白纸。

## 9. Phase 7 验收后修正 (Round 2 Feedback & Enhancements)
根据司令官的新一轮真机测试，追加以下极致体验的收尾：
1. **生成中指示器精简 (Indicator Polish)**：去掉 `FigurineGenerationGallery` 内部重复的“Secured in Vault”和 “Safe Asynchronous Process” 提示横幅，贯彻极简。顶部外层标题栏的“Secured in Vault”只在渲染完成后或在 Vault 查看时（并更名为“Vault Asset”之类的专属标签）才展示。
2. **云端链接导致的裂图 BUG 溯源 (Vercel Blob Image Pre-loading)**：由于新加入金库的数据存为了 `https://...` 格式的 Vercel Blob URL，旧版前端的 `base64,` 写死截取方式失效。将改为智能识别 URL 与 Base64，彻底解决二次查看时的 `<img src="" />` 裂图死循环。
3. **彻底隔离状态污染 (State Bleeding Closure)**：部分来自首页 (Home Themes) 的 "Start Creating" CTA 按钮和 Header 的 Logo 按钮未绑定 `resetGenerationFlow`，导致如果用户从 Vault 返回首页再点击定制，依然会看到旧图。将其全量覆盖，保证每次回到起点都是彻底清空的 Zustand 容器。
4. **废片拦截 (Blank Card Fallback)**：进一步严苛甄别失败件记录（如图3中空白），在 `GenerationVaultList` 及相关映射中注入更强的 Fallback UI。

## 10. Phase 8-12 深度体验打磨 (Late-Breaking UX Polish)
在多轮细致入微的真机测试下，执行了以下针对“转化体验”的终极打磨：
1. **生成器指示灯的精确剥离 (Gallery vs Page State Mapping)**：
   - 之前“生成中”和“已入库”的状态判断逻辑与底层的展厅组件脱节。
   - **重构**：将内部的 `galleryStatus` 上浮到 `page.tsx`。用户停留在 Step 2 时无标签；一旦点击生成，顶栏立即亮起青色的 `Generating...`；生成彻底完工后（或从金库原样载入时），顶栏瞬切为常绿的 `Vault Asset` 徽章。内部界面的多余标签全数铲除，保证视觉中心点只有一处。
2. **幽灵记录消除 (Duplicate Database Prevention)**：
   - 用户在走完生成流程、跳转至确认页或刷新时，底层异步的 webhook `saveGeneratedAsset` 容易和前台页面互相踩踏，产生双份同样的入库记录。
   - **重构**：打通 `FigurineGenerationGallery.tsx` 的 `onComplete(urls, asyncAssetId)` 回调。让子组件直接把异步创建完毕的 ID 传递给父级并锁入 `editingVaultAssetId`，从而一刀切断后续冗余的保存请求。
3. **加购后的沉浸式留存与重置 (In-Place Add to Cart UX)**：
   - 点击“Add to Cart”后，原有逻辑会粗暴地强行 `router.push('/')` 回首页以清空状态机，这让抽屉式购物车体验变得极具断层感。
   - **重构**：废除强制驱逐代码，引入 `isAddedToCart` 原地成功态。用户点击后，购物车侧滑展开，底部的加购按钮绿灯锁定为 `✓ Added to Cart`，并提供一个全新的高优按钮 `✨ Create Another Figurine`。让用户自己决定是留在原地观赏，还是平滑回滚到 Step 1 再捏一个。

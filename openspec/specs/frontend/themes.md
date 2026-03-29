# 首页多主题体系规范 (Themes Specifications)

为了让独立站能随时以极高审美契合不同的节假日营销和用户群体偏好，首页 (Root Page) 目前被设计并构建出了五套可无缝平切的完备静态视觉主题层。

## 1. 共有架构范式
- 通过 `src/lib/theme.ts` 或 React Context 在顶层捕获和持久化当前访客的主题偏好状态。
- **核心原则 (Data-View Separation)**: 所有主题在视觉构成上大相径庭，但都必须共享、注入同意的高阶数据模型字典（复用文案流及资产：如 `[craftList, processList, faqList, scenarioImages]` 等）。绝不允许把文案硬编码到各个特定主题中。
- 所有独立组装的页面级别组件统统收纳于 `src/components/home-themes/` 下。

## 2. 主流分支规范 (The Core Themes Matrix)

### 2.1 赛博朋克风 (`CyberpunkHome.tsx`)
- **视觉特征**: 暗黑科幻基底、深色调配合极高反差的荧光蓝/亮洋红发光轮廓。
- **必现动效注入 (`globals.css`)**: 
  - `--animate-glitch`: 文字和按钮悬浮的强烈断层错位闪烁与色彩切割。
  - `--animate-scanline`: 必须叠加覆盖全视口的 CRT 显像管带状扫描线（mix-blend 重叠）。

### 2.2 极致拟态·毛玻璃 (`GlassmorphismHome.tsx`)
- **视觉特征**: 以极淡的浅蓝/纯白渐变为基调，拥有类似 iPhone 深度感知层面的磨砂玻璃高斯模糊感，轻盈漂浮。
- **必现动效注入 (`globals.css`)**:
  - `--animate-shimmer`: 交互按钮表面与强调色块必须含有平滑的高光反光（一束光倾斜扫过）。
  - 大面积虚化渐变色背景光斑的极度缓慢 `--animate-pulse-glow` 呼吸放大，与 `--animate-float` 柔顺物理漂浮感。

### 2.3 模块化卡片便当盒 (`BentoBoxHome.tsx`)
- **视觉特征**: 类似苹果风 Dashboard 的现代块状卡片墙缝隙拼接，要求呈现极大的粗旷圆角 (`rounded-2xl` - `rounded-3xl` 及以上)。
- **操作交互重点**:
  - 全屏横贯的无限自驱动无缝轮播标签跑马灯 (`marquee`)，用以展示特征。且满足 Hover 时必须 `paused`。
  - 单个卡片或模块区域获得鼠标焦点划过时产生的微妙弹性缩放 / 位移悬浮。

### 2.4 美式复古波普 (`RetroPopHome.tsx`)
- **视觉特征**: 引入粗犷的大轮廓全黑描边、实心重力投射阴影、美式连环画 (Halftone / 波点阵列) 背景图案。
- **必现动效注入 (`globals.css`)**:
  - 带有漫画感强调特征的组件需执行 `--animate-wiggle`（魔性的、不规律的夸张抖动晃动）。
  - 各类徽章需要在被交互时展现极为戏剧化和浮夸的全尺寸旋转与暴增。

### 2.5 极致极简·禅意 (`ZenMinimalHome.tsx`)
- **视觉特征**: 日式枯山水设计风格，强调原研哉级别的极致留白，无边界感，运用大量的微弱灰度衬线字。
- **操作交互重点（核心: 慢）**:
  - 摒弃任何快速跳跃动效。页面的挂载和所有响应（如 Fade-in）需要被拉伸到 1.5s 以上。
  - 图片默认为黑白/极低对比度，悬浮时以极其缓慢（>2秒）的速度发生去色与曝光恢复 (Desaturation Recover)。
  - 强依赖全局页面的滚轮防震滚动事件 (Parallax Window Scrolling Effect)，让文本、图片和深色背景以不同的速度进行相交相融。

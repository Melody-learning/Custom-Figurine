## Architecture

Admin 后台作为 Next.js App Router 子路由 `/admin/*` 实现，复用现有基础设施：
- **鉴权**: middleware.ts 已有 `/admin` ADMIN 角色守卫
- **数据库**: 复用 Prisma + Vercel Postgres
- **图片存储**: 复用 Vercel Blob
- **部署**: 同一个 Vercel 项目，零额外成本

---

## 1. DB Schema 设计

### 1.1 User 表新增字段

```prisma
model User {
  // ... 现有字段
  maxConcurrentJobs   Int      @default(1)      // 同时进行的生图任务上限
  maxTotalGenerations Int      @default(3)       // 总生图次数上限
  isWhitelisted       Boolean  @default(false)   // 白名单（无限制）
}
```

### 1.2 新增 HeroSlide Model

```prisma
model HeroSlide {
  id            String   @id @default(cuid())
  sortOrder     Int      @default(0)            // 排序权重
  tag           String                           // 场景标签 "Game Characters"
  tagZh         String?                          // 中文标签
  title         String                           // 英文标题
  titleZh       String?                          // 中文标题
  description   String   @db.Text               // 英文描述
  descriptionZh String?  @db.Text               // 中文描述
  imageUrl      String   @db.Text               // 背景大图 URL (Blob)
  thumbUrl      String   @db.Text               // 缩略图 URL (Blob)
  accent        String   @default("from-amber-500/20 via-orange-400/10 to-transparent")
  isActive      Boolean  @default(true)          // 是否启用
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 2. 生图权限控制流程

### 2.1 检查时机：startAsyncGeneration (Server Action)

```
用户点击 "生成 3D 模型"
       │
       ▼
┌──────────────────┐
│ 查询 User 权限     │
│ isWhitelisted?    │── Yes ──► 直接放行
└───────┬──────────┘
        No
        ▼
┌──────────────────┐
│ COUNT(status IN   │
│ COMPLETE,PENDING, │
│ PROCESSING)       │
│ >= maxTotal?      │── Yes ──► 返回 {error: "LIMIT_REACHED"}
└───────┬──────────┘           前端灰掉按钮 + 文案
        No
        ▼
┌──────────────────┐
│ COUNT(status IN   │
│ PENDING,          │
│ PROCESSING)       │
│ >= maxConcurrent? │── Yes ──► 返回 {error: "CONCURRENT_LIMIT"}
└───────┬──────────┘           前端提示 "请等待当前任务完成"
        No
        ▼
  创建 Asset (PENDING)
  启动后台生成
```

### 2.2 总次数计算规则

- **扣次数时机**: Asset 创建时（status=PENDING）即计入
- **返还时机**: webhook 中 Asset 更新为 FAILED 时，不计入总次数
- **实现方式**: COUNT 时排除 status='FAILED' 的记录
  - 即 `WHERE status IN ('PENDING', 'PROCESSING', 'COMPLETE')`
  - 这样 FAILED 的自动不算在总次数里，无需手动返还

### 2.3 并发检查

- 只检查 `status IN ('PENDING', 'PROCESSING')` 的记录数
- 注意：这是**用户级任务数**，不是 API 并发数
- 一个任务内部的 primary → (back + side + showcase) 3 路并行不受影响

### 2.4 前端限制态

```tsx
// customize/page.tsx 生成按钮
{quotaError === 'LIMIT_REACHED' ? (
  <button disabled className="opacity-50 cursor-not-allowed ...">
    Generation limit reached (3/3)
  </button>
) : quotaError === 'CONCURRENT_LIMIT' ? (
  <button disabled className="opacity-50 cursor-not-allowed ...">
    Please wait for current generation to finish
  </button>
) : (
  <button onClick={handleGenerate} ...>
    ✨ 生成 3D 模型
  </button>
)}
```

---

## 3. Admin 页面设计

### 3.1 Layout (侧边栏)

```
┌──────────────────────────────────────────┐
│  ADMIN PANEL          [User Avatar] [←]  │
├──────────┬───────────────────────────────┤
│          │                               │
│ Dashboard│   [主内容区]                   │
│ ─────────│                               │
│ 📊 Stats │                               │
│ 🎨 Hero  │                               │
│ 🖼 Gens  │                               │
│ 👥 Users │                               │
│          │                               │
│          │                               │
│          │                               │
│ ─────────│                               │
│ ← Back   │                               │
└──────────┴───────────────────────────────┘
```

- 暗色主题，简洁风格
- 移动端侧边栏折叠为 hamburger

### 3.2 Dashboard (page.tsx)

统计卡片：
- 总用户数、今日新增
- 总生成数、今日生成
- 活跃 Hero 轮播数
- 白名单用户数

### 3.3 Generations (/admin/generations)

- 表格：用户名 | 邮箱 | 状态 | 模型 | 创建时间 | 操作
- 筛选：All / Pending / Complete / Failed
- 点击展开详情：4 图预览（primary/back/side/showcase）
- 操作：查看大图、删除

### 3.4 Hero (/admin/hero)

- 轮播卡片列表（拖拽排序或 ↑↓ 按钮排序）
- 每张卡片：缩略图预览 + 标题 + 状态（启用/停用）
- 新增/编辑弹窗：上传大图+缩略图、填写中英文案、选择 accent 色
- 图片上传走 Vercel Blob (复用现有 upload-token API)

### 3.5 Users (/admin/users)

- 表格：用户名 | 邮箱 | 角色 | 已用次数/上限 | 白名单 | 操作
- 操作：切换白名单、调整次数上限、调整并发上限
- 批量操作：批量加白名单

---

## 4. API 设计

### Admin API Routes (均有 ADMIN 角色保护)

| Method | Route | 功能 |
|--------|-------|------|
| GET | `/api/admin/stats` | Dashboard 统计数据 |
| GET | `/api/admin/generations` | 生成记录列表 (分页+筛选) |
| DELETE | `/api/admin/generations/[id]` | 删除生成记录 |
| GET | `/api/admin/hero` | Hero 轮播列表 |
| POST | `/api/admin/hero` | 新增轮播 |
| PUT | `/api/admin/hero/[id]` | 编辑轮播 |
| DELETE | `/api/admin/hero/[id]` | 删除轮播 |
| PATCH | `/api/admin/hero/reorder` | 批量更新排序 |
| GET | `/api/admin/users` | 用户列表 (分页+搜索) |
| PATCH | `/api/admin/users/[id]` | 更新用户权限 |

### 前端公开 API

| Method | Route | 功能 |
|--------|-------|------|
| GET | `/api/hero-slides` | 获取启用的 Hero 轮播（按 sortOrder排序，前端首页用）|

---

## 5. 技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Admin 位置 | 同项目 `src/app/admin/` | 复用鉴权/DB/API，零额外部署成本 |
| 轮播数据存储 | Prisma HeroSlide model | 灵活 CRUD，已有 Prisma 基础 |
| 权限检查位置 | Server Action (startAsyncGeneration) | 服务端拦截，不可绕过 |
| 次数返还方式 | COUNT 排除 FAILED | 无需手动返还逻辑，自然生效 |
| Admin UI 风格 | 原生 Tailwind 手写 | 不引入 shadcn 等额外依赖，轻量 |

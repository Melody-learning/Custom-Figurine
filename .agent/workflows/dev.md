---
description: 本地开发环境启动与日常开发流程
---

# 开发工作流

## 环境准备

1. 确保 Docker Desktop 已启动
2. 确保 `.env.local` 包含所有环境变量（参考 `.gemini/GEMINI.md` 环境变量章节）

## 启动服务

// turbo
1. 启动数据库容器
```bash
docker-compose up -d
```

// turbo
2. 启动开发服务器
```bash
npm run dev
```

## 数据库变更

修改 `prisma/schema.prisma` 后：
```bash
npx prisma db push
```

## 部署

生产部署通过 GitHub 自动触发：
```bash
git add .
git commit -m "feat: 变更描述"
git push origin main
```

> ⚠️ 禁止使用 `vercel deploy --prod` 强推

## 构建验证

本地验证构建是否通过：
// turbo
```bash
npm run build
```

## 变更约定

1. 修改前先了解 `specs/` 目录下的对应规范
2. 大型变更建议先在 `changes/` 中创建提案文档
3. 完成后将提案移入 `changes/archive/`

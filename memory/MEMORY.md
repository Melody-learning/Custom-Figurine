# 定制手办独立站项目

## 项目概述
- **类型**：海外独立站，定制实物手办
- **核心流程**：用户上传2D图片 → AI生成3D风格渲染图 → 用户确认 → 下单 → 线下3D建模/打印/涂装/发货
- **现状**：
  - Shopify 已注册并配置完成
  - Shopify 域名：fk0.myshopfk1j-tify.com
  - AI生图：当前为模拟返回原图，待对接真实API
  - 无技术人员，全流程外包

## 技术选型
- 前端：Next.js 16 + Tailwind CSS
- 状态管理：Zustand
- 国际化：自定义 i18n（中英文切换）
- 主题系统：6种风格（default, neo-brutalist, minimal, elegant, editorial, watercolor）
- Shopify：Storefront API
- 部署：Vercel

## Shopify 配置
- 域名：fkfk1j-t0.myshopify.com
- Storefront API 令牌：a059b1a3bfa9ddf42ee02d55895bcfc7
- 商品：1个商品，36个变体（工艺 x 配件 x 规格）

## 已完成功能
- 首页：Hero区 + 产品介绍区（适用场景、工艺介绍、制作流程、FAQ）
- 定制流程：上传图片 → AI生成 → 选择规格 → 加入购物车
- 购物车：侧边栏展示、跳转结账
- 中英文切换
- 风格切换

## 后续任务
1. **AI 生图对接** - 对接真实 AI API（Replicate/Stability AI）
2. **网站样式优化** - 完善 UI/UX 设计
3. **Shopify 后台配置** - 完善商品、开通支付
4. **订单同步** - 线下完成后同步物流信息（可选）
5. **SEO 优化** - 搜索引擎优化

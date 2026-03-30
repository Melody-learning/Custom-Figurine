## MODIFIED Requirements

### Requirement: Replace StoreOrder with Order and OrderItem tables
数据库 SHALL 删除 `StoreOrder` 表，新增 `Order` 和 `OrderItem` 表。

`GeneratedAsset` 表 SHALL 新增 `orderItems` 反向关联字段（`OrderItem[]`）。

`User` 表的 `storeOrders` 关联 SHALL 改为 `orders`（关联到新的 `Order` 表）。

`OrderStatus` 枚举 SHALL 包含：PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED。

#### Scenario: Schema migration
- **WHEN** 执行 `npx prisma db push`
- **THEN** 数据库 SHALL 删除 StoreOrder 表，创建 Order 和 OrderItem 表，无数据迁移需要

#### Scenario: User-Order relationship
- **WHEN** 查询用户的订单
- **THEN** SHALL 通过 User.orders 关联获取该用户的所有 Order 记录

#### Scenario: Order-OrderItem relationship
- **WHEN** 查询订单详情
- **THEN** SHALL 通过 Order.items 关联获取该订单的所有 OrderItem 记录

#### Scenario: OrderItem-GeneratedAsset optional relationship
- **WHEN** OrderItem 有 generatedAssetId
- **THEN** SHALL 可通过 OrderItem.generatedAsset 关联获取对应的 GeneratedAsset 记录

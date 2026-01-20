# VIP 功能实现文档

## 📋 概述

本文档说明考试成绩分析系统的 VIP 会员功能实现，包括会员类型、权限控制、功能限制等。

---

## 🎯 VIP 类型

### 1. 季度会员 (quarter)
- **时长**：3个月
- **价格**：¥99
- **平均**：¥33/月

### 2. 年度会员 (year)
- **时长**：12个月
- **价格**：¥299
- **优惠**：立省¥97（相比季度会员）

---

## 🔐 权限对比

| 功能 | 免费用户 | VIP会员 |
|------|---------|---------|
| 考试记录数量 | 最多3条 | 无限制 ✅ |
| 导出Excel | ❌ | ✅ |
| 主题肤色设置 | ❌ | ✅ |
| 等级称谓设置 | ❌ | ✅ |
| 数据分析报告 | 基础版 | 完整版 ✅ |
| 优先客服支持 | ❌ | ✅ |

---

## 💾 数据库设计

### user_vip 表字段

```sql
CREATE TABLE user_vip (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  is_vip BOOLEAN DEFAULT FALSE,
  vip_type TEXT CHECK (vip_type IN ('quarter', 'year')), -- 新增
  vip_start_date TIMESTAMPTZ,
  vip_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### vip_orders 表（订单记录）

```sql
CREATE TABLE vip_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  order_no TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL, -- 3 或 12
  status TEXT CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠️ 核心组件

### 1. useVipStatus Hook

**文件**：`src/hooks/useVipStatus.ts`

**功能**：
- 检查用户VIP状态
- 获取VIP类型和到期时间
- 计算剩余天数

**使用示例**：
```typescript
import { useVipStatus } from '@/hooks/useVipStatus'

function MyComponent() {
  const { vipStatus, loading, refreshVipStatus } = useVipStatus()
  
  if (vipStatus.isVip) {
    console.log('VIP类型:', vipStatus.vipType)
    console.log('剩余天数:', vipStatus.daysRemaining)
  }
}
```

### 2. useVipFeature Hook

**功能**：检查特定功能是否需要VIP权限

**使用示例**：
```typescript
import { useVipFeature } from '@/hooks/useVipStatus'

function ExportButton() {
  const { requiresVip, hasAccess } = useVipFeature('export-excel')
  
  if (!hasAccess) {
    return <div>需要VIP权限</div>
  }
  
  return <Button>导出Excel</Button>
}
```

### 3. VipBadge 组件

**文件**：`src/components/common/VipBadge.tsx`

**功能**：显示VIP标识图标

**使用示例**：
```typescript
import { VipBadge } from '@/components/common/VipBadge'

<VipBadge size="md" showText onClick={() => setShowModal(true)} />
```

### 4. VipBenefitsModal 组件

**文件**：`src/components/common/VipBenefitsModal.tsx`

**功能**：显示VIP权益弹窗和升级入口

**使用示例**：
```typescript
import { VipBenefitsModal } from '@/components/common/VipBenefitsModal'

<VipBenefitsModal
  open={showModal}
  onClose={() => setShowModal(false)}
  onUpgrade={() => router.push('/vip')}
  currentFeature="export-excel"
/>
```

### 5. VipFeatureWrapper 组件

**文件**：`src/components/common/VipFeatureWrapper.tsx`

**功能**：包装需要VIP权限的功能，自动处理权限检查和UI显示

**使用示例**：
```typescript
import { VipFeatureWrapper } from '@/components/common/VipFeatureWrapper'

<VipFeatureWrapper featureName="export-excel">
  <Button>导出Excel</Button>
</VipFeatureWrapper>
```

---

## 🔧 API 函数

### 1. canCreateExamRecord()

**文件**：`src/db/api.ts`

**功能**：检查用户是否可以创建新的考试记录

**返回值**：
```typescript
{
  canCreate: boolean;      // 是否可以创建
  isVip: boolean;          // 是否VIP
  currentCount: number;    // 当前记录数
  maxCount: number;        // 最大记录数（-1表示无限制）
  reason?: string;         // 不能创建的原因
}
```

**使用示例**：
```typescript
import { canCreateExamRecord } from '@/db/api'

const result = await canCreateExamRecord()
if (!result.canCreate) {
  message.error(result.reason)
  return
}
```

### 2. getUserVipStatus()

**文件**：`src/db/api.ts`

**功能**：获取用户VIP状态

**返回值**：
```typescript
{
  isVip: boolean;
  vipType?: 'quarter' | 'year';
  vipEndDate?: string;
  daysRemaining?: number;
}
```

---

## 📝 功能实现清单

### ✅ 已完成

1. **数据库层**
   - [x] 添加 vip_type 字段
   - [x] 更新 admin_activate_vip 函数
   - [x] 更新 admin_renew_vip 函数

2. **前端组件**
   - [x] useVipStatus Hook
   - [x] useVipFeature Hook
   - [x] VipBadge 组件
   - [x] VipBenefitsModal 组件
   - [x] VipFeatureWrapper 组件

3. **API 函数**
   - [x] canCreateExamRecord() - 检查考试记录创建权限
   - [x] getUserVipStatus() - 获取VIP状态

### 🔄 待集成

以下功能需要在对应页面中集成VIP权限检查：

1. **考试记录上传**（免费用户限制3条）
   - 文件：`src/pages/UploadPage.tsx`
   - 实现：在上传前调用 `canCreateExamRecord()`
   - 提示：达到限制时显示VIP升级弹窗

2. **导出Excel功能**（需要VIP）
   - 文件：`src/pages/DataOverview.tsx`、`src/pages/ModuleAnalysis.tsx`
   - 实现：使用 `VipFeatureWrapper` 包装导出按钮
   - 提示：点击时显示VIP权益弹窗

3. **主题肤色设置**（需要VIP）
   - 文件：`src/pages/Settings.tsx`
   - 实现：使用 `VipFeatureWrapper` 包装主题设置区域
   - 提示：点击时显示VIP权益弹窗

4. **等级称谓设置**（需要VIP）
   - 文件：`src/pages/Settings.tsx`
   - 实现：使用 `VipFeatureWrapper` 包装等级设置区域
   - 提示：点击时显示VIP权益弹窗

---

## 🎨 UI 设计规范

### VIP 标识颜色

- **主色**：`text-yellow-600 dark:text-yellow-500`
- **填充色**：`fill-yellow-500`
- **悬停色**：`hover:text-yellow-700 dark:hover:text-yellow-400`

### VIP 按钮样式

```typescript
<Button
  type="primary"
  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 border-0"
  icon={<Crown className="w-4 h-4" />}
>
  立即升级VIP
</Button>
```

### VIP 卡片样式

```typescript
<Card
  className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
>
  <Tag color="gold">推荐</Tag>
  {/* 内容 */}
</Card>
```

---

## 🔒 安全注意事项

1. **前端权限检查**：仅用于UI显示，不能作为安全保障
2. **后端权限验证**：所有敏感操作必须在后端验证VIP状态
3. **过期检查**：每次操作都要检查VIP是否过期
4. **RLS策略**：数据库层面确保用户只能访问自己的数据

---

## 📊 测试清单

### 功能测试

- [ ] 免费用户创建第4条记录时被拦截
- [ ] VIP用户可以创建无限条记录
- [ ] 免费用户点击导出Excel显示VIP弹窗
- [ ] VIP用户可以正常导出Excel
- [ ] 免费用户点击主题设置显示VIP弹窗
- [ ] VIP用户可以正常设置主题
- [ ] 免费用户点击等级设置显示VIP弹窗
- [ ] VIP用户可以正常设置等级

### 边界测试

- [ ] VIP到期后自动降级为免费用户
- [ ] VIP到期后超过3条记录的用户只能查看不能新增
- [ ] 季度会员和年度会员权益一致
- [ ] 续费后到期时间正确延长

---

## 🚀 部署步骤

1. **应用数据库迁移**
   ```bash
   # 迁移已自动应用
   # 文件：supabase/migrations/00028_add_vip_type_field.sql
   ```

2. **验证数据库**
   ```sql
   -- 检查字段是否添加成功
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'user_vip' AND column_name = 'vip_type';
   ```

3. **前端部署**
   ```bash
   npm run build
   npm run preview  # 本地预览
   ```

4. **测试VIP功能**
   - 使用SQL Editor手动开通测试VIP
   - 测试各项VIP功能是否正常

---

## 📞 支持

如有问题，请参考：
- [VIP开通安全方案](./VIP_ACTIVATION_SECURITY.md)
- [VIP快速参考](./VIP_QUICK_REFERENCE.md)

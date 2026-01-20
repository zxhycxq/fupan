# VIP功能测试文档

## 测试账号

### VIP用户
- **手机号**: 15538838360（数据库中为8615538838360）
- **用户ID**: de659f57-9bd9-4e08-962d-7b60fc6637b3
- **VIP状态**: 已开通
- **有效期**: 2026-01-20 至 2027-01-20（1年）

### 普通用户
- 使用其他手机号注册的用户
- 或者使用15036007115（数据库中为8615036007115）

## 功能测试清单

### 1. Dashboard页面 - 导出Excel功能

#### VIP用户测试
1. 使用15538838360登录
2. 进入Dashboard页面
3. 点击"导出Excel"按钮
4. **预期结果**: 可以正常导出Excel文件

#### 普通用户测试
1. 使用其他手机号登录
2. 进入Dashboard页面
3. 观察"导出Excel"按钮状态
4. **预期结果**: 
   - 按钮显示为半透明（opacity-50）
   - 鼠标悬停显示"该功能需要VIP会员"提示
   - 点击按钮弹出VIP升级弹窗
   - 无法导出Excel

### 2. Settings页面 - 主题设置

#### 免费主题（所有用户）
1. 进入Settings页面
2. 找到"主题设置"部分
3. 点击"蓝色"主题
4. **预期结果**: 所有用户都可以切换到蓝色主题

#### VIP主题（仅VIP用户）
**VIP用户测试**:
1. 使用15538838360登录
2. 进入Settings页面
3. 尝试切换以下主题：
   - 绿色主题
   - 紫色主题
   - 橙色主题
   - 红色主题
   - 青色主题
   - 粉色主题
4. **预期结果**: 可以正常切换所有主题

**普通用户测试**:
1. 使用其他手机号登录
2. 进入Settings页面
3. 观察非蓝色主题的状态
4. **预期结果**:
   - 非蓝色主题显示为半透明
   - 鼠标悬停显示"该主题需要VIP会员"提示
   - 点击主题卡片弹出VIP升级弹窗
   - 无法切换到VIP主题

### 3. Settings页面 - 等级设置

#### 免费系列（所有用户）
1. 进入Settings页面
2. 找到"等级设置"部分
3. 点击"易经系列"
4. **预期结果**: 所有用户都可以切换到易经系列

#### VIP系列（仅VIP用户）
**VIP用户测试**:
1. 使用15538838360登录
2. 进入Settings页面
3. 尝试切换以下系列：
   - 武侠系列
   - 神话系列
   - 诗词系列
4. **预期结果**: 可以正常切换所有系列

**普通用户测试**:
1. 使用其他手机号登录
2. 进入Settings页面
3. 观察非易经系列的状态
4. **预期结果**:
   - 非易经系列显示为半透明
   - 鼠标悬停显示"该等级系列需要VIP会员"提示
   - 点击系列卡片弹出VIP升级弹窗
   - 无法切换到VIP系列

## VIP升级弹窗测试

### 弹窗内容验证
1. 使用普通用户点击任意VIP功能
2. 观察弹出的VIP升级弹窗
3. **预期内容**:
   - 弹窗标题："升级VIP会员"
   - 当前功能说明
   - VIP权益列表
   - 升级按钮

### 弹窗交互验证
1. 点击弹窗外部区域
2. **预期结果**: 弹窗关闭
3. 点击"关闭"按钮
4. **预期结果**: 弹窗关闭
5. 点击"立即升级"按钮
6. **预期结果**: 执行升级操作（如果配置了onUpgrade回调）

## 数据库验证

### 查询VIP状态
```sql
-- 查询指定用户的VIP状态
SELECT 
  u.phone,
  u.email,
  uv.is_vip,
  uv.vip_start_date,
  uv.vip_end_date,
  CASE 
    WHEN uv.is_vip AND uv.vip_end_date > NOW() THEN 'VIP会员'
    ELSE '免费用户'
  END as status
FROM auth.users u
LEFT JOIN user_vip uv ON u.id = uv.user_id
WHERE u.phone = '8615538838360';
```

### 设置VIP用户
```sql
-- 使用SET_VIP_USER.sql文件中的脚本
-- 或者直接执行以下SQL
INSERT INTO user_vip (
  user_id,
  is_vip,
  vip_start_date,
  vip_end_date
) VALUES (
  'de659f57-9bd9-4e08-962d-7b60fc6637b3',
  true,
  NOW(),
  NOW() + INTERVAL '1 year'
)
ON CONFLICT (user_id) 
DO UPDATE SET
  is_vip = true,
  vip_start_date = NOW(),
  vip_end_date = NOW() + INTERVAL '1 year',
  updated_at = NOW();
```

## 常见问题排查

### 问题1: VIP用户仍然看到VIP限制
**可能原因**:
- 前端缓存未更新
- useVipStatus hook未正确获取VIP状态

**解决方法**:
1. 清除浏览器缓存
2. 退出登录后重新登录
3. 检查useVipStatus hook的实现

### 问题2: 普通用户可以点击VIP功能
**可能原因**:
- VipFeatureWrapper的覆盖层z-index不够高
- onClick事件未被正确拦截

**解决方法**:
1. 检查VipFeatureWrapper的覆盖层实现
2. 确保覆盖层的pointerEvents设置为auto
3. 提高覆盖层的z-index值

### 问题3: VIP状态查询返回空
**可能原因**:
- user_vip表中没有该用户的记录
- 用户ID不匹配

**解决方法**:
1. 执行SET_VIP_USER.sql脚本
2. 检查auth.users表中的用户ID
3. 确保user_vip表中有对应记录

## 测试完成标准

- [ ] VIP用户可以使用所有功能
- [ ] 普通用户无法点击VIP功能
- [ ] 点击VIP功能显示升级弹窗
- [ ] 主题设置权限控制正确
- [ ] 等级设置权限控制正确
- [ ] Dashboard导出功能权限控制正确
- [ ] VIP状态在数据库中正确存储
- [ ] 前端正确读取VIP状态

## 更新日志

### 2026-01-20
- ✅ 创建user_vip表
- ✅ 设置8615538838360为VIP用户
- ✅ 修复VipFeatureWrapper覆盖层z-index
- ✅ 实现主题设置VIP权限控制
- ✅ 实现等级设置VIP权限控制
- ✅ 实现Dashboard导出VIP权限控制

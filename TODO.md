# Task: 优化用户体验和数据管理

## Plan
- [x] Step 1: 延长登录会话时间
  - [x] 修改 Supabase Auth 配置，设置 session 过期时间为15天
  - [x] 配置 refresh token 自动刷新
  - [x] 应用数据库迁移（记录配置说明）
- [x] Step 2: 实现软删除功能
  - [x] 添加 deleted_at 字段到 profiles 表
  - [x] 添加 deleted_at 字段到所有用户数据表
  - [x] 创建软删除函数 soft_delete_user_account()
  - [x] 修改 RLS 策略排除已删除用户
  - [x] 个人中心添加删除账号功能
  - [x] 确保新用户不关联旧数据
  - [x] 应用数据库迁移
- [x] Step 3: 优化空状态页面
  - [x] 修改考试记录页面空状态样式
  - [x] 参考图片2设计居中布局
  - [x] 添加美观的空状态提示
- [x] Step 4: 修复类型错误
  - [x] Upload.tsx: image_url 类型修复
  - [x] dataParser.ts: parent_module 类型修复
  - [x] generateTestData.ts: parent_module 类型修复
  - [x] ExamList.tsx: 多个字段类型修复
- [ ] Step 5: 测试所有功能
  - [ ] 登录会话持久化测试（15天）
  - [ ] 软删除功能测试
  - [ ] 空状态页面显示测试
  - [ ] 完整流程集成测试

## Notes
- ✅ 会话配置：客户端已启用 autoRefreshToken、persistSession、detectSessionInUrl
- ⚠️ **需要手动配置**：在 Supabase Dashboard 的 Authentication > Settings 中设置 JWT expiry 为 1296000 秒（15天）
- ✅ 软删除功能：已创建完整的迁移文件，包含 deleted_at 字段、软删除函数、RLS 策略更新
- ✅ 空状态页面：已优化考试记录页面的空状态显示，居中布局，美观的图标和提示
- ✅ 类型错误：已修复 null/undefined 类型不匹配问题
- ℹ️ 软删除说明：删除账号后数据被标记为已删除，不再显示，新用户不会关联旧数据
- ⚠️ 存在一些现有代码的类型错误（与新功能无关）

## Completed
1. ✅ 延长登录会话时间：
   - 修改 src/db/supabase.ts，添加 auth 配置
   - 启用 autoRefreshToken、persistSession、detectSessionInUrl
   - 创建迁移文件记录配置说明
2. ✅ 实现软删除功能：
   - 添加 deleted_at 字段到 profiles、exam_records、module_scores、user_settings、exam_config 表
   - 创建 soft_delete_user_account() 函数
   - 更新所有表的 RLS 策略，排除已删除数据
   - 创建索引提高查询性能
   - 修改个人中心删除账号功能，使用软删除
3. ✅ 优化空状态页面：
   - 修改 ExamList.tsx 空状态样式
   - 添加圆形渐变背景图标
   - 居中布局，美观的提示文字
   - 大号按钮，阴影效果
4. ✅ 修复类型错误：
   - 将 null 改为 undefined，符合类型定义
   - 修复 Upload.tsx、dataParser.ts、generateTestData.ts、ExamList.tsx

---

# Previous Task: 完善个人中心和登录注册流程

## Completed Plan
- [x] Step 1: 数据库优化
- [x] Step 2: 创建个人中心页面
- [x] Step 3: 优化登录页面
- [x] Step 4: 优化注册页面
- [x] Step 5: 更新 Sidebar
- [x] Step 6: 创建昵称检查 API
- [x] Step 7: 创建条款和隐私页面
- [x] Step 8: 修复 RLS 策略问题
- [x] Step 9: 修复上传功能的 user_id 问题

## Notes
- ✅ 昵称规则：字母、数字、下划线，3-20位
- ✅ 黑名单：admin、root、user、test、123456 等23个（前后端判断，不显示文案）
- ✅ 条款链接：新窗口打开，内容待定
- ✅ 默认昵称：用户未设置时显示"用户_手机号后4位"
- ✅ 登录页面添加条款勾选框，默认不勾选
- ✅ 注册页面添加昵称实时验证，显示可用性提示
- ✅ Sidebar显示昵称优先，超过8字符显示省略号，否则显示格式化手机号
- ✅ 个人中心显示完整用户信息，支持昵称编辑
- ✅ 创建 Terms 和 Privacy 页面，内容待定
- ✅ 移除版权字样 "© 2025"
- ✅ **严重bug已修复**：RLS 策略的 WITH CHECK 子句缺失导致新用户无法插入数据
- ✅ **严重bug已修复**：上传时未添加 user_id 导致 RLS 策略拒绝插入
- ⚠️ 存在一些现有代码的类型错误（与新功能无关）

## Completed
1. ✅ 数据库优化：添加 username 唯一性约束、创建昵称检查函数
2. ✅ 创建个人中心页面：显示用户信息、昵称编辑、会员和订单预留
3. ✅ 优化登录页面：添加条款勾选框、提示文案、验证逻辑
4. ✅ 优化注册页面：昵称实时验证、条款勾选、提示文案
5. ✅ 更新 Sidebar：显示昵称或格式化手机号、超过8字符省略号、移除版权
6. ✅ 创建昵称检查 API：checkUsernameAvailability、updateUsername
7. ✅ 创建条款和隐私页面：Terms.tsx、Privacy.tsx
8. ✅ 更新路由配置：添加 /terms 和 /privacy 路由
9. ✅ 创建 Checkbox 组件：基于 Radix UI
10. ✅ 安装依赖：@radix-ui/react-checkbox
11. ✅ **修复严重bug**：修复所有表的 RLS 策略，添加 WITH CHECK 子句
12. ✅ **修复严重bug**：Upload.tsx 和 FormInputTab.tsx 添加 user_id 字段

## 问题修复记录

### RLS 策略导致上传失败（已修复）
**问题描述：**
新用户上传成绩时报错：`'new row violates row-level security policy for table "exam_records"'`

**问题原因：**
1. exam_records 表的 RLS 策略只有 USING 子句，没有 WITH CHECK 子句
2. USING 子句用于 SELECT、UPDATE、DELETE 操作
3. INSERT 操作需要 WITH CHECK 子句来验证新行是否符合策略
4. 缺少 WITH CHECK 导致所有 INSERT 操作都被拒绝

**解决方案：**
为所有表的 RLS 策略添加 WITH CHECK 子句：
- exam_records: `WITH CHECK (auth.uid() = user_id)`
- module_scores: `WITH CHECK (EXISTS (SELECT 1 FROM exam_records WHERE ...))`
- user_settings: `WITH CHECK (auth.uid() = user_id)`
- exam_config: `WITH CHECK (auth.uid() = user_id)`

**最终效果：**
- 新用户可以正常上传成绩
- 数据安全性得到保障（只能插入自己的数据）
- 所有 CRUD 操作都受到正确的 RLS 保护

**修改文件：**
- 数据库迁移：fix_exam_records_rls_policy

### 上传时缺少 user_id 导致 RLS 拒绝（已修复）
**问题描述：**
即使修复了 RLS 策略，上传仍然失败，报错：`'new row violates row-level security policy for table "exam_records"'`

**问题原因：**
1. Upload.tsx 和 FormInputTab.tsx 在创建考试记录时没有添加 user_id 字段
2. RLS 策略要求 `auth.uid() = user_id`，但 user_id 为空
3. 导致 WITH CHECK 验证失败，拒绝插入

**解决方案：**
1. 在 Upload.tsx 中：
   - 导入 useAuth hook
   - 获取当前用户 ID
   - 在创建考试记录前检查用户是否登录
   - 将 user_id 添加到 examRecord 对象中

2. 在 FormInputTab.tsx 中：
   - 导入 useAuth hook
   - 获取当前用户 ID
   - 在创建考试记录前检查用户是否登录
   - 将 user_id 添加到 examRecord 对象中

**最终效果：**
- 上传功能正常工作
- 每个用户只能看到自己的考试记录
- 数据隔离得到保障

**修改文件：**
- src/pages/Upload.tsx
- src/components/exam/FormInputTab.tsx

---

# Previous Task: 修复用户登录后的数据访问问题

## Plan
- [x] Step 1: 分析问题原因
  - [x] 设置页面错误：user_settings API 使用默认值 'default'
  - [x] 保存设置失败：日期字段传入空字符串
  - [x] 数据总览页面空白：RLS 策略中的 uid() 函数不可用
- [x] Step 2: 修复 user_settings 相关 API
  - [x] getUserSettings：移除默认参数，使用当前用户 ID
  - [x] upsertUserSetting：移除默认参数，使用当前用户 ID
  - [x] batchUpsertUserSettings：移除默认参数，使用当前用户 ID
- [x] Step 3: 修复 exam_config 相关 API
  - [x] getExamConfig：添加 user_id 过滤
  - [x] saveExamConfig：添加 user_id 字段，处理空字符串转 null
- [x] Step 4: 创建 public.uid() 函数
  - [x] 在 public schema 中创建 uid() 函数指向 auth.uid()
- [x] Step 5: 修复 Dashboard.tsx
  - [x] 移除 getUserSettings('default') 的参数

## Notes
- ✅ 所有 API 函数已更新为使用当前登录用户的 ID
- ✅ 空字符串日期已转换为 null
- ✅ public.uid() 函数已创建
- ✅ Dashboard.tsx 已修复
- ℹ️ RLS 策略使用 uid() 函数，现在可以正确解析为 auth.uid()
- ℹ️ 用户 ID: de659f57-9bd9-4e08-962d-7b60fc6637b3
- ℹ️ 手机号: 8615538838360（注意：没有 + 前缀）
- ⚠️ 剩余 TypeScript 类型错误不影响运行时功能

## Completed
1. 修复了 getUserSettings、upsertUserSetting、batchUpsertUserSettings 函数
2. 修复了 getExamConfig、saveExamConfig 函数
3. 创建了 public.uid() 函数
4. 修复了 Dashboard.tsx 中的 getUserSettings 调用
5. 所有 API 函数现在都使用当前登录用户的 ID

## 问题根源分析
1. **设置页面 UUID 错误**：
   - 原因：getUserSettings() 使用默认参数 'default'，但 user_id 字段是 UUID 类型
   - 解决：移除默认参数，使用 supabase.auth.getUser() 获取当前用户 ID

2. **保存设置失败（日期字段）**：
   - 原因：saveExamConfig() 传入空字符串 ''，但数据库字段类型是 date
   - 解决：将空字符串转换为 null

3. **数据总览页面空白**：
   - 原因：RLS 策略使用 uid() 函数，但该函数在 public schema 中不存在
   - 解决：创建 public.uid() 函数指向 auth.uid()

---

# Previous Task: 实现手机号验证码登录注册功能

## Plan
- [x] Step 1: 启用 Supabase 手机号认证
- [x] Step 2: 创建数据库迁移脚本
  - [x] 创建 profiles 表
  - [x] 创建 auth.uid() 函数
  - [x] 创建触发器 on_auth_user_confirmed
  - [x] 为现有表添加 user_id 字段
  - [x] 修改 user_settings 表 user_id 类型
  - [x] 启用 RLS 并创建访问策略
  - [x] 创建绑定数据函数
- [x] Step 3: 应用数据库迁移
- [x] Step 4: 创建认证上下文 (AuthContext.tsx)
- [x] Step 5: 创建路由守卫 (RouteGuard.tsx)
- [x] Step 6: 创建登录页面 (Login.tsx)
- [x] Step 7: 创建注册页面 (Register.tsx)
- [x] Step 8: 更新 App.tsx 集成认证
- [x] Step 9: 更新 routes.tsx 添加登录注册路由
- [x] Step 10: 更新 Sidebar 添加用户信息和退出按钮
- [x] Step 11: 创建 shadcn/ui 基础组件 (Button, Input, Card)
- [x] Step 12: 更新类型定义添加 user_id 字段
- [ ] Step 13: 测试登录注册流程
- [ ] Step 14: 验证手机号 15538838360 数据绑定

## Notes
- ✅ 数据库迁移已成功应用
- ✅ 手机号认证已启用
- ✅ 现有数据将在手机号 15538838360 登录时自动绑定
- ⚠️ 存在一些现有代码的类型错误（与登录功能无关）
- ℹ️ 登录页面使用手机号+验证码方式
- ℹ️ 注册页面支持设置用户名（可选，仅字母数字下划线）
- ℹ️ 用户信息显示在侧边栏底部
- ℹ️ 未登录用户访问受保护路由会自动跳转到登录页
- ℹ️ 登录/注册页面路径：/login 和 /register
- ℹ️ 手机号格式：+86 + 11位手机号
- ℹ️ 验证码：6位数字

## Completed
1. 数据库迁移成功应用，包含：
   - profiles 表（id, phone, username, created_at, updated_at）
   - auth.uid() 函数
   - handle_new_user() 触发器函数
   - bind_existing_data_to_user() 绑定函数
   - RLS 策略
2. 认证上下文 AuthContext 创建完成
3. 路由守卫 RouteGuard 创建完成
4. 登录页面 Login 创建完成
5. 注册页面 Register 创建完成
6. App.tsx 集成认证组件
7. routes.tsx 添加登录注册路由
8. Sidebar 添加用户信息和退出按钮
9. shadcn/ui 基础组件创建完成
10. 类型定义更新完成

---

# Previous Task: 为考试记录列表添加星级列，修改期数为考试名称和索引号

## Plan
- [x] Step 1: 创建数据库迁移文件，添加 rating、exam_name 和 index_number 字段
- [x] Step 2: 应用数据库迁移，设置约束和索引
- [x] Step 3: 更新 ExamRecord 类型定义，添加新字段
- [x] Step 4: 更新 UploadFormData 和其他相关类型
- [x] Step 5: 添加 API 函数：updateExamRating、checkIndexNumberExists、updateExamIndexNumber、getNextIndexNumber
- [x] Step 6: 修改 getAllExamRecords 函数，按索引号排序
- [x] Step 7: 更新 Upload 页面，将期数改为考试名称和索引号
- [x] Step 8: 修改 ExamList 页面，添加星级列
- [x] Step 9: 修改 ExamDetail 页面，显示考试名称和索引
- [x] Step 10: 修改 Dashboard 页面，更新图表显示
- [x] Step 11: 修复 dataParser.ts 和 generateTestData.ts 的类型错误
- [x] Step 12: 运行 lint 检查
- [x] Step 13: 优化列宽和布局
  - [x] 缩小总分、平均分、击败率列宽（90px）
  - [x] 星级列移到倒数第二列
  - [x] 星级列设置最小宽度150px
  - [x] 操作列固定在右侧
  - [x] 添加横向滚动支持
- [x] Step 14: 将内联编辑改为抽屉形式
  - [x] 移除内联编辑逻辑
  - [x] 添加 Drawer 组件
  - [x] 使用 Form 组件管理表单
  - [x] 添加移动端响应式支持
  - [x] 修复焦点问题
- [x] Step 15: 在历次考试各模块详细数据表中添加用时列
  - [x] 修改 getModuleDetailedStats API，添加 time_used 字段
  - [x] 更新 Dashboard 数据类型定义
  - [x] 在表格列中添加用时显示（仅大模块）
  - [x] 在总计行中计算总用时
  - [x] 将秒转换为分钟显示
- [x] Step 16: 添加导出 Excel 功能
  - [x] 安装 xlsx 库
  - [x] 实现导出函数
  - [x] 添加导出按钮
  - [x] 包含所有数据（主模块和子模块）
  - [x] 使用考试名称作为列标题
- [x] Step 17: 修改备注功能
  - [x] 添加数据库字段 improvements 和 mistakes
  - [x] 更新类型定义
  - [x] 添加 updateExamNotes API 函数
  - [x] 修改详情页备注显示为两列布局
  - [x] 修改详情页编辑对话框为两个输入框
  - [x] 在考试记录列表添加备注列
  - [x] 添加两个图标按钮（进步和错误）
  - [x] 点击图标弹窗显示对应内容
- [x] Step 18: 添加用时超时警告功能
  - [x] 在详情页添加用时超时检测
  - [x] 显示警告提示和建议
  - [x] 添加视觉标识（红色边框）
- [x] Step 19: 添加考试日历模块
  - [x] 在Dashboard页面添加日历组件
  - [x] 按日期显示考试记录
  - [x] 不同分数段用不同颜色标识
  - [x] 鼠标悬停显示考试信息
  - [x] 点击跳转到详情页
  - [x] 添加颜色图例说明
- [x] Step 20: 优化用时编辑功能
  - [x] 将用时输入改为整数分钟
  - [x] 步进值设置为1分钟
  - [x] 添加输入验证，只允许整数
  - [x] 简化显示格式
- [x] Step 21: 排查并修复数据同步问题
  - [x] 添加上传页面数据保存日志
  - [x] 添加Dashboard数据加载日志
  - [x] 添加模块数量和列表输出
  - [x] 用户测试：上传新记录，查看日志
  - [x] 定位问题原因：使用了exam_number而不是index_number
  - [x] 修复数据查询，使用index_number
  - [x] 在表头添加考试名称和日期显示
  - [x] 修复表头显示问题：确保显示所有考试记录（包括没有模块数据的记录）

## 已解决问题

### 上传失败问题：难度系数超出范围（已修复）
**问题描述：**
上传图片时提示失败，接口报错：
```
new row for relation "exam_records" violates check constraint "exam_records_difficulty_check"
```

**问题原因：**
1. 数据库约束要求 `difficulty` 字段值在 0-5 范围内
2. OCR 识别出的难度系数可能超过 5（如识别出 5.2）
3. 插入数据时违反约束导致上传失败

**解决方案：**
在数据解析时添加验证：
- 检查 difficulty 是否超过 5
- 如果超过，自动限制为 5
- 添加警告日志记录原始值

**最终效果：**
- 即使 OCR 识别出超范围的难度系数，也能正常上传
- 自动修正为合法值
- 保留日志便于调试

**修改文件：**
- `/workspace/app-7q11e4xackch/src/services/dataParser.ts` - 添加难度系数范围验证

### 上传页面用户体验优化（已完成）
**问题描述：**
上传过程中用户可能会修改输入框的值或清空图片，导致数据不一致或上传失败。

**解决方案：**
添加全屏 loading 遮罩，在上传过程中：
1. 固定在屏幕中央显示
2. 半透明黑色背景，阻止用户操作
3. 显示大号 Spin 加载图标
4. 显示当前处理步骤
5. 显示进度条（带蓝绿渐变色）
6. 提示用户不要关闭或刷新页面

**最终效果：**
- 防止用户在上传过程中进行误操作
- 更清晰的加载状态展示
- 更专业的视觉效果

**修改文件：**
- `/workspace/app-7q11e4xackch/src/pages/Upload.tsx` - 添加全屏遮罩

### 考试详情页图表显示问题（已修复）
**问题描述：**
1. 各模块用时对比图的纵坐标显示秒，不太合适
2. 各模块正确率雷达图的图例颜色与实际颜色不一致
3. 雷达图 hover 时没有显示当前项的值和目标值

**问题原因：**
1. 用时对比图直接显示秒数，没有转换为分钟
2. 雷达图的图例名称和颜色配置不正确
3. tooltip 触发方式设置为 'axis'，导致无法正确显示数据

**解决方案：**
1. **各模块用时对比图**：
   - yAxis 名称改为"用时(分钟)"
   - yAxis 标签格式化：将秒转换为分钟显示
   - tooltip 格式化：显示分钟数

2. **各模块正确率雷达图**：
   - 将系列名称从"我的"改为"实际"
   - "实际"系列颜色改为蓝色（#1890FF）
   - "目标"系列颜色改为绿色（#52C41A）
   - tooltip 触发方式改为 'item'
   - tooltip 显示所有模块的当前值

**最终效果：**
- 用时对比图纵坐标显示分钟，更直观
- 雷达图图例颜色与实际颜色一致
- hover 雷达图时显示完整的模块数据

**修改文件：**
- `/workspace/app-7q11e4xackch/src/pages/ExamDetail.tsx` - 图表配置

### 用时显示错误（已修复）
**问题描述：**
用户在上传考试成绩时输入120分钟，但考试记录列表显示为7200分钟。

**问题原因：**
1. 数据库存储的是**秒**（120分钟 = 7200秒）
2. 显示时直接将秒数当作分钟显示（7200秒 → 显示为7200分钟）
3. 编辑时也没有正确转换单位

**解决方案：**
1. **ExamList 页面**：
   - 表格显示：将秒转换为分钟（`Math.round(value / 60)`）
   - 编辑表单初始化：将秒转换为分钟
   - 保存时：将分钟转换为秒（`value * 60`）

2. **ExamDetail 页面**：
   - 显示用时时将秒转换为分钟

3. **Upload 页面**：
   - 设置默认用时为120分钟

**最终效果：**
- 输入120分钟 → 存储7200秒 → 显示120分钟 ✓
- 编辑时显示正确的分钟数
- 新上传时默认显示120分钟

**修改文件：**
- `/workspace/app-7q11e4xackch/src/pages/ExamList.tsx` - 表格显示、表单初始化、保存逻辑
- `/workspace/app-7q11e4xackch/src/pages/ExamDetail.tsx` - 用时显示
- `/workspace/app-7q11e4xackch/src/pages/Upload.tsx` - 默认值设置

### 数据同步问题（已修复）
**问题描述：**
1. 首页"历次考试各模块详细数据表"的数据数量与考试记录列表不一致
2. 表头没有显示考试日期
3. 某些考试记录（如第40期）在表头中缺失

**问题原因：**
1. 考试记录列表显示的是 `index_number`（用户设置的索引号）
2. Dashboard的模块详细数据表使用的是 `exam_number`（内部编号）进行查询
3. 两个字段的值不同，导致显示的期数不一致
4. 表头只显示期数，没有显示考试名称和日期
5. **关键问题**：表头期数从 `moduleDetailedStats` 获取，如果某个考试记录没有模块数据，就不会显示在表头

**解决方案：**
1. 修改 `getModuleDetailedStats` 函数：
   - 使用 `index_number` 而不是 `exam_number` 进行查询和排序
   - 同时获取 `exam_name` 和 `exam_date` 字段
   - 确保返回所有考试记录的模块数据

2. 修改 Dashboard 页面：
   - **改为从 `examRecords` 获取所有考试期数**，而不是从 `moduleDetailedStats`
   - 从 `examRecords` 构建 `examInfoMap` 映射
   - 表头格式改为：`考试名称 - 考试日期`
   - 如果没有日期，只显示考试名称
   - 更新类型定义，包含新增字段
   - 添加详细日志，显示哪些考试记录缺少模块数据

**最终效果：**
- 所有8条考试记录都显示在表头，即使某些记录没有模块数据
- 表头显示完整信息，例如：`第33期 - 2025-11-18`
- 数据按照 `index_number` 排序，与考试记录列表完全一致
- 没有模块数据的列显示 `-`
- 用户可以看到完整的考试历史

**修改文件：**
- `/workspace/app-7q11e4xackch/src/db/api.ts` - getModuleDetailedStats函数
- `/workspace/app-7q11e4xackch/src/pages/Dashboard.tsx` - 表头显示逻辑和期数获取逻辑

## Notes
- 星级功能使用 Ant Design 的 Rate 组件，支持半星，范围 0-5
- 索引号用于排序，设置唯一约束，不能重复
- 考试名称替代原来的期数概念
- 所有相关页面都已更新以使用新的字段
- 数据库迁移已成功应用
- 所有类型定义已更新
- Lint 检查通过，无错误
- 列布局已优化，星级列在倒数第二列，操作列固定
- 编辑功能已改为抽屉形式，提供更好的用户体验
- 移动端响应式已实现，抽屉在移动端全屏显示
- 用时列仅显示在大模块（6大模块）上，子模块不显示
- 用时以分钟为单位显示，保留1位小数
- Excel 导出功能包含所有模块数据，使用考试名称作为列标题
- 导出的文件名包含当前日期
- 备注功能分为两部分：有进步的地方（绿色）和出错的地方（红色）
- 详情页使用两列布局展示备注
- 列表页使用两个图标按钮，有内容时高亮显示
- 点击图标弹窗显示完整内容

## Completed
1. 数据库添加了 rating、exam_name 和 index_number 字段
2. 添加了相关的 API 函数
3. Upload 页面支持输入考试名称和索引号
4. ExamList 页面添加了星级列，可以直接点击星星评分
5. ExamList 页面将期数改为索引号和考试名称
6. ExamDetail 页面显示考试名称和索引号
7. Dashboard 页面的图表使用考试名称
8. 所有相关文件的类型定义已更新
9. Lint 检查通过
10. 列布局优化完成：
    - 总分、平均分、击败率列宽缩小到90px
    - 星级列移到倒数第二列，宽度150px
    - 操作列固定在右侧
    - 添加横向滚动支持
11. 编辑功能改为抽屉形式：
    - 移除了表格内联编辑
    - 使用 Drawer + Form 组件
    - 完善的表单验证
    - 移动端全屏显示
    - 桌面端固定宽度480px
    - 响应式布局适配
12. 历次考试各模块详细数据表添加用时列：
    - API 返回 time_used 字段（秒）
    - 表格显示用时列（分钟，保留1位小数）
    - 仅大模块显示用时，子模块不显示
    - 总计行计算所有大模块的总用时
13. Excel 导出功能：
    - 安装并集成 xlsx 库
    - 实现完整的导出逻辑
    - 导出包含所有主模块和子模块数据
    - 使用考试名称作为列标题
    - 子模块名称前添加缩进标识
    - 文件名包含当前日期
    - 添加导出按钮到表格标题栏
14. 备注功能优化：
    - 数据库添加 improvements 和 mistakes 字段
    - 添加 updateExamNotes API 函数
    - 详情页改为两列布局显示备注
    - 编辑对话框改为两个独立输入框
    - 列表页添加备注列，包含两个图标按钮
    - 有内容时图标高亮显示（绿色/红色）
    - 点击图标弹窗显示完整内容
    - 弹窗使用对应的颜色主题

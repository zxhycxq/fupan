# 用户登录功能准备文档

## 当前系统状态

### 数据存储方式
- **当前**：所有数据存储在单一数据库中，无用户隔离
- **数据表**：
  - `exam_records` - 考试记录
  - `module_stats` - 模块统计
  - `user_settings` - 用户设置（目前使用 'default' 作为用户ID）
  - `exam_config` - 考试配置

### 数据归属
- 当前所有数据属于"默认用户"
- 用户设置使用 `user_id = 'default'`
- 无用户认证和授权机制

## 下一版本计划：用户登录功能

### 功能需求
1. **用户注册**
   - 邮箱注册
   - 密码强度验证
   - 邮箱验证（可选）

2. **用户登录**
   - 邮箱密码登录
   - 记住登录状态
   - 自动登录

3. **用户管理**
   - 个人信息编辑
   - 密码修改
   - 账号注销

### 数据迁移策略

#### 方案一：保留现有数据给第一个注册用户
```sql
-- 1. 创建用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 为现有数据添加 user_id 字段
ALTER TABLE exam_records ADD COLUMN user_id UUID;
ALTER TABLE module_stats ADD COLUMN user_id UUID;
ALTER TABLE user_settings MODIFY COLUMN user_id UUID;
ALTER TABLE exam_config ADD COLUMN user_id UUID;

-- 3. 第一个注册用户时，将现有数据关联到该用户
-- （在应用层实现）
```

#### 方案二：现有数据作为演示数据
```sql
-- 1. 创建用户表（同方案一）

-- 2. 为现有数据添加 user_id 字段
ALTER TABLE exam_records ADD COLUMN user_id UUID;
ALTER TABLE module_stats ADD COLUMN user_id UUID;
ALTER TABLE user_settings MODIFY COLUMN user_id UUID;
ALTER TABLE exam_config ADD COLUMN user_id UUID;

-- 3. 创建演示用户
INSERT INTO users (id, email, password_hash) 
VALUES ('00000000-0000-0000-0000-000000000000', 'demo@example.com', 'demo_hash');

-- 4. 将现有数据关联到演示用户
UPDATE exam_records SET user_id = '00000000-0000-0000-0000-000000000000';
UPDATE module_stats SET user_id = '00000000-0000-0000-0000-000000000000';
UPDATE user_settings SET user_id = '00000000-0000-0000-0000-000000000000';
UPDATE exam_config SET user_id = '00000000-0000-0000-0000-000000000000';

-- 5. 新用户注册时，复制演示数据到新用户
-- （在应用层实现）
```

### 推荐方案
**方案一：保留现有数据给第一个注册用户**

理由：
1. 保护用户现有数据
2. 第一个注册用户可以继续使用已有数据
3. 实现简单，无需复制数据

### 实现步骤

#### 阶段一：数据库准备
1. 使用 Supabase Auth 创建用户认证
2. 为所有数据表添加 `user_id` 字段
3. 创建数据库触发器，自动设置 `user_id`
4. 配置 Row Level Security (RLS) 策略

#### 阶段二：前端实现
1. 创建登录/注册页面
2. 实现用户认证流程
3. 添加用户状态管理（Context/Redux）
4. 更新所有 API 调用，自动带上用户ID

#### 阶段三：数据迁移
1. 检测是否为第一个注册用户
2. 如果是，将现有数据关联到该用户
3. 如果不是，创建空白数据

#### 阶段四：测试和优化
1. 测试多用户数据隔离
2. 测试数据迁移流程
3. 性能优化

### 技术选型

#### 认证方案
- **Supabase Auth**（推荐）
  - 优点：与数据库集成，支持多种登录方式，RLS 自动处理
  - 缺点：依赖 Supabase 服务

#### 状态管理
- **React Context**（推荐）
  - 优点：简单，无需额外依赖
  - 缺点：大型应用可能性能不佳

#### 路由保护
- **React Router + Protected Route**
  - 未登录用户重定向到登录页
  - 已登录用户可访问所有页面

### 数据库 Schema 变更

```sql
-- 用户表（Supabase Auth 自动创建）
-- auth.users

-- 为现有表添加 user_id
ALTER TABLE exam_records 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

ALTER TABLE module_stats 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

ALTER TABLE user_settings 
ALTER COLUMN user_id TYPE UUID USING user_id::uuid,
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE exam_config 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 创建索引
CREATE INDEX idx_exam_records_user_id ON exam_records(user_id);
CREATE INDEX idx_module_stats_user_id ON module_stats(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_exam_config_user_id ON exam_config(user_id);

-- RLS 策略
ALTER TABLE exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_config ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can only access their own exam_records" 
ON exam_records FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own module_stats" 
ON module_stats FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own user_settings" 
ON user_settings FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own exam_config" 
ON exam_config FOR ALL 
USING (auth.uid() = user_id);
```

### 前端代码变更

#### 1. 创建 AuthContext
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

#### 2. 创建 ProtectedRoute
```typescript
// src/components/common/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spin } from 'antd';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

#### 3. 更新路由配置
```typescript
// src/routes.tsx
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // 所有需要登录的页面
    ],
  },
];
```

### 注意事项

1. **数据安全**
   - 使用 RLS 确保用户只能访问自己的数据
   - 密码使用 bcrypt 加密
   - 敏感操作需要二次验证

2. **性能优化**
   - 为 user_id 字段创建索引
   - 使用连接池管理数据库连接
   - 实现数据缓存机制

3. **用户体验**
   - 记住登录状态
   - 自动登录
   - 友好的错误提示

4. **数据迁移**
   - 备份现有数据
   - 测试迁移脚本
   - 提供回滚方案

## 时间规划

- **第1周**：数据库设计和 Supabase Auth 配置
- **第2周**：前端登录/注册页面开发
- **第3周**：数据迁移和 RLS 策略实现
- **第4周**：测试和优化

## 风险评估

1. **数据丢失风险**：中等
   - 缓解措施：完整备份，测试迁移脚本

2. **性能风险**：低
   - 缓解措施：添加索引，优化查询

3. **用户体验风险**：低
   - 缓解措施：平滑过渡，提供帮助文档

## 下一步行动

1. ✅ 整理现有代码，添加注释
2. ✅ 确保现有功能正常运行
3. ⏳ 设计用户认证流程
4. ⏳ 创建数据库迁移脚本
5. ⏳ 实现登录/注册页面

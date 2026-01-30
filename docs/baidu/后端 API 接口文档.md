# 📡 后端 API 接口文档

## 基础信息

**Base URL**: `http://your-domain.com/api` 或 `http://your-ip:3000/api`

**认证方式**: JWT Bearer Token

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**响应格式**:
```json
{
  "status": 0,           // 0-成功, 非0-失败
  "msg": "操作成功",      // 响应消息
  "data": {}             // 响应数据（可选）
}
```

---

## 1. 认证相关 API

### 1.1 发送短信验证码

**接口**: `POST /auth/send-code`

**说明**: 发送短信验证码（用于登录/注册）

**请求参数**:
```json
{
  "phone": "13800138000",
  "purpose": "login"  // login-登录, register-注册
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "验证码发送成功",
  "data": {
    "sessionId": "80959b59-7e54-4177-9024-3bd4c1f2ee08",
    "expiresAt": "2025-01-30T12:35:00Z"
  }
}
```

**错误码**:
- `1001`: 手机号格式错误
- `1002`: 发送频率过快（60秒内只能发送一次）
- `1003`: 短信服务异常

---

### 1.2 验证码登录/注册

**接口**: `POST /auth/login`

**说明**: 使用验证码登录或注册（自动注册新用户）

**请求参数**:
```json
{
  "phone": "13800138000",
  "code": "379016",
  "sessionId": "80959b59-7e54-4177-9024-3bd4c1f2ee08"
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800,  // 7天（秒）
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "phone": "13800138000",
      "nickname": "用户13800138000",
      "avatarUrl": null,
      "role": "user",
      "isVip": false,
      "vipExpiresAt": null
    }
  }
}
```

**错误码**:
- `2001`: 验证码错误
- `2002`: 验证码已过期
- `2003`: sessionId 无效
- `2004`: 验证码已使用

---

### 1.3 刷新 Token

**接口**: `POST /auth/refresh`

**说明**: 使用 refreshToken 刷新 accessToken

**请求参数**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "Token 刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

**错误码**:
- `2101`: refreshToken 无效
- `2102`: refreshToken 已过期

---

### 1.4 退出登录

**接口**: `POST /auth/logout`

**说明**: 退出登录（清除会话）

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "status": 0,
  "msg": "退出成功"
}
```

---

## 2. 用户相关 API

### 2.1 获取当前用户信息

**接口**: `GET /users/me`

**说明**: 获取当前登录用户的详细信息

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "status": 0,
  "msg": "获取成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "phone": "13800138000",
    "nickname": "张三",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "user",
    "isVip": true,
    "vipExpiresAt": "2025-12-31T23:59:59Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLoginAt": "2025-01-30T10:00:00Z"
  }
}
```

---

### 2.2 更新用户信息

**接口**: `PUT /users/me`

**说明**: 更新当前用户的昵称和头像

**请求头**: 需要 Authorization

**请求参数**:
```json
{
  "nickname": "新昵称",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "更新成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nickname": "新昵称",
    "avatarUrl": "https://example.com/new-avatar.jpg"
  }
}
```

---

### 2.3 获取用户资料

**接口**: `GET /users/me/profile`

**说明**: 获取用户详细资料

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "status": 0,
  "msg": "获取成功",
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "bio": "个人简介",
    "location": "北京",
    "website": "https://example.com",
    "birthday": "1990-01-01",
    "gender": "male"
  }
}
```

---

### 2.4 更新用户资料

**接口**: `PUT /users/me/profile`

**说明**: 更新用户详细资料

**请求头**: 需要 Authorization

**请求参数**:
```json
{
  "bio": "新的个人简介",
  "location": "上海",
  "website": "https://newsite.com",
  "birthday": "1990-01-01",
  "gender": "male"
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "更新成功"
}
```

---

## 3. 考试记录 API

### 3.1 上传考试记录

**接口**: `POST /exam-records`

**说明**: 上传考试成绩截图并识别

**请求头**: 需要 Authorization

**请求参数** (multipart/form-data):
```
image: File (考试截图)
examNumber: Number (考试期数)
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "上传成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "examNumber": 1,
    "totalScore": 61.6,
    "totalTime": 14,
    "examDate": "2025-01-30",
    "modules": [
      {
        "moduleName": "政治理论",
        "score": 15,
        "totalQuestions": 20,
        "correctQuestions": 15,
        "timeSpent": 28
      }
    ]
  }
}
```

**错误码**:
- `3001`: 图片格式不支持
- `3002`: 图片大小超过限制（最大 5MB）
- `3003`: OCR 识别失败
- `3004`: 考试期数已存在

---

### 3.2 获取考试记录列表

**接口**: `GET /exam-records`

**说明**: 获取当前用户的考试记录列表

**请求头**: 需要 Authorization

**查询参数**:
```
page: Number (页码，默认 1)
pageSize: Number (每页数量，默认 10)
sortBy: String (排序字段，默认 examDate)
sortOrder: String (排序方向，asc/desc，默认 desc)
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "获取成功",
  "data": {
    "records": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "examNumber": 1,
        "totalScore": 61.6,
        "totalTime": 14,
        "examDate": "2025-01-30",
        "createdAt": "2025-01-30T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 3.3 获取考试记录详情

**接口**: `GET /exam-records/:id`

**说明**: 获取指定考试记录的详细信息

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "status": 0,
  "msg": "获取成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "examNumber": 1,
    "totalScore": 61.6,
    "totalTime": 14,
    "examDate": "2025-01-30",
    "modules": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174000",
        "moduleName": "政治理论",
        "parentModule": null,
        "score": 15,
        "totalQuestions": 20,
        "correctQuestions": 15,
        "timeSpent": 28
      },
      {
        "id": "789e0123-e89b-12d3-a456-426614174000",
        "moduleName": "马克思主义",
        "parentModule": "政治理论",
        "score": 2,
        "totalQuestions": 3,
        "correctQuestions": 2,
        "timeSpent": 3
      }
    ]
  }
}
```

---

### 3.4 删除考试记录

**接口**: `DELETE /exam-records/:id`

**说明**: 删除指定的考试记录

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "status": 0,
  "msg": "删除成功"
}
```

---

### 3.5 获取统计数据

**接口**: `GET /exam-records/statistics`

**说明**: 获取考试统计数据

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "status": 0,
  "msg": "获取成功",
  "data": {
    "totalExams": 10,
    "averageScore": 62.1,
    "highestScore": 100,
    "lowestScore": 48.9,
    "scoreDistribution": [
      { "range": "0-20", "count": 0 },
      { "range": "20-40", "count": 1 },
      { "range": "40-60", "count": 3 },
      { "range": "60-80", "count": 5 },
      { "range": "80-100", "count": 1 }
    ],
    "modulesAverage": [
      { "moduleName": "政治理论", "averageScore": 75 },
      { "moduleName": "常识判断", "averageScore": 47 }
    ]
  }
}
```

---

## 4. VIP 申请 API

### 4.1 提交 VIP 申请

**接口**: `POST /vip-applications`

**说明**: 提交 VIP 申请（上传支付截图）

**请求头**: 需要 Authorization

**请求参数** (multipart/form-data):
```
paymentScreenshot: File (支付截图)
transactionNumber: String (流水号，可选)
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "申请提交成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "456e7890-e89b-12d3-a456-426614174000",
    "userPhone": "13800138000",
    "paymentScreenshotUrl": "https://bos.example.com/screenshots/xxx.jpg",
    "transactionNumber": "202501301234567890",
    "status": "pending",
    "createdAt": "2025-01-30T10:00:00Z"
  }
}
```

**错误码**:
- `4001`: 图片格式不支持
- `4002`: 图片大小超过限制（最大 5MB）
- `4003`: 已有待审核的申请

---

### 4.2 获取我的 VIP 申请

**接口**: `GET /vip-applications/me`

**说明**: 获取当前用户的 VIP 申请记录

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "status": 0,
  "msg": "获取成功",
  "data": {
    "applications": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "paymentScreenshotUrl": "https://bos.example.com/screenshots/xxx.jpg",
        "transactionNumber": "202501301234567890",
        "status": "pending",
        "adminNote": null,
        "reviewedAt": null,
        "createdAt": "2025-01-30T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.3 获取所有 VIP 申请（管理员）

**接口**: `GET /admin/vip-applications`

**说明**: 获取所有 VIP 申请记录（仅管理员）

**请求头**: 需要 Authorization（管理员权限）

**查询参数**:
```
status: String (状态筛选，pending/approved/rejected，可选)
page: Number (页码，默认 1)
pageSize: Number (每页数量，默认 10)
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "获取成功",
  "data": {
    "applications": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "userId": "456e7890-e89b-12d3-a456-426614174000",
        "userPhone": "13800138000",
        "paymentScreenshotUrl": "https://bos.example.com/screenshots/xxx.jpg",
        "transactionNumber": "202501301234567890",
        "status": "pending",
        "adminNote": null,
        "reviewedBy": null,
        "reviewedAt": null,
        "createdAt": "2025-01-30T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**错误码**:
- `5001`: 无权限访问

---

### 4.4 审核 VIP 申请（管理员）

**接口**: `PUT /admin/vip-applications/:id`

**说明**: 审核 VIP 申请（仅管理员）

**请求头**: 需要 Authorization（管理员权限）

**请求参数**:
```json
{
  "status": "approved",  // approved-通过, rejected-拒绝
  "adminNote": "审核备注"
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "审核成功",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "approved",
    "adminNote": "审核备注",
    "reviewedBy": "789e0123-e89b-12d3-a456-426614174000",
    "reviewedAt": "2025-01-30T11:00:00Z"
  }
}
```

**错误码**:
- `5001`: 无权限访问
- `5002`: 申请不存在
- `5003`: 申请已审核

---

## 5. 文件上传 API

### 5.1 上传图片

**接口**: `POST /upload/image`

**说明**: 上传图片到百度云 BOS

**请求头**: 需要 Authorization

**请求参数** (multipart/form-data):
```
image: File (图片文件)
type: String (图片类型，avatar/screenshot/other)
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "上传成功",
  "data": {
    "url": "https://bos.example.com/images/xxx.jpg",
    "filename": "xxx.jpg",
    "size": 102400,
    "mimeType": "image/jpeg"
  }
}
```

**错误码**:
- `6001`: 文件格式不支持（仅支持 jpg, jpeg, png, gif）
- `6002`: 文件大小超过限制（最大 5MB）
- `6003`: 上传失败

---

## 6. 用户设置 API

### 6.1 获取用户设置

**接口**: `GET /users/me/settings`

**说明**: 获取当前用户的所有设置

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "status": 0,
  "msg": "获取成功",
  "data": {
    "settings": [
      {
        "settingKey": "theme",
        "settingValue": "dark",
        "settingType": "string"
      },
      {
        "settingKey": "notifications",
        "settingValue": "true",
        "settingType": "boolean"
      }
    ]
  }
}
```

---

### 6.2 更新用户设置

**接口**: `PUT /users/me/settings`

**说明**: 更新用户设置

**请求头**: 需要 Authorization

**请求参数**:
```json
{
  "settingKey": "theme",
  "settingValue": "dark",
  "settingType": "string"
}
```

**响应示例**:
```json
{
  "status": 0,
  "msg": "更新成功"
}
```

---

## 错误码汇总

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 手机号格式错误 |
| 1002 | 发送频率过快 |
| 1003 | 短信服务异常 |
| 2001 | 验证码错误 |
| 2002 | 验证码已过期 |
| 2003 | sessionId 无效 |
| 2004 | 验证码已使用 |
| 2101 | refreshToken 无效 |
| 2102 | refreshToken 已过期 |
| 3001 | 图片格式不支持 |
| 3002 | 图片大小超过限制 |
| 3003 | OCR 识别失败 |
| 3004 | 考试期数已存在 |
| 4001 | 图片格式不支持 |
| 4002 | 图片大小超过限制 |
| 4003 | 已有待审核的申请 |
| 5001 | 无权限访问 |
| 5002 | 申请不存在 |
| 5003 | 申请已审核 |
| 6001 | 文件格式不支持 |
| 6002 | 文件大小超过限制 |
| 6003 | 上传失败 |
| 9999 | 系统错误 |

---

## 认证说明

### JWT Token 结构

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "phone": "13800138000",
  "role": "user",
  "iat": 1706601600,
  "exp": 1707206400
}
```

### Token 使用

```javascript
// 请求示例
fetch('http://your-domain.com/api/users/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
```

### Token 刷新机制

1. accessToken 有效期：7天
2. refreshToken 有效期：30天
3. 当 accessToken 过期时，使用 refreshToken 刷新
4. 如果 refreshToken 也过期，需要重新登录

---

## 文件上传说明

### 支持的图片格式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)

### 文件大小限制

- 最大 5MB

### 上传示例

```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('type', 'screenshot');

fetch('http://your-domain.com/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
```

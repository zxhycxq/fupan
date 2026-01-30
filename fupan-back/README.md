# Fupan后端服务

Fupan项目的后端服务，提供OCR识别、身份验证和其他API服务。

## 功能特性

- **OCR识别**: 基于百度AI的光学字符识别，带有自动令牌管理
- **令牌管理**: 自动获取和刷新百度AI访问令牌(有效期30天，在过期前1天刷新)
- **安全性**: 速率限制、输入验证和防止滥用
- **可扩展**: 设计用于支持身份验证和验证码等附加服务

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fupan-back
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   - `BAIDU_API_KEY`: Your Baidu AI API Key
   - `BAIDU_SECRET_KEY`: Your Baidu AI Secret Key

## Configuration

The application uses the following environment variables:

- `PORT`: Port to run the server on (default: 8080)
- `NODE_ENV`: Environment mode (development/production)
- `FRONTEND_URL`: Frontend URL for CORS (default: '*')
- `BAIDU_API_KEY`: Baidu AI API Key
- `BAIDU_SECRET_KEY`: Baidu AI Secret Key
- `RATE_LIMIT_MAX`: Maximum requests per IP per window (default: 100)

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API端点

### OCR服务

- `GET /api/ocr/token` - 获取当前访问令牌(内部使用)
- `POST /api/ocr/recognize` - 对图像执行OCR识别(前端调用此端点)

#### OCR识别请求

```json
{
  "image": "base64_encoded_image_string",
  "language_type": "CHN_ENG"
}
```

支持的语言类型:
- `CHN_ENG` (中文和英文，默认)
- `ENG` (英文)
- `JAP` (日文)
- `KOR` (韩文)
- `FRE` (法文)
- `SPA` (西班牙文)
- `POR` (葡萄牙文)
- `GER` (德文)
- `ITA` (意大利文)
- `RUS` (俄文)

#### OCR Recognition Response

```json
{
  "success": true,
  "data": "recognized text from the image",
  "timestamp": 1234567890
}
```

### Authentication Service (Future Implementation)

- `POST /api/auth/generate-verification-code` - Generate verification code
- `POST /api/auth/verify-code` - Verify a code
- `POST /api/auth/login` - Login endpoint

## 安全特性

- **速率限制**: 通过限制每个IP的请求数量防止滥用
- **输入验证**: 验证所有传入的请求
- **负载大小检查**: 确保请求大小在限制范围内
- **内容类型验证**: 确保适当的内容类型
- **输入清理**: 清理传入的数据
- **Helmet**: 向响应添加安全头部
- **CORS**: 为安全跨域请求配置

## 架构

```
前端应用程序
         ↓
    HTTP请求
         ↓
   Express服务器
         ↓
身份验证和验证中间件
         ↓
    API处理器
         ↓
  外部服务(百度AI)
```

## 令牌管理

系统自动管理百度AI访问令牌:

1. 检查是否存在有效令牌(1天内不会过期)
2. 如果不存在有效令牌，则获取新令牌
3. 存储令牌及其过期时间
4. 在过期前1天刷新令牌(令牌有效期为30天)

## 错误处理

应用程序提供适当的HTTP状态码和描述性错误消息:

- `200`: 成功
- `400`: 错误请求(验证错误)
- `404`: 未找到
- `413`: 负载过大
- `429`: 请求过多
- `500`: 内部服务器错误

## 未来增强功能

- 用户身份验证和会话管理
- 验证码生成和验证
- 图像缓存以减少API调用
- 详细日志记录和监控
- 集成其他AI服务
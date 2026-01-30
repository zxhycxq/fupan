# Fupan 后端服务部署指南

## 目录
1. [部署概述](#部署概述)
2. [环境准备](#环境准备)
3. [配置文件说明](#配置文件说明)
4. [生产环境配置](#生产环境配置)
5. [部署步骤](#部署步骤)
6. [安全最佳实践](#安全最佳实践)
7. [监控与维护](#监控与维护)
8. [故障排查](#故障排查)

## 部署概述

本指南详细说明如何将 Fupan 后端服务部署到生产服务器。后端服务基于 Express.js 框架，提供 OCR 识别、身份验证等 API 服务。

**重要原则**：
- `.env` 文件绝对不能上传到服务器或 Git 仓库
- 生产环境必须使用 HTTPS
- 敏感信息（API 密钥）应通过环境变量管理

## 环境准备

### 1. 服务器要求
- **操作系统**：Linux (Ubuntu 20.04+/CentOS 7+) 或 Windows Server 2019+
- **Node.js**：v18.x 或 v20.x（推荐 LTS 版本）
- **npm**：v9.x 或更高版本
- **内存**：至少 1GB RAM（建议 2GB+）
- **磁盘空间**：至少 500MB 可用空间

### 2. 安装依赖
```bash
# 安装 Node.js 和 npm（以 Ubuntu 为例）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

## 配置文件说明

### 1. 核心配置文件
| 文件路径 | 用途 | 是否需要上传 |
|---------|------|-------------|
| `config/config.js` | 应用程序配置 | ✅ 是 |
| `.env.example` | 环境变量示例 | ✅ 是 |
| `.gitignore` | Git 忽略规则 | ✅ 是 |

### 2. 环境变量说明
**`.env` 文件内容示例**（在服务器上创建，不要提交到 Git）：
```env
# 服务器配置
PORT=8080
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# 百度AI凭证（敏感信息！）
BAIDU_API_KEY=your_actual_api_key_here
BAIDU_SECRET_KEY=your_actual_secret_key_here

# 安全配置
RATE_LIMIT_MAX=50
```

### 3. 配置文件结构
```
fupan-back/
├── config/
│   └── config.js          # 应用程序配置
├── .env.example           # 环境变量示例
├── server.js              # 主服务器文件
├── start.js               # 启动脚本
└── package.json
```

## 生产环境配置

### 1. 安全增强配置
在 `config/config.js` 中添加生产环境特定配置：

```javascript
module.exports = {
  // 服务器配置
  port: process.env.PORT || 8080,
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || '*',
  
  // 生产环境安全设置
  isProduction: process.env.NODE_ENV === 'production',
  showDetailedErrors: process.env.NODE_ENV !== 'production',
  
  // 百度AI配置
  baidu: {
    apiKey: process.env.BAIDU_API_KEY,
    secretKey: process.env.BAIDU_SECRET_KEY,
    tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
    ocrUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic'
  },
  
  // 安全配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: process.env.RATE_LIMIT_MAX || 50, // 生产环境限制更严格
    message: '请求过于频繁，请稍后再试。'
  }
};
```

### 2. CORS 配置优化
在 `server.js` 中更新 CORS 配置：

```javascript
// 生产环境：只允许特定域名
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-domain.com',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
}));
```

## 部署步骤

### 方式一：使用 PM2（推荐）

#### 1. 安装 PM2
```bash
npm install -g pm2
```

#### 2. 创建生态系统配置文件
创建 `ecosystem.config.js` 文件：
```javascript
module.exports = {
  apps: [{
    name: 'fupan-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    watch: false,
    ignore_watch: ['node_modules', '.git'],
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
```

#### 3. 创建日志目录
```bash
mkdir -p logs
```

#### 4. 启动应用
```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs fupan-backend
```

#### 5. 设置开机自启
```bash
pm2 startup
pm2 save
```

### 方式二：使用 systemd（Linux）

#### 1. 创建服务文件
创建 `/etc/systemd/system/fupan-backend.service` 文件：
```ini
[Unit]
Description=Fupan Backend Service
After=network.target

[Service]
User=node
WorkingDirectory=/path/to/fupan-back
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
StandardOutput=syslog
StandardError=syslog

[Install]
WantedBy=multi-user.target
```

#### 2. 启动服务
```bash
sudo systemctl daemon-reload
sudo systemctl enable fupan-backend
sudo systemctl start fupan-backend
```

## 安全最佳实践

### 1. 环境变量管理
- **绝对不要**将 `.env` 文件提交到 Git
- 使用服务器环境变量或云服务商的 secrets manager
- 对于开发环境，使用 `.env.local` 而不是 `.env`

### 2. API 密钥保护
```bash
# 检查 .gitignore 是否包含 .env
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### 3. HTTPS 配置
推荐使用 Nginx 反向代理 + Let's Encrypt：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # HTTP重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location /api/ocr {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 其他API路由
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 监控与维护

### 1. 日志管理
- 定期清理日志文件
- 设置日志轮转（logrotate）
- 监控错误日志中的异常

### 2. 性能监控
```bash
# PM2 监控
pm2 monit

# 查看资源使用情况
pm2 list
pm2 show fupan-backend
```

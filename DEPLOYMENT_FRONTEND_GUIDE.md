# Fupan 前端服务部署指南

## 目录
1. [部署概述](#部署概述)
2. [环境准备](#环境准备)
3. [环境变量配置](#环境变量配置)
4. [构建配置](#构建配置)
5. [部署步骤](#部署步骤)
6. [与后端集成](#与后端集成)
7. [安全最佳实践](#安全最佳实践)
8. [故障排查](#故障排查)

## 部署概述

本指南详细说明如何将 Fupan 前端服务部署到生产服务器。前端服务基于 React + Vite 框架,需要与后端服务协同工作.

**重要原则**：
- 使用环境变量管理 API 地址，避免硬编码
- 生产环境必须使用 HTTPS
- 前后端部署方案需协调一致

## 环境准备

### 1. 服务器要求
- **操作系统**：Linux (Ubuntu 20.04+/CentOS 7+) 或 Windows Server 2019+
- **Node.js**：v18.x 或 v20.x（推荐 LTS 版本）
- **npm**：v9.x 或更高版本
- **内存**：至少 1GB RAM（建议 2GB+）
- **磁盘空间**：至少 1GB 可用空间

### 2. 安装依赖
```bash
# 安装 Node.js 和 npm（以 Ubuntu 为例）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

## 环境变量配置

### 1. 环境变量文件结构
| 文件路径 | 用途 | 是否需要上传 |
|---------|------|-------------|
| `.env.development` | 开发环境变量 | ✅ 是 |
| `.env.production` | 生产环境变量 | ✅ 是 |
| `.gitignore` | Git 忽略规则 | ✅ 是 |

### 2. 环境变量说明

**`.env.development`**（开发环境）：
```env
# 开发环境配置
VITE_API_BASE_URL=http://localhost:5173
VITE_OCR_API_BASE_URL=http://localhost:8080/api/ocr
VITE_NODE_ENV=development
```

**`.env.production`**（生产环境）：
```env
# 生产环境配置
VITE_API_BASE_URL=https://your-domain.com
VITE_OCR_API_BASE_URL=https://your-domain.com/api/ocr
VITE_NODE_ENV=production
```

### 3. 代码中使用环境变量

#### 在 `src/services/imageRecognition.ts` 中：
```typescript
// 获取API基础URL
const getOcrApiBaseUrl = () => {
  // 开发环境使用代理，生产环境使用相对路径或环境变量
  if (import.meta.env.MODE === 'development') {
    return import.meta.env.VITE_OCR_API_BASE_URL || '/api/ocr';
  } else {
    // 生产环境：如果部署在同一域名下，使用相对路径
    // 如果部署在不同域名，使用环境变量
    return import.meta.env.VITE_OCR_API_BASE_URL || '/api/ocr';
  }
};

// 调用通用文字识别(高精度版)API
export async function recognizeText(request: OcrRequest): Promise<string> {
  try {
    const baseUrl = getOcrApiBaseUrl();
    
    // 发送请求到后端OCR服务
    const response = await fetch(`${baseUrl}/recognize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: request.image,
        language_type: request.language_type || 'CHN_ENG'
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'OCR recognition failed');
    }

    return result.data;
  } catch (error) {
    console.error('文字识别失败:', error);
    throw error;
  }
}
```

## 构建配置

### 1. Vite 配置优化

#### 修改 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// 根据环境决定是否需要代理
const isDevelopment = process.env.NODE_ENV === 'development';

export default defineConfig({
  server: {
    // 开发环境才需要代理配置
    proxy: isDevelopment ? {
      '/api/ocr': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ocr/, ''),
      },
    } : undefined, // 生产环境不需要代理
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2. 构建脚本配置

**`package.json`**：
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "build:prod": "cross-env NODE_ENV=production vite build"
  }
}
```

## 部署步骤

### 方式一：静态文件部署（推荐）

#### 1. 构建前端应用
```bash
# 构建生产环境版本
npm run build

# 输出目录：dist/
```

#### 2. 部署到 Nginx
创建 Nginx 配置：
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
    
    # 前端静态文件
    root /var/www/fupan-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API路由代理到后端
    location /api/ocr {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 其他API路由
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 方式二：Docker 部署

#### 1. 创建 Dockerfile
```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

#### 2. 创建 nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name _;
        
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
        
        # API路由代理到后端
        location /api/ocr {
            proxy_pass http://backend:8080;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /api {
            proxy_pass http://backend:8080;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

# 考试成绩分析系统 - 部署指南

本文档详细说明如何将考试成绩分析系统部署到阿里云或腾讯云服务器。

## 目录

- [系统架构](#系统架构)
- [前置准备](#前置准备)
- [方案一：使用Supabase云服务（推荐）](#方案一使用supabase云服务推荐)
- [方案二：完全自托管部署](#方案二完全自托管部署)
- [方案三：混合部署](#方案三混合部署)
- [域名和SSL配置](#域名和ssl配置)
- [监控和维护](#监控和维护)
- [常见问题](#常见问题)

---

## 系统架构

本项目采用前后端分离架构：

- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Supabase (PostgreSQL + RESTful API + 实时订阅)
- **存储**: Supabase Storage (对象存储)
- **认证**: Supabase Auth (可选，当前未启用)

---

## 前置准备

### 1. 服务器要求

**最低配置**（适合测试/小规模使用）：
- CPU: 2核
- 内存: 2GB
- 硬盘: 20GB SSD
- 带宽: 1Mbps

**推荐配置**（适合生产环境）：
- CPU: 4核
- 内存: 4GB
- 硬盘: 40GB SSD
- 带宽: 5Mbps

**操作系统**: Ubuntu 20.04 LTS 或 Ubuntu 22.04 LTS

### 2. 域名准备

- 一个已备案的域名（如果在国内服务器部署）
- DNS解析权限

### 3. 必备软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必备工具
sudo apt install -y curl wget git vim ufw
```

---

## 方案一：使用Supabase云服务（推荐）

这是最简单、最快速的部署方案，适合大多数场景。

### 优势

- ✅ 部署简单，维护成本低
- ✅ 自动备份和高可用
- ✅ 全球CDN加速
- ✅ 免费额度充足（500MB数据库，1GB存储，50MB文件上传）
- ✅ 自动SSL证书
- ✅ 实时数据库功能

### 步骤详解

#### 1. Supabase项目配置（已完成）

您的项目已经配置好Supabase，相关信息在 `.env` 文件中：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 2. 安装Node.js和pnpm

```bash
# 安装Node.js 18.x (推荐使用LTS版本)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version  # 应显示 v18.x.x
npm --version

# 安装pnpm
npm install -g pnpm

# 验证pnpm安装
pnpm --version
```

#### 3. 克隆项目代码

```bash
# 创建项目目录
sudo mkdir -p /var/www
cd /var/www

# 克隆代码（替换为您的仓库地址）
sudo git clone <your-repository-url> exam-analysis
cd exam-analysis

# 设置目录权限
sudo chown -R $USER:$USER /var/www/exam-analysis
```

#### 4. 配置环境变量

```bash
# 创建生产环境配置文件
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ID=your_app_id
VITE_API_ENV=production
EOF

# 设置文件权限
chmod 600 .env.production
```

**重要**: 将上述配置中的值替换为您的实际Supabase项目信息。

#### 5. 构建前端项目

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm run build

# 构建完成后，dist目录包含所有静态文件
ls -la dist/
```

#### 6. 安装和配置Nginx

```bash
# 安装Nginx
sudo apt install -y nginx

# 创建网站配置
sudo tee /etc/nginx/sites-available/exam-analysis << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/exam-analysis/dist;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 日志
    access_log /var/log/nginx/exam-analysis-access.log;
    error_log /var/log/nginx/exam-analysis-error.log;
}
EOF

# 启用网站
sudo ln -s /etc/nginx/sites-available/exam-analysis /etc/nginx/sites-enabled/

# 删除默认网站（可选）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

**重要**: 将 `your-domain.com` 替换为您的实际域名。

#### 7. 配置防火墙

```bash
# 启用UFW防火墙
sudo ufw enable

# 允许SSH（重要！）
sudo ufw allow 22/tcp

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看防火墙状态
sudo ufw status
```

#### 8. 配置SSL证书（Let's Encrypt）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书（自动配置Nginx）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

Certbot会自动修改Nginx配置，添加SSL支持。

#### 9. 验证部署

1. 访问 `https://your-domain.com`
2. 检查以下功能：
   - ✅ 页面正常加载
   - ✅ 可以上传考试记录
   - ✅ 数据正常显示
   - ✅ 图表正常渲染
   - ✅ 富文本编辑器正常工作

#### 10. 设置自动部署脚本

创建部署脚本方便后续更新：

```bash
# 创建部署脚本
cat > /var/www/exam-analysis/deploy.sh << 'EOF'
#!/bin/bash

echo "开始部署..."

# 进入项目目录
cd /var/www/exam-analysis

# 拉取最新代码
echo "拉取最新代码..."
git pull origin master

# 安装依赖
echo "安装依赖..."
pnpm install

# 构建项目
echo "构建项目..."
pnpm run build

# 重启Nginx
echo "重启Nginx..."
sudo systemctl reload nginx

echo "部署完成！"
EOF

# 设置执行权限
chmod +x /var/www/exam-analysis/deploy.sh
```

后续更新只需运行：

```bash
cd /var/www/exam-analysis
./deploy.sh
```

---

## 方案二：完全自托管部署

如果您需要完全控制数据，可以自己部署PostgreSQL数据库。

### 优势

- ✅ 完全数据控制
- ✅ 无第三方依赖
- ✅ 可自定义数据库配置

### 劣势

- ❌ 部署复杂度高
- ❌ 需要自己维护数据库
- ❌ 需要自己实现API层
- ❌ 需要自己处理备份和高可用

### 步骤详解

#### 1. 安装PostgreSQL

```bash
# 安装PostgreSQL 14
sudo apt install -y postgresql-14 postgresql-contrib-14

# 启动PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 切换到postgres用户
sudo -u postgres psql

# 在psql中执行以下命令：
CREATE DATABASE exam_analysis;
CREATE USER exam_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE exam_analysis TO exam_user;
\q
```

#### 2. 导入数据库结构

```bash
# 从Supabase导出SQL（在本地执行）
# 登录Supabase Dashboard -> SQL Editor -> 复制所有migration文件内容

# 在服务器上导入
sudo -u postgres psql exam_analysis < schema.sql
```

#### 3. 安装PostgREST（提供RESTful API）

```bash
# 下载PostgREST
wget https://github.com/PostgREST/postgrest/releases/download/v11.2.2/postgrest-v11.2.2-linux-static-x64.tar.xz

# 解压
tar -xf postgrest-v11.2.2-linux-static-x64.tar.xz

# 移动到系统路径
sudo mv postgrest /usr/local/bin/
sudo chmod +x /usr/local/bin/postgrest

# 创建配置文件
sudo mkdir -p /etc/postgrest
sudo tee /etc/postgrest/config << 'EOF'
db-uri = "postgres://exam_user:your_strong_password@localhost:5432/exam_analysis"
db-schemas = "public"
db-anon-role = "exam_user"
server-host = "127.0.0.1"
server-port = 3000
EOF

# 创建systemd服务
sudo tee /etc/systemd/system/postgrest.service << 'EOF'
[Unit]
Description=PostgREST API Server
After=postgresql.service

[Service]
Type=simple
User=postgres
ExecStart=/usr/local/bin/postgrest /etc/postgrest/config
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl start postgrest
sudo systemctl enable postgrest

# 检查状态
sudo systemctl status postgrest
```

#### 4. 配置Nginx反向代理

```bash
# 修改Nginx配置，添加API代理
sudo tee /etc/nginx/sites-available/exam-analysis << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/exam-analysis/dist;
    index index.html;
    
    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 重启Nginx
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. 修改前端配置

```bash
# 修改.env.production
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://your-domain.com/api
VITE_SUPABASE_ANON_KEY=your_jwt_secret
VITE_APP_ID=your_app_id
VITE_API_ENV=production
EOF

# 重新构建
pnpm run build
```

#### 6. 配置数据库备份

```bash
# 创建备份脚本
sudo tee /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/exam_analysis_$DATE.sql.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
sudo -u postgres pg_dump exam_analysis | gzip > $BACKUP_FILE

# 删除30天前的备份
find $BACKUP_DIR -name "exam_analysis_*.sql.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_FILE"
EOF

# 设置执行权限
sudo chmod +x /usr/local/bin/backup-db.sh

# 添加定时任务（每天凌晨2点备份）
sudo crontab -e
# 添加以下行：
0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## 方案三：混合部署

前端部署在阿里云/腾讯云，后端使用Supabase云服务。

### 优势

- ✅ 国内访问速度快（前端）
- ✅ 后端维护简单（Supabase）
- ✅ 成本适中

### 步骤

1. 按照**方案一**的步骤1-4配置Supabase
2. 按照**方案一**的步骤5-10部署前端到云服务器
3. 配置CDN加速（可选）

---

## 域名和SSL配置

### 阿里云域名配置

1. 登录阿里云控制台
2. 进入**域名** -> **域名列表**
3. 点击**解析**
4. 添加记录：
   - 记录类型: A
   - 主机记录: @ (或 www)
   - 记录值: 您的服务器IP
   - TTL: 10分钟

### 腾讯云域名配置

1. 登录腾讯云控制台
2. 进入**域名注册** -> **我的域名**
3. 点击**解析**
4. 添加记录：
   - 记录类型: A
   - 主机记录: @ (或 www)
   - 记录值: 您的服务器IP
   - TTL: 600

### SSL证书配置

#### 方式一：Let's Encrypt（免费，推荐）

已在方案一步骤8中说明。

#### 方式二：阿里云/腾讯云SSL证书

1. 在云服务商控制台申请免费SSL证书
2. 下载Nginx格式证书
3. 上传到服务器：

```bash
# 创建证书目录
sudo mkdir -p /etc/nginx/ssl

# 上传证书文件
sudo scp your-cert.pem root@your-server:/etc/nginx/ssl/
sudo scp your-key.pem root@your-server:/etc/nginx/ssl/

# 修改Nginx配置
sudo tee /etc/nginx/sites-available/exam-analysis << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/your-cert.pem;
    ssl_certificate_key /etc/nginx/ssl/your-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    root /var/www/exam-analysis/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 重启Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## 监控和维护

### 1. 系统监控

#### 安装监控工具

```bash
# 安装htop（进程监控）
sudo apt install -y htop

# 安装iotop（磁盘IO监控）
sudo apt install -y iotop

# 安装nethogs（网络监控）
sudo apt install -y nethogs
```

#### 查看系统状态

```bash
# 查看CPU和内存
htop

# 查看磁盘使用
df -h

# 查看磁盘IO
sudo iotop

# 查看网络连接
sudo nethogs

# 查看Nginx日志
sudo tail -f /var/log/nginx/exam-analysis-access.log
sudo tail -f /var/log/nginx/exam-analysis-error.log
```

### 2. 日志管理

```bash
# 配置日志轮转
sudo tee /etc/logrotate.d/exam-analysis << 'EOF'
/var/log/nginx/exam-analysis-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
EOF
```

### 3. 性能优化

#### Nginx优化

```bash
# 编辑Nginx主配置
sudo vim /etc/nginx/nginx.conf

# 优化配置项：
worker_processes auto;
worker_connections 2048;
keepalive_timeout 65;
client_max_body_size 10M;
```

#### 启用HTTP/2

已在SSL配置中包含 `http2` 参数。

#### 启用Brotli压缩（可选）

```bash
# 安装Brotli模块
sudo apt install -y nginx-module-brotli

# 在Nginx配置中添加
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 4. 安全加固

```bash
# 禁用root SSH登录
sudo vim /etc/ssh/sshd_config
# 修改: PermitRootLogin no
sudo systemctl restart sshd

# 安装fail2ban防止暴力破解
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 配置fail2ban
sudo tee /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
maxretry = 5
bantime = 3600
EOF

sudo systemctl restart fail2ban
```

### 5. 定期更新

```bash
# 创建更新脚本
cat > /usr/local/bin/system-update.sh << 'EOF'
#!/bin/bash

echo "开始系统更新..."

# 更新软件包列表
sudo apt update

# 升级软件包
sudo apt upgrade -y

# 清理旧包
sudo apt autoremove -y
sudo apt autoclean

echo "系统更新完成！"
EOF

chmod +x /usr/local/bin/system-update.sh

# 添加定时任务（每周日凌晨3点更新）
sudo crontab -e
# 添加：
0 3 * * 0 /usr/local/bin/system-update.sh >> /var/log/system-update.log 2>&1
```

---

## 常见问题

### 1. 页面无法访问

**检查步骤**：

```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查Nginx配置
sudo nginx -t

# 检查防火墙
sudo ufw status

# 检查端口监听
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# 查看Nginx错误日志
sudo tail -50 /var/log/nginx/error.log
```

### 2. 数据无法加载

**检查步骤**：

1. 打开浏览器开发者工具（F12）
2. 查看Network标签，检查API请求状态
3. 检查Console标签，查看错误信息
4. 验证Supabase配置：

```bash
# 检查环境变量
cat /var/www/exam-analysis/.env.production

# 测试Supabase连接
curl -X GET "YOUR_SUPABASE_URL/rest/v1/exam_records" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY"
```

### 3. 上传文件失败

**检查步骤**：

```bash
# 检查Nginx上传大小限制
sudo vim /etc/nginx/nginx.conf
# 确保有: client_max_body_size 10M;

# 重启Nginx
sudo systemctl restart nginx
```

### 4. SSL证书问题

**检查步骤**：

```bash
# 检查证书有效期
sudo certbot certificates

# 手动续期
sudo certbot renew

# 测试续期
sudo certbot renew --dry-run
```

### 5. 性能问题

**优化建议**：

1. 启用CDN加速（阿里云CDN或腾讯云CDN）
2. 优化图片大小
3. 启用浏览器缓存
4. 使用HTTP/2
5. 启用Gzip/Brotli压缩

### 6. 数据库连接问题（自托管方案）

**检查步骤**：

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查PostgREST状态
sudo systemctl status postgrest

# 测试数据库连接
sudo -u postgres psql exam_analysis -c "SELECT version();"

# 查看PostgREST日志
sudo journalctl -u postgrest -n 50
```

---

## 成本估算

### 方案一：Supabase云服务

**Supabase免费额度**：
- 数据库: 500MB
- 存储: 1GB
- 带宽: 2GB/月
- API请求: 无限制

**阿里云/腾讯云服务器**：
- 轻量应用服务器: ¥60-100/月（2核2G）
- 域名: ¥50-100/年
- SSL证书: 免费（Let's Encrypt）

**总成本**: 约 ¥70-110/月

### 方案二：完全自托管

**服务器配置**：
- 云服务器: ¥150-300/月（4核4G）
- 域名: ¥50-100/年
- SSL证书: 免费
- 备份存储: ¥20-50/月

**总成本**: 约 ¥180-360/月

### 方案三：混合部署

与方案一成本相同，约 ¥70-110/月

---

## 推荐方案

根据不同场景推荐：

### 个人学习/小型项目
- **推荐**: 方案一（Supabase云服务）
- **理由**: 成本低、部署简单、维护方便

### 中小型企业
- **推荐**: 方案三（混合部署）
- **理由**: 国内访问快、成本适中、可靠性高

### 大型企业/高安全要求
- **推荐**: 方案二（完全自托管）
- **理由**: 数据完全可控、可定制化、符合合规要求

---

## 技术支持

如果在部署过程中遇到问题，可以：

1. 查看项目README.md
2. 检查Nginx错误日志
3. 查看浏览器开发者工具
4. 参考Supabase官方文档: https://supabase.com/docs
5. 参考Nginx官方文档: https://nginx.org/en/docs/

---

## 更新日志

- 2025-01-22: 初始版本
- 包含三种部署方案
- 详细的步骤说明
- 监控和维护指南
- 常见问题解答

---

**祝您部署顺利！** 🚀

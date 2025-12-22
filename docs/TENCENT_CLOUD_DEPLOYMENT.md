# 腾讯云部署指南

## 📋 目录

- [前置准备](#前置准备)
- [服务器配置](#服务器配置)
- [OCR服务配置](#ocr服务配置)
- [应用部署](#应用部署)
- [域名和HTTPS](#域名和https)
- [监控和维护](#监控和维护)

---

## 前置准备

### 1. 腾讯云账号

1. 注册腾讯云账号：https://cloud.tencent.com/
2. 完成实名认证
3. 充值（建议至少100元）

### 2. 购买服务器

**推荐配置**:
- **CPU**: 2核
- **内存**: 4GB
- **带宽**: 5Mbps
- **系统**: Ubuntu 22.04 LTS
- **地域**: 根据用户分布选择（如广州、上海、北京）

**购买步骤**:
1. 进入 [轻量应用服务器控制台](https://console.cloud.tencent.com/lighthouse)
2. 点击"新建"
3. 选择地域和配置
4. 选择镜像：Ubuntu 22.04 LTS
5. 设置服务器名称
6. 购买并等待创建完成

### 3. 获取服务器信息

创建完成后，记录以下信息：
- **公网IP**: xxx.xxx.xxx.xxx
- **用户名**: ubuntu（或root）
- **密码**: 在控制台重置密码

---

## 服务器配置

### 1. 连接服务器

```bash
# 使用SSH连接
ssh ubuntu@your-server-ip

# 或使用腾讯云控制台的"登录"按钮
```

### 2. 更新系统

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. 安装Node.js

```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载配置
source ~/.bashrc

# 安装Node.js 18
nvm install 18
nvm use 18

# 验证安装
node -v  # 应该显示 v18.x.x
npm -v   # 应该显示 9.x.x
```

### 4. 安装Nginx

```bash
sudo apt install nginx -y

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
sudo nginx -v
```

### 5. 配置防火墙

```bash
# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

## OCR服务配置

### 方式一：使用百度OCR（推荐）

#### 1. 注册百度智能云

1. 访问 https://cloud.baidu.com/
2. 注册并完成实名认证

#### 2. 开通OCR服务

1. 进入 [文字识别控制台](https://console.bce.baidu.com/ai/#/ai/ocr/overview/index)
2. 点击"立即使用"
3. 选择"通用文字识别（高精度版）"
4. 点击"开通服务"

#### 3. 创建应用

1. 点击"创建应用"
2. 填写应用名称：`考试成绩分析系统`
3. 填写应用描述
4. 点击"立即创建"
5. 记录 **API Key** 和 **Secret Key**

#### 4. 获取Access Token

百度OCR API需要先获取access_token才能调用。

**方法1：使用curl获取**

```bash
curl -X POST \
  'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=YOUR_API_KEY&client_secret=YOUR_SECRET_KEY'
```

**响应示例**:
```json
{
  "access_token": "24.xxxxx.xxxxx.xxxxx",
  "expires_in": 2592000
}
```

**方法2：在服务器端实现自动获取**

创建 `server/ocr-proxy.js`:

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

const API_KEY = 'your-api-key';
const SECRET_KEY = 'your-secret-key';

let accessToken = '';
let tokenExpireTime = 0;

// 获取access_token
async function getAccessToken() {
  const now = Date.now();
  
  // 如果token未过期，直接返回
  if (accessToken && now < tokenExpireTime) {
    return accessToken;
  }
  
  try {
    const response = await axios.post(
      'https://aip.baidubce.com/oauth/2.0/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: API_KEY,
          client_secret: SECRET_KEY,
        },
      }
    );
    
    accessToken = response.data.access_token;
    tokenExpireTime = now + (response.data.expires_in - 3600) * 1000; // 提前1小时刷新
    
    console.log('获取access_token成功，有效期:', response.data.expires_in, '秒');
    return accessToken;
  } catch (error) {
    console.error('获取access_token失败:', error);
    throw error;
  }
}

// OCR识别接口
app.post('/api/ocr/recognize', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: '缺少图片数据' });
    }
    
    // 获取access_token
    const token = await getAccessToken();
    
    // 调用百度OCR API
    const formData = new URLSearchParams();
    formData.append('image', image);
    formData.append('language_type', 'CHN_ENG');
    formData.append('detect_direction', 'true');
    formData.append('probability', 'true');
    formData.append('paragraph', 'true');
    formData.append('recognize_granularity', 'big');
    formData.append('vertexes_location', 'true');
    
    const response = await axios.post(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${token}`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    // 返回结果
    res.json({
      status: 0,
      msg: 'success',
      data: response.data,
    });
  } catch (error) {
    console.error('OCR识别失败:', error);
    res.status(500).json({
      status: -1,
      msg: error.message || 'OCR识别失败',
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`OCR代理服务器运行在端口 ${PORT}`);
});
```

**安装依赖**:
```bash
npm install express axios
```

**启动服务**:
```bash
node server/ocr-proxy.js
```

**使用PM2保持运行**:
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server/ocr-proxy.js --name ocr-proxy

# 设置开机自启
pm2 startup
pm2 save
```

#### 5. 修改前端代码

修改 `src/services/imageRecognition.ts`:

```typescript
// 修改API地址
const API_BASE_URL = '/api/ocr';  // 指向自己的代理服务器

// 修改请求逻辑
const response = await fetch(`${API_BASE_URL}/recognize`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ image: request.image }),
});
```

#### 6. 配置Nginx反向代理

编辑 `/etc/nginx/sites-available/exam-analysis`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/exam-analysis/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # OCR API代理
    location /api/ocr/ {
        proxy_pass http://localhost:3001/api/ocr/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 增加超时时间（OCR识别可能需要较长时间）
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

重启Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 方式二：使用腾讯云OCR

#### 1. 开通腾讯云OCR服务

1. 进入 [文字识别控制台](https://console.cloud.tencent.com/ocr)
2. 点击"立即使用"
3. 选择"通用印刷体识别（高精度版）"
4. 开通服务

#### 2. 获取API密钥

1. 进入 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 点击"新建密钥"
3. 记录 **SecretId** 和 **SecretKey**

#### 3. 安装腾讯云SDK

```bash
npm install tencentcloud-sdk-nodejs
```

#### 4. 创建OCR服务

参考 [OCR_INTEGRATION.md](./OCR_INTEGRATION.md#迁移指南) 文档。

---

## 应用部署

### 1. 上传代码

**方式一：使用Git**

```bash
# 在服务器上
cd /var/www
git clone <your-repository-url> exam-analysis
cd exam-analysis

# 安装依赖
npm install

# 构建
npm run build
```

**方式二：使用SCP**

```bash
# 在本地
npm run build
scp -r dist/* ubuntu@your-server-ip:/var/www/exam-analysis/dist/
```

### 2. 配置Nginx

创建配置文件：

```bash
sudo nano /etc/nginx/sites-available/exam-analysis
```

粘贴以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    root /var/www/exam-analysis/dist;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # OCR API代理（如果使用自建代理）
    location /api/ocr/ {
        proxy_pass http://localhost:3001/api/ocr/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/exam-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 配置环境变量

在服务器上创建 `.env` 文件：

```bash
cd /var/www/exam-analysis
nano .env
```

粘贴以下内容：

```env
# Supabase配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 应用ID
VITE_APP_ID=app-7q11e4xackch

# API环境
VITE_API_ENV=production
```

### 4. 重新构建

```bash
npm run build
```

### 5. 测试访问

在浏览器中访问：`http://your-server-ip`

---

## 域名和HTTPS

### 1. 配置域名

#### 1.1 购买域名

在腾讯云或其他域名注册商购买域名。

#### 1.2 添加DNS解析

1. 进入 [DNS解析控制台](https://console.cloud.tencent.com/cns)
2. 添加A记录：
   - 主机记录: `@` 或 `www`
   - 记录类型: `A`
   - 记录值: `your-server-ip`
   - TTL: `600`

#### 1.3 等待DNS生效

通常需要10分钟到24小时。

**验证DNS**:
```bash
ping your-domain.com
```

### 2. 配置HTTPS

#### 2.1 安装Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 2.2 获取SSL证书

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

按提示操作：
1. 输入邮箱地址
2. 同意服务条款
3. 选择是否重定向HTTP到HTTPS（推荐选择2）

#### 2.3 自动续期

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 设置定时任务
sudo crontab -e

# 添加以下行（每天凌晨2点检查续期）
0 2 * * * certbot renew --quiet
```

#### 2.4 验证HTTPS

访问 `https://your-domain.com`，应该看到绿色的锁图标。

---

## 监控和维护

### 1. 查看Nginx日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 2. 查看OCR代理日志

```bash
# 如果使用PM2
pm2 logs ocr-proxy

# 如果使用systemd
sudo journalctl -u ocr-proxy -f
```

### 3. 监控服务器资源

```bash
# CPU和内存使用情况
htop

# 磁盘使用情况
df -h

# 网络连接
netstat -tunlp
```

### 4. 定期备份

#### 4.1 备份数据库

```bash
# 创建备份脚本
nano ~/backup-db.sh
```

粘贴以下内容：

```bash
#!/bin/bash

# Supabase数据库备份
# 注意：需要先安装pg_dump工具

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/exam-analysis"
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份（需要配置数据库连接信息）
pg_dump -h your-db-host -U postgres -d your-db-name > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: $BACKUP_FILE.gz"
```

设置权限并添加定时任务：

```bash
chmod +x ~/backup-db.sh

# 添加定时任务（每天凌晨3点备份）
crontab -e

# 添加以下行
0 3 * * * /home/ubuntu/backup-db.sh
```

#### 4.2 备份代码

```bash
# 创建备份脚本
nano ~/backup-code.sh
```

粘贴以下内容：

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/exam-analysis"
BACKUP_FILE="$BACKUP_DIR/code_backup_$DATE.tar.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 打包代码
tar -czf $BACKUP_FILE -C /var/www exam-analysis

# 删除30天前的备份
find $BACKUP_DIR -name "code_backup_*.tar.gz" -mtime +30 -delete

echo "代码备份完成: $BACKUP_FILE"
```

设置权限并添加定时任务：

```bash
chmod +x ~/backup-code.sh

# 添加定时任务（每周日凌晨4点备份）
crontab -e

# 添加以下行
0 4 * * 0 /home/ubuntu/backup-code.sh
```

### 5. 更新应用

```bash
# 进入项目目录
cd /var/www/exam-analysis

# 拉取最新代码
git pull

# 安装依赖
npm install

# 构建
npm run build

# 重启服务（如果有后端服务）
pm2 restart ocr-proxy

# 重载Nginx
sudo systemctl reload nginx
```

---

## 性能优化

### 1. 启用HTTP/2

编辑Nginx配置：

```nginx
server {
    listen 443 ssl http2;  # 添加 http2
    server_name your-domain.com;
    
    # ... 其他配置 ...
}
```

### 2. 配置缓存

```nginx
# 在http块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;

server {
    # ... 其他配置 ...
    
    # 缓存API响应
    location /api/ {
        proxy_cache my_cache;
        proxy_cache_valid 200 10m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://localhost:3001/api/;
    }
}
```

### 3. 配置CDN（可选）

1. 进入 [CDN控制台](https://console.cloud.tencent.com/cdn)
2. 添加域名
3. 配置源站（填写服务器IP）
4. 配置缓存规则
5. 等待配置生效

---

## 安全加固

### 1. 修改SSH端口

```bash
sudo nano /etc/ssh/sshd_config

# 修改端口（例如改为2222）
Port 2222

# 重启SSH服务
sudo systemctl restart sshd

# 更新防火墙规则
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

### 2. 禁用root登录

```bash
sudo nano /etc/ssh/sshd_config

# 修改以下配置
PermitRootLogin no

# 重启SSH服务
sudo systemctl restart sshd
```

### 3. 配置fail2ban

```bash
# 安装fail2ban
sudo apt install fail2ban -y

# 创建配置文件
sudo nano /etc/fail2ban/jail.local
```

粘贴以下内容：

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 2222  # 如果修改了SSH端口
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
```

启动fail2ban:
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# 查看状态
sudo fail2ban-client status
```

### 4. 定期更新系统

```bash
# 创建更新脚本
nano ~/update-system.sh
```

粘贴以下内容：

```bash
#!/bin/bash

echo "开始更新系统..."

# 更新软件包列表
sudo apt update

# 升级软件包
sudo apt upgrade -y

# 清理不需要的软件包
sudo apt autoremove -y
sudo apt autoclean

echo "系统更新完成"
```

设置权限并添加定时任务：

```bash
chmod +x ~/update-system.sh

# 添加定时任务（每周一凌晨5点更新）
crontab -e

# 添加以下行
0 5 * * 1 /home/ubuntu/update-system.sh
```

---

## 常见问题

### 1. 无法访问网站

**检查清单**:
- [ ] 服务器是否运行
- [ ] Nginx是否启动：`sudo systemctl status nginx`
- [ ] 防火墙是否开放80/443端口：`sudo ufw status`
- [ ] DNS是否解析正确：`ping your-domain.com`

### 2. OCR识别失败

**检查清单**:
- [ ] OCR代理服务是否运行：`pm2 status`
- [ ] API密钥是否正确
- [ ] access_token是否过期
- [ ] 图片格式和大小是否符合要求
- [ ] 查看OCR代理日志：`pm2 logs ocr-proxy`

### 3. 数据库连接失败

**检查清单**:
- [ ] Supabase项目是否正常
- [ ] 环境变量是否配置正确
- [ ] 网络是否正常
- [ ] 查看浏览器控制台错误信息

### 4. HTTPS证书问题

**检查清单**:
- [ ] 域名是否解析正确
- [ ] 80端口是否开放
- [ ] Certbot是否安装成功
- [ ] 查看Certbot日志：`sudo certbot certificates`

---

## 快速命令参考

### 服务管理

```bash
# Nginx
sudo systemctl start nginx    # 启动
sudo systemctl stop nginx     # 停止
sudo systemctl restart nginx  # 重启
sudo systemctl reload nginx   # 重载配置
sudo systemctl status nginx   # 查看状态

# OCR代理（PM2）
pm2 start ocr-proxy          # 启动
pm2 stop ocr-proxy           # 停止
pm2 restart ocr-proxy        # 重启
pm2 logs ocr-proxy           # 查看日志
pm2 status                   # 查看状态
```

### 日志查看

```bash
# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# OCR代理日志
pm2 logs ocr-proxy

# 系统日志
sudo journalctl -f
```

### 文件操作

```bash
# 查看磁盘使用
df -h

# 查看目录大小
du -sh /var/www/exam-analysis

# 清理日志
sudo find /var/log -name "*.log" -mtime +30 -delete
```

---

## 下一步

- ✅ 完成服务器配置
- ✅ 部署应用
- ✅ 配置域名和HTTPS
- ✅ 设置监控和备份
- 📖 阅读其他文档了解更多细节
- 🚀 开始使用系统

---

## 技术支持

如有问题，请：

1. 查看 [常见问题](./DEPLOYMENT.md#常见问题)
2. 查看 [故障排查](./QUICK_START.md#故障排查)
3. 提交 [Issue](https://github.com/your-repo/issues)
4. 联系技术支持：support@example.com

---

最后更新: 2024-12-10

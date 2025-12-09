# 快速部署指南

> 5分钟快速部署考试成绩分析系统到阿里云/腾讯云

## 🚀 一键部署（推荐）

### 前提条件

- Ubuntu 20.04/22.04 LTS服务器
- 已备案的域名
- Supabase账号（免费）

### 部署步骤

```bash
# 1. 上传项目到服务器
scp -r exam-analysis root@your-server-ip:/root/

# 2. SSH登录服务器
ssh root@your-server-ip

# 3. 运行一键部署脚本
cd /root/exam-analysis
bash scripts/quick-deploy.sh

# 4. 按提示输入配置信息
# - 域名：exam.example.com
# - Supabase URL：从Supabase控制台获取
# - Supabase Key：从Supabase控制台获取
# - 是否配置SSL：y

# 5. 等待部署完成（约5-10分钟）
```

### 完成！

访问 `https://your-domain.com` 即可使用。

---

## 📋 手动部署

如果一键部署失败，可以按以下步骤手动部署：

### 1. 安装Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm
```

### 2. 构建项目

```bash
cd /var/www/exam-analysis
pnpm install
pnpm run build
```

### 3. 配置Nginx

```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/exam-analysis << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/exam-analysis/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/exam-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 配置说明

### 环境变量

创建 `.env.production` 文件：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ID=exam-analysis
VITE_API_ENV=production
```

### Supabase配置

1. 访问 https://supabase.com
2. 创建新项目
3. 在 Settings -> API 中获取：
   - Project URL（VITE_SUPABASE_URL）
   - anon public key（VITE_SUPABASE_ANON_KEY）

---

## 📊 服务器要求

### 最低配置

- CPU: 2核
- 内存: 2GB
- 硬盘: 20GB SSD
- 带宽: 1Mbps

### 推荐配置

- CPU: 4核
- 内存: 4GB
- 硬盘: 40GB SSD
- 带宽: 5Mbps

---

## 💰 成本估算

### 方案一：Supabase云服务（推荐）

- 服务器：¥60-100/月
- Supabase：免费（500MB数据库）
- 域名：¥50-100/年
- **总计：约¥70-110/月**

### 方案二：完全自托管

- 服务器：¥150-300/月
- 域名：¥50-100/年
- **总计：约¥180-360/月**

---

## 🔍 故障排查

### 页面无法访问

```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查防火墙
sudo ufw status

# 查看错误日志
sudo tail -50 /var/log/nginx/error.log
```

### 数据无法加载

1. 打开浏览器开发者工具（F12）
2. 查看Network标签
3. 检查API请求是否成功
4. 验证Supabase配置是否正确

### SSL证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew
```

---

## 📚 更多信息

详细部署文档请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🆘 需要帮助？

- 查看详细文档：DEPLOYMENT.md
- 检查Nginx日志：`/var/log/nginx/exam-analysis-error.log`
- 查看浏览器控制台错误
- 参考Supabase文档：https://supabase.com/docs

---

**祝您部署顺利！** 🎉

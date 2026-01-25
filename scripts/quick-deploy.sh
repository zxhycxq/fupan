#!/bin/bash

# 考试成绩分析系统 - 快速部署脚本
# 适用于Ubuntu 20.04/22.04 LTS

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then 
    print_error "请不要使用root用户运行此脚本"
    exit 1
fi

# 欢迎信息
clear
echo "================================================"
echo "    考试成绩分析系统 - 快速部署脚本"
echo "================================================"
echo ""

# 收集配置信息
print_info "请输入以下配置信息："
echo ""

read -p "域名（例如：exam.example.com）: " DOMAIN
read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "App ID（可选，直接回车跳过）: " APP_ID
read -p "是否配置SSL证书？(y/n): " SETUP_SSL

echo ""
print_info "配置信息确认："
echo "域名: $DOMAIN"
echo "Supabase URL: $SUPABASE_URL"
echo "配置SSL: $SETUP_SSL"
echo ""

read -p "确认以上信息无误？(y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    print_error "部署已取消"
    exit 1
fi

# 1. 更新系统
print_info "步骤 1/10: 更新系统..."
sudo apt update
sudo apt upgrade -y

# 2. 安装必备工具
print_info "步骤 2/10: 安装必备工具..."
sudo apt install -y curl wget git vim ufw

# 3. 安装Node.js
print_info "步骤 3/10: 安装Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 4. 安装pnpm
print_info "步骤 4/10: 安装pnpm..."
if ! command -v pnpm &> /dev/null; then
    sudo npm install -g pnpm
fi

print_info "Node.js版本: $(node --version)"
print_info "pnpm版本: $(pnpm --version)"

# 5. 创建项目目录
print_info "步骤 5/10: 创建项目目录..."
PROJECT_DIR="/var/www/exam-analysis"
if [ -d "$PROJECT_DIR" ]; then
    print_warn "项目目录已存在，是否删除并重新创建？(y/n)"
    read -p "> " RECREATE
    if [ "$RECREATE" = "y" ]; then
        sudo rm -rf "$PROJECT_DIR"
    fi
fi

sudo mkdir -p "$PROJECT_DIR"
sudo chown -R $USER:$USER "$PROJECT_DIR"

# 6. 复制项目文件
print_info "步骤 6/10: 复制项目文件..."
CURRENT_DIR=$(pwd)
if [ -f "$CURRENT_DIR/package.json" ]; then
    cp -r "$CURRENT_DIR"/* "$PROJECT_DIR/"
    cd "$PROJECT_DIR"
else
    print_error "未找到项目文件，请在项目根目录运行此脚本"
    exit 1
fi

# 7. 配置环境变量
print_info "步骤 7/10: 配置环境变量..."
cat > .env.production << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_APP_ID=${APP_ID:-exam-analysis}
VITE_API_ENV=production
EOF

chmod 600 .env.production
print_info "环境变量配置完成"

# 8. 构建项目
print_info "步骤 8/10: 构建项目..."
pnpm install
pnpm run build

if [ ! -d "dist" ]; then
    print_error "构建失败，未找到dist目录"
    exit 1
fi

print_info "项目构建完成"

# 9. 安装和配置Nginx
print_info "步骤 9/10: 安装和配置Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
fi

# 创建Nginx配置
sudo tee /etc/nginx/sites-available/exam-analysis > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    root $PROJECT_DIR/dist;
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
        try_files \$uri \$uri/ /index.html;
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
sudo ln -sf /etc/nginx/sites-available/exam-analysis /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
if sudo nginx -t; then
    print_info "Nginx配置测试通过"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    print_error "Nginx配置测试失败"
    exit 1
fi

# 10. 配置防火墙
print_info "步骤 10/10: 配置防火墙..."
if ! sudo ufw status | grep -q "Status: active"; then
    sudo ufw --force enable
fi

sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

print_info "防火墙配置完成"

# 11. 配置SSL（可选）
if [ "$SETUP_SSL" = "y" ]; then
    print_info "配置SSL证书..."
    
    if ! command -v certbot &> /dev/null; then
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    print_warn "请确保域名已正确解析到此服务器IP"
    read -p "按回车键继续..."
    
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || {
        print_warn "SSL证书配置失败，您可以稍后手动运行: sudo certbot --nginx -d $DOMAIN"
    }
fi

# 12. 创建部署脚本
print_info "创建更新部署脚本..."
cat > "$PROJECT_DIR/deploy.sh" << 'DEPLOY_SCRIPT'
#!/bin/bash

echo "开始部署..."

cd /var/www/exam-analysis

echo "拉取最新代码..."
git pull origin master || echo "跳过git拉取（非git仓库）"

echo "安装依赖..."
pnpm install

echo "构建项目..."
pnpm run build

echo "重启Nginx..."
sudo systemctl reload nginx

echo "部署完成！"
DEPLOY_SCRIPT

chmod +x "$PROJECT_DIR/deploy.sh"

# 完成
echo ""
echo "================================================"
print_info "部署完成！"
echo "================================================"
echo ""
echo "访问地址: http://$DOMAIN"
if [ "$SETUP_SSL" = "y" ]; then
    echo "HTTPS地址: https://$DOMAIN"
fi
echo ""
echo "项目目录: $PROJECT_DIR"
echo "Nginx配置: /etc/nginx/sites-available/exam-analysis"
echo "访问日志: /var/log/nginx/exam-analysis-access.log"
echo "错误日志: /var/log/nginx/exam-analysis-error.log"
echo ""
echo "后续更新命令: cd $PROJECT_DIR && ./deploy.sh"
echo ""
print_info "建议："
echo "1. 配置域名DNS解析指向此服务器IP"
echo "2. 如未配置SSL，运行: sudo certbot --nginx -d $DOMAIN"
echo "3. 定期备份数据"
echo "4. 监控服务器资源使用情况"
echo ""
print_info "祝您使用愉快！"

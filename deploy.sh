#!/bin/bash

# ============================================
# 考试成绩分析系统 - 快速部署脚本
# ============================================

set -e  # 遇到错误立即退出

echo "======================================"
echo "考试成绩分析系统 - 快速部署"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查必要工具
check_requirements() {
    echo "检查必要工具..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未安装 Node.js${NC}"
        echo "请访问 https://nodejs.org/ 安装 Node.js"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}警告: 未安装 pnpm，正在安装...${NC}"
        npm install -g pnpm
    fi
    
    echo -e "${GREEN}✓ 工具检查完成${NC}"
    echo ""
}

# 配置环境变量
configure_env() {
    echo "配置环境变量..."
    
    if [ ! -f .env.production ]; then
        echo -e "${YELLOW}未找到 .env.production 文件，正在创建...${NC}"
        
        read -p "请输入 Supabase URL: " SUPABASE_URL
        read -p "请输入 Supabase Anon Key: " SUPABASE_ANON_KEY
        read -p "请输入 App ID: " APP_ID
        
        cat > .env.production << EOF
# Supabase 配置
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# 应用配置
VITE_APP_ID=${APP_ID}
VITE_API_ENV=production
EOF
        
        echo -e "${GREEN}✓ 环境变量配置完成${NC}"
    else
        echo -e "${GREEN}✓ 环境变量文件已存在${NC}"
    fi
    echo ""
}

# 安装依赖
install_dependencies() {
    echo "安装项目依赖..."
    pnpm install
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
    echo ""
}

# 构建项目
build_project() {
    echo "构建生产版本..."
    pnpm run build
    echo -e "${GREEN}✓ 构建完成${NC}"
    echo ""
}

# 部署选项
deploy_options() {
    echo "======================================"
    echo "选择部署方式："
    echo "======================================"
    echo "1. Vercel 部署（推荐）"
    echo "2. Netlify 部署"
    echo "3. 生成部署包（手动上传）"
    echo "4. 仅构建，不部署"
    echo ""
    
    read -p "请选择 (1-4): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_netlify
            ;;
        3)
            create_deploy_package
            ;;
        4)
            echo -e "${GREEN}构建完成，产物在 dist 目录${NC}"
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            exit 1
            ;;
    esac
}

# Vercel 部署
deploy_vercel() {
    echo "准备 Vercel 部署..."
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}安装 Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    echo ""
    echo "请按照提示完成 Vercel 部署："
    echo "1. 选择项目范围"
    echo "2. 链接到现有项目或创建新项目"
    echo "3. 确认项目设置"
    echo ""
    
    vercel --prod
    
    echo -e "${GREEN}✓ Vercel 部署完成${NC}"
}

# Netlify 部署
deploy_netlify() {
    echo "准备 Netlify 部署..."
    
    if ! command -v netlify &> /dev/null; then
        echo -e "${YELLOW}安装 Netlify CLI...${NC}"
        npm install -g netlify-cli
    fi
    
    # 创建 netlify.toml
    if [ ! -f netlify.toml ]; then
        cat > netlify.toml << EOF
[build]
  command = "pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
    fi
    
    echo ""
    echo "请按照提示完成 Netlify 部署："
    echo ""
    
    netlify deploy --prod
    
    echo -e "${GREEN}✓ Netlify 部署完成${NC}"
}

# 创建部署包
create_deploy_package() {
    echo "创建部署包..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    PACKAGE_NAME="exam-analysis-${TIMESTAMP}.tar.gz"
    
    tar -czf "${PACKAGE_NAME}" dist/
    
    echo -e "${GREEN}✓ 部署包创建完成: ${PACKAGE_NAME}${NC}"
    echo ""
    echo "上传到服务器："
    echo "  scp ${PACKAGE_NAME} user@your-server:/path/to/deploy/"
    echo ""
    echo "解压并部署："
    echo "  tar -xzf ${PACKAGE_NAME}"
    echo "  mv dist/* /var/www/your-site/"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "======================================"
    echo "部署完成！"
    echo "======================================"
    echo ""
    echo "后续步骤："
    echo "1. 配置 Supabase 数据库（参考 DEPLOYMENT_GUIDE.md）"
    echo "2. 配置 Storage bucket"
    echo "3. 设置 RLS 策略"
    echo "4. 配置自定义域名（可选）"
    echo ""
    echo "详细文档: DEPLOYMENT_GUIDE.md"
    echo ""
}

# 主流程
main() {
    check_requirements
    configure_env
    install_dependencies
    build_project
    deploy_options
    show_deployment_info
}

# 执行主流程
main

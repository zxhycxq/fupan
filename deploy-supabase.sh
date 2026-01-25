#!/bin/bash

# ============================================
# Supabase 后端服务部署脚本
# ============================================

set -e

echo "======================================"
echo "Supabase 后端服务部署"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查 Supabase CLI
check_supabase_cli() {
    echo "检查 Supabase CLI..."
    
    if ! command -v supabase &> /dev/null; then
        echo -e "${YELLOW}未安装 Supabase CLI，正在安装...${NC}"
        npm install -g supabase
    fi
    
    echo -e "${GREEN}✓ Supabase CLI 已就绪${NC}"
    echo ""
}

# 登录 Supabase
login_supabase() {
    echo "登录 Supabase..."
    echo "这将打开浏览器进行身份验证"
    echo ""
    
    supabase login
    
    echo -e "${GREEN}✓ 登录成功${NC}"
    echo ""
}

# 链接项目
link_project() {
    echo "链接 Supabase 项目..."
    echo ""
    
    read -p "请输入项目 Reference ID (在 Supabase Dashboard 的 Settings > General 中查看): " PROJECT_REF
    
    supabase link --project-ref "${PROJECT_REF}"
    
    echo -e "${GREEN}✓ 项目链接成功${NC}"
    echo ""
}

# 初始化数据库
init_database() {
    echo "======================================"
    echo "初始化数据库"
    echo "======================================"
    echo ""
    echo "选择初始化方式："
    echo "1. 使用 SQL 文件（推荐）"
    echo "2. 使用迁移文件"
    echo "3. 跳过（手动在 Dashboard 执行）"
    echo ""
    
    read -p "请选择 (1-3): " choice
    
    case $choice in
        1)
            init_with_sql
            ;;
        2)
            init_with_migrations
            ;;
        3)
            echo -e "${YELLOW}跳过数据库初始化${NC}"
            echo "请在 Supabase Dashboard 的 SQL Editor 中手动执行初始化脚本"
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            ;;
    esac
    
    echo ""
}

# 使用 SQL 文件初始化
init_with_sql() {
    echo "使用 SQL 文件初始化数据库..."
    
    # 检查是否存在 SQL 文件
    if [ -f "supabase/migrations/init.sql" ]; then
        echo "找到初始化 SQL 文件"
        supabase db push
        echo -e "${GREEN}✓ 数据库初始化完成${NC}"
    else
        echo -e "${YELLOW}未找到 SQL 文件${NC}"
        echo "请在 Supabase Dashboard 的 SQL Editor 中手动执行 DEPLOYMENT_GUIDE.md 中的 SQL 脚本"
    fi
}

# 使用迁移文件初始化
init_with_migrations() {
    echo "使用迁移文件初始化数据库..."
    
    if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations)" ]; then
        supabase db push
        echo -e "${GREEN}✓ 数据库迁移完成${NC}"
    else
        echo -e "${YELLOW}未找到迁移文件${NC}"
        echo "请先创建迁移文件或使用 SQL 文件初始化"
    fi
}

# 配置 Storage
setup_storage() {
    echo "======================================"
    echo "配置 Storage"
    echo "======================================"
    echo ""
    
    echo "请在 Supabase Dashboard 中手动完成以下步骤："
    echo ""
    echo "1. 进入 Storage 页面"
    echo "2. 创建新 bucket："
    echo "   - Name: exam-images"
    echo "   - Public: ✅ 勾选"
    echo ""
    echo "3. 在 SQL Editor 中执行以下 SQL 配置策略："
    echo ""
    echo -e "${BLUE}-- 允许认证用户上传图片${NC}"
    echo "CREATE POLICY \"认证用户可以上传图片\""
    echo "ON storage.objects FOR INSERT"
    echo "TO authenticated"
    echo "WITH CHECK (bucket_id = 'exam-images');"
    echo ""
    echo -e "${BLUE}-- 允许用户查看自己的图片${NC}"
    echo "CREATE POLICY \"用户可以查看自己的图片\""
    echo "ON storage.objects FOR SELECT"
    echo "TO authenticated"
    echo "USING (bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]);"
    echo ""
    echo -e "${BLUE}-- 允许用户删除自己的图片${NC}"
    echo "CREATE POLICY \"用户可以删除自己的图片\""
    echo "ON storage.objects FOR DELETE"
    echo "TO authenticated"
    echo "USING (bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]);"
    echo ""
    echo -e "${BLUE}-- 允许公开访问图片${NC}"
    echo "CREATE POLICY \"公开访问图片\""
    echo "ON storage.objects FOR SELECT"
    echo "TO public"
    echo "USING (bucket_id = 'exam-images');"
    echo ""
    
    read -p "完成后按 Enter 继续..."
    echo ""
}

# 部署 Edge Functions
deploy_edge_functions() {
    echo "======================================"
    echo "部署 Edge Functions"
    echo "======================================"
    echo ""
    
    if [ -d "supabase/functions" ] && [ "$(ls -A supabase/functions)" ]; then
        echo "找到 Edge Functions，准备部署..."
        echo ""
        
        # 列出所有函数
        echo "可用的 Edge Functions:"
        ls -1 supabase/functions/
        echo ""
        
        read -p "是否部署所有函数？(y/n): " deploy_all
        
        if [ "$deploy_all" = "y" ]; then
            supabase functions deploy
            echo -e "${GREEN}✓ 所有函数部署完成${NC}"
        else
            read -p "请输入要部署的函数名称: " function_name
            supabase functions deploy "${function_name}"
            echo -e "${GREEN}✓ 函数 ${function_name} 部署完成${NC}"
        fi
        
        # 配置环境变量
        echo ""
        read -p "是否需要配置 Edge Function 环境变量？(y/n): " config_secrets
        
        if [ "$config_secrets" = "y" ]; then
            configure_secrets
        fi
    else
        echo -e "${YELLOW}未找到 Edge Functions${NC}"
        echo "如果需要使用 Edge Functions，请创建后再部署"
    fi
    
    echo ""
}

# 配置 Secrets
configure_secrets() {
    echo "配置 Edge Function 环境变量..."
    echo ""
    
    read -p "微信支付 Key (可选): " WECHAT_PAY_KEY
    read -p "微信支付商户号 (可选): " WECHAT_PAY_MCHID
    
    if [ ! -z "$WECHAT_PAY_KEY" ]; then
        supabase secrets set WECHAT_PAY_KEY="${WECHAT_PAY_KEY}"
    fi
    
    if [ ! -z "$WECHAT_PAY_MCHID" ]; then
        supabase secrets set WECHAT_PAY_MCHID="${WECHAT_PAY_MCHID}"
    fi
    
    echo -e "${GREEN}✓ 环境变量配置完成${NC}"
}

# 配置认证
setup_auth() {
    echo "======================================"
    echo "配置认证"
    echo "======================================"
    echo ""
    
    echo "请在 Supabase Dashboard 中完成以下配置："
    echo ""
    echo "1. 进入 Authentication > Providers"
    echo "2. 启用 Email 登录"
    echo "3. 配置邮件模板（可选）"
    echo "4. 设置密码策略（可选）"
    echo ""
    
    read -p "完成后按 Enter 继续..."
    echo ""
}

# 配置 CORS
setup_cors() {
    echo "======================================"
    echo "配置 CORS"
    echo "======================================"
    echo ""
    
    read -p "请输入前端域名（如 https://your-domain.com）: " FRONTEND_URL
    
    echo ""
    echo "请在 Supabase Dashboard 中完成以下配置："
    echo ""
    echo "1. 进入 Settings > API"
    echo "2. 在 CORS 部分添加以下域名："
    echo "   - ${FRONTEND_URL}"
    echo "   - http://localhost:5173 (本地开发)"
    echo ""
    
    read -p "完成后按 Enter 继续..."
    echo ""
}

# 验证部署
verify_deployment() {
    echo "======================================"
    echo "验证部署"
    echo "======================================"
    echo ""
    
    echo "检查数据库状态..."
    supabase db diff
    
    echo ""
    echo "检查项目状态..."
    supabase status
    
    echo ""
    echo -e "${GREEN}✓ 部署验证完成${NC}"
}

# 显示部署信息
show_deployment_summary() {
    echo ""
    echo "======================================"
    echo "Supabase 部署完成！"
    echo "======================================"
    echo ""
    
    # 获取项目信息
    echo "项目信息："
    supabase status
    
    echo ""
    echo "后续步骤："
    echo "1. 在 Supabase Dashboard 中验证所有配置"
    echo "2. 测试数据库连接和查询"
    echo "3. 测试 Storage 上传功能"
    echo "4. 测试用户注册和登录"
    echo "5. 配置前端环境变量"
    echo ""
    echo "详细文档: DEPLOYMENT_GUIDE.md"
    echo ""
}

# 主流程
main() {
    echo "开始 Supabase 后端服务部署..."
    echo ""
    
    check_supabase_cli
    login_supabase
    link_project
    init_database
    setup_storage
    deploy_edge_functions
    setup_auth
    setup_cors
    verify_deployment
    show_deployment_summary
    
    echo -e "${GREEN}所有步骤完成！${NC}"
}

# 执行主流程
main

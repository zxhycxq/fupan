# 📚 部署文档导航

欢迎使用考试成绩分析系统！本文档帮助您快速找到所需的部署资源。

---

## 🎯 我应该看哪个文档？

### 🚀 我想快速部署（10-15分钟）
👉 查看 [**快速参考卡片**](./DEPLOYMENT_QUICK_REFERENCE.md)
- 一页纸快速指南
- 清晰的步骤编号
- 常见问题速查

### 📖 我想了解详细步骤
👉 查看 [**完整部署指南**](./DEPLOYMENT_GUIDE.md)
- 详细的分步教程
- 完整的 SQL 脚本
- 故障排查方案
- 监控和维护建议

### 🤖 我想使用自动化脚本
👉 使用部署脚本：
```bash
# Supabase 后端部署
./deploy-supabase.sh

# 前端部署
./deploy.sh
```

### ⚙️ 我需要配置环境变量
👉 查看 [**环境变量模板**](./.env.production.example)
- 完整的配置说明
- 安全提示
- 多平台配置方法

---

## 📁 部署文档清单

| 文档 | 用途 | 适合人群 |
|------|------|----------|
| [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md) | 快速参考卡片 | ⭐ 所有用户 |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | 完整部署指南 | 详细了解 |
| [deploy.sh](./deploy.sh) | 前端部署脚本 | 自动化部署 |
| [deploy-supabase.sh](./deploy-supabase.sh) | 后端部署脚本 | 自动化部署 |
| [.env.production.example](./.env.production.example) | 环境变量模板 | 配置参考 |
| [README.md](./README.md#生产部署) | 项目说明 | 快速了解 |

---

## 🗺️ 部署流程图

```
开始部署
    ↓
┌─────────────────────┐
│ 1. Supabase 后端    │
│  - 创建项目         │
│  - 初始化数据库     │
│  - 配置 Storage     │
│  - 设置认证         │
│  - 配置 CORS        │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 2. 环境变量配置     │
│  - SUPABASE_URL     │
│  - SUPABASE_KEY     │
│  - APP_ID           │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 3. 前端部署         │
│  - Vercel（推荐）   │
│  - Netlify          │
│  - 自建服务器       │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 4. 验证部署         │
│  - 测试注册/登录    │
│  - 测试图片上传     │
│  - 测试数据保存     │
└─────────────────────┘
    ↓
部署完成 ✅
```

---

## ⏱️ 部署时间估算

| 步骤 | 预计时间 | 难度 |
|------|----------|------|
| Supabase 项目创建 | 2-3 分钟 | ⭐ 简单 |
| 数据库初始化 | 1-2 分钟 | ⭐⭐ 中等 |
| Storage 配置 | 1 分钟 | ⭐ 简单 |
| 前端构建 | 1-2 分钟 | ⭐ 简单 |
| 前端部署 | 2-3 分钟 | ⭐ 简单 |
| **总计** | **约 10-15 分钟** | ⭐⭐ 中等 |

---

## 🎓 部署教程

### 视频教程（推荐）
- 🎥 [Supabase 快速入门](https://supabase.com/docs/guides/getting-started)
- 🎥 [Vercel 部署教程](https://vercel.com/docs)

### 文字教程
1. [Supabase 官方文档](https://supabase.com/docs)
2. [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
3. [PostgreSQL 性能优化](https://www.postgresql.org/docs/current/performance-tips.html)

---

## 🔧 常见部署场景

### 场景 1：个人学习使用
**推荐方案**：Supabase 免费版 + Vercel 免费版
- ✅ 零成本
- ✅ 快速部署
- ✅ 自动 HTTPS
- ⚠️ 有使用限制

**部署步骤**：
```bash
1. 创建 Supabase 项目（免费版）
2. 执行数据库初始化脚本
3. 运行 ./deploy.sh 选择 Vercel
```

### 场景 2：小团队使用
**推荐方案**：Supabase Pro + Vercel Pro
- ✅ 更高性能
- ✅ 更多存储
- ✅ 技术支持
- 💰 约 $50/月

**部署步骤**：
```bash
1. 创建 Supabase Pro 项目
2. 配置自定义域名
3. 设置团队权限
4. 部署到 Vercel Pro
```

### 场景 3：企业生产环境
**推荐方案**：自建服务器 + 自托管 Supabase
- ✅ 完全控制
- ✅ 数据安全
- ✅ 可定制
- 💰 根据服务器配置

**部署步骤**：
```bash
1. 部署 Supabase（Docker）
2. 配置 Nginx + SSL
3. 设置数据库备份
4. 配置监控和日志
```

---

## 🆘 获取帮助

### 遇到问题？

1. **查看文档**
   - [快速参考](./DEPLOYMENT_QUICK_REFERENCE.md) - 常见问题速查
   - [完整指南](./DEPLOYMENT_GUIDE.md) - 详细故障排查

2. **检查日志**
   - Supabase: Dashboard → Logs
   - Vercel: Deployment → Logs
   - 浏览器: F12 → Console

3. **社区支持**
   - GitHub Issues
   - Supabase Discord
   - Stack Overflow

4. **技术支持**
   - 提交工单
   - 联系开发团队

---

## ✅ 部署成功检查

部署完成后，请确认以下项目：

```
□ Supabase 项目状态正常
□ 数据库表已创建（6 个表）
  - user_settings
  - exam_config
  - exam_records
  - module_scores
  - vip_orders
  - user_vip
□ Storage bucket 已配置（exam-images）
□ RLS 策略已启用
□ 前端可访问
□ 用户可注册/登录
□ 图片可上传
□ 数据可保存和查询
□ 主题切换正常
□ 计时器功能正常
```

---

## 🔄 更新部署

### 更新前端代码
```bash
# 1. 拉取最新代码
git pull origin master

# 2. 安装依赖
pnpm install

# 3. 重新部署
./deploy.sh
```

### 更新数据库
```bash
# 1. 创建新的迁移文件
supabase migration new update_description

# 2. 编写 SQL
# 在 supabase/migrations/ 中编辑文件

# 3. 推送到远程
supabase db push
```

---

## 📊 部署监控

### 关键指标

| 指标 | 监控方式 | 告警阈值 |
|------|----------|----------|
| API 响应时间 | Supabase Dashboard | > 1s |
| 数据库连接数 | Supabase Dashboard | > 80% |
| 存储使用量 | Supabase Dashboard | > 90% |
| 前端加载时间 | Vercel Analytics | > 3s |
| 错误率 | Sentry | > 1% |

### 监控工具推荐

- **Supabase Dashboard**: 后端监控
- **Vercel Analytics**: 前端性能
- **Sentry**: 错误追踪
- **Google Analytics**: 用户行为
- **UptimeRobot**: 可用性监控

---

## 🔐 安全检查清单

```
□ 环境变量未提交到 Git
□ service_role key 仅在服务端使用
□ RLS 策略已正确配置
□ CORS 仅允许可信域名
□ 密码策略已设置
□ 邮件验证已启用（可选）
□ 定期备份数据库
□ 监控异常登录
□ 定期更新依赖
□ 配置 CSP 头（可选）
```

---

## 📝 部署日志模板

记录您的部署信息，方便后续维护：

```
部署日期: _______________
部署人员: _______________

Supabase 信息:
- Project URL: _______________
- Project Ref: _______________
- Region: _______________

前端部署:
- 平台: _______________
- URL: _______________
- 域名: _______________

环境变量:
- APP_ID: _______________
- API_ENV: _______________

备注:
_______________
_______________
```

---

## 🎉 部署完成！

恭喜您成功部署考试成绩分析系统！

**下一步**：
1. 测试所有功能
2. 配置自定义域名（可选）
3. 设置监控和告警
4. 邀请用户使用

**需要帮助？**
- 📖 查看 [完整部署指南](./DEPLOYMENT_GUIDE.md)
- 🚀 查看 [快速参考](./DEPLOYMENT_QUICK_REFERENCE.md)
- 💬 联系技术支持

---

**最后更新**: 2025-11-22  
**版本**: v1.0.0  
**维护**: 考试成绩分析系统团队

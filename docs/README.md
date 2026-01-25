# 欢迎使用你的秒哒应用代码包
秒哒应用链接
    URL:https://www.miaoda.cn/projects/app-7q11e4xackch

# 考试成绩分析系统 - 技术文档

## 📚 文档导航

本目录包含考试成绩分析系统的完整技术文档，帮助您快速了解系统架构、部署流程和API使用方法。

---

## 📖 文档列表

### 1. [快速开始指南](./QUICK_START.md)

**适合人群**: 新手开发者、快速上手

**内容概要**:
- ✅ 环境要求
- ✅ 快速部署步骤
- ✅ 配置OCR服务
- ✅ 数据库初始化
- ✅ 常用命令
- ✅ 快速测试
- ✅ 故障排查

**阅读时间**: 10分钟

---

### 2. [腾讯云部署指南](./TENCENT_CLOUD_DEPLOYMENT.md) ⭐ 推荐

**适合人群**: 腾讯云用户、快速部署

**内容概要**:
- ✅ 服务器购买和配置
- ✅ OCR服务配置（百度/腾讯云）
- ✅ 应用部署步骤
- ✅ 域名和HTTPS配置
- ✅ 监控和维护
- ✅ 安全加固
- ✅ 快速命令参考

**阅读时间**: 20分钟

---

### 3. [部署文档](./DEPLOYMENT.md)

**适合人群**: 运维人员、部署工程师

**内容概要**:
- ✅ 系统概述
- ✅ 技术架构
- ✅ 数据库设计
- ✅ OCR识别服务
- ✅ 详细部署步骤
- ✅ 环境变量配置
- ✅ 常见问题解答

**阅读时间**: 30分钟

---

### 4. [OCR集成文档](./OCR_INTEGRATION.md)

**适合人群**: 后端开发者、OCR集成工程师

**内容概要**:
- ✅ 百度OCR API详解
- ✅ 腾讯云OCR API详解
- ✅ 识别流程说明
- ✅ 数据格式定义
- ✅ 代码实现细节
- ✅ 迁移指南（百度→腾讯云）
- ✅ 性能优化建议
- ✅ 监控和日志

**阅读时间**: 45分钟

---

### 5. [API接口文档](./API_REFERENCE.md)

**适合人群**: 前端开发者、后端开发者

**内容概要**:
- ✅ 数据库API完整参考
- ✅ OCR识别API详解
- ✅ 数据类型定义
- ✅ 错误处理指南
- ✅ 使用示例
- ✅ 性能优化建议
- ✅ 安全建议
- ✅ 测试示例

**阅读时间**: 60分钟

---

## 🚀 快速导航

### 我想...

#### 快速部署到腾讯云
→ 阅读 [腾讯云部署指南](./TENCENT_CLOUD_DEPLOYMENT.md) ⭐

#### 快速部署系统（通用）
→ 阅读 [快速开始指南](./QUICK_START.md)

#### 了解系统架构
→ 阅读 [部署文档 - 技术架构](./DEPLOYMENT.md#技术架构)

#### 配置OCR服务
→ 阅读 [腾讯云部署指南 - OCR服务配置](./TENCENT_CLOUD_DEPLOYMENT.md#ocr服务配置)

#### 迁移到腾讯云OCR
→ 阅读 [OCR集成文档 - 迁移指南](./OCR_INTEGRATION.md#迁移指南)

#### 了解数据库设计
→ 阅读 [部署文档 - 数据库设计](./DEPLOYMENT.md#数据库设计)

#### 查看API接口
→ 阅读 [API接口文档](./API_REFERENCE.md)

#### 优化识别准确率
→ 阅读 [OCR集成文档 - 识别流程](./OCR_INTEGRATION.md#识别流程)

#### 排查问题
→ 阅读 [腾讯云部署指南 - 常见问题](./TENCENT_CLOUD_DEPLOYMENT.md#常见问题)

---

## 📊 系统架构概览

```
┌─────────────────────────────────────────────────────────┐
│                      前端应用                            │
│  React + TypeScript + Tailwind CSS + shadcn/ui         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├─────────────┐
                  │             │
                  ▼             ▼
         ┌────────────┐  ┌────────────┐
         │  Supabase  │  │  OCR API   │
         │ PostgreSQL │  │  百度/腾讯  │
         └────────────┘  └────────────┘
```

---

## 🔑 核心功能

### 1. 图片上传与OCR识别

- 支持JPG、PNG、BMP格式
- 自动压缩和增强图片
- 支持长截图识别
- 识别准确率95%+

### 2. 数据解析

- 支持三种文本格式
- 自动提取总分、模块得分、用时
- 智能计算答对数和答错数
- 数据验证和容错处理

### 3. 数据存储

- PostgreSQL数据库
- 两级模块结构
- 级联删除
- 自动时间戳

### 4. 数据分析

- 成绩趋势分析
- 模块对比分析
- 效率分析
- 弱势模块识别

### 5. 可视化展示

- ECharts图表
- 折线图、柱状图、雷达图
- 响应式设计
- 深色模式支持

---

## 🛠️ 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 5.x | 构建工具 |
| Tailwind CSS | 3.x | 样式框架 |
| shadcn/ui | latest | UI组件库 |
| ECharts | 5.x | 图表库 |
| React Router | 6.x | 路由管理 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Supabase | latest | 后端服务 |
| PostgreSQL | 15.x | 数据库 |
| 百度OCR | v1 | 文字识别 |

---

## 📝 数据库表结构

### exam_records - 考试记录表

存储每次考试的基本信息和总体成绩。

**主要字段**:
- `id`: 记录ID（UUID）
- `exam_number`: 考试期数
- `exam_name`: 考试名称
- `total_score`: 总分
- `rating`: 星级评分（0-5）
- `difficulty`: 难度系数（0-5）
- `beat_percentage`: 已击败考生百分比
- `time_used`: 用时（秒）

### module_scores - 模块得分表

存储每个模块和子模块的详细得分信息。

**主要字段**:
- `id`: 记录ID（UUID）
- `exam_record_id`: 关联考试记录ID
- `module_name`: 模块名称
- `parent_module`: 父模块名称（NULL表示大模块）
- `total_questions`: 总题数
- `correct_answers`: 答对题数
- `accuracy_rate`: 正确率
- `time_used`: 用时（秒）

### user_settings - 用户设置表

存储用户的个性化设置。

**主要字段**:
- `id`: 记录ID（UUID）
- `user_id`: 用户ID
- `module_name`: 模块名称
- `target_accuracy`: 目标正确率

### exam_config - 考试配置表

存储全局考试配置信息。

**主要字段**:
- `id`: 记录ID（UUID）
- `exam_type`: 考试类型
- `exam_name`: 考试名称
- `exam_date`: 考试日期
- `grade_label_theme`: 成绩等级标签主题

---

## 🔌 API接口概览

### 数据库API

**考试记录**:
- `getAllExamRecords()` - 获取所有考试记录
- `getExamRecordById(id)` - 获取考试记录详情
- `createExamRecord(record)` - 创建考试记录
- `updateExamRecord(id, updates)` - 更新考试记录
- `deleteExamRecord(id)` - 删除考试记录
- `getRecentExamRecords(limit)` - 获取最近N次考试

**模块得分**:
- `createModuleScores(scores)` - 创建模块得分
- `getModuleScoresByExamId(examId)` - 获取模块得分
- `updateModuleScore(id, updates)` - 更新模块得分
- `getModuleAverageScores()` - 获取模块平均得分
- `getModuleTrendData()` - 获取模块趋势数据
- `getModuleTimeTrendData()` - 获取模块用时趋势

**用户设置**:
- `getUserSettings(userId)` - 获取用户设置
- `upsertUserSetting(userId, moduleName, targetAccuracy)` - 更新设置
- `batchUpsertUserSettings(settings, userId)` - 批量更新设置

**考试配置**:
- `getExamConfig()` - 获取考试配置
- `saveExamConfig(examType, examDate, gradeLabelTheme, examName)` - 保存配置

### OCR识别API

- `recognizeText(request)` - 识别图片中的文字
- `fileToBase64(file)` - 文件转Base64
- `compressImage(file, maxWidth, quality)` - 压缩图片
- `parseExamData(ocrText, examNumber, timeUsedSeconds)` - 解析考试数据

---

## 📦 支持的数据格式

### 格式1：手机端格式

```
政治理论
共15题，答对10题，正确率67%，用时23秒
```

### 格式2：网页版格式

```
政治理论
总题数 15题  答对 10题  正确率 67%  用时 23秒
```

### 格式3：简化格式

```
政治理论
15
67%
23
```

---

## 🎯 最佳实践

### 1. 图片上传

- ✅ 使用清晰的截图
- ✅ 确保文字清晰可见
- ✅ 避免图片过大（建议<10MB）
- ✅ 使用支持的格式（JPG、PNG、BMP）

### 2. 数据管理

- ✅ 定期备份数据库
- ✅ 使用唯一的索引项
- ✅ 填写完整的考试信息
- ✅ 及时更新考试备注

### 3. 性能优化

- ✅ 启用图片压缩
- ✅ 使用数据缓存
- ✅ 启用gzip压缩
- ✅ 配置CDN加速

### 4. 安全性

- ✅ 启用HTTPS
- ✅ 保护API密钥
- ✅ 验证用户输入
- ✅ 定期更新依赖

---

## 📈 版本历史

### v1.0.0 (2024-12-09)
- 初始版本发布
- 支持OCR识别
- 支持多期考试管理
- 支持数据分析和可视化

### v1.1.0 (2024-12-10)
- 优化OCR识别准确率
- 支持长截图识别
- 添加简化格式支持
- 改进数据解析逻辑

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 如何贡献

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范

- 使用TypeScript
- 遵循ESLint规则
- 编写清晰的注释
- 添加单元测试

---

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

---

## 📞 联系方式

- **项目仓库**: [GitHub](https://github.com/your-repo)
- **问题反馈**: [Issues](https://github.com/your-repo/issues)
- **邮箱**: support@example.com

---

## 🙏 致谢

感谢以下开源项目：

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [ECharts](https://echarts.apache.org/)
- [Supabase](https://supabase.com/)

---

## 📚 相关资源

### 官方文档

- [React文档](https://react.dev/)
- [TypeScript文档](https://www.typescriptlang.org/docs/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [ECharts文档](https://echarts.apache.org/zh/index.html)
- [Supabase文档](https://supabase.com/docs)
- [百度OCR文档](https://cloud.baidu.com/doc/OCR/index.html)
- [腾讯云OCR文档](https://cloud.tencent.com/document/product/866)

### 学习资源

- [React教程](https://react.dev/learn)
- [TypeScript教程](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS教程](https://tailwindcss.com/docs/installation)
- [ECharts示例](https://echarts.apache.org/examples/zh/index.html)

---

## 🔄 更新日志

查看 [CHANGELOG.md](../icon.md) 了解详细的版本更新历史。

---

最后更新: 2024-12-10

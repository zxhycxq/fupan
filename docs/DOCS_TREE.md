# 文档目录树

```
docs/
├── 📖 核心文档（必读）
│   ├── README.md                          # 文档导航（入口）⭐⭐⭐⭐⭐
│   ├── INDEX.md                           # 文档索引（完整列表）⭐⭐⭐⭐⭐
│   ├── TENCENT_CLOUD_DEPLOYMENT.md        # 腾讯云部署指南 ⭐⭐⭐⭐⭐
│   ├── QUICK_START.md                     # 快速开始指南 ⭐⭐⭐⭐
│   ├── DEPLOYMENT.md                      # 通用部署文档 ⭐⭐⭐⭐
│   ├── OCR_INTEGRATION.md                 # OCR集成文档 ⭐⭐⭐⭐
│   └── API_REFERENCE.md                   # API接口文档 ⭐⭐⭐⭐⭐
│
├── 📋 产品文档
│   ├── prd.md                             # 产品需求文档
│   └── USER_GUIDE.md                      # 用户使用指南
│
├── 🔧 技术文档
│   ├── 安卓截图识别完整解决方案.md
│   ├── 长截图OCR识别优化说明.md
│   ├── OCR识别修复总结.md
│   ├── OCR优化说明.md
│   ├── 测试OCR识别.md
│   ├── 安卓截图格式适配说明.md
│   └── API_MIGRATION.md
│
├── 🎨 界面优化文档
│   ├── 图表视觉优化说明.md
│   └── 数据总览页面优化说明.md
│
├── 🛠️ 功能增强文档
│   ├── 考试倒计时和Excel导出优化说明.md
│   ├── 考试记录列表分页优化说明.md
│   ├── TIME_EDIT_FEATURE.md
│   └── 重新上传第58和59期指南.md
│
├── 🐛 调试和测试文档
│   ├── DEBUG_GUIDE.md
│   ├── HOW_TO_DEBUG.md
│   ├── TROUBLESHOOTING.md
│   └── TESTING_GUIDE.md
│
├── 📝 更新和改进文档
│   ├── IMPROVEMENTS_SUMMARY.md
│   ├── UPDATE_SUMMARY.md
│   └── PWA开发环境问题解决.md
│
└── 📌 快速参考
    └── QUICK_REFERENCE.md
```

---

## 📊 文档统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 核心文档 | 7个 | 必读文档，包含部署、API、OCR等 |
| 产品文档 | 2个 | 需求和用户指南 |
| 技术文档 | 7个 | OCR识别相关技术文档 |
| 界面优化 | 2个 | UI/UX优化说明 |
| 功能增强 | 4个 | 新功能说明 |
| 调试测试 | 4个 | 调试和测试指南 |
| 更新改进 | 3个 | 更新历史和改进说明 |
| 快速参考 | 1个 | 快速参考手册 |
| **总计** | **30个** | - |

---

## 🎯 快速查找

### 我是新手，想快速开始
→ [README.md](./README.md) → [QUICK_START.md](./QUICK_START.md)

### 我要部署到腾讯云
→ [TENCENT_CLOUD_DEPLOYMENT.md](./TENCENT_CLOUD_DEPLOYMENT.md) ⭐

### 我要了解API接口
→ [API_REFERENCE.md](./API_REFERENCE.md)

### 我要配置OCR服务
→ [OCR_INTEGRATION.md](./OCR_INTEGRATION.md)

### 我遇到了问题
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 我要查看所有文档
→ [INDEX.md](./INDEX.md)

---

## 📏 文档大小

| 文档 | 大小 | 说明 |
|------|------|------|
| API_REFERENCE.md | 56KB | 最详细的API文档 |
| prd.md | 40KB | 产品需求文档 |
| OCR_INTEGRATION.md | 36KB | OCR集成文档 |
| DEPLOYMENT.md | 32KB | 部署文档 |
| TENCENT_CLOUD_DEPLOYMENT.md | 20KB | 腾讯云部署指南 |
| 其他文档 | 4-16KB | 各类专题文档 |

---

## 🔗 文档关系

```
README.md (入口)
    ├─→ TENCENT_CLOUD_DEPLOYMENT.md (腾讯云部署)
    │       ├─→ OCR_INTEGRATION.md (OCR配置)
    │       └─→ TROUBLESHOOTING.md (故障排查)
    │
    ├─→ QUICK_START.md (快速开始)
    │       ├─→ DEPLOYMENT.md (详细部署)
    │       └─→ API_REFERENCE.md (API参考)
    │
    ├─→ OCR_INTEGRATION.md (OCR集成)
    │       ├─→ 安卓截图识别完整解决方案.md
    │       ├─→ 长截图OCR识别优化说明.md
    │       └─→ OCR识别修复总结.md
    │
    └─→ API_REFERENCE.md (API接口)
            ├─→ API_MIGRATION.md
            └─→ TESTING_GUIDE.md
```

---

## 📅 文档更新历史

### 2024-12-10
- ✅ 创建核心文档体系
- ✅ 添加腾讯云部署指南
- ✅ 完善OCR集成文档
- ✅ 创建完整的API参考
- ✅ 添加文档索引和导航

### 2024-12-09
- ✅ 创建初始文档
- ✅ 添加产品需求文档
- ✅ 添加用户指南

---

## 💡 使用建议

### 第一次使用
1. 从 [README.md](./README.md) 开始
2. 根据你的角色选择对应的文档
3. 按推荐顺序阅读

### 遇到问题时
1. 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 开发新功能
1. 查看 [API_REFERENCE.md](./API_REFERENCE.md)
2. 查看 [prd.md](./prd.md)
3. 参考相关的功能增强文档

### 部署到生产环境
1. 查看 [TENCENT_CLOUD_DEPLOYMENT.md](./TENCENT_CLOUD_DEPLOYMENT.md)
2. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
3. 查看 [OCR_INTEGRATION.md](./OCR_INTEGRATION.md)

---

最后更新: 2024-12-10

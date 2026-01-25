# 快速参考指南

## 🚀 新功能速览

### 1. 文字识别(OCR)
- **功能**: 从考试成绩截图中提取文字
- **速度**: 2-5秒快速识别
- **准确度**: 高精度中英文混合识别
- **使用**: 上传清晰的PNG/JPG截图即可

### 2. 智能图片压缩
- **自动触发**: 图片大于2MB时自动压缩
- **压缩质量**: 保持85%质量,确保文字清晰
- **最大宽度**: 1920像素
- **格式转换**: 自动转为JPEG格式

### 3. 多图片上传
- **批量上传**: 一次选择多张图片
- **独立管理**: 每张图片可单独删除
- **进度显示**: 实时显示处理进度
- **序号标识**: 清晰显示图片顺序

### 4. 测试数据生成
- **快速生成**: 1-20条模拟考试记录
- **完整数据**: 包含所有模块和子模块
- **随机分布**: 模拟真实考试场景
- **即时查看**: 生成后自动跳转到仪表板

## 📋 API参考

### recognizeText()
识别图片中的文字

```typescript
import { recognizeText } from '@/services/imageRecognition';

const text = await recognizeText({
  image: 'base64编码的图片',
  language_type: 'CHN_ENG', // 可选,默认中英文
});
```

**参数**:
- `image`: string - base64编码的图片(必需)
- `language_type`: string - 识别语言类型(可选)
- `detect_direction`: boolean - 是否检测图像朝向(可选)
- `probability`: boolean - 是否返回置信度(可选)

**返回**: Promise<string> - 识别出的文字

### fileToBase64()
将文件转换为base64编码

```typescript
import { fileToBase64 } from '@/services/imageRecognition';

const base64 = await fileToBase64(file);
```

**参数**:
- `file`: File - 要转换的文件

**返回**: Promise<string> - base64编码(不含前缀)

### compressImage()
压缩图片

```typescript
import { compressImage } from '@/services/imageRecognition';

const compressed = await compressImage(file, 1920, 0.85);
```

**参数**:
- `file`: File - 要压缩的图片
- `maxWidth`: number - 最大宽度(默认1920)
- `quality`: number - 压缩质量(默认0.9)

**返回**: Promise<File> - 压缩后的文件

## 🎨 类型定义

### OcrRequest
```typescript
interface OcrRequest {
  image: string;              // base64编码的图片
  language_type?: string;     // 识别语言类型
  detect_direction?: boolean; // 是否检测图像朝向
  probability?: boolean;      // 是否返回置信度
}
```

### OcrResponse
```typescript
interface OcrResponse {
  status: number;
  msg: string;
  data: {
    log_id: number;
    direction?: number;
    words_result_num: number;
    words_result: Array<{
      words: string;
      probability?: {
        average: number;
        variance: number;
        min: number;
      };
    }>;
  };
}
```

## 🔧 常用命令

### 开发
```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run lint     # 代码检查
npm run preview  # 预览生产版本
```

### 数据库
```bash
# 查看所有考试记录
SELECT * FROM exam_records ORDER BY created_at DESC;

# 查看某次考试的模块得分
SELECT * FROM module_scores WHERE exam_record_id = 'xxx';

# 清空所有数据
DELETE FROM module_scores;
DELETE FROM exam_records;
```

## 📊 数据结构

### exam_records
- `id`: UUID - 主键
- `exam_number`: 整数 - 考试期数
- `total_score`: 整数 - 总分
- `time_used`: 整数 - 用时(秒)
- `image_url`: 文本 - 图片URL(可选)
- `created_at`: 时间戳 - 创建时间

### module_scores
- `id`: UUID - 主键
- `exam_record_id`: UUID - 考试记录ID
- `module_name`: 文本 - 模块名称
- `parent_module`: 文本 - 父模块(可选)
- `total_questions`: 整数 - 总题数
- `correct_answers`: 整数 - 答对数
- `wrong_answers`: 整数 - 答错数
- `unanswered`: 整数 - 未答数
- `accuracy_rate`: 小数 - 正确率
- `time_used`: 整数 - 用时(秒,可选)

## 🎯 最佳实践

### 图片上传
1. 使用PNG格式(推荐)或JPG格式
2. 确保分辨率至少1920x1080
3. 文件大小控制在2-10MB
4. 截图要完整,包含所有信息
5. 避免模糊、倾斜或有遮挡

### 数据管理
1. 定期备份重要数据
2. 使用测试数据进行功能验证
3. 清空数据前确认无误
4. 保持考试期数的连续性

### 性能优化
1. 一次上传不超过5张图片
2. 网络不稳定时分批上传
3. 定期清理不需要的记录
4. 使用浏览器缓存加速加载

## 📚 相关文档

- [更新日志](../icon.md)
- [故障排查指南](./TROUBLESHOOTING.md)
- [API迁移说明](./API_MIGRATION.md)
- [更新总结](./UPDATE_SUMMARY.md)

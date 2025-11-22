# API迁移说明

## 从图像内容理解到通用文字识别

### 变更原因

根据用户需求,系统需要的是**文字识别(OCR)**功能,而不是**图像内容理解**功能。

### 主要区别

| 特性 | 图像内容理解 | 通用文字识别(高精度版) |
|------|------------|---------------------|
| **功能** | 理解图像内容并回答问题 | 提取图像中的文字 |
| **调用方式** | 异步(提交任务+轮询结果) | 同步(直接返回结果) |
| **响应时间** | 较慢(需要轮询,20-90秒) | 快速(2-5秒) |
| **适用场景** | 图像问答、内容分析 | 文字提取、OCR识别 |
| **Content-Type** | application/json | application/x-www-form-urlencoded |

### 技术变更

#### 1. API Endpoint

**旧API (图像内容理解)**:
- 提交请求: `/api/miaoda/runtime/apicenter/source/proxy/vCkBqBnYAumpihoy7mJKFS`
- 查询结果: `/api/miaoda/runtime/apicenter/source/proxy/p1fmNnVdKApGo3cse1Xn4m`

**新API (通用文字识别)**:
- 识别文字: `/api/miaoda/runtime/apicenter/source/proxy/6KmAKxK9aE29irAwt32QRk`

#### 2. 请求格式

**旧格式 (JSON)**:
```typescript
{
  image: "base64编码的图片",
  question: "请提取图片中的文字..."
}
```

**新格式 (表单)**:
```typescript
{
  image: "base64编码的图片",
  language_type: "CHN_ENG", // 可选
  detect_direction: false,  // 可选
  probability: false        // 可选
}
```

#### 3. 响应格式

**旧格式**:
```typescript
{
  status: 0,
  data: {
    result: {
      task_id: "任务ID",
      ret_code: 0,
      description: "识别结果文本"
    }
  }
}
```

**新格式**:
```typescript
{
  status: 0,
  data: {
    log_id: 123456,
    words_result_num: 10,
    words_result: [
      { words: "第一行文字" },
      { words: "第二行文字" },
      ...
    ]
  }
}
```

#### 4. 代码变更

**移除的函数**:
- `submitImageRecognition()` - 提交识别任务
- `getImageRecognitionResult()` - 获取识别结果
- `pollImageRecognitionResult()` - 轮询识别结果

**新增的函数**:
- `recognizeText()` - 直接识别文字并返回结果

**保留的函数**:
- `fileToBase64()` - 文件转base64
- `compressImage()` - 图片压缩

### 优势

1. **更快的响应速度**: 从异步轮询改为同步调用,识别时间从20-90秒缩短到2-5秒
2. **更简单的代码**: 移除复杂的轮询逻辑,代码更易维护
3. **更高的稳定性**: 避免轮询超时问题
4. **更准确的功能**: 专门的OCR API更适合文字识别场景

### 使用示例

```typescript
import { recognizeText, fileToBase64 } from '@/services/imageRecognition';

// 识别图片中的文字
async function handleOcr(file: File) {
  // 1. 转换为base64
  const base64Image = await fileToBase64(file);
  
  // 2. 调用OCR识别
  const text = await recognizeText({
    image: base64Image,
    language_type: 'CHN_ENG', // 中英文混合
  });
  
  // 3. 使用识别结果
  console.log('识别结果:', text);
}
```

### 注意事项

1. **Content-Type**: 必须使用 `application/x-www-form-urlencoded`
2. **图片格式**: 支持PNG、JPG、JPEG等常见格式
3. **图片大小**: 建议2-10MB,系统会自动压缩大图片
4. **识别语言**: 默认使用CHN_ENG(中英文混合)
5. **错误处理**: API调用失败时会抛出异常,需要妥善处理

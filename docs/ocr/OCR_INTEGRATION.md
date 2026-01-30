# OCR识别集成文档

## 目录

- [概述](#概述)
- [百度OCR API](#百度ocr-api)
- [腾讯云OCR API](#腾讯云ocr-api)
- [识别流程](#识别流程)
- [数据格式](#数据格式)
- [代码实现](#代码实现)
- [迁移指南](#迁移指南)

---

## 概述

本系统使用OCR（光学字符识别）技术自动识别考试成绩截图中的文字信息。当前使用百度智能云的通用文字识别（高精度版）API，本文档将指导您如何迁移到腾讯云OCR服务。

---

## 百度OCR API

### 当前实现

**API名称**: 通用文字识别（高精度版）

**API文档**: https://cloud.baidu.com/doc/OCR/s/1k3h7y3db

**接口地址**: `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 说明 | 是否必填 |
|--------|------|------|----------|
| image | string | 图片的Base64编码 | 是 |
| language_type | string | 识别语言类型（CHN_ENG：中英文混合） | 否 |
| detect_direction | boolean | 是否检测图像朝向 | 否 |
| probability | boolean | 是否返回识别结果中每一行的置信度 | 否 |
| paragraph | boolean | 是否输出段落信息 | 否 |
| recognize_granularity | string | 识别颗粒度（big：大颗粒度） | 否 |
| vertexes_location | boolean | 是否返回文字外接多边形顶点位置 | 否 |

**响应示例**:

```json
{
  "log_id": 1234567890,
  "direction": 0,
  "words_result_num": 50,
  "words_result": [
    {
      "words": "言语理解与表达",
      "probability": {
        "average": 0.98,
        "variance": 0.01,
        "min": 0.95
      }
    },
    {
      "words": "共30道，答对23道，正确率77%，用时41秒",
      "probability": {
        "average": 0.96,
        "variance": 0.02,
        "min": 0.92
      }
    }
  ]
}
```

### 当前代码实现

**文件**: `src/services/imageRecognition.ts`

```typescript
export async function recognizeText(request: OcrRequest): Promise<string> {
  const formData = new URLSearchParams();
  formData.append('image', request.image);
  formData.append('language_type', 'CHN_ENG');
  formData.append('detect_direction', 'true');
  formData.append('probability', 'true');
  formData.append('paragraph', 'true');
  formData.append('recognize_granularity', 'big');
  formData.append('vertexes_location', 'true');

  const response = await fetch(`${API_BASE_URL}/6KmAKxK9aE29irAwt32QRk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-App-Id': APP_ID,
    },
    body: formData.toString(),
  });

  const result: OcrResponse = await response.json();

  if (result.status !== 0) {
    throw new Error(result.msg || '文字识别失败');
  }

  // 拼接识别结果
  const text = result.data.words_result
    .map(item => item.words.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n');

  return text;
}
```

---

## 腾讯云OCR API

### API介绍

**产品名称**: 通用印刷体识别（高精度版）

**API文档**: https://cloud.tencent.com/document/product/866/34937

**接口地址**: `https://ocr.tencentcloudapi.com/`

**请求方式**: POST

**鉴权方式**: API密钥签名（TC3-HMAC-SHA256）

### 请求参数

| 参数名 | 类型 | 说明 | 是否必填 |
|--------|------|------|----------|
| ImageBase64 | string | 图片的Base64编码 | 是 |
| ImageUrl | string | 图片URL（与ImageBase64二选一） | 否 |
| LanguageType | string | 识别语言类型（zh：中文，en：英文，zh_rare：生僻字） | 否 |
| IsPdf | boolean | 是否为PDF文件 | 否 |
| PdfPageNumber | integer | PDF页码 | 否 |
| IsWords | boolean | 是否返回单字信息 | 否 |

### 响应示例

```json
{
  "Response": {
    "TextDetections": [
      {
        "DetectedText": "言语理解与表达",
        "Confidence": 98,
        "Polygon": [
          {"X": 100, "Y": 200},
          {"X": 300, "Y": 200},
          {"X": 300, "Y": 250},
          {"X": 100, "Y": 250}
        ],
        "AdvancedInfo": "{\"Parag\":{\"ParagNo\":1}}",
        "ItemPolygon": {
          "X": 100,
          "Y": 200,
          "Width": 200,
          "Height": 50
        },
        "Words": [
          {
            "Confidence": 99,
            "Character": "言",
            "WordCoordPoint": [
              {"X": 100, "Y": 200},
              {"X": 120, "Y": 200},
              {"X": 120, "Y": 250},
              {"X": 100, "Y": 250}
            ]
          }
        ],
        "WordCoordPoint": [
          {"X": 100, "Y": 200},
          {"X": 300, "Y": 200},
          {"X": 300, "Y": 250},
          {"X": 100, "Y": 250}
        ]
      }
    ],
    "Language": "zh",
    "Angel": 0.0,
    "PdfPageSize": 0,
    "RequestId": "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### 鉴权方式

腾讯云API使用TC3-HMAC-SHA256签名方法进行鉴权。

**签名步骤**:

1. 拼接规范请求串
2. 拼接待签名字符串
3. 计算签名
4. 拼接Authorization

**详细文档**: https://cloud.tencent.com/document/api/866/33518

---

## 识别流程

### 完整流程图

```
┌─────────────────┐
│  用户上传图片    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  图片预处理      │
│  - 压缩         │
│  - 增强对比度   │
│  - 锐化         │
│  - 降噪         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  转换Base64     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  调用OCR API    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  接收识别结果    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  文本预处理      │
│  - 统一标点     │
│  - 清理空白     │
│  - 修复错误     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  数据解析        │
│  - 提取总分     │
│  - 提取模块数据 │
│  - 计算统计值   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  保存到数据库    │
└─────────────────┘
```

### 图片预处理详解

#### 1. 压缩处理

**目的**: 减小文件大小，加快上传速度

**参数**:
- 最大宽度: 2400px
- 压缩质量: 95%
- 输出格式: JPEG

**代码**:
```typescript
export function compressImage(
  file: File, 
  maxWidth: number = 2400,
  quality: number = 0.95
): Promise<File>
```

#### 2. 对比度增强

**目的**: 提高文字与背景的对比度

**参数**:
- 普通图片: 1.2倍
- 长截图: 1.3倍

**算法**:
```typescript
const contrast = isLongScreenshot ? 1.3 : 1.2;
const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

for (let i = 0; i < data.length; i += 4) {
  data[i] = factor * (data[i] - 128) + 128;       // R
  data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
  data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
}
```

#### 3. 锐化处理

**目的**: 增强文字边缘，提高清晰度

**参数**:
- 普通图片: 0.5强度
- 长截图: 0.7强度

**算法**: 拉普拉斯锐化

```typescript
const sharpness = isLongScreenshot ? 0.7 : 0.5;

for (let y = 1; y < canvas.height - 1; y++) {
  for (let x = 1; x < canvas.width - 1; x++) {
    for (let c = 0; c < 3; c++) {
      const center = tempData[i];
      const top = tempData[((y - 1) * canvas.width + x) * 4 + c];
      const bottom = tempData[((y + 1) * canvas.width + x) * 4 + c];
      const left = tempData[(y * canvas.width + (x - 1)) * 4 + c];
      const right = tempData[(y * canvas.width + (x + 1)) * 4 + c];
      
      const sharpened = center * (1 + 4 * sharpness) - 
                       (top + bottom + left + right) * sharpness;
      data[i] = Math.max(0, Math.min(255, sharpened));
    }
  }
}
```

#### 4. 降噪处理（仅长截图）

**目的**: 去除压缩噪点，提高识别准确率

**算法**: 3x3邻域平均

```typescript
if (isLongScreenshot) {
  for (let y = radius; y < canvas.height - radius; y++) {
    for (let x = radius; x < canvas.width - radius; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let count = 0;
        
        // 3x3邻域平均
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const i = ((y + dy) * canvas.width + (x + dx)) * 4 + c;
            sum += denoiseData[i];
            count++;
          }
        }
        
        const i = (y * canvas.width + x) * 4 + c;
        // 轻度降噪：70%原值 + 30%平均值
        data[i] = denoiseData[i] * 0.7 + (sum / count) * 0.3;
      }
    }
  }
}
```

### 文本预处理详解

**文件**: `src/services/dataParser.ts`

#### 1. 统一标点符号

```typescript
processed = processed
  .replace(/，/g, ',')  // 中文逗号转英文逗号
  .replace(/：/g, ':')  // 中文冒号转英文冒号
  .replace(/（/g, '(')  // 中文括号转英文括号
  .replace(/）/g, ')')
  .replace(/％/g, '%'); // 全角百分号转半角
```

#### 2. 清理空白字符

```typescript
processed = processed
  .replace(/[ \t]+/g, ' ')      // 多个空格/制表符合并为一个空格
  .replace(/\n\s+/g, '\n')      // 删除行首空格
  .replace(/\s+\n/g, '\n')      // 删除行尾空格
  .replace(/\n{3,}/g, '\n\n');  // 多个换行合并为两个
```

#### 3. 修复常见OCR错误

```typescript
processed = processed
  .replace(/[oO0]/g, '0')  // 在数字上下文中，o/O可能是0
  .replace(/[lI1]/g, '1')  // 在数字上下文中，l/I可能是1
  .replace(/共\s*([0-9]+)\s*([道题])/g, '共$1$2')
  .replace(/答对\s*([0-9]+)\s*([道题])/g, '答对$1$2')
  .replace(/正确率\s*([0-9]+)\s*%/g, '正确率$1%')
  .replace(/用时\s*([0-9]+)\s*(秒|分)/g, '用时$1$2');
```

---

## 数据格式

### 支持的成绩截图格式

系统支持三种OCR识别文本格式：

#### 格式1：手机端格式

**特征**:
- 使用逗号分隔
- 关键词：共、答对、正确率、用时

**示例**:
```
政治理论
共15题，答对10题，正确率67%，用时23秒

马克思主义
共3题，答对2题，正确率67%，用时3秒
```

**正则表达式**:
```typescript
const mobilePattern = `${module.name}[\\s\\n]{0,20}` +
  `共[\\s，,]*?(\\d+)[\\s]*?(?:题|道)[\\s，,]+?` +
  `答对[\\s，,]*?(\\d+)[\\s]*?(?:题|道)[\\s，,]+?` +
  `正确率[\\s，,]*?(\\d+)[\\s]*?%[\\s，,]+?` +
  `用时[\\s，,]*?(\\d+)[\\s]*?(?:分[\\s]*?)?(\\d+)?[\\s]*?秒`;
```

#### 格式2：网页版格式

**特征**:
- 使用空格分隔
- 关键词：总题数、答对、正确率、用时
- 单位：题、道

**示例**:
```
政治理论
总题数 15题  答对 10题  正确率 67%  用时 23秒

马克思主义
总题数 3题   答对 2道   正确率 67%  用时 3秒
```

**正则表达式**:
```typescript
const webPattern = `${module.name}[\\s\\S]{0,200}?` +
  `(?:总题数|共计)[：:\\s]{0,10}(\\d+)[\\s]*(?:题|道)[\\s]{0,20}` +
  `答对[：:\\s]{0,10}(\\d+)[\\s]*(?:题|道)[\\s]{0,20}` +
  `正确率[：:\\s]{0,10}(\\d+)%[\\s]{0,20}` +
  `用时[：:\\s]{0,10}(\\d+)(?:[\\s]*(\\d+))?[\\s]*(?:秒|分)`;
```

#### 格式3：简化格式

**特征**:
- 只有数字和百分比
- 没有关键词
- 每行一个数据

**示例**:
```
言语理解与表达
21
70%
25
```

**正则表达式**:
```typescript
const simplePattern = `${module.name}[\\s\\S]{0,50}?` +
  `(\\d+)[\\s\\S]{0,20}?` +    // 第一个数字（总题数）
  `(\\d+)%[\\s\\S]{0,20}?` +   // 百分比（正确率）
  `(\\d+)`;                     // 第二个数字（用时）
```

**数据计算**:
```typescript
const totalQuestions = parseInt(match[1]);  // 21
const accuracyRate = parseInt(match[2]);    // 70
const timeUsed = parseInt(match[3]);        // 25

// 计算答对数
const correctAnswers = Math.round(totalQuestions * accuracyRate / 100);
// 21 * 70 / 100 = 14.7 ≈ 15

// 计算答错数
const wrongAnswers = totalQuestions - correctAnswers;
// 21 - 15 = 6
```

### 数据提取规则

#### 1. 总分提取

**支持的格式**:
- `我的得分: 75.5`
- `得分: 75.5`
- `75.5 / 100`
- `75.5/100`

**正则表达式**:
```typescript
const totalScoreMatch = textToUse.match(/我的得分[：:\s]*(\d+\.?\d*)/i) || 
                        textToUse.match(/得分[：:\s]*(\d+\.?\d*)/i) ||
                        textToUse.match(/(\d+\.?\d*)\s*[/／]\s*100/) ||
                        textToUse.match(/(\d+\.?\d*)[/／]100/);
```

#### 2. 最高分提取

**支持的格式**:
- `最高分: 100`
- `最高: 100`

**正则表达式**:
```typescript
const maxScoreMatch = textToUse.match(/最高分[：:\s]*(\d+\.?\d*)/i) ||
                      textToUse.match(/最高[：:\s]*(\d+\.?\d*)/i);
```

#### 3. 平均分提取

**支持的格式**:
- `平均分: 62.1`
- `平均: 62.1`

**正则表达式**:
```typescript
const avgScoreMatch = textToUse.match(/平均分[：:\s]*(\d+\.?\d*)/i) ||
                      textToUse.match(/平均[：:\s]*(\d+\.?\d*)/i);
```

#### 4. 难度系数提取

**支持的格式**:
- `难度: 4.9`
- `难度4.9`

**正则表达式**:
```typescript
const difficultyMatch = textToUse.match(/难度[：:\s]*(\d+\.?\d*)/i) ||
                        textToUse.match(/难度(\d+\.?\d*)/i);
```

**数据验证**:
```typescript
if (difficulty !== undefined && difficulty > 5) {
  console.warn(`难度系数 ${difficulty} 超过最大值 5，将被限制为 5`);
  difficulty = 5;
}
```

#### 5. 已击败考生百分比提取

**支持的格式**:
- `已击败考生: 48.9%`
- `击败考生: 48.9%`
- `已击败48.9%`

**正则表达式**:
```typescript
const beatPercentageMatch = textToUse.match(/已击败[考生\s]*[：:\s]*(\d+\.?\d*)%/i) ||
                            textToUse.match(/击败[考生\s]*[：:\s]*(\d+\.?\d*)%/i) ||
                            textToUse.match(/已击败(\d+\.?\d*)%/i);
```

#### 6. 用时提取

**支持的格式**:
- `用时 29分` → 1740秒
- `用时 84秒` → 84秒
- `用时 1分30秒` → 90秒
- `1时55分36秒` → 6936秒

**解析逻辑**:
```typescript
// 格式1: X分Y秒
if (moduleMatch[5]) {
  timeUsedSec = parseInt(moduleMatch[4]) * 60 + parseInt(moduleMatch[5]);
}
// 格式2: X秒 或 X分
else {
  timeUsedSec = parseInt(moduleMatch[4]);
  if (moduleMatch[0].includes('分')) {
    timeUsedSec = timeUsedSec * 60;
  }
}
```

---

## 代码实现

### 核心文件

#### 1. imageRecognition.ts - OCR识别服务

**位置**: `src/services/imageRecognition.ts`

**主要函数**:

##### recognizeText()

调用OCR API识别图片中的文字。

```typescript
export async function recognizeText(request: OcrRequest): Promise<string>
```

**参数**:
- `request.image`: Base64编码的图片
- `request.language_type`: 识别语言类型（可选）

**返回值**: 识别出的文本字符串

**异常**: 识别失败时抛出Error

##### fileToBase64()

将File对象转换为Base64编码。

```typescript
export function fileToBase64(file: File): Promise<string>
```

**参数**:
- `file`: File对象

**返回值**: Base64编码字符串（不包含前缀）

##### compressImage()

压缩和增强图片。

```typescript
export function compressImage(
  file: File, 
  maxWidth: number = 2400,
  quality: number = 0.95
): Promise<File>
```

**参数**:
- `file`: 原始图片文件
- `maxWidth`: 最大宽度，默认2400px
- `quality`: 压缩质量，默认0.95

**返回值**: 处理后的图片文件

#### 2. dataParser.ts - 数据解析服务

**位置**: `src/services/dataParser.ts`

**主要函数**:

##### parseExamData()

解析OCR识别的文本，提取考试数据。

```typescript
export function parseExamData(
  ocrText: string,
  examNumber: number,
  timeUsedSeconds: number = 0
): {
  examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>;
  moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[];
}
```

**参数**:
- `ocrText`: OCR识别出的文本
- `examNumber`: 考试期数
- `timeUsedSeconds`: 总用时（秒）

**返回值**: 
- `examRecord`: 考试记录对象
- `moduleScores`: 模块得分数组

**解析流程**:

1. **文本预处理**
   ```typescript
   const processedText = preprocessOcrText(ocrText);
   ```

2. **提取总体信息**
   ```typescript
   const totalScore = extractTotalScore(processedText);
   const maxScore = extractMaxScore(processedText);
   const averageScore = extractAverageScore(processedText);
   const difficulty = extractDifficulty(processedText);
   const beatPercentage = extractBeatPercentage(processedText);
   ```

3. **提取模块数据**
   ```typescript
   for (const module of moduleStructure) {
     // 尝试三种格式匹配
     const moduleData = matchModule(module.name, processedText);
     
     if (moduleData) {
       moduleScores.push(moduleData);
       
       // 提取子模块数据
       for (const childName of module.children) {
         const childData = matchModule(childName, processedText);
         if (childData) {
           childData.parent_module = module.name;
           moduleScores.push(childData);
         }
       }
     }
   }
   ```

4. **数据验证**
   ```typescript
   if (totalQuestions < correctAnswers) {
     console.warn(`警告: ${module.name} 的答对数大于总题数`);
   }
   if (accuracyRate > 100) {
     console.warn(`警告: ${module.name} 的正确率超过100%`);
   }
   ```

#### 3. api.ts - 数据库API

**位置**: `src/db/api.ts`

**主要函数**: 参见 [API接口文档](#api接口文档)

### 类型定义

**文件**: `src/types/index.ts`

#### OcrRequest - OCR请求类型

```typescript
export interface OcrRequest {
  image: string;              // base64编码的图片
  language_type?: string;     // 识别语言类型,默认CHN_ENG
  detect_direction?: boolean; // 是否检测图像朝向
  probability?: boolean;      // 是否返回置信度
}
```

#### OcrResponse - OCR响应类型

```typescript
export interface OcrResponse {
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

#### ExamRecord - 考试记录类型

```typescript
export interface ExamRecord {
  id: string;
  exam_number: number;
  exam_name: string;
  exam_type?: string;
  index_number: number;
  rating: number;
  total_score: number;
  max_score?: number;
  average_score?: number;
  pass_rate?: number;
  difficulty?: number;
  beat_percentage?: number;
  time_used?: number;
  image_url?: string;
  improvements?: string;
  mistakes?: string;
  exam_date?: string;
  report_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

#### ModuleScore - 模块得分类型

```typescript
export interface ModuleScore {
  id: string;
  exam_record_id: string;
  module_name: string;
  parent_module?: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  accuracy_rate?: number;
  time_used?: number;
  created_at: string;
}
```

---

## 迁移指南

### 从百度OCR迁移到腾讯云OCR

#### 步骤1：安装腾讯云SDK

```bash
npm install tencentcloud-sdk-nodejs
```

#### 步骤2：创建腾讯云OCR服务

创建新文件 `src/services/tencentOcr.ts`:

```typescript
import * as tencentcloud from 'tencentcloud-sdk-nodejs';

const OcrClient = tencentcloud.ocr.v20181119.Client;

// 腾讯云API配置
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: 'ap-guangzhou',  // 根据实际情况选择地域
  profile: {
    httpProfile: {
      endpoint: 'ocr.tencentcloudapi.com',
    },
  },
};

const client = new OcrClient(clientConfig);

// 调用腾讯云OCR API
export async function recognizeTextTencent(imageBase64: string): Promise<string> {
  try {
    const params = {
      ImageBase64: imageBase64,
      LanguageType: 'zh',  // 中文识别
      IsPdf: false,
      IsWords: false,
    };

    const response = await client.GeneralAccurateOCR(params);
    
    if (!response.TextDetections || response.TextDetections.length === 0) {
      throw new Error('未识别到文字');
    }

    // 拼接识别结果
    const text = response.TextDetections
      .map(item => item.DetectedText)
      .filter(line => line && line.length > 0)
      .join('\n');

    console.log('=== 腾讯云OCR识别完成 ===');
    console.log('识别到', response.TextDetections.length, '行文字');
    console.log('识别结果:', text);
    
    // 计算平均置信度
    const avgConfidence = response.TextDetections
      .reduce((sum, item) => sum + (item.Confidence || 0), 0) / 
      response.TextDetections.length;
    console.log('平均识别置信度:', avgConfidence.toFixed(2) + '%');
    
    if (avgConfidence < 80) {
      console.warn('⚠️ 识别置信度较低，可能是长截图或图片质量问题');
    }

    return text;
  } catch (error) {
    console.error('腾讯云OCR识别失败:', error);
    throw error;
  }
}
```

#### 步骤3：修改imageRecognition.ts

```typescript
// 在文件顶部添加导入
import { recognizeTextTencent } from './tencentOcr';

// 修改recognizeText函数
export async function recognizeText(request: OcrRequest): Promise<string> {
  // 判断使用哪个OCR服务
  const useTecentOcr = import.meta.env.VITE_USE_TENCENT_OCR === 'true';
  
  if (useTecentOcr) {
    // 使用腾讯云OCR
    return await recognizeTextTencent(request.image);
  } else {
    // 使用百度OCR（原有逻辑）
    // ... 保持原有代码不变 ...
  }
}
```

#### 步骤4：更新环境变量

在 `.env` 文件中添加：

```env
# OCR服务选择
VITE_USE_TENCENT_OCR=true

# 腾讯云配置
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
```

#### 步骤5：更新类型定义

在 `src/types/index.ts` 中添加腾讯云OCR响应类型：

```typescript
// 腾讯云OCR响应类型
export interface TencentOcrResponse {
  Response: {
    TextDetections: Array<{
      DetectedText: string;
      Confidence: number;
      Polygon: Array<{ X: number; Y: number }>;
      AdvancedInfo?: string;
      ItemPolygon?: {
        X: number;
        Y: number;
        Width: number;
        Height: number;
      };
      Words?: Array<{
        Confidence: number;
        Character: string;
        WordCoordPoint: Array<{ X: number; Y: number }>;
      }>;
      WordCoordPoint: Array<{ X: number; Y: number }>;
    }>;
    Language: string;
    Angel: number;
    PdfPageSize: number;
    RequestId: string;
  };
}
```

#### 步骤6：测试

1. 重启开发服务器
2. 上传测试图片
3. 检查识别结果
4. 对比百度OCR和腾讯云OCR的识别效果

### 对比分析

| 特性 | 百度OCR | 腾讯云OCR |
|------|---------|-----------|
| 识别准确率 | 95%+ | 95%+ |
| 支持语言 | 中英文混合 | 中英文混合 |
| 图片大小限制 | 4MB | 7MB |
| 图片尺寸限制 | 15x15 ~ 4096x4096 | 无明确限制 |
| 免费额度 | 500次/天 | 1000次/月 |
| 价格 | ¥0.015/次 | ¥0.015/次 |
| SDK支持 | 官方SDK | 官方SDK |
| 响应速度 | 快 | 快 |
| 特殊功能 | 段落信息、方向检测 | 单字信息、PDF支持 |

### 建议

1. **开发阶段**: 使用百度OCR（免费额度更高）
2. **生产环境**: 根据实际需求选择
   - 如果需要PDF识别 → 腾讯云OCR
   - 如果需要段落信息 → 百度OCR
   - 如果需要更高免费额度 → 百度OCR（500次/天 vs 1000次/月）

---

## 性能优化

### 1. 图片压缩优化

**当前配置**:
- 最大宽度: 2400px
- 压缩质量: 95%

**优化建议**:
- 根据实际识别效果调整参数
- 如果识别准确率高，可以降低质量到90%
- 如果识别准确率低，可以提高最大宽度到3000px

### 2. 缓存优化

**建议**:
- 缓存OCR识别结果（避免重复识别）
- 使用localStorage缓存最近的识别结果
- 设置合理的缓存过期时间

**实现示例**:
```typescript
const cacheKey = `ocr_${fileHash}`;
const cached = localStorage.getItem(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await recognizeText(request);
localStorage.setItem(cacheKey, JSON.stringify(result));
```

### 3. 并发控制

**问题**: 同时上传多张图片可能导致API调用超限

**解决方案**: 使用队列控制并发数量

```typescript
class OcrQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 2;  // 最大并发数

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift();
    
    if (task) {
      await task();
    }
    
    this.running--;
    this.process();
  }
}

const ocrQueue = new OcrQueue();

// 使用队列
const result = await ocrQueue.add(() => recognizeText(request));
```

### 4. 错误重试

**建议**: 对于网络错误，自动重试

```typescript
async function recognizeTextWithRetry(
  request: OcrRequest,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await recognizeText(request);
    } catch (error) {
      lastError = error as Error;
      console.warn(`OCR识别失败，重试 ${i + 1}/${maxRetries}`, error);
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError || new Error('OCR识别失败');
}
```

---

## 监控和日志

### 1. 识别质量监控

**指标**:
- 平均识别置信度
- 识别成功率
- 识别耗时

**实现**:
```typescript
// 记录识别质量
const ocrMetrics = {
  totalAttempts: 0,
  successCount: 0,
  failureCount: 0,
  avgConfidence: 0,
  avgDuration: 0,
};

// 在recognizeText函数中记录
const startTime = Date.now();
try {
  const result = await recognizeText(request);
  const duration = Date.now() - startTime;
  
  ocrMetrics.totalAttempts++;
  ocrMetrics.successCount++;
  ocrMetrics.avgDuration = 
    (ocrMetrics.avgDuration * (ocrMetrics.totalAttempts - 1) + duration) / 
    ocrMetrics.totalAttempts;
  
  console.log('OCR识别成功，耗时:', duration, 'ms');
} catch (error) {
  ocrMetrics.totalAttempts++;
  ocrMetrics.failureCount++;
  console.error('OCR识别失败:', error);
  throw error;
}
```

### 2. 数据解析监控

**指标**:
- 解析成功率
- 平均解析模块数
- 解析耗时

**实现**:
```typescript
const parseMetrics = {
  totalAttempts: 0,
  successCount: 0,
  avgModuleCount: 0,
  avgDuration: 0,
};

// 在parseExamData函数中记录
const startTime = Date.now();
const result = parseExamData(ocrText, examNumber, timeUsedSeconds);
const duration = Date.now() - startTime;

parseMetrics.totalAttempts++;
if (result.moduleScores.length > 0) {
  parseMetrics.successCount++;
}
parseMetrics.avgModuleCount = 
  (parseMetrics.avgModuleCount * (parseMetrics.totalAttempts - 1) + result.moduleScores.length) / 
  parseMetrics.totalAttempts;
parseMetrics.avgDuration = 
  (parseMetrics.avgDuration * (parseMetrics.totalAttempts - 1) + duration) / 
  parseMetrics.totalAttempts;

console.log('数据解析完成，耗时:', duration, 'ms');
console.log('解析到', result.moduleScores.length, '个模块');
```

### 3. 日志级别

**开发环境**: 详细日志（console.log）

**生产环境**: 只记录错误和警告（console.error、console.warn）

**配置**:
```typescript
const isDevelopment = import.meta.env.MODE === 'development';

function log(...args: any[]) {
  if (isDevelopment) {
    console.log(...args);
  }
}

function warn(...args: any[]) {
  console.warn(...args);
}

function error(...args: any[]) {
  console.error(...args);
}
```

---

## 故障排查

### 1. OCR识别置信度低

**现象**: 识别置信度 < 80%

**可能原因**:
- 图片质量差
- 图片模糊
- 光线不足
- 文字太小

**解决方案**:
1. 提高图片清晰度
2. 增强图片对比度
3. 调整图片预处理参数
4. 使用更高分辨率的截图

### 2. 模块数据匹配失败

**现象**: 日志显示"未找到模块数据"

**排查步骤**:

1. **查看OCR原始文本**
   ```typescript
   console.log('OCR原始文本:', ocrText);
   ```

2. **查看预处理后的文本**
   ```typescript
   console.log('预处理后文本:', processedText);
   ```

3. **查看模块名称位置**
   ```typescript
   console.log('找到模块位置:', moduleIndex);
   console.log('模块后的内容:', contextAfterModule);
   ```

4. **查看正则表达式匹配结果**
   ```typescript
   console.log('正则表达式:', pattern);
   console.log('匹配结果:', match);
   ```

5. **手动测试正则表达式**
   ```javascript
   // 在浏览器控制台中执行
   const text = "言语理解与表达\n21\n70%\n25";
   const pattern = /言语理解与表达[\s\S]{0,50}?(\d+)[\s\S]{0,20}?(\d+)%[\s\S]{0,20}?(\d+)/i;
   const match = text.match(pattern);
   console.log(match);
   ```

### 3. 数据保存失败

**现象**: 提示"创建考试记录失败"或"创建模块得分失败"

**可能原因**:
- 数据库连接失败
- 数据格式错误
- 字段约束冲突
- 权限不足

**排查步骤**:

1. **检查Supabase连接**
   ```typescript
   const { data, error } = await supabase.from('exam_records').select('count');
   console.log('数据库连接测试:', error ? '失败' : '成功');
   ```

2. **检查数据格式**
   ```typescript
   console.log('考试记录:', examRecord);
   console.log('模块得分:', moduleScores);
   ```

3. **检查字段约束**
   - `index_number` 必须唯一
   - `exam_number` 不能为空
   - `total_score` 不能为空

4. **查看Supabase日志**
   - 登录Supabase控制台
   - 查看 "Logs" → "Postgres Logs"

### 4. 性能问题

**现象**: 页面加载慢或卡顿

**排查步骤**:

1. **检查网络请求**
   - 打开浏览器开发者工具
   - 切换到 "Network" 标签
   - 查看请求耗时

2. **检查数据库查询**
   - 查看Supabase控制台的查询日志
   - 检查是否有慢查询

3. **检查图片大小**
   - 查看上传的图片大小
   - 确认图片压缩是否生效

4. **优化建议**:
   - 启用数据库索引
   - 使用分页加载
   - 启用浏览器缓存
   - 使用CDN加速静态资源

---

## 附录

### A. 百度OCR API完整参数

| 参数名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| image | string | 图片的Base64编码（不包含前缀） | - |
| url | string | 图片URL（与image二选一） | - |
| language_type | string | 识别语言类型 | CHN_ENG |
| detect_direction | boolean | 是否检测图像朝向 | false |
| detect_language | boolean | 是否检测语言 | false |
| probability | boolean | 是否返回置信度 | false |
| paragraph | boolean | 是否输出段落信息 | false |
| recognize_granularity | string | 识别颗粒度（big/small） | small |
| vertexes_location | boolean | 是否返回文字外接多边形顶点位置 | false |

### B. 腾讯云OCR API完整参数

| 参数名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| ImageBase64 | string | 图片的Base64编码 | - |
| ImageUrl | string | 图片URL（与ImageBase64二选一） | - |
| LanguageType | string | 识别语言类型（zh/en/zh_rare） | zh |
| IsPdf | boolean | 是否为PDF文件 | false |
| PdfPageNumber | integer | PDF页码（从0开始） | 0 |
| IsWords | boolean | 是否返回单字信息 | false |

### C. 正则表达式测试工具

在浏览器控制台中使用以下代码测试正则表达式：

```javascript
// 测试手机端格式
const mobileText = "政治理论\n共15题，答对10题，正确率67%，用时23秒";
const mobilePattern = /政治理论[\s\n]{0,20}共[\s，,]*?(\d+)[\s]*?(?:题|道)[\s，,]+?答对[\s，,]*?(\d+)[\s]*?(?:题|道)[\s，,]+?正确率[\s，,]*?(\d+)[\s]*?%[\s，,]+?用时[\s，,]*?(\d+)[\s]*?(?:分[\s]*?)?(\d+)?[\s]*?秒/i;
console.log('手机端格式匹配:', mobileText.match(mobilePattern));

// 测试网页版格式
const webText = "政治理论\n总题数 15题  答对 10题  正确率 67%  用时 23秒";
const webPattern = /政治理论[\s\S]{0,200}?(?:总题数|共计)[：:\s]{0,10}(\d+)[\s]*(?:题|道)[\s]{0,20}答对[：:\s]{0,10}(\d+)[\s]*(?:题|道)[\s]{0,20}正确率[：:\s]{0,10}(\d+)%[\s]{0,20}用时[：:\s]{0,10}(\d+)(?:[\s]*(\d+))?[\s]*(?:秒|分)/i;
console.log('网页版格式匹配:', webText.match(webPattern));

// 测试简化格式
const simpleText = "言语理解与表达\n21\n70%\n25";
const simplePattern = /言语理解与表达[\s\S]{0,50}?(\d+)[\s\S]{0,20}?(\d+)%[\s\S]{0,20}?(\d+)/i;
console.log('简化格式匹配:', simpleText.match(simplePattern));
```

### D. 数据库查询优化

**慢查询示例**:
```sql
-- 不推荐：没有索引
SELECT * FROM module_scores WHERE module_name = '政治理论';

-- 推荐：使用索引
SELECT * FROM module_scores 
WHERE module_name = '政治理论' 
ORDER BY created_at DESC 
LIMIT 10;
```

**创建索引**:
```sql
-- 已创建的索引
CREATE INDEX idx_module_scores_module_name ON module_scores(module_name);
CREATE INDEX idx_module_scores_exam_record_id ON module_scores(exam_record_id);
CREATE INDEX idx_module_scores_parent_module ON module_scores(parent_module);

-- 如需要，可以创建复合索引
CREATE INDEX idx_module_scores_exam_module ON module_scores(exam_record_id, module_name);
```

### E. 常用SQL查询

#### 1. 查询所有考试记录

```sql
SELECT * FROM exam_records 
ORDER BY sort_order ASC;
```

#### 2. 查询指定考试的模块得分

```sql
SELECT * FROM module_scores 
WHERE exam_record_id = 'uuid-123' 
ORDER BY module_name ASC;
```

#### 3. 查询大模块的平均正确率

```sql
SELECT 
  module_name,
  AVG(accuracy_rate) as avg_accuracy
FROM module_scores
WHERE parent_module IS NULL
GROUP BY module_name
ORDER BY avg_accuracy DESC;
```

#### 4. 查询弱势模块（正确率<60%）

```sql
SELECT 
  module_name,
  AVG(accuracy_rate) as avg_accuracy
FROM module_scores
WHERE parent_module IS NULL
GROUP BY module_name
HAVING AVG(accuracy_rate) < 60
ORDER BY avg_accuracy ASC;
```

#### 5. 查询成绩趋势

```sql
SELECT 
  er.exam_number,
  er.exam_name,
  er.total_score,
  er.created_at
FROM exam_records er
ORDER BY er.sort_order ASC;
```

#### 6. 查询模块用时趋势

```sql
SELECT 
  er.exam_number,
  ms.module_name,
  ms.time_used
FROM exam_records er
JOIN module_scores ms ON ms.exam_record_id = er.id
WHERE ms.parent_module IS NULL
ORDER BY er.sort_order ASC, ms.module_name ASC;
```

---

## 参考资料

### 官方文档

- [百度OCR API文档](https://cloud.baidu.com/doc/OCR/index.html)
- [腾讯云OCR API文档](https://cloud.tencent.com/document/product/866)
- [Supabase文档](https://supabase.com/docs)
- [React文档](https://react.dev/)
- [TypeScript文档](https://www.typescriptlang.org/docs/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [ECharts文档](https://echarts.apache.org/zh/index.html)

### 相关工具

- [正则表达式测试工具](https://regex101.com/)
- [Base64编码/解码工具](https://www.base64encode.org/)
- [JSON格式化工具](https://jsonformatter.org/)
- [图片压缩工具](https://tinypng.com/)

---

## 版本历史

### v1.0.0 (2024-12-09)
- 初始版本
- 支持百度OCR API
- 支持三种文本格式

### v1.1.0 (2024-12-10)
- 添加腾讯云OCR迁移指南
- 优化图片预处理
- 改进数据解析逻辑

---

## 联系方式

如有问题或建议，请联系：

- 项目仓库: [GitHub](https://github.com/your-repo)
- 问题反馈: [Issues](https://github.com/your-repo/issues)
- 邮箱: support@example.com

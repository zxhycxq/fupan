import type { OcrRequest, OcrResponse } from '@/types';

const APP_ID = import.meta.env.VITE_APP_ID;
const API_BASE_URL = '/api/miaoda/runtime/apicenter/source/proxy';

// 调用通用文字识别(高精度版)API（支持长截图分段识别）
export async function recognizeText(request: OcrRequest): Promise<string> {
  try {
    // 构建表单数据
    const formData = new URLSearchParams();
    formData.append('image', request.image);
    
    // 默认使用中英文混合识别
    formData.append('language_type', request.language_type || 'CHN_ENG');
    
    // 启用方向检测，提高手机截图识别准确度
    formData.append('detect_direction', 'true');
    
    // 启用概率值返回，用于判断识别质量
    formData.append('probability', 'true');
    
    // 启用段落信息，保持文本结构
    formData.append('paragraph', 'true');
    
    // 针对长截图：启用识别颗粒度（big - 更适合长文本）
    formData.append('recognize_granularity', 'big');
    
    // 针对长截图：启用垂直文本检测
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
      console.error('OCR API返回错误:', result);
      throw new Error(result.msg || '文字识别失败');
    }

    // 将识别结果拼接成文本，保留更多结构信息
    const text = result.data.words_result
      .map(item => {
        // 清理文本：去除多余空格，但保留必要的分隔符
        const cleanedText = item.words
          .replace(/\s+/g, ' ')  // 多个空格合并为一个
          .trim();
        return cleanedText;
      })
      .filter(line => line.length > 0)  // 过滤空行
      .join('\n');

    console.log('=== OCR识别完成 ===');
    console.log('识别到', result.data.words_result_num, '行文字');
    console.log('识别结果:', text);
    console.log('前300字符:', text.substring(0, 300));
    
    // 输出识别质量信息
    if (result.data.words_result.some(item => item.probability)) {
      const avgProbability = result.data.words_result
        .filter(item => item.probability)
        .reduce((sum, item) => sum + (item.probability?.average || 0), 0) / 
        result.data.words_result.length;
      console.log('平均识别置信度:', (avgProbability * 100).toFixed(2) + '%');
      
      // 如果置信度较低，给出警告
      if (avgProbability < 0.8) {
        console.warn('⚠️ 识别置信度较低，可能是长截图或图片质量问题');
      }
    }
    
    return text;
  } catch (error) {
    console.error('文字识别失败:', error);
    throw error;
  }
}

// 将文件转换为base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // 移除data:image/xxx;base64,前缀
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 图片预处理：增强对比度和清晰度（针对安卓长截图优化）
function enhanceImage(canvas: HTMLCanvasElement, isLongScreenshot: boolean = false): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // 1. 增强对比度（长截图使用更强的对比度）
  const contrast = isLongScreenshot ? 1.3 : 1.2;  // 对比度系数
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;       // R
    data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
    data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
  }

  // 2. 锐化处理（长截图使用更强的锐化）
  const sharpness = isLongScreenshot ? 0.7 : 0.5;  // 锐化强度
  const tempData = new Uint8ClampedArray(data);

  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      for (let c = 0; c < 3; c++) {  // RGB通道
        const i = (y * canvas.width + x) * 4 + c;
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

  // 3. 针对长截图：降噪处理（去除压缩噪点）
  if (isLongScreenshot) {
    const denoiseData = new Uint8ClampedArray(data);
    const radius = 1;
    
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

  ctx.putImageData(imageData, 0, 0);
}

// 压缩图片 - 针对手机截图优化（支持安卓长截图）
export function compressImage(
  file: File, 
  maxWidth: number = 2400,  // 提高最大宽度以保留更多细节
  quality: number = 0.95    // 提高质量以保留文字清晰度
): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // 检查是否支持 document 和 canvas
      if (typeof document === 'undefined') {
        console.warn('当前环境不支持 document，跳过图片压缩');
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              console.log(`原始图片尺寸: ${width}x${height}`);
              
              // 判断是否为长截图（高度/宽度比例 > 2.5）
              const aspectRatio = height / width;
              const isLongScreenshot = aspectRatio > 2.5;
              
              if (isLongScreenshot) {
                console.log(`检测到长截图，高宽比: ${aspectRatio.toFixed(2)}`);
              }

              // 如果图片宽度超过最大宽度,按比例缩放
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
                console.log(`缩放后尺寸: ${width}x${height}`);
              }

              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                console.warn('无法创建canvas上下文，使用原图');
                resolve(file);
                return;
              }

              // 绘制图片
              ctx.drawImage(img, 0, 0, width, height);

              // 对手机截图进行图像增强（长截图使用增强参数）
              console.log(isLongScreenshot ? '应用长截图增强处理...' : '应用图像增强处理...');
              enhanceImage(canvas, isLongScreenshot);

              // 转换为blob
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    console.warn('图片压缩失败，使用原图');
                    resolve(file);
                    return;
                  }

                  // 创建新的File对象
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });

                  console.log(`图片处理完成: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                  resolve(compressedFile);
                },
                'image/jpeg',
                quality
              );
            } catch (error) {
              console.warn('图片压缩过程出错，使用原图:', error);
              resolve(file);
            }
          };
          img.onerror = () => {
            console.warn('图片加载失败，使用原图');
            resolve(file);
          };
          img.src = e.target?.result as string;
        } catch (error) {
          console.warn('图片处理出错，使用原图:', error);
          resolve(file);
        }
      };
      reader.onerror = () => {
        console.warn('文件读取失败，使用原图');
        resolve(file);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.warn('压缩图片时出错，使用原图:', error);
      resolve(file);
    }
  });
}


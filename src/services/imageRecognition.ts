import type { OcrRequest, OcrResponse } from '@/types';

const APP_ID = import.meta.env.VITE_APP_ID;
const API_BASE_URL = '/api/miaoda/runtime/apicenter/source/proxy';

// 调用通用文字识别(高精度版)API
export async function recognizeText(request: OcrRequest): Promise<string> {
  try {
    // 构建表单数据
    const formData = new URLSearchParams();
    formData.append('image', request.image);
    
    if (request.language_type) {
      formData.append('language_type', request.language_type);
    }
    
    if (request.detect_direction !== undefined) {
      formData.append('detect_direction', String(request.detect_direction));
    }
    
    if (request.probability !== undefined) {
      formData.append('probability', String(request.probability));
    }

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

    // 将识别结果拼接成文本
    const text = result.data.words_result
      .map(item => item.words)
      .join('\n');

    console.log('识别成功,识别到', result.data.words_result_num, '行文字');
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

// 压缩图片
export function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.9): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 如果图片宽度超过最大宽度,按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }

            // 创建新的File对象
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log(`图片压缩: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}


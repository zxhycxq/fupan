import type { ImageRecognitionRequest, ImageRecognitionResponse, ImageRecognitionResultResponse } from '@/types';

const APP_ID = import.meta.env.VITE_APP_ID;
const API_BASE_URL = '/api/miaoda/runtime/apicenter/source/proxy';

// 提交图像识别请求
export async function submitImageRecognition(
  request: ImageRecognitionRequest
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/vCkBqBnYAumpihoy7mJKFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': APP_ID,
      },
      body: JSON.stringify(request),
    });

    const result: ImageRecognitionResponse = await response.json();

    if (result.status !== 0) {
      throw new Error(result.msg || '图像识别请求失败');
    }

    return result.data.result.task_id;
  } catch (error) {
    console.error('提交图像识别请求失败:', error);
    throw error;
  }
}

// 获取图像识别结果
export async function getImageRecognitionResult(
  taskId: string
): Promise<ImageRecognitionResultResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/p1fmNnVdKApGo3cse1Xn4m`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': APP_ID,
      },
      body: JSON.stringify({ task_id: taskId }),
    });

    const result: ImageRecognitionResultResponse = await response.json();

    if (result.status !== 0) {
      throw new Error(result.msg || '获取识别结果失败');
    }

    return result;
  } catch (error) {
    console.error('获取图像识别结果失败:', error);
    throw error;
  }
}

// 轮询获取识别结果(最多尝试10次,每次间隔2秒)
export async function pollImageRecognitionResult(
  taskId: string,
  maxAttempts: number = 10,
  interval: number = 2000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getImageRecognitionResult(taskId);

    if (result.data.result.ret_code === 0) {
      // 处理成功
      return result.data.result.description;
    }

    if (result.data.result.ret_code === 1) {
      // 处理中,等待后重试
      await new Promise((resolve) => setTimeout(resolve, interval));
      continue;
    }

    // 其他错误
    throw new Error(result.data.result.ret_msg || '识别失败');
  }

  throw new Error('识别超时,请稍后重试');
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

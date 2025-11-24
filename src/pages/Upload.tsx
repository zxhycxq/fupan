import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, InputNumber, Progress, message, Space } from 'antd';
import { UploadOutlined, LoadingOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { fileToBase64, recognizeText, compressImage } from '@/services/imageRecognition';
import { parseExamData } from '@/services/dataParser';
import { createExamRecord, createModuleScores, getNextIndexNumber, checkIndexNumberExists } from '@/db/api';

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

export default function Upload() {
  const [examName, setExamName] = useState<string>('');
  const [indexNumber, setIndexNumber] = useState<number>(1);
  const [timeUsedMinutes, setTimeUsedMinutes] = useState<number>(0);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const navigate = useNavigate();

  // 获取下一个可用的索引号
  useEffect(() => {
    const fetchNextIndex = async () => {
      try {
        const nextIndex = await getNextIndexNumber();
        setIndexNumber(nextIndex);
        setExamName(`第${nextIndex}期`);
      } catch (error) {
        console.error('获取下一个索引号失败:', error);
      }
    };
    fetchNextIndex();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const validFiles: FileWithPreview[] = [];

    for (const file of files) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        message.error(`${file.name} 不是图片文件`);
        continue;
      }

      // 验证文件大小(10MB)
      if (file.size > 10 * 1024 * 1024) {
        message.error(`${file.name} 大小超过10MB`);
        continue;
      }

      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      validFiles.push({ file, previewUrl });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].previewUrl);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      message.error('请至少选择一张图片');
      return;
    }

    if (!examName || examName.trim() === '') {
      message.error('请输入考试名称');
      return;
    }

    if (!indexNumber || indexNumber < 1) {
      message.error('请输入有效的索引号(必须大于0)');
      return;
    }

    // 检查索引号是否已存在
    try {
      const exists = await checkIndexNumberExists(indexNumber);
      if (exists) {
        message.error('该索引号已被使用，请选择其他索引号');
        return;
      }
    } catch (error) {
      console.error('检查索引号失败:', error);
      message.error('检查索引号失败，请重试');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentStep('准备上传...');

      const totalSteps = selectedFiles.length + 2;
      const allRecognizedTexts: string[] = [];

      // 处理每张图片
      for (let i = 0; i < selectedFiles.length; i++) {
        const { file } = selectedFiles[i];
        setCurrentStep(`正在处理第 ${i + 1}/${selectedFiles.length} 张图片...`);

        // 压缩图片
        setUploadProgress(((i + 0.3) / totalSteps) * 100);
        let processedFile = file;
        try {
          // 如果图片大于2MB,进行压缩
          if (file.size > 2 * 1024 * 1024) {
            console.log(`图片 ${i + 1} 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB, 开始压缩...`);
            processedFile = await compressImage(file, 1920, 0.85);
          } else {
            console.log(`图片 ${i + 1} 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB, 无需压缩`);
          }
        } catch (error) {
          console.error('图片压缩失败,使用原图:', error);
          processedFile = file;
        }

        // 识别文字
        setCurrentStep(`正在识别第 ${i + 1}/${selectedFiles.length} 张图片...`);
        setUploadProgress(((i + 0.6) / totalSteps) * 100);
        
        try {
          // 将图片转换为base64
          const base64Image = await fileToBase64(processedFile);
          
          // 调用OCR识别
          const ocrText = await recognizeText({
            image: base64Image,
            language_type: 'CHN_ENG',
          });
          
          if (ocrText && ocrText.trim()) {
            allRecognizedTexts.push(ocrText);
          }
        } catch (error) {
          console.error(`识别第 ${i + 1} 张图片失败:`, error);
          // 继续处理下一张图片
        }

        setUploadProgress(((i + 1) / totalSteps) * 100);
      }

      // 解析数据
      setCurrentStep('正在解析数据...');
      setUploadProgress(((selectedFiles.length + 1) / totalSteps) * 100);
      const combinedText = allRecognizedTexts.join('\n\n');
      
      // 传入用户输入的用时(分钟转秒)
      const timeUsedSeconds = timeUsedMinutes * 60;
      const { examRecord, moduleScores } = parseExamData(
        combinedText, 
        indexNumber, // 使用 indexNumber 作为 exam_number 保持向后兼容
        timeUsedSeconds
      );

      // 添加考试名称和索引号
      const recordWithNameAndIndex = {
        ...examRecord,
        exam_name: examName,
        index_number: indexNumber,
        rating: 0, // 默认星级为 0
      };

      // 保存到数据库
      setCurrentStep('正在保存数据...');
      setUploadProgress(((selectedFiles.length + 2) / totalSteps) * 100);
      
      const savedRecord = await createExamRecord(recordWithNameAndIndex);

      // 保存模块得分
      if (moduleScores.length > 0) {
        const scoresWithExamId = moduleScores.map(score => ({
          ...score,
          exam_record_id: savedRecord.id,
        }));
        await createModuleScores(scoresWithExamId);
      }

      message.success(`已成功上传并解析 ${selectedFiles.length} 张图片`);

      // 清理预览URL
      selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));

      // 跳转到详情页面
      navigate(`/exam/${savedRecord.id}`);
    } catch (error) {
      console.error('上传失败:', error);
      message.error(error instanceof Error ? error.message : '上传失败,请重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentStep('');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card 
        title="上传考试成绩"
        className="max-w-4xl mx-auto"
      >
        <div className="mb-4 text-gray-500">
          上传考试成绩截图,系统将自动识别并分析数据。支持一次上传多张图片。
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div>
              <div className="mb-2 text-sm font-medium">考试名称 <span className="text-red-500">*</span></div>
              <Input
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="请输入考试名称"
                maxLength={50}
                showCount
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                例如：第1期、2024年国考模拟等
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">索引号 <span className="text-red-500">*</span></div>
              <InputNumber
                min={1}
                value={indexNumber}
                onChange={(value) => setIndexNumber(value || 1)}
                placeholder="请输入索引号"
                style={{ width: '100%' }}
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                用于排序，不能重复，默认自动递增
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">用时(分钟)</div>
              <InputNumber
                min={0}
                value={timeUsedMinutes}
                onChange={(value) => setTimeUsedMinutes(value || 0)}
                placeholder="请输入考试用时(分钟)"
                style={{ width: '100%' }}
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                请输入考试用时，单位为分钟
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">考试成绩截图</div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="text-sm text-gray-500 mt-1">
              可以一次选择多张图片,每张图片最大10MB。建议按顺序选择图片以便更好地识别。
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    已选择 {selectedFiles.length} 张图片
                  </div>
                  <Button
                    type="default"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
                      setSelectedFiles([]);
                    }}
                    disabled={isUploading}
                  >
                    清空所有
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedFiles.map((fileWithPreview, index) => (
                    <div
                      key={index}
                      className="relative border rounded-lg p-4 group"
                    >
                      <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      />
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        {index + 1}
                      </div>
                      <img
                        src={fileWithPreview.previewUrl}
                        alt={`预览 ${index + 1}`}
                        className="w-full h-48 object-contain rounded"
                      />
                      <div className="mt-2 text-sm text-gray-600 truncate">
                        {fileWithPreview.file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress percent={Math.round(uploadProgress)} status="active" />
            </div>
          )}

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            icon={isUploading ? <LoadingOutlined /> : <UploadOutlined />}
            loading={isUploading}
            disabled={isUploading || selectedFiles.length === 0}
            block
          >
            {isUploading 
              ? '处理中...' 
              : `上传并解析 (${selectedFiles.length} 张图片)`
            }
          </Button>
        </form>
      </Card>
    </div>
  );
}

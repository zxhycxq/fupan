import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, InputNumber, Progress, message, Spin, Tabs, Select } from 'antd';
import { UploadOutlined, LoadingOutlined, CloseOutlined, DeleteOutlined, PictureOutlined, FormOutlined } from '@ant-design/icons';
import { fileToBase64, recognizeText, compressImage } from '@/services/imageRecognition';
import { parseExamData } from '@/services/dataParser';
import { createExamRecord, createModuleScores, getNextSortOrder, getNextIndexNumber } from '@/db/api';
import FormInputTab from '@/components/exam/FormInputTab';
import PageHeader from '@/components/common/PageHeader';

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

export default function Upload() {
  const [activeTab, setActiveTab] = useState<string>('image');
  const [examName, setExamName] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [examType, setExamType] = useState<string>('国考模考');
  const [timeUsedMinutes, setTimeUsedMinutes] = useState<number>(120);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const navigate = useNavigate();

  // 获取下一个可用的排序号
  useEffect(() => {
    const fetchNextSortOrder = async () => {
      try {
        const nextSortOrder = await getNextSortOrder();
        setSortOrder(nextSortOrder);
        setExamName(`第${nextSortOrder}期`);
      } catch (error) {
        console.error('获取下一个排序号失败:', error);
      }
    };
    fetchNextSortOrder();
  }, []);

  // 上传时禁止页面滚动
  useEffect(() => {
    if (isUploading) {
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      // 禁止滚动
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // 恢复滚动
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      // 恢复滚动位置
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // 清理函数
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isUploading]);

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
        sortOrder, // 使用 sortOrder 作为 exam_number
        timeUsedSeconds
      );

      console.log('=== 准备保存数据 ===');
      console.log('解析到的模块数量:', moduleScores.length);
      console.log('模块列表:', moduleScores.map(m => `${m.parent_module ? m.parent_module + ' > ' : ''}${m.module_name}`).join(', '));

      // 获取下一个可用的索引号
      const nextIndexNumber = await getNextIndexNumber();
      console.log('获取到的索引号:', nextIndexNumber);

      // 添加考试名称、排序号、索引号和考试类型
      const recordWithNameAndSortOrder = {
        ...examRecord,
        exam_name: examName,
        exam_type: examType, // 添加考试类型
        sort_order: sortOrder,
        index_number: nextIndexNumber, // 使用自动生成的唯一索引号
        rating: 0, // 默认星级为 0
      };

      // 保存到数据库
      setCurrentStep('正在保存数据...');
      setUploadProgress(((selectedFiles.length + 2) / totalSteps) * 100);
      
      const savedRecord = await createExamRecord(recordWithNameAndSortOrder);
      console.log('考试记录已保存, ID:', savedRecord.id);

      // 保存模块得分
      if (moduleScores.length > 0) {
        const scoresWithExamId = moduleScores.map(score => ({
          ...score,
          exam_record_id: savedRecord.id,
        }));
        console.log('准备保存', scoresWithExamId.length, '个模块数据');
        const savedScores = await createModuleScores(scoresWithExamId);
        console.log('实际保存了', savedScores.length, '个模块数据');
      } else {
        console.warn('警告: 没有解析到任何模块数据!');
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
    <div className="container mx-auto py-8 px-4 relative">
      {/* 页面头部 */}
      <PageHeader />

      {/* 上传中的全屏遮罩 */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <Spin size="large" />
              <div className="mt-4 text-lg font-medium">{currentStep}</div>
              <div className="mt-4">
                <Progress 
                  percent={Math.round(uploadProgress)} 
                  status="active"
                  strokeColor={{
                    '0%': '#1890ff',
                    '100%': '#52c41a',
                  }}
                />
              </div>
              <div className="mt-4 text-sm text-gray-500">
                正在处理中，请勿关闭页面或刷新...
              </div>
            </div>
          </div>
        </div>
      )}

      <Card 
        title="上传考试成绩"
        className="max-w-4xl mx-auto"
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'image',
              label: (
                <span>
                  <PictureOutlined />
                  <span className="ml-2">成绩截图</span>
                </span>
              ),
              children: (
                <div>
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
                </div>
              )
            },
            {
              key: 'form',
              label: (
                <span>
                  <FormOutlined />
                  <span className="ml-2">表单录入</span>
                </span>
              ),
              children: (
                <div>
                  <div className="mb-4 text-gray-500">
                    手动填写各模块的成绩数据。展开对应模块填写题目数量、答对数量和用时。
                  </div>
                  
                  <div className="mb-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
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
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-medium">考试类型</div>
                      <Select
                        value={examType}
                        onChange={(value) => setExamType(value)}
                        style={{ width: '100%' }}
                        options={[
                          { value: '国考真题', label: '国考真题' },
                          { value: '国考模考', label: '国考模考' },
                          { value: '省考真题', label: '省考真题' },
                          { value: '省考模考', label: '省考模考' },
                          { value: '其他', label: '其他' }
                        ]}
                      />
                    </div>
                  </div>

                  <FormInputTab
                    examName={examName}
                    sortOrder={sortOrder}
                    examType={examType}
                    onSubmitStart={() => {
                      setIsUploading(true);
                      setCurrentStep('正在保存数据...');
                    }}
                    onSubmitEnd={() => {
                      setIsUploading(false);
                      setCurrentStep('');
                    }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}

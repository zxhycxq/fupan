import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, Loader2, X } from 'lucide-react';
import { fileToBase64, submitImageRecognition, pollImageRecognitionResult } from '@/services/imageRecognition';
import { parseExamData } from '@/services/dataParser';
import { createExamRecord, createModuleScores } from '@/db/api';

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

export default function Upload() {
  const [examNumber, setExamNumber] = useState<number>(1);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const validFiles: FileWithPreview[] = [];

    for (const file of files) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast({
          title: '错误',
          description: `${file.name} 不是图片文件`,
          variant: 'destructive',
        });
        continue;
      }

      // 验证文件大小(10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: '错误',
          description: `${file.name} 大小超过10MB`,
          variant: 'destructive',
        });
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
      // 释放预览URL
      URL.revokeObjectURL(newFiles[index].previewUrl);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast({
        title: '错误',
        description: '请至少选择一张图片',
        variant: 'destructive',
      });
      return;
    }

    if (!examNumber || examNumber < 1) {
      toast({
        title: '错误',
        description: '请输入有效的考试期数',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // 存储所有图片的识别结果
      const allOcrTexts: string[] = [];

      // 依次处理每张图片
      for (let i = 0; i < selectedFiles.length; i++) {
        const { file } = selectedFiles[i];
        
        toast({
          title: '处理中',
          description: `正在处理第 ${i + 1}/${selectedFiles.length} 张图片...`,
        });

        // 1. 将图片转换为base64
        const base64Image = await fileToBase64(file);

        // 2. 提交图像识别请求
        const taskId = await submitImageRecognition({
          image: base64Image,
          question: '请详细提取这张考试成绩截图中的所有信息,包括总分、用时、各模块的题数、答对数、答错数、未答数、正确率和用时。请按照原始格式输出所有数据。',
        });

        // 3. 轮询获取识别结果
        const ocrText = await pollImageRecognitionResult(taskId);
        allOcrTexts.push(ocrText);
      }

      // 4. 合并所有识别结果
      toast({
        title: '处理中',
        description: '正在解析识别结果...',
      });
      const combinedText = allOcrTexts.join('\n\n');

      // 5. 解析数据
      const { examRecord, moduleScores } = parseExamData(combinedText, examNumber);

      // 6. 保存到数据库
      toast({
        title: '处理中',
        description: '正在保存数据...',
      });
      const savedRecord = await createExamRecord(examRecord);
      
      if (moduleScores.length > 0) {
        const scoresWithExamId = moduleScores.map(score => ({
          ...score,
          exam_record_id: savedRecord.id,
        }));
        await createModuleScores(scoresWithExamId);
      }

      toast({
        title: '成功',
        description: `已成功上传并解析 ${selectedFiles.length} 张图片`,
      });

      // 清理预览URL
      selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));

      // 跳转到详情页面
      navigate(`/exam/${savedRecord.id}`);
    } catch (error) {
      console.error('上传失败:', error);
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '上传失败,请重试',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>上传考试成绩</CardTitle>
          <CardDescription>
            上传考试成绩截图,系统将自动识别并分析数据。支持一次上传多张图片。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="examNumber">考试期数</Label>
              <Input
                id="examNumber"
                type="number"
                min="1"
                value={examNumber}
                onChange={(e) => setExamNumber(parseInt(e.target.value))}
                placeholder="请输入考试期数"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">考试成绩截图</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                可以一次选择多张图片,每张图片最大10MB
              </p>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      已选择 {selectedFiles.length} 张图片
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
                        setSelectedFiles([]);
                      }}
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
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <img
                          src={fileWithPreview.previewUrl}
                          alt={`预览 ${index + 1}`}
                          className="w-full h-auto rounded"
                        />
                        <p className="mt-2 text-xs text-muted-foreground truncate">
                          {fileWithPreview.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  上传并解析 ({selectedFiles.length} 张图片)
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

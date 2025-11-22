import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, Loader2 } from 'lucide-react';
import { fileToBase64, submitImageRecognition, pollImageRecognitionResult } from '@/services/imageRecognition';
import { parseExamData } from '@/services/dataParser';
import { createExamRecord, createModuleScores } from '@/db/api';

export default function Upload() {
  const [examNumber, setExamNumber] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast({
          title: '错误',
          description: '请选择图片文件',
          variant: 'destructive',
        });
        return;
      }

      // 验证文件大小(10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: '错误',
          description: '图片大小不能超过10MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      
      // 创建预览URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: '错误',
        description: '请选择要上传的图片',
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
      // 1. 将图片转换为base64
      toast({
        title: '处理中',
        description: '正在上传图片...',
      });
      const base64Image = await fileToBase64(selectedFile);

      // 2. 提交图像识别请求
      toast({
        title: '处理中',
        description: '正在识别图片内容...',
      });
      const taskId = await submitImageRecognition({
        image: base64Image,
        question: '请详细提取这张考试成绩截图中的所有信息,包括总分、用时、各模块的题数、答对数、答错数、未答数、正确率和用时。请按照原始格式输出所有数据。',
      });

      // 3. 轮询获取识别结果
      toast({
        title: '处理中',
        description: '正在解析识别结果...',
      });
      const ocrText = await pollImageRecognitionResult(taskId);

      // 4. 解析数据
      const { examRecord, moduleScores } = parseExamData(ocrText, examNumber);

      // 5. 保存到数据库
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
        description: '考试成绩已成功上传并解析',
      });

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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>上传考试成绩</CardTitle>
          <CardDescription>
            上传考试成绩截图,系统将自动识别并分析数据
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
              <Label htmlFor="image">考试成绩截图</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                  required
                />
              </div>
              {previewUrl && (
                <div className="mt-4 border rounded-lg p-4">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  上传并解析
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

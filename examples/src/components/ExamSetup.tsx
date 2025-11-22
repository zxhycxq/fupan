import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { categories, networkEngineerQuestions } from '@/data/questions';
import { BookOpen, Play, Settings, Filter } from 'lucide-react';

interface ExamSetupProps {
  onStartExam: (selectedCategories: string[], questionCount: number) => void;
}

export function ExamSetup({ onStartExam }: ExamSetupProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const [questionCount, setQuestionCount] = useState(8);

  // 计算每个分类的题目数量
  const getCategoryQuestionCount = (category: string) => {
    return networkEngineerQuestions.filter(q => q.category === category).length;
  };

  // 计算当前选中分类的总题目数
  const getAvailableQuestions = () => {
    return networkEngineerQuestions.filter(q => selectedCategories.includes(q.category)).length;
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    }
  };

  const handleSelectAll = () => {
    setSelectedCategories(categories);
  };

  const handleDeselectAll = () => {
    setSelectedCategories([]);
  };

  const availableQuestions = getAvailableQuestions();
  const isValidSetup = selectedCategories.length > 0 && questionCount > 0 && availableQuestions >= questionCount;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 标题卡片 */}
      <Card className="text-center p-8 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 shadow-elegant">
        <CardContent className="space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">网络工程师考试模拟系统</h1>
          <p className="text-muted-foreground text-lg">
            基于历年真题和官方教程，帮助你高效备考网络工程师资格考试
          </p>
        </CardContent>
      </Card>

      {/* 考试设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            考试设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 知识点选择 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                选择知识点范围
              </Label>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  全选
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  全不选
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const questionCount = getCategoryQuestionCount(category);
                return (
                  <div key={category} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={category} 
                        className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category}
                      </Label>
                      <div className="text-xs text-muted-foreground mt-1">
                        {questionCount} 题
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">已选择:</span>
              {selectedCategories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* 题目数量选择 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">题目数量</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[5, 8, 10, 15].map((count) => (
                <Button
                  key={count}
                  variant={questionCount === count ? "default" : "outline"}
                  onClick={() => setQuestionCount(count)}
                  className="h-12"
                >
                  {count} 题
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 开始考试按钮 */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              准备开始模拟考试，共 {questionCount} 题
            </p>
            <p className="text-sm text-muted-foreground">
              涵盖 {selectedCategories.length} 个知识点分类
            </p>
            <div className="mt-2">
              <p className={`text-sm ${availableQuestions >= questionCount ? 'text-green-600' : 'text-red-600'}`}>
                可用题目: {availableQuestions} 题 
                {availableQuestions < questionCount && ` (需要 ${questionCount} 题，还差 ${questionCount - availableQuestions} 题)`}
              </p>
            </div>
          </div>
          <Button 
            size="lg" 
            onClick={() => onStartExam(selectedCategories, questionCount)}
            disabled={!isValidSetup}
            className="w-full max-w-md h-12 text-lg flex items-center gap-2 shadow-lg"
          >
            <Play className="w-5 h-5" />
            开始考试
          </Button>
          {!isValidSetup && availableQuestions < questionCount && (
            <p className="text-sm text-red-600 text-center">
              请选择更多分类或减少题目数量
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
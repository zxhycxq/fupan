import { ExamStats } from '@/types/exam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Clock, Target, BarChart3, RotateCcw, BookOpen } from 'lucide-react';

interface ExamResultsProps {
  stats: ExamStats;
  onRestart: () => void;
  onReview: () => void;
}

export function ExamResults({ stats, onRestart, onReview }: ExamResultsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: '优秀', variant: 'default' as const, className: 'bg-success text-success-foreground' };
    if (score >= 80) return { text: '良好', variant: 'secondary' as const, className: 'bg-primary text-primary-foreground' };
    if (score >= 60) return { text: '及格', variant: 'outline' as const, className: 'border-warning text-warning' };
    return { text: '不及格', variant: 'destructive' as const, className: '' };
  };

  const scoreBadge = getScoreBadge(stats.score);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 总体成绩卡片 */}
      <Card className="text-center p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 shadow-elegant">
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Award className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">考试完成！</h2>
            <div className="space-y-2">
              <div className={`text-6xl font-bold ${getScoreColor(stats.score)}`}>
                {stats.score}%
              </div>
              <Badge className={`text-lg px-4 py-2 ${scoreBadge.className}`} variant={scoreBadge.variant}>
                {scoreBadge.text}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="flex flex-col items-center gap-2">
              <Target className="w-8 h-8 text-primary" />
              <div className="text-2xl font-bold">{stats.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">正确题数</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="w-8 h-8 text-accent" />
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">总题数</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <div className="text-2xl font-bold">{formatTime(stats.timeSpent)}</div>
              <div className="text-sm text-muted-foreground">用时</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分类统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            知识点掌握情况
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.categoryStats).map(([category, stat]) => {
              const percentage = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
              return (
                <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{category}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.correct} / {stat.total} 题正确
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <Badge 
                      variant={percentage >= 80 ? 'default' : percentage >= 60 ? 'secondary' : 'destructive'}
                      className="min-w-[60px] justify-center"
                    >
                      {percentage}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onReview} size="lg" className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          查看解析
        </Button>
        <Button onClick={onRestart} variant="outline" size="lg" className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          重新开始
        </Button>
      </div>
    </div>
  );
}
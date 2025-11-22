import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, Award } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ExamHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  startTime: Date;
  score?: number;
}

export function ExamHeader({ currentQuestion, totalQuestions, startTime, score }: ExamHeaderProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto mb-6 p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold">网络工程师模拟考试</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">用时: {formatTime(timeElapsed)}</span>
          </div>

          {score !== undefined && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">得分: {score}%</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 min-w-0 flex-1 lg:flex-initial lg:min-w-[300px]">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>进度: {currentQuestion} / {totalQuestions}</span>
          </div>
          <Progress value={progress} className="w-full lg:w-[300px] h-2" />
        </div>
      </div>
    </Card>
  );
}
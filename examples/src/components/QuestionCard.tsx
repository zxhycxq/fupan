import { Question } from '@/types/exam';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Tag } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: number;
  showResult?: boolean;
  onAnswerSelect: (answer: number) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  showResult = false,
  onAnswerSelect,
}: QuestionCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'hard': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index 
        ? 'border-primary bg-primary/5 text-primary' 
        : 'border-border hover:border-primary/50 hover:bg-muted/50';
    }

    if (index === question.correctAnswer) {
      return 'border-success bg-success/10 text-success';
    }
    
    if (selectedAnswer === index && index !== question.correctAnswer) {
      return 'border-destructive bg-destructive/10 text-destructive';
    }
    
    return 'border-border text-muted-foreground';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-elegant">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              第 {questionNumber} 题 / 共 {totalQuestions} 题
            </Badge>
            <Badge className={getDifficultyColor(question.difficulty)}>
              {question.difficulty === 'easy' ? '简单' : 
               question.difficulty === 'medium' ? '中等' : '困难'}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {question.category}
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold leading-relaxed">
          {question.question}
        </h3>

        <div className="flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={`w-full text-left justify-start h-auto p-4 ${getOptionStyle(index)} transition-all duration-200`}
              onClick={() => !showResult && onAnswerSelect(index)}
              disabled={showResult}
            >
              <span className="font-semibold mr-3 text-primary">
                {String.fromCharCode(65 + index)}.
              </span>
              <span className="flex-1">{option}</span>
            </Button>
          ))}
        </div>

        {showResult && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border-l-4 border-l-accent">
            <h4 className="font-semibold text-accent mb-2">答案解析：</h4>
            <p className="text-sm leading-relaxed">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
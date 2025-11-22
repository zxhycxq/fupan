import { useState } from 'react';
import { Question, ExamSession, ExamStats } from '@/types/exam';
import { networkEngineerQuestions } from '@/data/questions';
import { ExamSetup } from '@/components/ExamSetup';
import { ExamHeader } from '@/components/ExamHeader';
import { QuestionCard } from '@/components/QuestionCard';
import { ExamResults } from '@/components/ExamResults';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ExamMode = 'setup' | 'exam' | 'results' | 'review';

const Index = () => {
  const [mode, setMode] = useState<ExamMode>('setup');
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [examStats, setExamStats] = useState<ExamStats | null>(null);
  const { toast } = useToast();

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startExam = (selectedCategories: string[], questionCount: number) => {
    // 根据选择的分类筛选题目
    const filteredQuestions = networkEngineerQuestions.filter(q => 
      selectedCategories.includes(q.category)
    );
    
    if (filteredQuestions.length < questionCount) {
      toast({
        title: "题目不足",
        description: `所选分类中只有 ${filteredQuestions.length} 道题目，请减少题目数量或增加分类选择。`,
        variant: "destructive"
      });
      return;
    }

    // 随机选择指定数量的题目
    const shuffledQuestions = shuffleArray(filteredQuestions).slice(0, questionCount);
    
    const session: ExamSession = {
      id: Date.now().toString(),
      questions: shuffledQuestions,
      currentQuestionIndex: 0,
      answers: {},
      startTime: new Date()
    };
    
    setExamSession(session);
    setMode('exam');
    
    toast({
      title: "考试开始",
      description: `已为您准备 ${questionCount} 道题目，祝您考试顺利！`
    });
  };

  const answerQuestion = (questionId: string, answer: number) => {
    if (!examSession) return;
    
    setExamSession({
      ...examSession,
      answers: {
        ...examSession.answers,
        [questionId]: answer
      }
    });
  };

  const nextQuestion = () => {
    if (!examSession) return;
    
    if (examSession.currentQuestionIndex < examSession.questions.length - 1) {
      setExamSession({
        ...examSession,
        currentQuestionIndex: examSession.currentQuestionIndex + 1
      });
    }
  };

  const previousQuestion = () => {
    if (!examSession) return;
    
    if (examSession.currentQuestionIndex > 0) {
      setExamSession({
        ...examSession,
        currentQuestionIndex: examSession.currentQuestionIndex - 1
      });
    }
  };

  const finishExam = () => {
    if (!examSession) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - examSession.startTime.getTime()) / 1000);
    
    let correctAnswers = 0;
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    
    examSession.questions.forEach(question => {
      const category = question.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { correct: 0, total: 0 };
      }
      categoryStats[category].total++;
      
      const userAnswer = examSession.answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
        categoryStats[category].correct++;
      }
    });

    const score = Math.round((correctAnswers / examSession.questions.length) * 100);
    
    const stats: ExamStats = {
      totalQuestions: examSession.questions.length,
      correctAnswers,
      score,
      timeSpent,
      categoryStats
    };

    setExamStats(stats);
    setExamSession({
      ...examSession,
      endTime,
      score
    });
    setMode('results');

    toast({
      title: "考试结束",
      description: `您的得分是 ${score}%，${score >= 60 ? '恭喜通过！' : '继续加油！'}`
    });
  };

  const restartExam = () => {
    setMode('setup');
    setExamSession(null);
    setExamStats(null);
  };

  const reviewAnswers = () => {
    setMode('review');
  };

  const backToResults = () => {
    setMode('results');
  };

  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-background p-4">
        <ExamSetup onStartExam={startExam} />
      </div>
    );
  }

  if (mode === 'results' && examStats) {
    return (
      <div className="min-h-screen bg-background p-4">
        <ExamResults 
          stats={examStats}
          onRestart={restartExam}
          onReview={reviewAnswers}
        />
      </div>
    );
  }

  if ((mode === 'exam' || mode === 'review') && examSession) {
    const currentQuestion = examSession.questions[examSession.currentQuestionIndex];
    const selectedAnswer = examSession.answers[currentQuestion.id];
    const isLastQuestion = examSession.currentQuestionIndex === examSession.questions.length - 1;
    const isFirstQuestion = examSession.currentQuestionIndex === 0;

    return (
      <div className="min-h-screen bg-background p-4 space-y-6">
        <ExamHeader 
          currentQuestion={examSession.currentQuestionIndex + 1}
          totalQuestions={examSession.questions.length}
          startTime={examSession.startTime}
          score={mode === 'review' ? examSession.score : undefined}
        />

        <QuestionCard
          question={currentQuestion}
          questionNumber={examSession.currentQuestionIndex + 1}
          totalQuestions={examSession.questions.length}
          selectedAnswer={selectedAnswer}
          showResult={mode === 'review'}
          onAnswerSelect={(answer) => answerQuestion(currentQuestion.id, answer)}
        />

        <Card className="w-full max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={mode === 'review' ? backToResults : previousQuestion}
              disabled={mode === 'exam' && isFirstQuestion}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {mode === 'review' ? '返回结果' : '上一题'}
            </Button>

            <div className="flex items-center gap-4">
              {mode === 'exam' && (
                <Button
                  variant="destructive"
                  onClick={finishExam}
                  className="flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  交卷
                </Button>
              )}
            </div>

            <Button
              onClick={nextQuestion}
              disabled={isLastQuestion}
              className="flex items-center gap-2"
            >
              下一题
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default Index;

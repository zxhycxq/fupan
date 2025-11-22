export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface ExamSession {
  id: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, number>;
  startTime: Date;
  endTime?: Date;
  score?: number;
}

export interface ExamStats {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  categoryStats: Record<string, { correct: number; total: number }>;
}
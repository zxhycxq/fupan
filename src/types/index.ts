export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// 考试记录类型
export interface ExamRecord {
  id: string;
  exam_number: number;
  total_score: number;
  max_score?: number;
  average_score?: number;
  pass_rate?: number;
  time_used?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// 模块得分类型
export interface ModuleScore {
  id: string;
  exam_record_id: string;
  module_name: string;
  parent_module?: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  accuracy_rate?: number;
  time_used?: number;
  created_at: string;
}

// 考试记录详情(包含模块得分)
export interface ExamRecordDetail extends ExamRecord {
  module_scores: ModuleScore[];
}

// 图像识别API请求类型
export interface ImageRecognitionRequest {
  image?: string; // base64编码的图片
  url?: string; // 图片URL
  question: string;
}

// 图像识别API响应类型
export interface ImageRecognitionResponse {
  status: number;
  msg: string;
  data: {
    log_id: string;
    result: {
      task_id: string;
    };
  };
}

// 图像识别结果响应类型
export interface ImageRecognitionResultResponse {
  status: number;
  msg: string;
  data: {
    log_id: string;
    result: {
      task_id: string;
      ret_code: number; // 0: 成功, 1: 处理中
      ret_msg: string;
      description: string;
    };
  };
}

// 上传表单数据类型
export interface UploadFormData {
  exam_number: number;
  image: File | null;
}

// 图表数据类型
export interface ChartData {
  exam_number: number;
  total_score: number;
  time_used?: number;
  created_at: string;
}

// 模块统计数据类型
export interface ModuleStats {
  module_name: string;
  average_score: number;
  average_accuracy: number;
  total_exams: number;
}

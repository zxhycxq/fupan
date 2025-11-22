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

// 通用文字识别API请求类型
export interface OcrRequest {
  image: string; // base64编码的图片
  language_type?: string; // 识别语言类型,默认CHN_ENG
  detect_direction?: boolean; // 是否检测图像朝向
  probability?: boolean; // 是否返回置信度
}

// 通用文字识别API响应类型
export interface OcrResponse {
  status: number;
  msg: string;
  data: {
    log_id: number;
    direction?: number;
    words_result_num: number;
    words_result: Array<{
      words: string;
      probability?: {
        average: number;
        variance: number;
        min: number;
      };
    }>;
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

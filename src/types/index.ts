export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// 考试记录类型
export interface ExamRecord {
  id: string;
  exam_number: number; // 保留用于向后兼容
  exam_name: string; // 考试名称
  index_number?: number; // 索引项(已废弃，保留用于向后兼容)
  rating: number; // 星级评分，支持半星，范围 0-5
  total_score: number;
  max_score?: number;
  average_score?: number;
  pass_rate?: number;
  difficulty?: number;
  beat_percentage?: number;
  time_used?: number;
  image_url?: string;
  notes?: string; // 考试备注(最多500字) - 保留用于向后兼容
  improvements?: string; // 有进步的地方
  mistakes?: string; // 出错的地方
  exam_date?: string; // 考试日期(YYYY-MM-DD格式)
  report_url?: string; // 考试报告链接地址
  sort_order: number; // 排序顺序
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
  exam_name: string; // 考试名称
  index_number: number; // 索引项
  image: File | null;
}

// 图表数据类型
export interface ChartData {
  exam_number: number;
  exam_name: string;
  sort_order: number;
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

// 用户设置类型
export interface UserSetting {
  id: string;
  user_id: string;
  module_name: string;
  target_accuracy: number;
  exam_type?: string; // 考试类型(国考/省考)
  exam_date?: string; // 考试日期
  created_at: string;
  updated_at: string;
}

// 考试配置类型
export interface ExamConfig {
  exam_type: string; // 考试类型(国考/省考)
  exam_date: string; // 考试日期
}

// 识别结果确认数据类型
export interface RecognitionConfirmData {
  exam_name: string; // 考试名称
  index_number: number; // 索引项
  total_score: number;
  time_used: number;
  module_scores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[];
  image_url: string;
}

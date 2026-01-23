-- 为exam_records表添加学习历程相关字段
-- 添加做题数量字段
ALTER TABLE exam_records ADD COLUMN IF NOT EXISTS question_count integer DEFAULT 0;

-- 添加考试时长字段（秒）
ALTER TABLE exam_records ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;

-- 添加注释
COMMENT ON COLUMN exam_records.question_count IS '本次考试做题数量';
COMMENT ON COLUMN exam_records.duration_seconds IS '本次考试用时（秒）';

-- 创建用户学习里程碑表
CREATE TABLE IF NOT EXISTS user_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_type text NOT NULL, -- 'first_exam', 'score_60', 'score_70', 'score_80', 'score_90'
  milestone_date timestamptz NOT NULL,
  exam_record_id uuid REFERENCES exam_records(id) ON DELETE SET NULL,
  score decimal(5,2),
  created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_type ON user_milestones(milestone_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_milestones_user_type ON user_milestones(user_id, milestone_type);

-- 添加注释
COMMENT ON TABLE user_milestones IS '用户学习里程碑记录';
COMMENT ON COLUMN user_milestones.milestone_type IS '里程碑类型：first_exam(第一次考试), score_60/70/80/90(首次突破分数)';
COMMENT ON COLUMN user_milestones.milestone_date IS '里程碑达成日期';

-- 启用RLS
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能查看自己的里程碑
CREATE POLICY "用户可以查看自己的里程碑"
  ON user_milestones
  FOR SELECT
  USING (auth.uid() = user_id);

-- 创建RLS策略：系统可以插入里程碑（通过service_role）
CREATE POLICY "系统可以插入里程碑"
  ON user_milestones
  FOR INSERT
  WITH CHECK (true);

-- 创建函数：自动记录里程碑
CREATE OR REPLACE FUNCTION record_user_milestone()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_score decimal(5,2);
BEGIN
  -- 获取用户ID和分数
  v_user_id := NEW.user_id;
  v_score := NEW.total_score;
  
  -- 如果没有用户ID，跳过
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- 记录第一次考试
  INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
  SELECT v_user_id, 'first_exam', NEW.created_at, NEW.id, v_score
  WHERE NOT EXISTS (
    SELECT 1 FROM user_milestones 
    WHERE user_id = v_user_id AND milestone_type = 'first_exam'
  );
  
  -- 记录首次突破60分
  IF v_score >= 60 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
    SELECT v_user_id, 'score_60', NEW.created_at, NEW.id, v_score
    WHERE NOT EXISTS (
      SELECT 1 FROM user_milestones 
      WHERE user_id = v_user_id AND milestone_type = 'score_60'
    );
  END IF;
  
  -- 记录首次突破70分
  IF v_score >= 70 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
    SELECT v_user_id, 'score_70', NEW.created_at, NEW.id, v_score
    WHERE NOT EXISTS (
      SELECT 1 FROM user_milestones 
      WHERE user_id = v_user_id AND milestone_type = 'score_70'
    );
  END IF;
  
  -- 记录首次突破80分
  IF v_score >= 80 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
    SELECT v_user_id, 'score_80', NEW.created_at, NEW.id, v_score
    WHERE NOT EXISTS (
      SELECT 1 FROM user_milestones 
      WHERE user_id = v_user_id AND milestone_type = 'score_80'
    );
  END IF;
  
  -- 记录首次突破90分
  IF v_score >= 90 THEN
    INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
    SELECT v_user_id, 'score_90', NEW.created_at, NEW.id, v_score
    WHERE NOT EXISTS (
      SELECT 1 FROM user_milestones 
      WHERE user_id = v_user_id AND milestone_type = 'score_90'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：在插入exam_records时自动记录里程碑
DROP TRIGGER IF EXISTS trigger_record_milestone ON exam_records;
CREATE TRIGGER trigger_record_milestone
  AFTER INSERT ON exam_records
  FOR EACH ROW
  EXECUTE FUNCTION record_user_milestone();

-- 为现有数据补充里程碑（如果有的话）
-- 注意：这个操作可能需要一些时间，取决于数据量
DO $$
DECLARE
  v_user record;
  v_first_exam record;
  v_score_record record;
BEGIN
  -- 为每个用户记录第一次考试
  FOR v_user IN 
    SELECT DISTINCT user_id 
    FROM exam_records 
    WHERE user_id IS NOT NULL
  LOOP
    -- 获取第一次考试记录
    SELECT * INTO v_first_exam
    FROM exam_records
    WHERE user_id = v_user.user_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF FOUND THEN
      -- 插入第一次考试里程碑
      INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
      VALUES (v_user.user_id, 'first_exam', v_first_exam.created_at, v_first_exam.id, v_first_exam.total_score)
      ON CONFLICT (user_id, milestone_type) DO NOTHING;
      
      -- 记录首次突破60分
      SELECT * INTO v_score_record
      FROM exam_records
      WHERE user_id = v_user.user_id AND total_score >= 60
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF FOUND THEN
        INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
        VALUES (v_user.user_id, 'score_60', v_score_record.created_at, v_score_record.id, v_score_record.total_score)
        ON CONFLICT (user_id, milestone_type) DO NOTHING;
      END IF;
      
      -- 记录首次突破70分
      SELECT * INTO v_score_record
      FROM exam_records
      WHERE user_id = v_user.user_id AND total_score >= 70
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF FOUND THEN
        INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
        VALUES (v_user.user_id, 'score_70', v_score_record.created_at, v_score_record.id, v_score_record.total_score)
        ON CONFLICT (user_id, milestone_type) DO NOTHING;
      END IF;
      
      -- 记录首次突破80分
      SELECT * INTO v_score_record
      FROM exam_records
      WHERE user_id = v_user.user_id AND total_score >= 80
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF FOUND THEN
        INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
        VALUES (v_user.user_id, 'score_80', v_score_record.created_at, v_score_record.id, v_score_record.total_score)
        ON CONFLICT (user_id, milestone_type) DO NOTHING;
      END IF;
      
      -- 记录首次突破90分
      SELECT * INTO v_score_record
      FROM exam_records
      WHERE user_id = v_user.user_id AND total_score >= 90
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF FOUND THEN
        INSERT INTO user_milestones (user_id, milestone_type, milestone_date, exam_record_id, score)
        VALUES (v_user.user_id, 'score_90', v_score_record.created_at, v_score_record.id, v_score_record.total_score)
        ON CONFLICT (user_id, milestone_type) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END $$;

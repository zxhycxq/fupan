import { Form, Collapse, Row, Col, InputNumber, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { createExamRecord, createModuleScores } from '@/db/api';
import { useNavigate } from 'react-router-dom';

const { Panel } = Collapse;

const MODULE_CONFIG = [
  {
    name: '政治理论',
    subModules: ['马克思主义', '理论与政策', '时政热点']
  },
  {
    name: '常识判断',
    subModules: ['经济常识', '科技常识', '人文常识', '地理国情', '法律常识']
  },
  {
    name: '言语理解与表达',
    subModules: ['逻辑填空', '片段阅读', '语句表达']
  },
  {
    name: '数量关系',
    subModules: ['数学运算']
  },
  {
    name: '判断推理',
    subModules: ['图形推理', '定义判断', '类比推理', '逻辑判断']
  },
  {
    name: '资料分析',
    subModules: ['文字资料', '综合资料', '简单计算', '基期与现期', '增长率', '增长量', '比重问题', '平均数问题']
  }
];

interface FormInputTabProps {
  examName: string;
  indexNumber: number;
  examType: string;
  onSubmitStart: () => void;
  onSubmitEnd: () => void;
}

export default function FormInputTab({ examName, indexNumber, examType, onSubmitStart, onSubmitEnd }: FormInputTabProps) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      if (!examName || examName.trim() === '') {
        message.error('请输入考试名称');
        return;
      }

      if (!indexNumber || indexNumber < 1) {
        message.error('请输入有效的索引号(必须大于0)');
        return;
      }

      // 验证表单并获取所有字段值
      const formValues = form.getFieldsValue(true);
      
      console.log('=== 表单提交 ===');
      console.log('考试名称:', examName);
      console.log('索引号:', indexNumber);
      console.log('考试类型:', examType);
      console.log('表单值:', formValues);
      
      const moduleScores: any[] = [];
      let totalScore = 0;
      let totalTime = 0;

      MODULE_CONFIG.forEach(parentModule => {
        // 先检查大模块总计
        const parentKey = `${parentModule.name}_总计`;
        const parentData = formValues[parentKey];
        
        if (parentData && parentData.total_questions > 0) {
          const correctAnswers = parentData.correct_answers || 0;
          const totalQs = parentData.total_questions;
          const timeUsedMinutes = parentData.time_used || 0;
          const timeUsedSeconds = timeUsedMinutes * 60; // 分钟转秒
          const accuracyRate = totalQs > 0 ? (correctAnswers / totalQs) * 100 : 0;

          const moduleScore = {
            module_name: parentModule.name,
            parent_module: null, // 大模块没有父模块
            total_questions: totalQs,
            correct_answers: correctAnswers,
            wrong_answers: totalQs - correctAnswers,
            unanswered: 0,
            accuracy_rate: Number(accuracyRate.toFixed(2)),
            time_used: timeUsedSeconds
          };
          
          console.log('添加大模块得分:', moduleScore);
          moduleScores.push(moduleScore);

          totalScore += correctAnswers;
          totalTime += timeUsedSeconds;
        }
        
        // 再处理子模块
        parentModule.subModules.forEach(subModule => {
          const key = `${parentModule.name}_${subModule}`;
          const data = formValues[key];
          
          console.log(`检查模块 ${key}:`, data);
          
          if (data && data.total_questions > 0) {
            const correctAnswers = data.correct_answers || 0;
            const totalQs = data.total_questions;
            const timeUsedMinutes = data.time_used || 0;
            const timeUsedSeconds = timeUsedMinutes * 60; // 分钟转秒
            const accuracyRate = totalQs > 0 ? (correctAnswers / totalQs) * 100 : 0;

            const moduleScore = {
              module_name: subModule,
              parent_module: parentModule.name,
              total_questions: totalQs,
              correct_answers: correctAnswers,
              wrong_answers: totalQs - correctAnswers,
              unanswered: 0,
              accuracy_rate: Number(accuracyRate.toFixed(2)),
              time_used: timeUsedSeconds
            };
            
            console.log('添加模块得分:', moduleScore);
            moduleScores.push(moduleScore);

            totalScore += correctAnswers;
            totalTime += timeUsedSeconds;
          }
        });
      });

      console.log('总共收集到', moduleScores.length, '个模块');
      console.log('总分:', totalScore);
      console.log('总用时(秒):', totalTime);

      if (moduleScores.length === 0) {
        message.error('请至少填写一个模块的数据');
        return;
      }

      onSubmitStart();

      const examRecord = {
        exam_name: examName,
        exam_number: indexNumber,
        index_number: indexNumber,
        total_score: totalScore,
        time_used: totalTime,
        rating: 0
      };

      const savedRecord = await createExamRecord(examRecord);

      if (moduleScores.length > 0) {
        const scoresWithExamId = moduleScores.map(score => ({
          ...score,
          exam_record_id: savedRecord.id,
        }));
        await createModuleScores(scoresWithExamId);
      }

      message.success('成绩录入成功');
      navigate(`/exam/${savedRecord.id}`);
    } catch (error) {
      console.error('保存失败:', error);
      message.error(error instanceof Error ? error.message : '保存失败,请重试');
    } finally {
      onSubmitEnd();
    }
  };

  return (
    <div className="space-y-4">
      <Form form={form} layout="vertical">
        <Collapse defaultActiveKey={[]} className="bg-white">
          {MODULE_CONFIG.map((parentModule) => (
            <Panel 
              header={
                <div className="font-medium text-base">
                  {parentModule.name}
                </div>
              } 
              key={parentModule.name}
            >
              <div className="space-y-3">
                {/* 大模块总计 */}
                <div className="bg-blue-50 p-3 rounded border-b-2 border-blue-200">
                  <div className="font-medium mb-2 text-blue-700">总计</div>
                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item
                        name={[`${parentModule.name}_总计`, 'total_questions']}
                        label="题目数量"
                        className="mb-0"
                      >
                        <InputNumber
                          min={0}
                          placeholder="题目数"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={[`${parentModule.name}_总计`, 'correct_answers']}
                        label="答对数量"
                        className="mb-0"
                      >
                        <InputNumber
                          min={0}
                          placeholder="答对数"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={[`${parentModule.name}_总计`, 'time_used']}
                        label="用时(分钟)"
                        className="mb-0"
                      >
                        <InputNumber
                          min={0}
                          placeholder="用时"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* 子模块 */}
                {parentModule.subModules.map((subModule) => {
                  const fieldKey = `${parentModule.name}_${subModule}`;
                  return (
                    <div key={subModule} className="border-b pb-3 last:border-b-0">
                      <div className="font-medium mb-2 text-gray-700">{subModule}</div>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item
                            name={[fieldKey, 'total_questions']}
                            label="题目数量"
                            className="mb-0"
                          >
                            <InputNumber
                              min={0}
                              placeholder="题目数"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[fieldKey, 'correct_answers']}
                            label="答对数量"
                            className="mb-0"
                          >
                            <InputNumber
                              min={0}
                              placeholder="答对数"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name={[fieldKey, 'time_used']}
                            label="用时(分钟)"
                            className="mb-0"
                          >
                            <InputNumber
                              min={0}
                              placeholder="用时"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  );
                })}
              </div>
            </Panel>
          ))}
        </Collapse>
      </Form>

      <Button
        type="primary"
        size="large"
        icon={<SaveOutlined />}
        onClick={handleSubmit}
        block
      >
        保存成绩
      </Button>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { getUserSettings, batchUpsertUserSettings } from '@/db/api';
import type { UserSetting } from '@/types';

// 6大模块
const MAIN_MODULES = [
  '政治理论',
  '常识判断',
  '言语理解与表达',
  '数量关系',
  '判断推理',
  '资料分析',
];

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const userSettings = await getUserSettings();
      
      // 转换为 Record 格式
      const settingsMap: Record<string, number> = {};
      for (const setting of userSettings) {
        settingsMap[setting.module_name] = setting.target_accuracy;
      }
      
      // 确保所有模块都有默认值
      for (const module of MAIN_MODULES) {
        if (!(module in settingsMap)) {
          settingsMap[module] = 80; // 默认80%
        }
      }
      
      setSettings(settingsMap);
    } catch (error) {
      console.error('加载设置失败:', error);
      toast({
        title: '错误',
        description: '加载设置失败,请刷新页面重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // 验证所有值
      for (const [module, value] of Object.entries(settings)) {
        if (value < 0 || value > 100) {
          toast({
            title: '错误',
            description: `${module}的目标正确率必须在0-100之间`,
            variant: 'destructive',
          });
          return;
        }
      }

      // 转换为 UserSetting 数组
      const settingsArray: Omit<UserSetting, 'id' | 'created_at' | 'updated_at'>[] = 
        Object.entries(settings).map(([module_name, target_accuracy]) => ({
          user_id: 'default',
          module_name,
          target_accuracy,
        }));

      await batchUpsertUserSettings(settingsArray);

      toast({
        title: '成功',
        description: '目标设置已保存',
      });
    } catch (error) {
      console.error('保存设置失败:', error);
      toast({
        title: '错误',
        description: '保存设置失败,请重试',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultSettings: Record<string, number> = {};
    for (const module of MAIN_MODULES) {
      defaultSettings[module] = 80;
    }
    setSettings(defaultSettings);
  };

  const handleChange = (module: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({
      ...prev,
      [module]: numValue,
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>目标设置</CardTitle>
          <CardDescription>
            设置各模块的目标正确率,用于在雷达图中对比实际表现
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MAIN_MODULES.map((module) => (
                <div key={module} className="space-y-2">
                  <Label htmlFor={module}>{module}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={module}
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={settings[module] || 80}
                      onChange={(e) => handleChange(module, e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-8">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 md:flex-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存设置
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                恢复默认
              </Button>
            </div>

            <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
              <p className="font-medium mb-2">说明:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>目标正确率范围: 0-100%</li>
                <li>默认目标为80%</li>
                <li>设置后将在雷达图中显示目标线,方便对比实际表现</li>
                <li>建议根据自身情况设置合理的目标</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

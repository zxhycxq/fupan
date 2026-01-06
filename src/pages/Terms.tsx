import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 用户条款页面
 */
export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">用户条款</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              用户条款内容待定。本页面将包含完整的用户服务条款。
            </p>
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold">1. 服务说明</h3>
              <p className="text-muted-foreground">
                本系统为考试成绩分析系统，提供成绩数据管理和分析服务。
              </p>

              <h3 className="text-lg font-semibold">2. 用户权利与义务</h3>
              <p className="text-muted-foreground">
                用户应遵守相关法律法规，合理使用本系统提供的服务。
              </p>

              <h3 className="text-lg font-semibold">3. 免责声明</h3>
              <p className="text-muted-foreground">
                本系统提供的分析结果仅供参考，不构成任何承诺或保证。
              </p>

              <h3 className="text-lg font-semibold">4. 条款变更</h3>
              <p className="text-muted-foreground">
                我们保留随时修改本条款的权利，修改后的条款将在本页面公布。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

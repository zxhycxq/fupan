import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 隐私协议页面
 */
export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">隐私协议</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              隐私协议内容待定。本页面将包含完整的隐私保护政策。
            </p>
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold">1. 信息收集</h3>
              <p className="text-muted-foreground">
                我们收集您的手机号、用户名等基本信息，以及您上传的考试成绩数据。
              </p>

              <h3 className="text-lg font-semibold">2. 信息使用</h3>
              <p className="text-muted-foreground">
                您的信息仅用于提供成绩分析服务，不会用于其他商业用途。
              </p>

              <h3 className="text-lg font-semibold">3. 信息保护</h3>
              <p className="text-muted-foreground">
                我们采用行业标准的安全措施保护您的个人信息和数据安全。
              </p>

              <h3 className="text-lg font-semibold">4. 信息共享</h3>
              <p className="text-muted-foreground">
                未经您的同意，我们不会与第三方共享您的个人信息。
              </p>

              <h3 className="text-lg font-semibold">5. 用户权利</h3>
              <p className="text-muted-foreground">
                您有权查看、修改或删除您的个人信息和数据。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

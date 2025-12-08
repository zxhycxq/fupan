import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Card } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    // 刷新页面
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto py-4 px-2 xl:py-8 xl:px-4">
          <Card>
            <Alert
              message="页面出错了"
              description={
                <div className="space-y-4">
                  <div>
                    抱歉，页面遇到了一些问题。这可能是由于：
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>浏览器扩展（如广告拦截器）干扰了页面运行</li>
                      <li>网络连接问题</li>
                      <li>浏览器缓存问题</li>
                    </ul>
                  </div>
                  {this.state.error && (
                    <div className="text-sm text-gray-500">
                      错误信息: {this.state.error.message}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="primary" onClick={this.handleReset}>
                      刷新页面
                    </Button>
                    <Button onClick={() => window.history.back()}>
                      返回上一页
                    </Button>
                  </div>
                </div>
              }
              type="error"
              showIcon
            />
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

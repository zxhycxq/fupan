import React, { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';

// PWA安装提示组件
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 监听beforeinstallprompt事件
    const handleBeforeInstallPrompt = (e: Event) => {
      // 阻止默认的安装提示
      e.preventDefault();
      // 保存事件，以便稍后触发
      setDeferredPrompt(e);
      // 显示自定义安装提示
      setShowPrompt(true);
    };

    // 监听应用已安装事件
    const handleAppInstalled = () => {
      message.success('应用已成功安装！');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      message.success('感谢您安装应用！');
    } else {
      message.info('您可以随时从浏览器菜单安装应用');
    }

    // 清除保存的事件
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 7天后再次显示
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  // 检查是否在7天内已经关闭过
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <CloseOutlined />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <DownloadOutlined className="text-2xl text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            安装应用到桌面
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            安装后可以快速访问，支持离线使用
          </p>
          
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleInstallClick}
              size="small"
            >
              立即安装
            </Button>
            <Button
              onClick={handleDismiss}
              size="small"
            >
              暂不安装
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

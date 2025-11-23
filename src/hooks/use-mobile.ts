import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // 安全地获取窗口宽度
    const getWindowWidth = () => {
      try {
        return typeof window !== 'undefined' ? window.innerWidth : 1024;
      } catch (error) {
        return 1024; // 默认桌面宽度
      }
    };

    const checkMobile = () => {
      const width = getWindowWidth();
      setIsMobile(width < MOBILE_BREAKPOINT);
    };

    checkMobile();

    try {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      const onChange = () => {
        checkMobile();
      };
      
      mql.addEventListener("change", onChange);
      
      return () => {
        try {
          mql.removeEventListener("change", onChange);
        } catch (error) {
          // 忽略跨域错误
          console.warn('清理 matchMedia 监听器时出错:', error);
        }
      };
    } catch (error) {
      // 忽略跨域错误
      console.warn('添加 matchMedia 监听器时出错:', error);
      return () => {};
    }
  }, []);

  return !!isMobile;
}

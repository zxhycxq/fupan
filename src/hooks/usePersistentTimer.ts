import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 持久化计时器状态接口
 */
export interface PersistentTimerState {
  // 开始时间戳（毫秒）
  startTimestamp: number | null;
  // 暂停时累计的已用时间（毫秒）
  accumulatedTime: number;
  // 暂停开始时间戳（毫秒）
  pauseStartTimestamp: number | null;
  // 是否正在运行
  isRunning: boolean;
  // 是否暂停
  isPaused: boolean;
  // 最后更新时间戳（用于检测长时间未活动）
  lastUpdateTimestamp: number;
}

/**
 * 持久化计时器配置
 */
export interface PersistentTimerConfig {
  // localStorage存储键名
  storageKey: string;
  // 是否启用Page Visibility API
  enableVisibilityTracking?: boolean;
  // 页面不可见时是否继续计时
  continueWhenHidden?: boolean;
  // 时间同步间隔（毫秒）
  syncInterval?: number;
  // 页面恢复时的回调
  onRestore?: (elapsedSeconds: number) => void;
  // 页面隐藏时的回调
  onHidden?: () => void;
  // 页面显示时的回调
  onVisible?: () => void;
}

/**
 * 持久化计时器Hook
 * 
 * 特性：
 * 1. 基于时间戳计时，不受浏览器节流影响
 * 2. 自动保存到localStorage，关闭页面后可恢复
 * 3. 支持Page Visibility API，检测页面可见性变化
 * 4. 页面恢复时自动同步实际经过的时间
 * 5. 支持暂停/继续功能
 */
export function usePersistentTimer(config: PersistentTimerConfig) {
  const {
    storageKey,
    enableVisibilityTracking = true,
    continueWhenHidden = true,
    syncInterval = 1000,
    onRestore,
    onHidden,
    onVisible,
  } = config;

  // 当前显示的时间（秒）
  const [currentTime, setCurrentTime] = useState(0);
  // 计时器状态
  const [timerState, setTimerState] = useState<PersistentTimerState>({
    startTimestamp: null,
    accumulatedTime: 0,
    pauseStartTimestamp: null,
    isRunning: false,
    isPaused: false,
    lastUpdateTimestamp: Date.now(),
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisibleRef = useRef(true);

  /**
   * 计算当前实际经过的时间（毫秒）
   */
  const calculateElapsedTime = useCallback((state: PersistentTimerState): number => {
    if (!state.isRunning || !state.startTimestamp) {
      return state.accumulatedTime;
    }

    if (state.isPaused && state.pauseStartTimestamp) {
      // 暂停状态：返回暂停前的累计时间
      return state.accumulatedTime;
    }

    // 运行状态：累计时间 + (当前时间 - 开始时间)
    const now = Date.now();
    return state.accumulatedTime + (now - state.startTimestamp);
  }, []);

  /**
   * 保存状态到localStorage
   */
  const saveState = useCallback((state: PersistentTimerState) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('保存计时器状态失败:', error);
    }
  }, [storageKey]);

  /**
   * 从localStorage加载状态
   */
  const loadState = useCallback((): PersistentTimerState | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('加载计时器状态失败:', error);
    }
    return null;
  }, [storageKey]);

  /**
   * 清除保存的状态
   */
  const clearSavedState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('清除计时器状态失败:', error);
    }
  }, [storageKey]);

  /**
   * 更新显示时间
   */
  const updateDisplayTime = useCallback((state: PersistentTimerState) => {
    const elapsedMs = calculateElapsedTime(state);
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    setCurrentTime(elapsedSeconds);
  }, [calculateElapsedTime]);

  /**
   * 开始计时
   */
  const start = useCallback(() => {
    setTimerState(prev => {
      const newState: PersistentTimerState = {
        ...prev,
        startTimestamp: Date.now(),
        isRunning: true,
        isPaused: false,
        pauseStartTimestamp: null,
        lastUpdateTimestamp: Date.now(),
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  /**
   * 暂停计时
   */
  const pause = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isRunning || prev.isPaused) {
        return prev;
      }

      const now = Date.now();
      const elapsedMs = calculateElapsedTime(prev);
      
      const newState: PersistentTimerState = {
        ...prev,
        accumulatedTime: elapsedMs,
        pauseStartTimestamp: now,
        isPaused: true,
        lastUpdateTimestamp: now,
      };
      saveState(newState);
      return newState;
    });
  }, [calculateElapsedTime, saveState]);

  /**
   * 继续计时
   */
  const resume = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isRunning || !prev.isPaused) {
        return prev;
      }

      const newState: PersistentTimerState = {
        ...prev,
        startTimestamp: Date.now(),
        pauseStartTimestamp: null,
        isPaused: false,
        lastUpdateTimestamp: Date.now(),
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  /**
   * 停止计时
   */
  const stop = useCallback(() => {
    setTimerState(prev => {
      const newState: PersistentTimerState = {
        startTimestamp: null,
        accumulatedTime: 0,
        pauseStartTimestamp: null,
        isRunning: false,
        isPaused: false,
        lastUpdateTimestamp: Date.now(),
      };
      clearSavedState();
      return newState;
    });
    setCurrentTime(0);
  }, [clearSavedState]);

  /**
   * 重置计时（保持运行状态）
   */
  const reset = useCallback(() => {
    setTimerState(prev => {
      const newState: PersistentTimerState = {
        ...prev,
        startTimestamp: prev.isRunning ? Date.now() : null,
        accumulatedTime: 0,
        pauseStartTimestamp: null,
        lastUpdateTimestamp: Date.now(),
      };
      if (prev.isRunning) {
        saveState(newState);
      } else {
        clearSavedState();
      }
      return newState;
    });
    setCurrentTime(0);
  }, [saveState, clearSavedState]);

  /**
   * 恢复保存的状态
   */
  const restore = useCallback(() => {
    const savedState = loadState();
    if (savedState && savedState.isRunning) {
      // 计算实际经过的时间
      const now = Date.now();
      const timeSinceLastUpdate = now - savedState.lastUpdateTimestamp;
      
      // 如果是暂停状态，不需要补偿时间
      if (savedState.isPaused) {
        setTimerState(savedState);
        updateDisplayTime(savedState);
        return true;
      }

      // 运行状态：补偿页面关闭期间的时间
      const restoredState: PersistentTimerState = {
        ...savedState,
        startTimestamp: now,
        accumulatedTime: savedState.accumulatedTime + timeSinceLastUpdate,
        lastUpdateTimestamp: now,
      };

      setTimerState(restoredState);
      updateDisplayTime(restoredState);
      saveState(restoredState);

      // 触发恢复回调
      if (onRestore) {
        const elapsedSeconds = Math.floor(restoredState.accumulatedTime / 1000);
        onRestore(elapsedSeconds);
      }

      return true;
    }
    return false;
  }, [loadState, saveState, updateDisplayTime, onRestore]);

  // 初始化：尝试恢复保存的状态
  useEffect(() => {
    restore();
  }, [restore]);

  // 定时更新显示时间
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        updateDisplayTime(timerState);
        
        // 定期保存状态
        const newState = {
          ...timerState,
          lastUpdateTimestamp: Date.now(),
        };
        saveState(newState);
      }, syncInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (timerState.isRunning && timerState.isPaused) {
      // 暂停状态也要更新显示
      updateDisplayTime(timerState);
    }
  }, [timerState, syncInterval, updateDisplayTime, saveState]);

  // Page Visibility API：处理页面可见性变化
  useEffect(() => {
    if (!enableVisibilityTracking) {
      return;
    }

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;

      if (isVisible && !lastVisibleRef.current) {
        // 页面从隐藏变为可见
        console.log('页面恢复可见，同步计时器状态');
        
        if (timerState.isRunning && !timerState.isPaused) {
          // 重新计算实际经过的时间
          const now = Date.now();
          const elapsedMs = calculateElapsedTime(timerState);
          
          const syncedState: PersistentTimerState = {
            ...timerState,
            startTimestamp: now,
            accumulatedTime: elapsedMs,
            lastUpdateTimestamp: now,
          };
          
          setTimerState(syncedState);
          updateDisplayTime(syncedState);
          saveState(syncedState);
        }

        if (onVisible) {
          onVisible();
        }
      } else if (!isVisible && lastVisibleRef.current) {
        // 页面从可见变为隐藏
        console.log('页面隐藏，保存当前状态');
        
        if (timerState.isRunning && !timerState.isPaused) {
          const now = Date.now();
          const elapsedMs = calculateElapsedTime(timerState);
          
          const savedState: PersistentTimerState = {
            ...timerState,
            accumulatedTime: elapsedMs,
            lastUpdateTimestamp: now,
          };
          
          saveState(savedState);
        }

        if (onHidden) {
          onHidden();
        }
      }

      lastVisibleRef.current = isVisible;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    enableVisibilityTracking,
    timerState,
    calculateElapsedTime,
    updateDisplayTime,
    saveState,
    onVisible,
    onHidden,
  ]);

  // 页面卸载前保存状态
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerState.isRunning) {
        const now = Date.now();
        const elapsedMs = calculateElapsedTime(timerState);
        
        const finalState: PersistentTimerState = {
          ...timerState,
          accumulatedTime: elapsedMs,
          lastUpdateTimestamp: now,
        };
        
        saveState(finalState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timerState, calculateElapsedTime, saveState]);

  return {
    // 当前时间（秒）
    currentTime,
    // 是否正在运行
    isRunning: timerState.isRunning,
    // 是否暂停
    isPaused: timerState.isPaused,
    // 控制方法
    start,
    pause,
    resume,
    stop,
    reset,
    restore,
    // 原始状态（用于调试）
    timerState,
  };
}

/**
 * 格式化时间显示
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

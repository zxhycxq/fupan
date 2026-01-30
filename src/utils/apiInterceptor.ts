/**
 * API 请求拦截器
 *
 * 功能：
 * 1. 在发送请求前检查用户登录状态
 * 2. 如果未登录，直接跳转到登录页，不发送请求
 * 3. 使用全局标志位，防止重复跳转
 * 4. 提供请求取消机制，避免多个无效请求
 */

import { supabase } from '@/db/supabase';

/**
 * 全局标志位：是否正在跳转到登录页
 * 用于防止多个请求同时触发跳转
 */
let isRedirectingToLogin = false;

/**
 * 重置跳转标志位
 * 在成功跳转到登录页后调用
 */
export function resetRedirectFlag() {
    isRedirectingToLogin = false;
}

/**
 * 检查用户是否已登录
 * @returns 如果已登录返回 true，否则返回 false
 */
export async function checkAuth(): Promise<boolean> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    } catch (error) {
        console.error('[API拦截器] 检查登录状态失败:', error);
        return false;
    }
}

/**
 * API 请求前置检查
 *
 * 使用方法：
 * ```typescript
 * import { checkAuthBeforeRequest } from '@/utils/apiInterceptor';
 *
 * async function fetchData() {
 *   // 在发送请求前检查登录状态
 *   if (!await checkAuthBeforeRequest()) {
 *     return; // 未登录，已自动跳转到登录页
 *   }
 *
 *   // 继续发送请求
 *   const data = await api.getData();
 * }
 * ```
 *
 * @param showMessage 是否显示提示消息（默认为 false）
 * @returns 如果已登录返回 true，否则返回 false
 */
export async function checkAuthBeforeRequest(showMessage = false): Promise<boolean> {
    // 如果正在跳转，直接返回 false
    if (isRedirectingToLogin) {
        console.log('[API拦截器] 正在跳转到登录页，取消请求');
        return false;
    }

    // 检查登录状态
    const isAuthenticated = await checkAuth();

    if (!isAuthenticated) {
        // 设置跳转标志位
        isRedirectingToLogin = true;

        console.log('[API拦截器] 用户未登录，跳转到登录页');

        // 显示提示消息（可选）
        if (showMessage) {
            try {
                const { message } = await import('antd');
                message.warning('请先登录');
            } catch (error) {
                console.warn('[API拦截器] 无法显示提示消息:', error);
            }
        }

        // 跳转到登录页
        const currentPath = window.location.pathname;
        const loginUrl = `/login?from=${encodeURIComponent(currentPath)}`;

        // 使用 setTimeout 确保在下一个事件循环中执行跳转
        setTimeout(() => {
            window.location.href = loginUrl;
        }, 0);

        return false;
    }

    return true;
}

/**
 * 创建可取消的 API 请求
 *
 * 使用方法：
 * ```typescript
 * import { createCancellableRequest } from '@/utils/apiInterceptor';
 *
 * const { request, cancel } = createCancellableRequest(async (signal) => {
 *   const response = await fetch('/api/data', { signal });
 *   return response.json();
 * });
 *
 * // 发送请求
 * request().then(data => {
 *   console.log('数据:', data);
 * }).catch(error => {
 *   if (error.name === 'AbortError') {
 *     console.log('请求已取消');
 *   }
 * });
 *
 * // 取消请求
 * cancel();
 * ```
 *
 * @param requestFn 请求函数，接收 AbortSignal 作为参数
 * @returns 包含 request 和 cancel 方法的对象
 */
export function createCancellableRequest<T>(
    requestFn: (signal: AbortSignal) => Promise<T>
): {
    request: () => Promise<T>;
    cancel: () => void;
} {
    const controller = new AbortController();

    return {
        request: () => requestFn(controller.signal),
        cancel: () => {
            console.log('[API拦截器] 取消请求');
            controller.abort();
        },
    };
}

/**
 * 批量取消请求
 *
 * 使用方法：
 * ```typescript
 * import { createRequestGroup } from '@/utils/apiInterceptor';
 *
 * const group = createRequestGroup();
 *
 * // 添加多个请求
 * group.add(async (signal) => {
 *   const response = await fetch('/api/data1', { signal });
 *   return response.json();
 * });
 *
 * group.add(async (signal) => {
 *   const response = await fetch('/api/data2', { signal });
 *   return response.json();
 * });
 *
 * // 执行所有请求
 * const results = await group.execute();
 *
 * // 取消所有请求
 * group.cancelAll();
 * ```
 */
export function createRequestGroup() {
    const controllers: AbortController[] = [];
    const requests: Array<(signal: AbortSignal) => Promise<any>> = [];

    return {
        /**
         * 添加请求到组
         */
        add<T>(requestFn: (signal: AbortSignal) => Promise<T>) {
            const controller = new AbortController();
            controllers.push(controller);
            requests.push(requestFn);
        },

        /**
         * 执行所有请求
         */
        async execute(): Promise<any[]> {
            return Promise.all(
                requests.map((requestFn, index) =>
                    requestFn(controllers[index].signal)
                )
            );
        },

        /**
         * 取消所有请求
         */
        cancelAll() {
            console.log('[API拦截器] 取消所有请求');
            controllers.forEach(controller => controller.abort());
        },
    };
}

/**
 * 包装 API 函数，自动添加登录检查
 *
 * 使用方法：
 * ```typescript
 * import { withAuthCheck } from '@/utils/apiInterceptor';
 *
 * // 原始 API 函数
 * async function getDataOriginal() {
 *   const { data } = await supabase.from('table').select();
 *   return data;
 * }
 *
 * // 包装后的 API 函数
 * const getData = withAuthCheck(getDataOriginal);
 *
 * // 使用时会自动检查登录状态
 * const data = await getData();
 * ```
 *
 * @param apiFn 原始 API 函数
 * @param showMessage 是否显示提示消息（默认为 false）
 * @returns 包装后的 API 函数
 */
export function withAuthCheck<T extends (...args: any[]) => Promise<any>>(
    apiFn: T,
    showMessage = false
): T {
    return (async (...args: any[]) => {
        // 检查登录状态
        if (!await checkAuthBeforeRequest(showMessage)) {
            // 未登录，返回 null 或抛出错误
            throw new Error('用户未登录');
        }

        // 继续执行原始函数
        return apiFn(...args);
    }) as T;
}

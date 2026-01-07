
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 自动刷新 token
    autoRefreshToken: true,
    // 持久化会话到 localStorage
    persistSession: true,
    // 检测会话变化
    detectSessionInUrl: true,
    // 设置 token 过期时间为 15 天（单位：秒）
    // 注意：实际过期时间由 Supabase 服务端控制，这里设置客户端刷新策略
    flowType: 'pkce'
  }
});

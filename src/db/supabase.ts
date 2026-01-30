import {createClient} from "@supabase/supabase-js";
import type { Session } from '@supabase/supabase-js'; // 新增：导入Session类型

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// 设置Supabase登录会话（核心，3行代码）
export function setSupabaseSession(session: Session) {
    supabase.auth.setSession(session);
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

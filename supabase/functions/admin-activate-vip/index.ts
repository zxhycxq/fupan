import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 管理员密钥（从环境变量读取）
const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET') || ''

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

interface ActivateVipRequest {
  userId: string
  durationMonths: number
  amount?: number
  paymentMethod?: string
  transactionId?: string
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. 验证管理员密钥
    const adminSecret = req.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      console.error('无效的管理员密钥')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: '无效的管理员密钥' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. 解析请求参数
    const body: ActivateVipRequest = await req.json()
    const { userId, durationMonths, amount, paymentMethod, transactionId } = body

    // 3. 参数验证
    if (!userId || !durationMonths) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: '缺少必需参数：userId 和 durationMonths' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 验证 durationMonths 是否合法
    if (![3, 12].includes(durationMonths)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'durationMonths 只能是 3 或 12' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 4. 创建 Supabase 客户端（使用 service_role key）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 5. 计算到期时间
    const vipEndDate = new Date()
    vipEndDate.setMonth(vipEndDate.getMonth() + durationMonths)

    // 6. 开通会员（使用 UPSERT）
    const { data: vipData, error: vipError } = await supabaseAdmin
      .from('user_vip')
      .upsert({
        user_id: userId,
        is_vip: true,
        vip_start_date: new Date().toISOString(),
        vip_end_date: vipEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (vipError) {
      console.error('开通会员失败:', vipError)
      throw new Error(`开通会员失败: ${vipError.message}`)
    }

    // 7. 生成订单号
    const orderNo = `VIP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    // 8. 创建订单记录
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('vip_orders')
      .insert({
        user_id: userId,
        order_no: orderNo,
        amount: amount || (durationMonths === 3 ? 99 : 299),
        duration_months: durationMonths,
        status: 'paid',
        payment_method: paymentMethod || 'manual',
        transaction_id: transactionId || null,
        paid_at: new Date().toISOString(),
        expired_at: vipEndDate.toISOString(),
      })
      .select()

    if (orderError) {
      console.error('创建订单失败:', orderError)
      // 订单创建失败不影响会员开通，只记录日志
    }

    // 9. 记录操作日志
    console.log('会员开通成功:', {
      userId,
      durationMonths,
      vipEndDate: vipEndDate.toISOString(),
      orderNo,
      timestamp: new Date().toISOString()
    })

    // 10. 返回成功结果
    return new Response(
      JSON.stringify({
        success: true,
        message: '会员开通成功',
        data: {
          userId,
          vipEndDate: vipEndDate.toISOString(),
          orderNo,
          durationMonths,
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('开通会员失败:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: '开通会员失败',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

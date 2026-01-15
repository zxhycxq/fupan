import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Wechatpay } from "npm:wechatpay-axios-plugin";
import ShortUniqueId from "npm:short-unique-id";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 生成订单号
function generateOrderNo() {
  const uid = new ShortUniqueId({ length: 8 });
  const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `ORD-${yymmdd}-${uid.rnd()}`;
}

// 创建微信支付 URL
async function createWechatPayUrl(
  MERCHANT_ID: string,
  MERCHANT_APP_ID: string,
  MCH_CERT_SERIAL_NO: string,
  MCH_PRIVATE_KEY: string,
  WECHAT_PAY_PUBLIC_KEY_ID: string,
  WECHAT_PAY_PUBLIC_KEY: string,
  outTradeNo: string,
  amount: number,
  notifyUrl: string,
  description: string
) {
  try {
    const wxpay = new Wechatpay({
      mchid: MERCHANT_ID,
      serial: MCH_CERT_SERIAL_NO,
      privateKey: MCH_PRIVATE_KEY,
      certs: { [WECHAT_PAY_PUBLIC_KEY_ID]: WECHAT_PAY_PUBLIC_KEY },
    });

    const res = await wxpay.v3.pay.transactions.native.post(
      {
        mchid: MERCHANT_ID,
        out_trade_no: outTradeNo,
        appid: MERCHANT_APP_ID,
        description: description,
        notify_url: notifyUrl,
        amount: { total: Math.round(amount * 100) },
      },
      { headers: { "Wechatpay-Serial": WECHAT_PAY_PUBLIC_KEY_ID } }
    );

    if (res.data.code_url) {
      console.log(`[WeChatPay SUCCESS] outTradeNo=${outTradeNo}, url=${res.data.code_url}`);
      return { success: true, url: res.data.code_url };
    } else {
      console.error(`[WeChatPay FAILED] outTradeNo=${outTradeNo}, error=${res.data.message || JSON.stringify(res.data)}`);
      return { success: false, error: res.data.message || JSON.stringify(res.data) };
    }
  } catch (err) {
    console.error(`[WeChatPay ERROR] outTradeNo=${outTradeNo}, error=${err?.message || String(err)}`);
    return { success: false, error: err?.message || String(err) };
  }
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 获取请求参数
    const { sku_code, quantity, user_name, user_address, user_phone } = await req.json();

    // 验证必填参数
    if (!sku_code || !quantity || !user_name || !user_address) {
      return new Response(
        JSON.stringify({ error: "缺少必填参数：sku_code, quantity, user_name, user_address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 获取用户信息
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    // 如果未登录且没有手机号，返回错误
    if (!userId && !user_phone) {
      return new Response(
        JSON.stringify({ error: "未登录用户必须提供手机号" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 查询 SKU 信息
    const { data: sku, error: skuError } = await supabaseClient
      .from("sku")
      .select("*")
      .eq("sku_code", sku_code)
      .eq("is_active", true)
      .single();

    if (skuError || !sku) {
      return new Response(
        JSON.stringify({ error: "SKU 不存在或已下架" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 计算总金额
    const totalAmount = sku.price * quantity;

    // 生成订单号
    const orderNo = generateOrderNo();

    // 创建订单
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        order_no: orderNo,
        user_id: userId,
        user_phone: user_phone || null,
        user_name: user_name,
        user_address: user_address,
        status: "pending",
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("创建订单失败:", orderError);
      return new Response(
        JSON.stringify({ error: "创建订单失败" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 创建订单明细
    const { error: itemError } = await supabaseClient
      .from("order_items")
      .insert({
        order_id: order.id,
        sku_code: sku.sku_code,
        quantity: quantity,
        unit_price: sku.price,
        total_price: totalAmount,
        sku_snapshot: sku,
      });

    if (itemError) {
      console.error("创建订单明细失败:", itemError);
      // 删除订单
      await supabaseClient.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "创建订单明细失败" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 如果是免费套餐，直接标记为已支付
    if (totalAmount === 0) {
      const { error: updateError } = await supabaseClient
        .from("orders")
        .update({ status: "paid" })
        .eq("id", order.id);

      if (updateError) {
        console.error("更新订单状态失败:", updateError);
      }

      return new Response(
        JSON.stringify({ success: true, order_no: orderNo, is_free: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 生成微信支付 URL
    const MERCHANT_ID = Deno.env.get("MERCHANT_ID");
    const MERCHANT_APP_ID = Deno.env.get("MERCHANT_APP_ID");
    const MCH_CERT_SERIAL_NO = Deno.env.get("MCH_CERT_SERIAL_NO");
    const MCH_PRIVATE_KEY = Deno.env.get("MCH_PRIVATE_KEY");
    const WECHAT_PAY_PUBLIC_KEY_ID = Deno.env.get("WECHAT_PAY_PUBLIC_KEY_ID");
    const WECHAT_PAY_PUBLIC_KEY = Deno.env.get("WECHAT_PAY_PUBLIC_KEY");

    if (!MERCHANT_ID || !MERCHANT_APP_ID || !MCH_CERT_SERIAL_NO || !MCH_PRIVATE_KEY || !WECHAT_PAY_PUBLIC_KEY_ID || !WECHAT_PAY_PUBLIC_KEY) {
      return new Response(
        JSON.stringify({ error: "微信支付配置不完整，请联系管理员在插件中心配置支付密钥" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/wechat_payment_webhook`;
    const payResult = await createWechatPayUrl(
      MERCHANT_ID,
      MERCHANT_APP_ID,
      MCH_CERT_SERIAL_NO,
      MCH_PRIVATE_KEY,
      WECHAT_PAY_PUBLIC_KEY_ID,
      WECHAT_PAY_PUBLIC_KEY,
      orderNo,
      totalAmount,
      notifyUrl,
      `${sku.name} x ${quantity}`
    );

    if (!payResult.success) {
      return new Response(
        JSON.stringify({ error: `生成支付二维码失败: ${payResult.error}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 更新订单的支付 URL
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ wechat_pay_url: payResult.url })
      .eq("id", order.id);

    if (updateError) {
      console.error("更新订单支付 URL 失败:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, order_no: orderNo, pay_url: payResult.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("处理请求失败:", error);
    return new Response(
      JSON.stringify({ error: error.message || "服务器内部错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

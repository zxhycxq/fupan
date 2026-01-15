import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Aes } from "npm:wechatpay-axios-plugin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 解密微信支付回调数据
async function decryptTradeState(
  MCH_API_V3_KEY: string,
  associatedData: string,
  nonce: string,
  ciphertext: string
): Promise<{ status: string; order_no: string }> {
  const plaintext = await Aes.AesGcm.decrypt(ciphertext, MCH_API_V3_KEY, nonce, associatedData);
  const obj = JSON.parse(plaintext);
  return {
    status: (obj.trade_state ?? "").toString() === "SUCCESS" ? "SUCCESS" : "OTHERS",
    order_no: obj.out_trade_no ?? "",
  };
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

    // 获取微信支付回调数据
    const body = await req.json();
    console.log("收到微信支付回调:", JSON.stringify(body));

    const { resource } = body;
    if (!resource) {
      return new Response(
        JSON.stringify({ code: "FAIL", message: "缺少 resource 字段" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 解密支付结果
    const MCH_API_V3_KEY = Deno.env.get("MCH_API_V3_KEY");
    if (!MCH_API_V3_KEY) {
      console.error("MCH_API_V3_KEY 未配置");
      return new Response(
        JSON.stringify({ code: "FAIL", message: "服务器配置错误" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { associated_data, nonce, ciphertext } = resource;
    const decryptResult = await decryptTradeState(MCH_API_V3_KEY, associated_data, nonce, ciphertext);

    console.log("解密结果:", decryptResult);

    if (decryptResult.status !== "SUCCESS") {
      console.log("支付未成功，状态:", decryptResult.status);
      return new Response(
        JSON.stringify({ code: "SUCCESS", message: "OK" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 查询订单
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("order_no", decryptResult.order_no)
      .single();

    if (orderError || !order) {
      console.error("订单不存在:", decryptResult.order_no);
      return new Response(
        JSON.stringify({ code: "FAIL", message: "订单不存在" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 如果订单已经是已支付状态，直接返回成功
    if (order.status === "paid") {
      console.log("订单已支付，跳过处理:", order.order_no);
      return new Response(
        JSON.stringify({ code: "SUCCESS", message: "OK" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 使用乐观锁更新订单状态
    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: "paid",
        updated_at: new Date().toISOString(),
        version: order.version + 1,
      })
      .eq("id", order.id)
      .eq("version", order.version)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      console.error("更新订单状态失败（可能是并发冲突）:", updateError);
      return new Response(
        JSON.stringify({ code: "SUCCESS", message: "OK" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("订单支付成功:", order.order_no);

    // TODO: 这里可以添加支付成功后的业务逻辑，例如：
    // - 更新用户会员状态
    // - 发送通知
    // - 记录日志等

    return new Response(
      JSON.stringify({ code: "SUCCESS", message: "OK" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("处理微信支付回调失败:", error);
    return new Response(
      JSON.stringify({ code: "FAIL", message: error.message || "服务器内部错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

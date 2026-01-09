import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProSubscriptionRequest {
  email: string;
  planName: string;
  price: number;
  period: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, planName, price, period }: ProSubscriptionRequest = await req.json();
    
    const TELEGRAM_PRO_BOT_TOKEN = Deno.env.get("TELEGRAM_PRO_BOT_TOKEN");
    const TELEGRAM_PRO_CHAT_ID = Deno.env.get("TELEGRAM_PRO_CHAT_ID");

    if (!TELEGRAM_PRO_BOT_TOKEN || !TELEGRAM_PRO_CHAT_ID) {
      console.error("Missing Telegram PRO credentials");
      throw new Error("Telegram PRO credentials not configured");
    }

    const telegramMessage = `🌟 Нова PRO підписка на GoToHome!

📧 Email: ${email}
📋 План: ${planName}
💰 Ціна: ${price} ₴ ${period}

🎉 Користувач успішно оформив підписку!`;

    console.log("Sending PRO subscription notification to Telegram...");

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_PRO_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_PRO_CHAT_ID,
          text: telegramMessage,
          parse_mode: "HTML",
        }),
      }
    );

    const telegramResult = await telegramResponse.json();
    console.log("Telegram PRO response:", telegramResult);

    if (!telegramResult.ok) {
      throw new Error(`Telegram API error: ${telegramResult.description}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "PRO subscription notification sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-telegram-pro function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

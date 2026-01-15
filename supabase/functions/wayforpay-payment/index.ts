import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import CryptoJS from "https://esm.sh/crypto-js@4.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WAYFORPAY_LOGIN = Deno.env.get("WAYFORPAY_LOGIN")!;
const WAYFORPAY_KEY = Deno.env.get("WAYFORPAY_KEY")!;

function generateHmacMd5(data: string, key: string): string {
  const hash = CryptoJS.HmacMD5(data, key);
  return hash.toString(CryptoJS.enc.Hex);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId, userEmail, userId } = await req.json();

    // Plan configuration - updated prices
    const plans: Record<string, { name: string; price: number; days: number }> = {
      "10days": { name: "GoToHome Smart - 10 днів", price: 199, days: 10 },
      "30days": { name: "GoToHome Pro - 30 днів", price: 299, days: 30 },
    };

    const plan = plans[planId];
    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = `order_${userId}_${planId}_${Date.now()}`;
    const orderDate = Math.floor(Date.now() / 1000);
    const currency = "UAH";
    const productName = plan.name;
    const productPrice = plan.price;
    const productCount = 1;

    // Data for signature (order matters!)
    const signatureString = [
      WAYFORPAY_LOGIN,
      "gotohome.com.ua",
      orderId,
      orderDate.toString(),
      plan.price.toString(),
      currency,
      productName,
      productCount.toString(),
      productPrice.toString(),
    ].join(";");

    const signature = generateHmacMd5(signatureString, WAYFORPAY_KEY);

    // Payment form data
    const paymentData = {
      merchantAccount: WAYFORPAY_LOGIN,
      merchantDomainName: "gotohome.com.ua",
      merchantSignature: signature,
      orderReference: orderId,
      orderDate: orderDate,
      amount: plan.price,
      currency: currency,
      productName: [productName],
      productPrice: [productPrice],
      productCount: [productCount],
      clientEmail: userEmail,
      returnUrl: "https://gotohome.com.ua/subscription?status=success",
      serviceUrl: "https://qselmijdcggthggjvdej.supabase.co/functions/v1/wayforpay-callback",
      language: "UA",
    };

    return new Response(
      JSON.stringify({ paymentData, orderId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

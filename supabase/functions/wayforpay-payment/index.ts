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
    const { planId, userEmail, userId, returnDomain } = await req.json();

    // Use caller origin when possible (keeps Supabase auth session on the same domain)
    // and fallback to production www domain.
    const domain = (() => {
      const fallback = "https://www.gotohome.com.ua";
      if (!returnDomain || typeof returnDomain !== "string") return fallback;

      try {
        const url = new URL(returnDomain);
        const host = url.hostname.toLowerCase();

        const allowed =
          host === "www.gotohome.com.ua" ||
          host === "gotohome.com.ua" ||
          host.endsWith(".lovable.app") ||
          host === "localhost" ||
          host.endsWith(".localhost");

        if (!allowed) return fallback;
        return `${url.protocol}//${url.host}`;
      } catch {
        return fallback;
      }
    })();

    // Plan configuration with recurring settings
    const plans: Record<string, { name: string; price: number; days: number; regularMode: string }> = {
      "10days": { name: "GoToHome Smart - 10 днів", price: 199, days: 10, regularMode: "none" },
      "30days": { name: "GoToHome Pro - 30 днів", price: 299, days: 30, regularMode: "monthly" },
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

    // Payment form data with recurring payment support
    const paymentData: Record<string, unknown> = {
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
      returnUrl: `${domain}/main`,
      serviceUrl: "https://qselmijdcggthggjvdej.supabase.co/functions/v1/wayforpay-callback",
      language: "UA",
    };

    // Add recurring payment parameters for Pro plan (monthly)
    if (plan.regularMode !== "none") {
      paymentData.regularMode = plan.regularMode;
      paymentData.regularAmount = plan.price;
      paymentData.regularOn = 1; // Enable recurring checkbox by default
      paymentData.regularBehavior = "preset"; // User cannot edit recurring parameters
      
      // Calculate next payment date (30 days from now for monthly)
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + plan.days);
      const day = String(nextDate.getDate()).padStart(2, '0');
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const year = nextDate.getFullYear();
      paymentData.dateNext = `${day}.${month}.${year}`;
    }

    return new Response(
      JSON.stringify({ paymentData, orderId, isRecurring: plan.regularMode !== "none" }),
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

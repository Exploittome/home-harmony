import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WAYFORPAY_LOGIN = Deno.env.get("WAYFORPAY_LOGIN")!;
const WAYFORPAY_KEY = Deno.env.get("WAYFORPAY_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function generateHmacMd5(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "MD5" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return new TextDecoder().decode(encode(new Uint8Array(signature)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("WayForPay callback received:", JSON.stringify(body));

    const {
      merchantAccount,
      orderReference,
      transactionStatus,
    } = body;

    // Verify the callback is from WayForPay
    if (merchantAccount !== WAYFORPAY_LOGIN) {
      console.error("Invalid merchant account");
      return new Response(
        JSON.stringify({ error: "Invalid merchant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse order reference to get userId and planId
    // Format: order_{userId}_{planId}_{timestamp}
    const orderParts = orderReference.split("_");
    if (orderParts.length < 4) {
      console.error("Invalid order reference format");
      return new Response(
        JSON.stringify({ error: "Invalid order reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = orderParts[1];
    const planId = orderParts[2];

    // If payment was successful, update subscription
    if (transactionStatus === "Approved") {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Determine subscription plan and expiry
      const planMapping: Record<string, { dbPlan: string; days: number }> = {
        "10days": { dbPlan: "plan_10_days", days: 10 },
        "30days": { dbPlan: "plan_30_days", days: 30 },
      };

      const planConfig = planMapping[planId];
      if (!planConfig) {
        console.error("Unknown plan:", planId);
        return new Response(
          JSON.stringify({ error: "Unknown plan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + planConfig.days);

      // Update user subscription
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: userId,
          plan: planConfig.dbPlan,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (updateError) {
        console.error("Error updating subscription:", updateError);
      } else {
        console.log(`Subscription updated for user ${userId} to ${planConfig.dbPlan}`);
      }
    }

    // Generate response signature for WayForPay
    const time = Math.floor(Date.now() / 1000);
    const responseSignatureString = [orderReference, "accept", time.toString()].join(";");
    const responseSignature = await generateHmacMd5(responseSignatureString, WAYFORPAY_KEY);

    // Return acknowledgment to WayForPay
    const response = {
      orderReference: orderReference,
      status: "accept",
      time: time,
      signature: responseSignature,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

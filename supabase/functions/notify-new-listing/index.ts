import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_PRO_BOT_TOKEN = Deno.env.get("TELEGRAM_PRO_BOT_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ListingPayload {
  id: string;
  title: string;
  price: number;
  city: string;
  rooms?: number | null;
  area?: number | null;
  phone?: string | null;
  description?: string | null;
  image_url?: string | null;
}

async function sendTelegramMessage(chatId: string, text: string, imageUrl?: string | null) {
  try {
    // If there's an image, send photo with caption
    if (imageUrl) {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_PRO_BOT_TOKEN}/sendPhoto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            photo: imageUrl,
            caption: text,
            parse_mode: "HTML",
          }),
        }
      );
      const result = await response.json();
      if (!result.ok) {
        console.error(`Failed to send photo to ${chatId}:`, result);
        // Fallback to text message if photo fails
        await sendTextMessage(chatId, text);
      }
      return result;
    } else {
      return await sendTextMessage(chatId, text);
    }
  } catch (error) {
    console.error(`Error sending message to ${chatId}:`, error);
    return { ok: false, error };
  }
}

async function sendTextMessage(chatId: string, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_PRO_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    }
  );
  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload));

    // Handle both direct calls and database webhook format
    let listing: ListingPayload;
    
    if (payload.type === "INSERT" && payload.record) {
      // Database webhook format
      listing = payload.record;
    } else if (payload.id && payload.title) {
      // Direct call format
      listing = payload;
    } else {
      console.log("Invalid payload format");
      return new Response(
        JSON.stringify({ error: "Invalid payload format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing new listing: ${listing.title} in ${listing.city}`);

    // Get all active subscribers for this city
    const { data: subscribers, error: subError } = await supabase
      .from("telegram_subscriptions")
      .select("telegram_chat_id")
      .eq("city", listing.city)
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscribers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      console.log(`No active subscribers for city: ${listing.city}`);
      return new Response(
        JSON.stringify({ success: true, message: "No subscribers for this city", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscribers.length} subscribers for ${listing.city}`);

    // Format the notification message
    const roomsText = listing.rooms ? `${listing.rooms} кімн.` : "";
    const areaText = listing.area ? `${listing.area} м²` : "";
    const detailsText = [roomsText, areaText].filter(Boolean).join(" • ");

    const message = `🏠 <b>Нове оголошення в ${listing.city}!</b>

📋 ${listing.title}

💰 <b>${listing.price.toLocaleString("uk-UA")} ₴/міс</b>
${detailsText ? `📐 ${detailsText}` : ""}
${listing.phone ? `📞 ${listing.phone}` : ""}

🔗 Переглянути на сайті: gotohome.com.ua`;

    // Send notifications to all subscribers
    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      const result = await sendTelegramMessage(
        subscriber.telegram_chat_id,
        message,
        listing.image_url
      );
      
      if (result.ok) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to notify ${subscriber.telegram_chat_id}:`, result);
      }
      
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log(`Notifications sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent to ${successCount} subscribers`,
        sent: successCount,
        failed: failCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in notify-new-listing:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number; username?: string; first_name?: string };
  };
  callback_query?: {
    id: string;
    chat_instance: string;
    from: { id: number; username?: string; first_name?: string };
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  };
}

function getTelegramBotToken() {
  const token = Deno.env.get("TELEGRAM_PRO_BOT_TOKEN");
  if (!token) {
    console.error("Missing TELEGRAM_PRO_BOT_TOKEN secret");
  }
  return token;
}

async function telegramApi(method: string, payload: Record<string, unknown>) {
  const token = getTelegramBotToken();
  if (!token) return { ok: false, description: "Missing bot token" };

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({ ok: false, description: "Invalid JSON from Telegram" }));

  if (!res.ok || !json?.ok) {
    console.error(`Telegram API error (${method}):`, json);
  }

  return json;
}

async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  await telegramApi("sendMessage", payload);
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

async function getCitiesFromListings(): Promise<string[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("city");

  if (error || !data) {
    console.error("Error fetching cities:", error);
    return [];
  }

  // Get unique cities
  const uniqueCities = [...new Set(data.map((l) => l.city))].sort();
  return uniqueCities;
}

async function getUserSubscription(chatId: number) {
  const { data, error } = await supabase
    .from("telegram_subscriptions")
    .select("*")
    .eq("telegram_chat_id", chatId.toString())
    .maybeSingle();

  if (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
  return data;
}

async function createOrUpdateSubscription(chatId: number, city: string, userId?: string) {
  const existing = await getUserSubscription(chatId);

  if (existing) {
    const { error } = await supabase
      .from("telegram_subscriptions")
      .update({ city, is_active: true, updated_at: new Date().toISOString() })
      .eq("telegram_chat_id", chatId.toString());

    if (error) {
      console.error("Error updating subscription:", error);
      return false;
    }
  } else {
    // For new subscriptions without user_id, we'll store with a placeholder
    // The actual linking to user account happens when they subscribe on the website
    const { error } = await supabase
      .from("telegram_subscriptions")
      .insert({
        telegram_chat_id: chatId.toString(),
        city,
        user_id: userId || "00000000-0000-0000-0000-000000000000", // Placeholder until linked
        is_active: true,
      });

    if (error) {
      console.error("Error creating subscription:", error);
      return false;
    }
  }
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log("Received update:", JSON.stringify(update));

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const { callback_query } = update;
      const chatId = callback_query.message?.chat.id;
      const data = callback_query.data;

      if (!chatId || !data) {
        return new Response("OK", { status: 200 });
      }

      await answerCallbackQuery(callback_query.id);

      if (data.startsWith("city:")) {
        const city = data.replace("city:", "");
        const success = await createOrUpdateSubscription(chatId, city);

        if (success) {
          await sendMessage(
            chatId,
            `✅ Чудово! Тепер ви будете отримувати сповіщення про нові оголошення в місті <b>${city}</b>.\n\n` +
            `Щоб змінити місто, натисніть /city\n` +
            `Щоб вимкнути сповіщення, натисніть /stop`
          );
        } else {
          await sendMessage(chatId, "❌ Помилка збереження. Спробуйте ще раз.");
        }
      }

      return new Response("OK", { status: 200 });
    }

    // Handle text messages
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim().toLowerCase();
      const firstName = update.message.from?.first_name || "Друже";

      if (text === "/start") {
        const subscription = await getUserSubscription(chatId);

        if (subscription) {
          await sendMessage(
            chatId,
            `👋 Привіт, ${firstName}!\n\n` +
            `Ви вже підписані на сповіщення для міста <b>${subscription.city}</b>.\n\n` +
            `/city - змінити місто\n` +
            `/status - перевірити статус\n` +
            `/stop - вимкнути сповіщення`
          );
        } else {
          await sendMessage(
            chatId,
            `👋 Привіт, ${firstName}!\n\n` +
            `🏠 Це бот GoToHome PRO для сповіщень про нові оголошення оренди.\n\n` +
            `Оберіть місто, щоб отримувати сповіщення:\n` +
            `/city - обрати місто`
          );
        }

        return new Response("OK", { status: 200 });
      }

      if (text === "/city") {
        const cities = await getCitiesFromListings();

        if (cities.length === 0) {
          await sendMessage(chatId, "😔 Наразі немає доступних міст. Спробуйте пізніше.");
          return new Response("OK", { status: 200 });
        }

        // Create inline keyboard with cities (2 per row)
        const keyboard: { text: string; callback_data: string }[][] = [];
        for (let i = 0; i < cities.length; i += 2) {
          const row: { text: string; callback_data: string }[] = [];
          row.push({ text: cities[i], callback_data: `city:${cities[i]}` });
          if (cities[i + 1]) {
            row.push({ text: cities[i + 1], callback_data: `city:${cities[i + 1]}` });
          }
          keyboard.push(row);
        }

        await sendMessage(
          chatId,
          "🏙 Оберіть місто для сповіщень:",
          { inline_keyboard: keyboard }
        );

        return new Response("OK", { status: 200 });
      }

      if (text === "/status") {
        const subscription = await getUserSubscription(chatId);

        if (subscription) {
          const status = subscription.is_active ? "✅ Активна" : "⏸ Призупинена";
          await sendMessage(
            chatId,
            `📊 Ваша підписка:\n\n` +
            `Місто: <b>${subscription.city}</b>\n` +
            `Статус: ${status}`
          );
        } else {
          await sendMessage(
            chatId,
            "❌ У вас ще немає підписки.\n\nНатисніть /city щоб обрати місто."
          );
        }

        return new Response("OK", { status: 200 });
      }

      if (text === "/stop") {
        const { error } = await supabase
          .from("telegram_subscriptions")
          .update({ is_active: false })
          .eq("telegram_chat_id", chatId.toString());

        if (error) {
          await sendMessage(chatId, "❌ Помилка. Спробуйте ще раз.");
        } else {
          await sendMessage(
            chatId,
            "⏸ Сповіщення вимкнено.\n\nНатисніть /city щоб підписатися знову."
          );
        }

        return new Response("OK", { status: 200 });
      }

      // Unknown command
      await sendMessage(
        chatId,
        `🤔 Невідома команда.\n\n` +
        `Доступні команди:\n` +
        `/city - обрати місто\n` +
        `/status - перевірити статус\n` +
        `/stop - вимкнути сповіщення`
      );
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("OK", { status: 200 }); // Always return 200 to Telegram
  }
});

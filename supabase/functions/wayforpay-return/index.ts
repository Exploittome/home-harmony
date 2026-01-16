import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function resolveAllowedDomain(raw: string | null): string {
  const fallback = "https://www.gotohome.com.ua";
  if (!raw) return fallback;

  try {
    const url = new URL(raw);
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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // WayForPay can open returnUrl with POST, which static hosting can't serve.
  // This function returns a tiny HTML page that immediately navigates with GET.
  const url = new URL(req.url);
  const domain = resolveAllowedDomain(url.searchParams.get("rd"));
  const redirectTo = `${domain}/main`;

  const html = `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${redirectTo}" />
    <title>Redirecting…</title>
  </head>
  <body>
    <script>
      window.location.replace(${JSON.stringify(redirectTo)});
    </script>
    <noscript>
      <p><a href="${redirectTo}">Перейти на сайт</a></p>
    </noscript>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});

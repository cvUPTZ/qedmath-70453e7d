import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const InputSchema = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(1000).optional().nullable(),
  referrer_source: z.string().max(50).optional().nullable(),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(200).optional().nullable(),
  user_agent: z.string().max(500).optional().nullable(),
  device_type: z.string().max(20).optional().nullable(),
  session_id: z.string().max(64).optional().nullable(),
});

export const logVisit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const req = getWebRequest();
    const h = req?.headers;

    // Get IP from common proxy headers
    const ip =
      h?.get("cf-connecting-ip") ||
      h?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h?.get("x-real-ip") ||
      null;

    // Cloudflare geolocation headers (available when running on Cloudflare Workers)
    let country: string | null = null;
    let country_code = h?.get("cf-ipcountry") || null;
    let region = h?.get("cf-region") || null;
    let city = h?.get("cf-ipcity") || null;
    const cfLat = h?.get("cf-iplatitude");
    const cfLng = h?.get("cf-iplongitude");
    let latitude = cfLat ? Number(cfLat) : null;
    let longitude = cfLng ? Number(cfLng) : null;

    // Fallback: use free ipapi.co if we don't have city info yet
    if (ip && !city) {
      try {
        const geo = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { "user-agent": "qed-visit-logger" },
          signal: AbortSignal.timeout(2500),
        }).then((r) => (r.ok ? r.json() : null));
        if (geo && !geo.error) {
          country = geo.country_name ?? country;
          country_code = geo.country_code ?? country_code;
          region = geo.region ?? region;
          city = geo.city ?? city;
          latitude = geo.latitude ?? latitude;
          longitude = geo.longitude ?? longitude;
        }
      } catch {
        /* ignore geo lookup errors */
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("visits").insert({
      path: data.path,
      referrer: data.referrer ?? null,
      referrer_source: data.referrer_source ?? null,
      utm_source: data.utm_source ?? null,
      utm_medium: data.utm_medium ?? null,
      utm_campaign: data.utm_campaign ?? null,
      user_agent: data.user_agent ?? null,
      device_type: data.device_type ?? null,
      session_id: data.session_id ?? null,
      ip,
      country,
      country_code,
      region,
      city,
      latitude,
      longitude,
    });

    return { ok: true };
  });

export const listVisits = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("visits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return data ?? [];
});

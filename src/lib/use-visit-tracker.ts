import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { logVisit } from "@/lib/visits.functions";

function detectReferrerSource(ref: string): string {
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (host.includes("facebook.") || host === "fb.com" || host.endsWith(".fb.com") || host.includes("fbclid"))
      return "facebook";
    if (host.includes("instagram.")) return "instagram";
    if (host.includes("t.co") || host.includes("twitter.") || host.includes("x.com")) return "twitter";
    if (host.includes("linkedin.")) return "linkedin";
    if (host.includes("whatsapp") || host.includes("wa.me")) return "whatsapp";
    if (host.includes("t.me") || host.includes("telegram.")) return "telegram";
    if (host.includes("tiktok.")) return "tiktok";
    if (host.includes("youtube.") || host.includes("youtu.be")) return "youtube";
    if (host.includes("google.")) return "google";
    if (host.includes("bing.")) return "bing";
    return host;
  } catch {
    return "unknown";
  }
}

function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function getSessionId(): string {
  const KEY = "qed_session_id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function useVisitTracker() {
  const router = useRouter();
  const log = useServerFn(logVisit);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastPath = "";

    const send = () => {
      const path = window.location.pathname + window.location.search;
      if (path === lastPath) return;
      lastPath = path;

      const ref = document.referrer || "";
      // Ignore internal navigations
      const isInternal = ref && ref.startsWith(window.location.origin);
      const url = new URL(window.location.href);
      const fbclid = url.searchParams.get("fbclid");
      const utm_source = url.searchParams.get("utm_source") || (fbclid ? "facebook" : null);

      log({
        data: {
          path,
          referrer: isInternal ? null : ref || null,
          referrer_source: isInternal ? "internal" : detectReferrerSource(ref),
          utm_source,
          utm_medium: url.searchParams.get("utm_medium"),
          utm_campaign: url.searchParams.get("utm_campaign"),
          user_agent: navigator.userAgent.slice(0, 500),
          device_type: detectDevice(navigator.userAgent),
          session_id: getSessionId(),
        },
      }).catch(() => {
        /* silent */
      });
    };

    send();
    const unsub = router.subscribe("onResolved", send);
    return () => unsub();
  }, [router, log]);
}

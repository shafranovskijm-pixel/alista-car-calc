import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/proxy-client";

/**
 * Calls `onChange` (debounced) when cars or their photos change, via realtime,
 * plus a calm 90s refresh while the tab is visible in case the socket is blocked.
 */
export const useCatalogLiveRefresh = (onChange: () => void, pollMs = 90_000) => {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    let timer: number | undefined;
    const trigger = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => cb.current(), 1500);
    };
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
      .channel(`catalog-live-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cars" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "car_photos" }, trigger)
      .subscribe();
    } catch {
      channel = null; // realtime unavailable: polling below still refreshes
    }
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") cb.current();
    }, pollMs);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [pollMs]);
};

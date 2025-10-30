import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton Supabase client for client components
let client: SupabaseClient | null = null;
let listenersAdded = false; // Track if event listeners are already added

export const createClient = () => {
  if (client) return client;

  client = createClientComponentClient({
    options: { global: { headers: { "x-client-info": "rogues-web" } } },
  }) as unknown as SupabaseClient;

  // 1) Disable built-in auto refresh to avoid multi-tab storms in dev/HMR
  try {
    client.auth.stopAutoRefresh();
  } catch {
    // no-op: older versions may not expose stopAutoRefresh
  }

  // 2) Single-tab refresh lock using localStorage
  const LOCK_KEY = "rogues:refresh-lock";
  const LOCK_TTL_MS = 10_000; // 10s
  const LAST_REFRESH_KEY = "rogues:last-refresh";
  const MIN_REFRESH_INTERVAL_MS = 30_000; // 30s minimum between refresh attempts

  async function acquireLock(): Promise<boolean> {
    try {
      const now = Date.now();
      const raw = window.localStorage.getItem(LOCK_KEY);
      if (raw) {
        try {
          const { ts } = JSON.parse(raw);
          if (typeof ts === "number" && now - ts <= LOCK_TTL_MS) {
            return false; // lock held by another tab
          }
        } catch {
          // corrupted entry, ignore and overwrite
        }
        window.localStorage.removeItem(LOCK_KEY);
      }
      window.localStorage.setItem(LOCK_KEY, JSON.stringify({ ts: now }));
      return true;
    } catch {
      return false;
    }
  }

  function releaseLock() {
    try {
      window.localStorage.removeItem(LOCK_KEY);
    } catch {
      // ignore
    }
  }

  function shouldThrottle(): boolean {
    try {
      const lastRefreshRaw = window.localStorage.getItem(LAST_REFRESH_KEY);
      if (lastRefreshRaw) {
        const lastRefresh = parseInt(lastRefreshRaw, 10);
        const now = Date.now();
        if (now - lastRefresh < MIN_REFRESH_INTERVAL_MS) {
          return true; // Too soon since last refresh
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  function updateLastRefresh() {
    try {
      window.localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }

  // 3) Conservative refresh trigger when tab becomes active
  async function refreshIfNeeded() {
    try {
      // Throttle: don't refresh too frequently
      if (shouldThrottle()) {
        return;
      }

      const { data } = await client!.auth.getSession();
      const expiresAt = data.session?.expires_at; // seconds epoch
      if (!expiresAt) return;
      const nowSec = Math.floor(Date.now() / 1000);
      const secondsLeft = expiresAt - nowSec;
      // Refresh if less than 120s remaining
      if (secondsLeft > 120) return;

      if (await acquireLock()) {
        try {
          await client!.auth.refreshSession();
          updateLastRefresh();
        } finally {
          releaseLock();
        }
      } else {
        // Another tab is refreshing; wait briefly
        await new Promise((r) => setTimeout(r, 1200));
      }
    } catch {
      // ignore; next focus/visibility event will retry
    }
  }

  // Add event listeners only once
  if (typeof window !== "undefined" && !listenersAdded) {
    listenersAdded = true;
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        refreshIfNeeded();
      }
    });
    window.addEventListener("focus", () => {
      refreshIfNeeded();
    });
  }

  return client;
};

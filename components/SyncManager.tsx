"use client";

import { useEffect } from "react";
import { deletedStore, savedStore } from "@/lib/saved-places";
import { applyingRemote, setSyncStatus, supabase, syncNow } from "@/lib/sync";

const DEBOUNCE_MS = 1500;
const REFOCUS_MIN_GAP_MS = 20_000;

/** Mounted once in the root layout: keeps saved spots in sync while someone is signed in. */
export default function SyncManager() {
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;

    let userId: string | null = null;
    let running = false;
    let again = false;
    let lastRun = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      if (!userId) return;
      if (running) {
        again = true;
        return;
      }
      running = true;
      lastRun = Date.now();
      setSyncStatus({ state: "syncing", error: null });
      try {
        await syncNow(userId);
        setSyncStatus({ state: "idle", lastSynced: new Date() });
      } catch (e) {
        setSyncStatus({ state: "error", error: e instanceof Error ? e.message : "Sync failed." });
      } finally {
        running = false;
        if (again) {
          again = false;
          run();
        }
      }
    };

    const schedule = () => {
      if (applyingRemote || !userId) return;
      clearTimeout(timer);
      timer = setTimeout(run, DEBOUNCE_MS);
    };

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const changed = (user?.id ?? null) !== userId;
      userId = user?.id ?? null;
      if (!user) {
        setSyncStatus({ email: null, state: "signed-out", lastSynced: null, error: null });
        return;
      }
      if (changed) {
        setSyncStatus({ email: user.email ?? null, state: "idle" });
        // Supabase advises against awaiting its own calls inside this callback.
        setTimeout(run, 0);
      }
    });

    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRun > REFOCUS_MIN_GAP_MS) run();
    };

    const unsubSaved = savedStore.subscribe(schedule);
    const unsubDeleted = deletedStore.subscribe(schedule);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      subscription.unsubscribe();
      unsubSaved();
      unsubDeleted();
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(timer);
    };
  }, []);

  return null;
}

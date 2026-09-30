import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { isPaint, paletteStore, type Medium } from "./paints";
import { deletedStore, lastChanged, savedStore, type SavedPlace } from "./saved-places";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const syncConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Browser-only Supabase client; null when sync isn't configured. */
export function supabase() {
  if (!syncConfigured) return null;
  client ??= createClient(url!, key!);
  return client;
}

// ---- Status, for the UI ----

export interface SyncStatus {
  email: string | null;
  state: "signed-out" | "idle" | "syncing" | "error";
  lastSynced: Date | null;
  error: string | null;
}

let status: SyncStatus = { email: null, state: "signed-out", lastSynced: null, error: null };
const statusListeners = new Set<() => void>();
const signedOut = status;

export function setSyncStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  statusListeners.forEach((l) => l());
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      statusListeners.add(l);
      return () => statusListeners.delete(l);
    },
    () => status,
    () => signedOut,
  );
}

// ---- Sync ----

interface SpotRow {
  user_id: string;
  id: string;
  data: SavedPlace | null;
  updated_at: string;
  deleted: boolean;
}

const PAGE = 1000;
const time = (iso: string | undefined) => (iso ? Date.parse(iso) : 0);

async function fetchAll(sb: SupabaseClient) {
  const rows: SpotRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("spots")
      .select("user_id, id, data, updated_at, deleted")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data as SpotRow[]));
    if (data.length < PAGE) return rows;
  }
}

/** True while sync writes to the local stores, so those writes don't schedule another sync. */
export let applyingRemote = false;

/**
 * Two-way merge: for each spot, whichever side changed it last wins (deletions
 * included). Local winners are pushed; remote winners replace local copies.
 */
export async function syncNow(userId: string) {
  const sb = supabase();
  if (!sb) return;

  const local = savedStore.get();
  const deleted = deletedStore.get();
  const remote = new Map((await fetchAll(sb)).map((r) => [r.id, r]));

  const merged: SavedPlace[] = [];
  const toPush: SpotRow[] = [];
  const ids = new Set([...remote.keys(), ...local.map((p) => p.id), ...Object.keys(deleted)]);

  for (const id of ids) {
    const mine = local.find((p) => p.id === id);
    const mineTime = mine ? lastChanged(mine) : deleted[id];
    const theirs = remote.get(id);

    if (mineTime && (!theirs || time(mineTime) > time(theirs.updated_at))) {
      if (mine) merged.push(mine);
      toPush.push({ user_id: userId, id, data: mine ?? null, updated_at: mineTime, deleted: !mine });
    } else if (theirs && !theirs.deleted && theirs.data) {
      merged.push({ ...theirs.data, updatedAt: theirs.updated_at });
    }
  }

  if (toPush.length > 0) {
    const { error } = await sb.from("spots").upsert(toPush, { onConflict: "user_id,id" });
    if (error) throw error;
  }

  // Keep anything the user changed or deleted while we were talking to the server.
  const snapshot = new Map(local.map((p) => [p.id, lastChanged(p)]));
  applyingRemote = true;
  try {
    const current = deletedStore.get();
    const removedDuring = new Set(Object.keys(current).filter((id) => current[id] !== deleted[id]));
    deletedStore.set(Object.fromEntries([...removedDuring].map((id) => [id, current[id]])));

    savedStore.set((prev) => {
      const editedDuring = prev.filter((p) => snapshot.get(p.id) !== lastChanged(p));
      const editedIds = new Set(editedDuring.map((p) => p.id));
      return [...editedDuring, ...merged.filter((p) => !editedIds.has(p.id) && !removedDuring.has(p.id))].sort(
        (a, b) => time(b.savedAt) - time(a.savedAt),
      );
    });
  } finally {
    applyingRemote = false;
  }
}

interface PaletteRow {
  medium: Medium;
  paints: unknown[];
  updated_at: string;
}

/**
 * The palette syncs as one unit: the newer copy replaces the older one. A
 * palette from before sync existed has no timestamp, so the first sync
 * merges its paints with the server's copy instead of discarding them.
 */
export async function syncPalette(userId: string) {
  const sb = supabase();
  if (!sb) return;

  const local = paletteStore.get();
  const { data, error } = await sb.from("palettes").select("medium, paints, updated_at").maybeSingle<PaletteRow>();
  if (error) throw error;

  const push = async (medium: Medium, paints: unknown[], updatedAt: string) => {
    const { error } = await sb
      .from("palettes")
      .upsert({ user_id: userId, medium, paints, updated_at: updatedAt }, { onConflict: "user_id" });
    if (error) throw error;
  };

  // Replace local medium and paints, unless the user edited them while we were waiting.
  const apply = (medium: Medium, paints: unknown[], updatedAt: string) => {
    applyingRemote = true;
    try {
      paletteStore.set((p) =>
        p.updatedAt === local.updatedAt ? { ...p, medium, paints: paints.filter(isPaint), updatedAt } : p,
      );
    } finally {
      applyingRemote = false;
    }
  };

  if (!local.updatedAt) {
    if (!data) {
      if (local.paints.length > 0) {
        const now = new Date().toISOString();
        await push(local.medium, local.paints, now);
        apply(local.medium, local.paints, now);
      }
      return;
    }
    const remotePaints = data.paints.filter(isPaint);
    const extra = local.paints.filter((p) => !remotePaints.some((r) => r.id === p.id));
    if (extra.length === 0) {
      apply(data.medium, remotePaints, data.updated_at);
      return;
    }
    const now = new Date().toISOString();
    const merged = [...remotePaints, ...extra];
    await push(data.medium, merged, now);
    apply(data.medium, merged, now);
    return;
  }

  if (!data || time(local.updatedAt) > time(data.updated_at)) {
    await push(local.medium, local.paints, local.updatedAt);
  } else if (time(data.updated_at) > time(local.updatedAt)) {
    apply(data.medium, data.paints, data.updated_at);
  }
}

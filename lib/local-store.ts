import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store shared by every component that uses it.
 * The server snapshot is always `fallback`, so hydration never mismatches.
 */
export function createLocalStore<T>(key: string, fallback: T, parse: (raw: unknown) => T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  function get(): T {
    if (cache === undefined) {
      try {
        const raw = localStorage.getItem(key);
        cache = raw ? parse(JSON.parse(raw)) : fallback;
      } catch {
        cache = fallback;
      }
    }
    return cache;
  }

  function set(next: T | ((prev: T) => T)) {
    cache = typeof next === "function" ? (next as (prev: T) => T)(get()) : next;
    try {
      localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      // Storage full or blocked: keep the in-memory value for this session.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = undefined;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useValue() {
    return useSyncExternalStore(subscribe, get, () => fallback);
  }

  return { get, set, useValue, subscribe };
}

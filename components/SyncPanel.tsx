"use client";

import { useState } from "react";
import { supabase, syncConfigured, useSyncStatus } from "@/lib/sync";

function ago(date: Date) {
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function SyncPanel() {
  const status = useSyncStatus();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!syncConfigured) {
    return (
      <p className="text-xs text-zinc-500">
        Sync between devices is off. Add your Supabase keys to turn it on (see README).
      </p>
    );
  }

  if (status.state !== "signed-out") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span>
          {status.state === "syncing" && "Syncing…"}
          {status.state === "idle" && `Synced${status.lastSynced ? ` ${ago(status.lastSynced)}` : ""}`}
          {status.state === "error" && <span className="text-red-500">Sync failed: {status.error}</span>}
          {status.email && <> as {status.email}</>}
        </span>
        <button className="underline hover:text-foreground" onClick={() => supabase()?.auth.signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  if (sentTo) {
    return (
      <p className="text-xs text-zinc-500">
        Check <strong>{sentTo}</strong> for a sign-in link, and open it on this device. Repeat on each device you use.
      </p>
    );
  }

  if (!open) {
    return (
      <button className="text-xs text-zinc-500 underline hover:text-foreground" onClick={() => setOpen(true)}>
        Sync your spots across devices
      </button>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabase();
    if (!sb) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/saved` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSentTo(email.trim());
  };

  return (
    <form onSubmit={send} className="flex flex-wrap items-center gap-2 text-sm">
      <input
        type="email"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-56 rounded-full border border-zinc-300 bg-transparent px-3 py-1.5 outline-none focus:border-amber-500 dark:border-zinc-700"
      />
      <button
        disabled={busy}
        className="rounded-full bg-amber-400 px-4 py-1.5 font-semibold text-zinc-950 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      {error && <span className="w-full text-xs text-red-500">{error}</span>}
    </form>
  );
}

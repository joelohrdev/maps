"use client";

import { useState } from "react";
import { SUGGESTED_TAGS, removePlace, upsertPlace, type SavedPlace } from "@/lib/saved-places";

export default function SaveDialog({
  place,
  isExisting,
  onClose,
}: {
  place: SavedPlace;
  isExisting: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(place.title);
  const [note, setNote] = useState(place.note);
  const [tags, setTags] = useState(place.tags);
  const [customTag, setCustomTag] = useState("");

  const toggleTag = (tag: string) =>
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setCustomTag("");
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    upsertPlace({ ...place, title: title.trim() || place.title, note: note.trim(), tags });
    onClose();
  };

  const allTags = [...SUGGESTED_TAGS, ...tags.filter((t) => !SUGGESTED_TAGS.includes(t))];

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-zinc-950/95 p-5 text-sm text-zinc-100 shadow-2xl backdrop-blur-md"
      >
        <div>
          <h2 className="text-base font-semibold">{isExisting ? "Edit saved spot" : "Save this spot"}</h2>
          <p className="text-xs text-zinc-400">Your current view angle and zoom are saved too.</p>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Title</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 outline-none focus:border-amber-400"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Sketch notes</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Two-point perspective, warm evening light, try gouache…"
            className="w-full resize-none rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 outline-none focus:border-amber-400"
          />
        </label>

        <div className="space-y-2">
          <span className="text-xs text-zinc-400">Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  tags.includes(tag)
                    ? "border-amber-400 bg-amber-400 text-zinc-950"
                    : "border-white/15 text-zinc-300 hover:border-white/40"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="Add your own tag"
              className="flex-1 rounded-lg border border-white/15 bg-zinc-900 px-3 py-1.5 outline-none focus:border-amber-400"
            />
            <button type="button" onClick={addCustomTag} className="rounded-lg border border-white/15 px-3 hover:border-white/40">
              Add
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {isExisting ? (
            <button
              type="button"
              className="text-red-400 hover:text-red-300"
              onClick={() => {
                removePlace(place.id);
                onClose();
              }}
            >
              Remove
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-zinc-300 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="rounded-full bg-amber-400 px-5 py-2 font-semibold text-zinc-950 hover:bg-amber-300">
              {isExisting ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

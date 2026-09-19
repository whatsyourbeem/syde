"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface StoredDraft<T> {
  data: T;
  savedAt: number;
}

function read<T>(key: string): StoredDraft<T> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredDraft<T>) : null;
  } catch {
    return null;
  }
}

/**
 * Autosaves `data` to localStorage. A draft found on mount is surfaced as `pendingDraft` until the user
 * restores or discards it; editing meanwhile is still saved, and the unresolved draft is kept aside rather than overwritten.
 * `isPristine` decides when there is nothing worth keeping (empty, or unchanged from the saved original).
 */
export function useLocalDraft<T>({
  key,
  data,
  isPristine,
  delay = 1000,
}: {
  key: string;
  data: T;
  isPristine: (data: T) => boolean;
  delay?: number;
}) {
  const [pendingDraft, setPendingDraft] = useState<StoredDraft<T> | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const isPristineRef = useRef(isPristine);
  isPristineRef.current = isPristine;
  const clearedRef = useRef(false);

  const previousKey = `${key}:previous`;

  useEffect(() => {
    const stored = read<T>(key);
    const previous = read<T>(previousKey);
    const candidate = [stored, previous].find((draft) => draft && !isPristineRef.current(draft.data));
    if (candidate) {
      setPendingDraft(candidate);
    }
    setReady(true);
  }, [key, previousKey]);

  useEffect(() => {
    if (!ready) return;
    // With the restore banner still open, untouched forms must not delete the stored draft.
    if (pendingDraft && isPristineRef.current(data)) return;
    const timer = setTimeout(() => {
      if (clearedRef.current) return;
      try {
        if (isPristineRef.current(data)) {
          localStorage.removeItem(key);
          setLastSavedAt(null);
          return;
        }
        // The user ignored the banner and started writing: keep their new work, but park the
        // unresolved draft under a side key so it can still be offered after a reload.
        if (pendingDraft && !localStorage.getItem(previousKey)) {
          localStorage.setItem(previousKey, JSON.stringify(pendingDraft));
        }
        const savedAt = Date.now();
        localStorage.setItem(key, JSON.stringify({ data, savedAt }));
        setLastSavedAt(savedAt);
      } catch {
        // Storage unavailable (private mode, quota) — drafts are best-effort.
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [key, previousKey, data, ready, pendingDraft, delay]);

  const restore = useCallback(() => {
    const draft = pendingDraft;
    setPendingDraft(null);
    try {
      localStorage.removeItem(previousKey);
    } catch {}
    if (draft) setLastSavedAt(draft.savedAt);
    return draft?.data ?? null;
  }, [pendingDraft, previousKey]);

  const discard = useCallback(() => {
    try {
      localStorage.removeItem(previousKey);
      // Only drop the main key when it still holds the discarded draft, not work typed since.
      if (pendingDraft && read<T>(key)?.savedAt === pendingDraft.savedAt) {
        localStorage.removeItem(key);
      }
    } catch {}
    setPendingDraft(null);
  }, [key, previousKey, pendingDraft]);

  // Call after a successful publish; stops any queued autosave from resurrecting the draft.
  const clear = useCallback(() => {
    clearedRef.current = true;
    try {
      localStorage.removeItem(key);
    } catch {}
    setLastSavedAt(null);
  }, [key]);

  return { pendingDraft, restore, discard, clear, lastSavedAt };
}

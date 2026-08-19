import { useEffect, useRef, useCallback } from "react";
import secureLocalStorage from "react-secure-storage";

/**
 * useQuizAutoSave
 * Persists quiz state every second (and on key events) to secureLocalStorage.
 * Also flushes on `beforeunload` and tab visibility hide.
 *
 * Optionally syncs a draft to the server every `serverIntervalMs` (default 20s).
 *
 * Params:
 *   storageKey       : string                 - e.g. "answerQuizProgress"
 *   state            : object                 - serializable snapshot to save
 *   enabled          : boolean                - turn off after submit/expire
 *   serverSync       : (payload) => Promise   - optional remote sync fn
 *   serverIntervalMs : number                 - default 20000
 */
export default function useQuizAutoSave({
  storageKey,
  state,
  enabled = true,
  serverSync,
  serverIntervalMs = 20000,
}) {
  const stateRef = useRef(state);
  stateRef.current = state;

  const save = useCallback(() => {
    if (!enabled) return;
    try {
      const payload = { ...stateRef.current, savedAt: Date.now() };
      // Convert Sets to arrays for JSON safety
      Object.keys(payload).forEach((k) => {
        if (payload[k] instanceof Set) payload[k] = Array.from(payload[k]);
      });
      secureLocalStorage.setItem(storageKey, payload);
    } catch (e) {
      // Phase 6: previously fell back to plain, unencrypted
      // localStorage on any secureLocalStorage failure (e.g. quota
      // exceeded), storing the full quiz state — potentially including
      // a respondent's answers — in cleartext, readable by any script
      // on the page or anyone with local access to the browser. If the
      // secure store fails, this save tick is simply skipped; the next
      // 1-second autosave tick (or the server-side sync below, when
      // configured) will retry rather than silently downgrading to an
      // insecure store.
    }
  }, [enabled, storageKey]);

  // 1-second autosave loop
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(save, 1000);
    return () => clearInterval(id);
  }, [enabled, save]);

  // Beforeunload + visibility flush
  useEffect(() => {
    if (!enabled) return;
    const flush = () => save();
    const onVis = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, save]);

  // Server-side draft sync
  useEffect(() => {
    if (!enabled || typeof serverSync !== "function") return;
    const id = setInterval(() => {
      try {
        const payload = { ...stateRef.current, savedAt: Date.now() };
        Object.keys(payload).forEach((k) => {
          if (payload[k] instanceof Set) payload[k] = Array.from(payload[k]);
        });
        Promise.resolve(serverSync(payload)).catch(() => {});
      } catch (_) {}
    }, serverIntervalMs);
    return () => clearInterval(id);
  }, [enabled, serverSync, serverIntervalMs]);

  const clear = useCallback(() => {
    try { secureLocalStorage.removeItem(storageKey); } catch (_) {}
    // Also clean up any legacy plaintext fallback key from before this
    // fix, in case a browser still has one cached from an earlier
    // session.
    try { localStorage.removeItem(storageKey + "_fallback"); } catch (_) {}
  }, [storageKey]);

  const load = useCallback(() => {
    try {
      const v = secureLocalStorage.getItem(storageKey);
      if (v) return v;
    } catch (_) {}
    return null;
  }, [storageKey]);

  return { save, clear, load };
}

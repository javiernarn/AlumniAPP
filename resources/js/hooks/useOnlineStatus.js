import { useEffect, useRef, useState } from "react";

/**
 * useOnlineStatus
 * Returns { online, justRestored } where `justRestored` is true for ~4 seconds
 * after the connection comes back, useful for a transient "restored" banner.
 */
export default function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [justRestored, setJustRestored] = useState(false);

  // Phase 4 (audit §1 finding #3): goOnline() is an event-listener
  // callback, not a useEffect itself, so the cleanup closure it used to
  // `return` was never called by React — every `online` event left its
  // setTimeout dangling. Rapid online/offline flapping could stack up
  // any number of pending timers (harmless individually — each just
  // calls setJustRestored(false) — but still a leak pattern). Hoisting
  // the timeout to a ref lets goOnline clear its own previous timer
  // before starting a new one, and the main effect cleanup below clears
  // whatever's still pending when the component unmounts.
  const restoredTimeoutRef = useRef(null);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setJustRestored(true);
      clearTimeout(restoredTimeoutRef.current);
      restoredTimeoutRef.current = setTimeout(() => setJustRestored(false), 4000);
    };
    const goOffline = () => {
      setOnline(false);
      setJustRestored(false);
      clearTimeout(restoredTimeoutRef.current);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearTimeout(restoredTimeoutRef.current);
    };
  }, []);

  return { online, justRestored };
}

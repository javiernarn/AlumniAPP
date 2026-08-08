import { useEffect, useState } from "react";

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

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setJustRestored(true);
      const t = setTimeout(() => setJustRestored(false), 4000);
      return () => clearTimeout(t);
    };
    const goOffline = () => {
      setOnline(false);
      setJustRestored(false);
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { online, justRestored };
}

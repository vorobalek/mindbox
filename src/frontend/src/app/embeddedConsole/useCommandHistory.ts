import { useCallback, useEffect, useRef, useState } from "react";

export interface CommandHistoryApi {
  history: string[];
  push: (cmd: string) => void;
  prev: () => string;
  next: () => string;
  resetCursor: () => void;
}

export function useCommandHistory(storageKey: string): CommandHistoryApi {
  const [history, setHistory] = useState<string[]>([]);
  const idxRef = useRef<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const next = parsed.filter((x) => typeof x === "string").slice(-200);
        setHistory(next);
        idxRef.current = next.length;
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const save = useCallback(
    (arr: string[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(arr.slice(-200)));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const push = useCallback(
    (cmd: string) => {
      const code = String(cmd || "").trim();
      if (!code) return;

      setHistory((prev) => {
        const next = prev.slice();
        if (!next.length || next[next.length - 1] !== code) next.push(code);
        const sliced = next.slice(-200);
        save(sliced);
        idxRef.current = sliced.length;
        return sliced;
      });
    },
    [save]
  );

  const resetCursor = useCallback(() => {
    idxRef.current = history.length;
  }, [history.length]);

  const prev = useCallback(() => {
    if (!history.length) return "";
    idxRef.current = Math.max(0, idxRef.current - 1);
    return history[idxRef.current] || "";
  }, [history]);

  const next = useCallback(() => {
    if (!history.length) return "";
    idxRef.current = Math.min(history.length, idxRef.current + 1);
    return idxRef.current >= history.length ? "" : (history[idxRef.current] || "");
  }, [history]);

  return { history, push, prev, next, resetCursor };
}



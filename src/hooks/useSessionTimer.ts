import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MINUTES, shiftMinutes } from "../lib/format";

export function useSessionTimer(savedMinutes: number, onSaveMinutes: (minutes: number) => void, onDone: () => void) {
  const [remaining, setRemaining] = useState(() => savedMinutes * 60);
  const [running, setRunning] = useState(false);
  const remainingRef = useRef(savedMinutes * 60);
  const runningRef = useRef(false);
  const endsAt = useRef(0);
  const savedRef = useRef(savedMinutes);
  const onSaveRef = useRef(onSaveMinutes);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    savedRef.current = savedMinutes;
    onSaveRef.current = onSaveMinutes;
    onDoneRef.current = onDone;
  }, [savedMinutes, onSaveMinutes, onDone]);

  const adjust = useCallback((steps: number) => {
    const nextMinutes = shiftMinutes(remainingRef.current, steps);
    const next = nextMinutes * 60;
    if (next === remainingRef.current) return;
    remainingRef.current = next;
    if (runningRef.current) endsAt.current = Date.now() + next * 1000;
    onSaveRef.current(nextMinutes);
    setRemaining(next);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      return;
    }
    const startFrom = remainingRef.current <= 0 ? savedRef.current * 60 : remainingRef.current;
    remainingRef.current = startFrom;
    setRemaining(startFrom);
    endsAt.current = Date.now() + startFrom * 1000;
    runningRef.current = true;
    setRunning(true);
  }, []);

  const reset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    remainingRef.current = DEFAULT_MINUTES * 60;
    setRemaining(DEFAULT_MINUTES * 60);
    onSaveRef.current(DEFAULT_MINUTES);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      if (left !== remainingRef.current) {
        remainingRef.current = left;
        setRemaining(left);
      }
      if (left <= 0 && runningRef.current) {
        runningRef.current = false;
        setRunning(false);
        onDoneRef.current();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  return { remaining, running, adjust, toggle, reset };
}

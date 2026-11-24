import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

interface ChromeApi {
  reduce: boolean;
  holdOpen: boolean;
  timerRunning: boolean;
  hide: () => void;
}

export function useChrome(timerRunning: boolean, holdOpen: boolean) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const pending = useRef(0);
  const api = useRef<ChromeApi>({
    reduce,
    holdOpen,
    timerRunning,
    hide: () => {},
  });

  const clear = useCallback(() => {
    window.clearTimeout(pending.current);
    pending.current = 0;
  }, []);

  const hide = useCallback(() => {
    if (api.current.reduce || api.current.holdOpen) return;
    const bar = barRef.current;
    if (bar && (bar.matches(":hover") || bar.contains(document.activeElement))) {
      pending.current = window.setTimeout(() => api.current.hide(), 700);
      return;
    }
    visibleRef.current = false;
    setVisible(false);
  }, []);

  const reveal = useCallback(() => {
    clear();
    visibleRef.current = true;
    setVisible(true);
  }, [clear]);

  const noteTyping = useCallback(() => {
    if (api.current.reduce || api.current.holdOpen || !visibleRef.current) return;
    clear();
    pending.current = window.setTimeout(() => api.current.hide(), 550);
  }, [clear]);

  useEffect(() => {
    api.current.reduce = reduce;
    api.current.holdOpen = holdOpen;
    api.current.timerRunning = timerRunning;
    api.current.hide = hide;
  }, [reduce, holdOpen, timerRunning, hide]);

  useEffect(() => {
    const onMove = () => {
      if (api.current.reduce) return;
      window.clearTimeout(pending.current);
      pending.current = 0;
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
      if (api.current.timerRunning && !api.current.holdOpen) {
        pending.current = window.setTimeout(() => api.current.hide(), 1300);
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      if (barRef.current?.contains(event.target as Node)) reveal();
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [reveal]);

  useEffect(() => {
    if (reduce || holdOpen || !timerRunning) {
      clear();
      return;
    }
    pending.current = window.setTimeout(() => api.current.hide(), 1000);
    return () => clear();
  }, [timerRunning, reduce, holdOpen, clear]);

  useEffect(() => clear, [clear]);

  return {
    visible: reduce || holdOpen || visible,
    barRef,
    reveal,
    noteTyping,
  };
}

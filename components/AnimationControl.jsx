"use client";

import { useEffect, useRef } from "react";

export default function AnimationControl() {
  const idleTimerRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;

    const setPaused = (paused) => {
      root.classList.toggle("animations-paused", paused);
    };

    const setIdle = (idle) => {
      root.classList.toggle("animations-idle", idle);
    };

    const onVisibility = () => setPaused(document.hidden);

    const resetIdleTimer = () => {
      setIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIdle(true), 30000); // 30s inactivity
    };

    // Respect reduced motion preference
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyReducedMotion = () => {
      root.classList.toggle("animations-paused", media.matches);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", () => setPaused(true));
    window.addEventListener("focus", () => setPaused(document.hidden));

    ["mousemove", "keydown", "scroll", "touchstart"].forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    media.addEventListener?.("change", applyReducedMotion);

    // Initialize
    onVisibility();
    applyReducedMotion();
    resetIdleTimer();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", () => setPaused(true));
      window.removeEventListener("focus", () => setPaused(document.hidden));
      ["mousemove", "keydown", "scroll", "touchstart"].forEach((evt) => {
        window.removeEventListener(evt, resetIdleTimer);
      });
      media.removeEventListener?.("change", applyReducedMotion);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return null;
}


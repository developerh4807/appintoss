import { useEffect, useState } from "react";

export interface UseStageTimerReturn {
  timeLeft: number;
  isPaused: boolean;
  isExpired: boolean;
  addTime: (seconds: number) => void;
  applyPenalty: (seconds: number) => void;
  reset: (seconds: number) => void;
}

export function useStageTimer(initialSeconds: number): UseStageTimerReturn {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(
    document.visibilityState === "hidden",
  );

  useEffect(() => {
    const onVisibilityChange = () =>
      setIsPaused(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const isExpired = timeLeft <= 0;

  useEffect(() => {
    if (isPaused || isExpired) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPaused, isExpired]);

  const addTime = (seconds: number) => setTimeLeft((t) => t + seconds);
  const applyPenalty = (seconds: number) =>
    setTimeLeft((t) => Math.max(0, t - seconds));
  const reset = (seconds: number) => setTimeLeft(seconds);

  return { timeLeft, isPaused, isExpired, addTime, applyPenalty, reset };
}

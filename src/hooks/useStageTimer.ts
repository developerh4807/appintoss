import { useEffect, useState } from "react";

export interface UseStageTimerReturn {
  timeLeft: number;
  isPaused: boolean;
  isExpired: boolean;
  addTime: (seconds: number) => void;
  applyPenalty: (seconds: number) => void;
  reset: (seconds: number) => void;
  setPaused: (paused: boolean) => void;
}

export function useStageTimer(initialSeconds: number): UseStageTimerReturn {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [visibilityPaused, setVisibilityPaused] = useState(
    document.visibilityState === "hidden",
  );
  // [NEW 2026-07-22] 앱 백그라운드와 별개로, 스테이지 클리어처럼 "지금은 카운트다운이 의미
  // 없는" 순간에 명시적으로 멈추기 위한 수동 정지 스위치. reset()에서 항상 해제된다 —
  // 다음 스테이지가 시작되면 자동으로 다시 흐른다.
  const [manuallyPaused, setManuallyPaused] = useState(false);

  useEffect(() => {
    const onVisibilityChange = () =>
      setVisibilityPaused(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const isPaused = visibilityPaused || manuallyPaused;
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
  const reset = (seconds: number) => {
    setTimeLeft(seconds);
    setManuallyPaused(false);
  };
  const setPaused = (paused: boolean) => setManuallyPaused(paused);

  return { timeLeft, isPaused, isExpired, addTime, applyPenalty, reset, setPaused };
}

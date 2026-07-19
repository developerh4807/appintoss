import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "appintoss.puzzle.progress";

interface Progress {
  currency: number;
  stage: number;
}

const DEFAULT_PROGRESS: Progress = { currency: 0, stage: 1 };

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;

    const parsed = JSON.parse(raw);
    if (
      Number.isInteger(parsed?.currency) &&
      parsed.currency >= 0 &&
      Number.isInteger(parsed?.stage) &&
      parsed.stage >= 1
    ) {
      return parsed;
    }
    return DEFAULT_PROGRESS;
  } catch (error) {
    console.error("진행도 불러오기 실패:", error);
    return DEFAULT_PROGRESS;
  }
}

interface UseCurrencyReturn {
  currency: number;
  stage: number;
  clearStage: (reward: number) => void;
  spendCurrency: (amount: number) => boolean;
}

export function useCurrency(): UseCurrencyReturn {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("진행도 저장 실패:", error);
    }
  }, [progress]);

  const clearStage = useCallback((reward: number) => {
    setProgress((prev) => ({
      currency: prev.currency + reward,
      stage: prev.stage + 1,
    }));
  }, []);

  const spendCurrency = useCallback(
    (amount: number): boolean => {
      if (progress.currency < amount) return false;
      setProgress((prev) => ({ ...prev, currency: prev.currency - amount }));
      return true;
    },
    [progress.currency],
  );

  return {
    currency: progress.currency,
    stage: progress.stage,
    clearStage,
    spendCurrency,
  };
}

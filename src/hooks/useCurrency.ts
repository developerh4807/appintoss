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
      // [NEW 2026-08-12] 콜드 스타트 리셋 — stage는 localStorage에서 복원하지 않는다.
      // 앱을 백그라운드로 보내기만 했다면(iOS/Android가 프로세스를 살려둔 경우) React
      // 상태가 메모리에 남아있어 이 함수 자체가 다시 호출되지 않는다 — 즉 loadProgress가
      // 실행된다는 건 예외 없이 "강제종료(스와이프) 또는 OS의 백그라운드 kill 이후 재시작"이라는
      // 뜻이다. 그래서 이 시점의 stage는 항상 1로 되돌리고, currency는 오락실 런 리셋과
      // 동일하게 유지한다(런을 거듭할수록 재화가 쌓이는 구조는 앱 재시작 여부와 무관해야 함).
      return { currency: parsed.currency, stage: 1 };
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
  addReward: (reward: number) => void;
  advanceStage: () => void;
  resetStage: () => void;
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

  // 재화 지급과 스테이지 진행을 분리 — 재화는 클리어 즉시, 스테이지(및 그에 딸린 타이머)는
  // 플레이어가 "다음 스테이지"를 실제로 선택한 순간에만 진행되도록 하기 위함.
  const addReward = useCallback((reward: number) => {
    setProgress((prev) => ({ ...prev, currency: prev.currency + reward }));
  }, []);

  const advanceStage = useCallback(() => {
    setProgress((prev) => ({ ...prev, stage: prev.stage + 1 }));
  }, []);

  // [NEW 2026-08-11] 오락실 런 리셋 — 재시도를 모두 소진했을 때 스테이지만 1로 되돌린다.
  // currency는 의도적으로 건드리지 않는다: 런을 거듭할수록 재화가 쌓여 아이템 전략이
  // 생기는 구조로 확정됐다(아이템도 useInventory에서 그대로 유지된다).
  const resetStage = useCallback(() => {
    setProgress((prev) => ({ ...prev, stage: 1 }));
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
    addReward,
    advanceStage,
    resetStage,
    spendCurrency,
  };
}

import { useCallback, useState } from "react";

// [NEW 2026-07-22] 스테이지별이 아니라 게임 전체(하루 단위)로 묶은 무료 재시도 횟수.
// 예전엔 스테이지마다 2회씩 리셋돼 사실상 무제한에 가까웠다 — 개발자 피드백에 따라
// 하루 3회로 강하게 제한하고, 소진되면 광고 시청으로만 이어할 수 있게 한다.
// useDailyAdCap.ts와 동일한 일일 리셋 패턴 재사용(하루가 지나면 자동으로 다시 3회).
// [ASSUMPTION] 정확한 횟수는 플레이테스트로 조정 — game/balance.ts DAILY_FREE_RETRIES 참고.
import { DAILY_FREE_RETRIES } from "../game/balance";

const STORAGE_KEY = "appintoss.puzzle.dailyRetryCap";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface DailyRetryState {
  date: string;
  count: number;
}

function loadState(): DailyRetryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };

    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.date === "string" &&
      Number.isInteger(parsed?.count) &&
      parsed.count >= 0
    ) {
      return parsed.date === todayKey()
        ? parsed
        : { date: todayKey(), count: 0 };
    }
    return { date: todayKey(), count: 0 };
  } catch (error) {
    console.error("일일 무료 재시도 횟수 불러오기 실패:", error);
    return { date: todayKey(), count: 0 };
  }
}

interface UseGlobalRetryCapReturn {
  retriesUsed: number;
  maxRetries: number;
  canRetry: boolean;
  recordRetry: () => void;
}

export function useGlobalRetryCap(): UseGlobalRetryCapReturn {
  const [state, setState] = useState<DailyRetryState>(loadState);

  const recordRetry = useCallback(() => {
    setState((prev) => {
      const next: DailyRetryState =
        prev.date === todayKey()
          ? { date: prev.date, count: prev.count + 1 }
          : { date: todayKey(), count: 1 };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("일일 무료 재시도 횟수 저장 실패:", error);
      }
      return next;
    });
  }, []);

  const retriesUsed = state.date === todayKey() ? state.count : 0;
  const canRetry = retriesUsed < DAILY_FREE_RETRIES;

  return {
    retriesUsed,
    maxRetries: DAILY_FREE_RETRIES,
    canRetry,
    recordRetry,
  };
}

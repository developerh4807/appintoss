import { useCallback, useState } from "react";

// PRD FR-16 `[ASSUMPTION]` — 정확한 상한 수치는 미정, 헤비유저 상한이 사실상 없는 수준으로 넉넉하게 설정. 플레이테스트로 조정.
const DAILY_LIMIT = 20;
const STORAGE_KEY = "appintoss.puzzle.dailyAdCap";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface DailyAdCapState {
  date: string;
  count: number;
}

function loadState(): DailyAdCapState {
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
    console.error("일일 광고 시청 횟수 불러오기 실패:", error);
    return { date: todayKey(), count: 0 };
  }
}

interface UseDailyAdCapReturn {
  canWatch: boolean;
  recordWatch: () => void;
}

export function useDailyAdCap(): UseDailyAdCapReturn {
  const [state, setState] = useState<DailyAdCapState>(loadState);

  const recordWatch = useCallback(() => {
    setState((prev) => {
      const next: DailyAdCapState =
        prev.date === todayKey()
          ? { date: prev.date, count: prev.count + 1 }
          : { date: todayKey(), count: 1 };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("일일 광고 시청 횟수 저장 실패:", error);
      }
      return next;
    });
  }, []);

  const canWatch =
    state.date !== todayKey() || state.count < DAILY_LIMIT;

  return { canWatch, recordWatch };
}

import { useCallback, useEffect, useState } from "react";

// [NEW 2026-08-11] 오락실(런 리셋) 모델 — useGlobalRetryCap.ts(하루 3회)를 대체한다.
// 무료 재시도는 하루가 아니라 "런" 단위로 리충되고, 광고 1회까지 모두 소진하면
// 스테이지 1로 리셋되며 무료 재시도도 다시 채워진다.
// 재화·아이템은 런 리셋에 영향받지 않는다(useCurrency/useInventory에서 관리) —
// 런을 거듭할수록 재화가 쌓여 아이템 전략이 생기는 구조로 확정됐다.
// 광고 일일 상한(useDailyAdCap.ts)은 성격이 달라 그대로 유지한다.
// 상세: deferred-work.md "[플레이테스트 2026-08-11] ② 무료 재시도" 항목.
import { FREE_RETRIES_PER_RUN } from "../game/balance";

const STORAGE_KEY = "appintoss.puzzle.runState";

interface RunState {
  // 이번 런에서 사용한 무료 재시도 횟수.
  retriesUsed: number;
  // 런 리셋과 무관하게 누적되는 개인 최고 도달 스테이지. 리더보드 제출 값의 원천이다.
  bestStage: number;
  // 이번 런이 시작될 때의 bestStage 스냅샷. bestStage는 클리어할 때마다 갱신되므로,
  // "이번 런에서 기록을 경신했는가"를 판정하려면 갱신 전 값이 따로 필요하다.
  // 런 리셋 시점에만 현재 bestStage로 다시 찍힌다.
  bestStageAtRunStart: number;
}

const DEFAULT_RUN_STATE: RunState = {
  retriesUsed: 0,
  bestStage: 1,
  bestStageAtRunStart: 1,
};

function loadState(): RunState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RUN_STATE;

    const parsed = JSON.parse(raw);
    // useCurrency.loadProgress와 동일하게 타입뿐 아니라 값 범위까지 검사한다 —
    // 손상된 localStorage가 하한 없는 재시도나 음수 최고기록으로 이어지지 않도록.
    if (
      Number.isInteger(parsed?.retriesUsed) &&
      parsed.retriesUsed >= 0 &&
      Number.isInteger(parsed?.bestStage) &&
      parsed.bestStage >= 1
    ) {
      return {
        retriesUsed: parsed.retriesUsed,
        bestStage: parsed.bestStage,
        // 이 필드가 없던 시절(또는 손상된) 저장값은 bestStage로 되돌린다 —
        // 첫 런에서 "경신" 문구가 잘못 뜨지 않도록 보수적으로 잡는다.
        bestStageAtRunStart:
          Number.isInteger(parsed?.bestStageAtRunStart) &&
          parsed.bestStageAtRunStart >= 1
            ? parsed.bestStageAtRunStart
            : parsed.bestStage,
      };
    }
    return DEFAULT_RUN_STATE;
  } catch (error) {
    console.error("런 상태 불러오기 실패:", error);
    return DEFAULT_RUN_STATE;
  }
}

interface UseRunStateReturn {
  retriesUsed: number;
  maxRetries: number;
  canRetry: boolean;
  bestStage: number;
  bestStageAtRunStart: number;
  recordRetry: () => void;
  /** 런 리셋 — 재시도 카운트만 되돌린다. 스테이지 리셋은 호출부(useCurrency)가 담당. */
  resetRun: () => void;
  /** 도달 스테이지가 기존 최고기록을 넘으면 갱신한다. 넘지 못하면 no-op. */
  recordStage: (stage: number) => void;
}

export function useRunState(): UseRunStateReturn {
  const [state, setState] = useState<RunState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("런 상태 저장 실패:", error);
    }
  }, [state]);

  const recordRetry = useCallback(() => {
    setState((prev) => ({ ...prev, retriesUsed: prev.retriesUsed + 1 }));
  }, []);

  const resetRun = useCallback(() => {
    // 새 런의 기준선을 지금까지의 최고기록으로 다시 찍는다 — 다음 런의 "경신" 판정 기준.
    setState((prev) => ({
      ...prev,
      retriesUsed: 0,
      bestStageAtRunStart: prev.bestStage,
    }));
  }, []);

  const recordStage = useCallback((stage: number) => {
    setState((prev) =>
      stage > prev.bestStage ? { ...prev, bestStage: stage } : prev,
    );
  }, []);

  return {
    retriesUsed: state.retriesUsed,
    maxRetries: FREE_RETRIES_PER_RUN,
    canRetry: state.retriesUsed < FREE_RETRIES_PER_RUN,
    bestStage: state.bestStage,
    bestStageAtRunStart: state.bestStageAtRunStart,
    recordRetry,
    resetRun,
    recordStage,
  };
}

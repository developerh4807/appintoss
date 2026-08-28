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
  // [FIX 2026-08-28] 이번 런에서 광고 이어하기를 이미 썼는지. 무료 재시도(2회)를 모두
  // 소진한 뒤 쓸 수 있는 광고 이어하기는 "런당 1회"다(balance.ts FREE_RETRIES_PER_RUN
  // 주석의 "무료 2회 + 광고 1회" 계약). 예전엔 이 플래그가 없어 일일 상한(20회)에 걸리기
  // 전까지 한 런에서 광고를 무한히 이어할 수 있었다.
  adUsed: boolean;
  // 런 리셋과 무관하게 누적되는 개인 최고 도달 스테이지. 리더보드 제출 값의 원천이다.
  bestStage: number;
  // 이번 런이 시작될 때의 bestStage 스냅샷. bestStage는 클리어할 때마다 갱신되므로,
  // "이번 런에서 기록을 경신했는가"를 판정하려면 갱신 전 값이 따로 필요하다.
  // 런 리셋 시점에만 현재 bestStage로 다시 찍힌다.
  bestStageAtRunStart: number;
}

const DEFAULT_RUN_STATE: RunState = {
  retriesUsed: 0,
  adUsed: false,
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
      // [NEW 2026-08-12] 콜드 스타트 리셋 — useCurrency.loadProgress와 짝을 이룬다.
      // loadState가 다시 호출된다는 건 곧 stage가 1로 되돌아갔다는 뜻(위 주석 참고)이므로,
      // 여기서도 새 런이 시작된 것으로 취급해 retriesUsed를 0으로, bestStageAtRunStart를
      // 지금까지의 bestStage로 다시 찍는다 — resetRun()과 동일한 처리다.
      // bestStage(영구 최고기록)만은 그대로 복원한다.
      return {
        retriesUsed: 0,
        adUsed: false,
        bestStage: parsed.bestStage,
        bestStageAtRunStart: parsed.bestStage,
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
  /** 이번 런에서 광고 이어하기를 아직 안 썼는지(런당 1회). false면 광고 이어하기 불가. */
  canUseAdContinue: boolean;
  bestStage: number;
  bestStageAtRunStart: number;
  recordRetry: () => void;
  /** 광고 이어하기를 이번 런에 썼다고 기록한다 — 이후 canUseAdContinue가 false가 된다. */
  recordAdContinue: () => void;
  /** 런 리셋 — 재시도 카운트와 광고 사용 여부를 되돌린다. 스테이지 리셋은 호출부(useCurrency)가 담당. */
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

  const recordAdContinue = useCallback(() => {
    setState((prev) => ({ ...prev, adUsed: true }));
  }, []);

  const resetRun = useCallback(() => {
    // 새 런의 기준선을 지금까지의 최고기록으로 다시 찍는다 — 다음 런의 "경신" 판정 기준.
    setState((prev) => ({
      ...prev,
      retriesUsed: 0,
      adUsed: false,
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
    canUseAdContinue: !state.adUsed,
    bestStage: state.bestStage,
    bestStageAtRunStart: state.bestStageAtRunStart,
    recordRetry,
    recordAdContinue,
    resetRun,
    recordStage,
  };
}

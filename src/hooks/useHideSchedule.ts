import { useEffect, useRef, useState } from "react";

import {
  graceRatioForStage,
  HIDE_FLOOR_TILES,
  hideCapForRemaining,
} from "../game/balance";

// [NEW 2026-08-11] 순차 숨김 스케줄 — spec-pattern-match-difficulty.md AD-6/AD-7.
//
// 경과 시간은 인터벌로 직접 세지 않고 **타이머의 timeLeft에서 역산**한다.
// 자체 누적 방식은 정지/재개나 리렌더로 인터벌이 재생성될 때마다 누적이 흔들려
// grace 구간을 영영 넘지 못하는 문제가 있었다. timeLeft는 이미 백그라운드 정지를
// 처리하고 있으므로(AD-7) 여기서 파생하면 정지 공유가 공짜로 따라온다.
//
// timeLeft는 1초 해상도지만, 숨김은 "지금까지 몇 장이 숨겨져 있어야 하는가"를 계산해
// 따라잡는 방식이라 후반의 ~256ms 간격도 한 틱에 여러 장을 숨겨 총량이 유지된다.

interface UseHideScheduleParams {
  /** 이 스테이지에 숨김이 적용되는지(1~3 유예 구간은 false). */
  enabled: boolean;
  stage: number;
  /** 이번 스테이지의 실제 제한시간(시간 회복 보너스 포함). 스케줄은 이 값에 비례한다. */
  stageSeconds: number;
  /** 타이머 잔여 초. 이 값에서 경과를 역산한다. */
  timeLeft: number;
  /** 아직 매치되지 않은 타일 id들. 매치된 타일은 숨길 대상이 아니다. */
  activeIds: string[];
  /** 정지 중이면 스케줄도 멈춘다(백그라운드·클리어·실패). */
  isPaused: boolean;
}

/**
 * 시간이 지남에 따라 타일을 하나씩 숨긴다.
 *
 * 규칙 세 가지:
 * - **상한**: 남은 타일의 70%까지만 숨긴다(나머지는 항상 노출 → 실력으로 풀 수 있음).
 * - **하한**: 남은 타일이 4장 이하면 추가 숨김을 멈춘다. 상한만으로는 막바지에
 *   노출된 2장이 서로 다른 페어일 수 있어 순수 추측이 된다.
 * - **단조성**: 매치로 상한이 내려가도 이미 숨긴 타일은 되돌리지 않는다. 되돌리면
 *   맞출 때마다 타일이 다시 나타나 혼란스럽다.
 */
export function useHideSchedule({
  enabled,
  stage,
  stageSeconds,
  timeLeft,
  activeIds,
  isPaused,
}: UseHideScheduleParams): string[] {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  // 최신 값을 effect 안에서 읽기 위한 미러 — deps에 넣으면 매 매치마다 재실행된다.
  const activeIdsRef = useRef(activeIds);
  activeIdsRef.current = activeIds;

  // 스테이지가 바뀌면 처음부터 다시 시작한다.
  useEffect(() => {
    setHiddenIds([]);
  }, [stage]);

  useEffect(() => {
    if (!enabled || isPaused) return;

    const elapsedMs = (stageSeconds - timeLeft) * 1000;
    const graceMs = stageSeconds * 1000 * graceRatioForStage(stage);
    if (elapsedMs < graceMs) return;

    setHiddenIds((prev) => {
      const active = activeIdsRef.current;
      const remaining = active.length;
      if (remaining <= HIDE_FLOOR_TILES) return prev;

      // 이미 숨긴 것 중 아직 살아있는(매치 안 된) 것만 센다.
      const stillHidden = prev.filter((tileId) => active.includes(tileId));
      const cap = hideCapForRemaining(remaining);
      if (stillHidden.length >= cap) return prev;

      const candidates = active.filter((tileId) => !prev.includes(tileId));
      if (candidates.length === 0) return prev;

      // 스케줄 상 지금까지 몇 장이 숨겨져 있어야 하는지 계산해 따라잡는다 —
      // 한 틱에 한 장씩만 더하면 간격이 1초보다 짧은 후반 스테이지에서 뒤처진다.
      const intervalMs = Math.max(
        1,
        (stageSeconds * 1000 - graceMs) / Math.max(1, cap),
      );
      const due = Math.floor((elapsedMs - graceMs) / intervalMs) + 1;
      const toAdd = Math.max(0, Math.min(cap, due) - stillHidden.length);
      if (toAdd === 0) return prev;

      const picked: string[] = [];
      const pool = [...candidates];
      for (let i = 0; i < toAdd && pool.length > 0; i++) {
        const index = Math.floor(Math.random() * pool.length);
        picked.push(pool[index]);
        pool.splice(index, 1);
      }
      return [...prev, ...picked];
    });
  }, [enabled, isPaused, stage, stageSeconds, timeLeft]);

  return hiddenIds;
}

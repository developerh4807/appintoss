import { AdMob, MaxAdContentRating } from "@capacitor-community/admob";

import { USE_TEST_ADS } from "./adIds";

// [NEW 2026-08-21] AdMob 초기화 (4단계).
//
// 초기화는 앱 전체에서 한 번만 일어나야 한다 — 배너 훅과 보상형 훅이 각각
// 초기화하면 경합이 난다. 모듈 스코프 Promise로 단일화한다.
//
// ⚠️ 리스크 ①(Families 정책) 관련:
// 13세 미만 타겟으로 재분류되면 setTagForChildDirectedTreatment(true) +
// MaxAdContentRating.G 가 필요하다. 지금은 "13세 이상" 신고 기준이므로 G만 걸어
// 전체이용가 콘텐츠에 맞추고, 아동 대상 플래그는 켜지 않는다.
// 재분류 시 여기만 고치면 된다.

let initPromise: Promise<void> | null = null;

export function ensureAdMobInitialized(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = AdMob.initialize({
    // 테스트 모드에서는 실제 노출/클릭이 집계되지 않아 무효 트래픽 위험이 없다.
    initializeForTesting: USE_TEST_ADS,
    // IARC 전체이용가(3세)를 목표로 하므로 광고 콘텐츠도 G로 제한한다.
    maxAdContentRating: MaxAdContentRating.General,
    // 아동 대상 플래그는 켜지 않는다 — 타겟층을 "13세 이상"으로 신고했기 때문이다.
    // 재분류되면 여기를 true로 바꾼다(리스크 ①).
    tagForChildDirectedTreatment: false,
  })
    .catch((error) => {
      // 브라우저/데스크톱 등 네이티브 브릿지가 없는 환경에서는 실패가 정상이다.
      // 광고는 부가 기능이므로 게임을 막지 않고 조용히 미지원 처리한다.
      console.debug("AdMob 초기화 실패(웹 환경일 수 있음):", error);
      // 실패를 캐시해두면 재시도가 영영 막히므로 초기화 상태를 되돌린다.
      initPromise = null;
      throw error;
    });

  return initPromise;
}

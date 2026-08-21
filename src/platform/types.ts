// [NEW 2026-08-21] 플랫폼 어댑터 공통 인터페이스.
//
// 호출부는 `@platform` 하나만 import하고, 실제 구현은 Vite alias가 빌드 타임에
// toss/ 또는 android/ 로 확정한다. 런타임 분기(`if (platform === ...)`)를 쓰면
// 양쪽 구현이 모두 번들에 들어가 산출물 격리가 깨지므로 절대 하지 않는다.
// (docs/plans/android-port.md 2️⃣ "필수 제약" 참고)

/** 보상형 광고가 지급한 보상. 토스는 unitType/unitAmount를 그대로 준다. */
export interface Reward {
  unitType: string;
  unitAmount: number;
}

/** 전면/보상형 광고 훅의 반환 형태. 양 플랫폼이 이 모양을 지켜야 호출부가 안 바뀐다. */
export interface InAppAdsApi {
  isAdLoaded: boolean;
  isSupported: boolean;
  showAd: () => void;
  lastReward: Reward | null;
}

/** 배너 부착 결과. destroy()로 정리한다. */
export interface BannerHandle {
  destroy: () => void;
}

export interface BannerApi {
  isInitialized: boolean;
  attachBanner: (
    adGroupId: string,
    element: HTMLElement,
  ) => BannerHandle | undefined;
}

/** 공유 페이로드. 토스는 message, 웹은 Web Share API의 text로 매핑된다. */
export interface SharePayload {
  message: string;
}

/** 리더보드. Android는 로컬 최고기록만 다루므로 open()이 no-op일 수 있다. */
export interface LeaderboardApi {
  /** 점수를 제출한다. 실패는 전부 삼킨다 — 게임 흐름을 막아선 안 된다. */
  submitScore: (score: number) => Promise<void>;
  /** 순위 화면을 연다. 지원하지 않으면 false를 반환한다. */
  openLeaderboard: () => Promise<boolean>;
  /** 순위 화면을 띄울 수 있는 플랫폼인지. 버튼 노출 여부 판단에 쓴다. */
  canOpenLeaderboard: boolean;
}

/**
 * 하드웨어 뒤로가기 핸들러. 처리했으면 true, 앱을 종료해도 되면 false를 반환한다.
 * 토스에서는 토스 앱이 직접 처리하므로 구현이 no-op이다.
 */
export type BackHandler = () => boolean;

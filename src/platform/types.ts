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
  /**
   * 로드를 시도하는 중인지. isAdLoaded=false 하나로는 "아직 로딩 중"과
   * "로드에 실패함"이 구분되지 않아, 실패했는데도 버튼이 영원히 로딩 표시에
   * 머무는 문제가 생긴다(에뮬레이터 실측에서 확인).
   */
  isLoading: boolean;
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

/**
 * 광고 지면별 식별자. 토스는 콘솔에서 발급한 광고그룹 ID가 들어가고,
 * Android는 AdMob 광고단위를 adIds.ts에서 따로 고르므로 이 값을 쓰지 않는다
 * (계약을 맞추기 위한 자리표시자). 호출부는 어느 쪽인지 몰라도 된다.
 */
export interface AdGroupIds {
  banner: string;
  rewardedContinue: string;
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

/**
 * [NEW 2026-09-11] 분석 이벤트 카탈로그 — 그로스 1라운드 P0-1.
 *
 * 이름이 곧 계약이다: 토스 콘솔의 핵심지표·이벤트 차트가 이 log_name을 기준으로 쌓이므로
 * 이름을 바꾸면 과거 데이터와 끊긴다. 새 이벤트는 추가만 하고 기존 이름은 바꾸지 않는다.
 *
 * 파라미터는 원시값만 둔다(토스 Analytics가 전부 string으로 정규화한다). 유저 식별값·PII는
 * 절대 넣지 않는다 — 유저 구분은 SDK가 anonymous_key를 자동으로 붙인다.
 */
export interface AnalyticsEventMap {
  /** 런의 첫 타일 탭 — 앱을 연 게 아니라 실제로 플레이를 시작한 시점. 활성지표의 원천. */
  run_start: { best_stage: number };
  /** 스테이지 클리어. stage = 방금 클리어한 스테이지. */
  stage_clear: { stage: number };
  /** 컨티뉴 수단을 모두 소진해 결과 카드가 뜬 시점(런 종료). */
  run_over: { cleared_stage: number; new_record: boolean };
  /** 실패 후 이어하기를 실제로 쓴 시점. stage = 이어서 다시 하는 스테이지. */
  continue_used: { type: "free" | "ad" | "share"; stage: number };
  /** 광고가 실제로 노출된 시점(SDK 노출 이벤트 기준). */
  ad_shown: { format: "banner" | "rewarded" };
  /** "공유하고 한 판 더" 단계가 화면에 뜬 시점 — 공유 퍼널의 분모. */
  share_prompt_shown: { stage: number };
  /** 공유 리워드 시트에서 친구에게 실제로 공유를 보낸 시점(sendViral). */
  share_sent: { stage: number };
  /** 결과 카드의 일반 공유 버튼(FR-19, 보상 없음) 탭. 실제 전송 여부는 알 수 없다. */
  result_share_click: { cleared_stage: number };
  /** 결과 카드에서 랭킹 보기 탭. */
  leaderboard_open: { cleared_stage: number };
  /** 뽑기 1회. item = 뽑힌 아이템 종류. */
  gacha_pull: { item: string };
  /** 인벤토리에서 아이템 사용. */
  item_used: { kind: string };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

/** 화면 진입 기록용 이름. GameShell의 Screen과 1:1이다. */
export type AnalyticsScreenName = "puzzle" | "gacha";

/** 양 플랫폼 계측 어댑터가 지켜야 하는 시그니처. 실패는 어댑터가 전부 삼킨다. */
export type LogEventFn = <K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventMap[K],
) => void;
export type LogScreenFn = (name: AnalyticsScreenName) => void;

/** [NEW 2026-09-11] 공유 리워드(친구 초대) 시트의 결과 콜백 — PRD FR-20. */
export interface ShareRewardHandlers {
  /** 친구에게 공유를 보냈다. 한 번 열어서 여러 명에게 보내면 여러 번 올 수 있다. */
  onSent: () => void;
  /**
   * 시트가 닫혔다 — 오류로 닫힌 경우를 포함해 한 번 열면 정확히 한 번 불린다.
   * rewarded = 이번에 공유를 한 번이라도 보냈는지. 보상(이어하기) 지급은 여기서 한다.
   */
  onClose: (result: { rewarded: boolean }) => void;
}

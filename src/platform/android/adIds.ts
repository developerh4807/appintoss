// [NEW 2026-08-21] 구글 공식 테스트 광고 단위 ID.
// [개편 2026-08-28] 실 광고 ID를 소스에 커밋하지 않는다 — 빌드 타임에 env로 주입한다.
//
// 왜: repo가 public이라 실 ID가 소스에 있으면 그대로 공개된다. 광고 ID는 비밀번호가
// 아니라 식별자(어차피 APK를 뜯으면 보인다)지만, repo 소스에 실 ID를 남기지 않기 위해
// 값을 `.env.local`(gitignore됨)에서 읽는다. 소스에는 테스트 ID와 env 참조만 남는다.
//
// 출처(테스트 ID): https://developers.google.com/admob/android/test-ads

/** 구글 공식 테스트 광고 단위 ID. 실 ID가 주입되지 않았을 때의 폴백. */
export const TEST_AD_IDS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
} as const;

// 실 ID는 `.env.local`의 VITE_ADMOB_* 에서 온다(gitignore). 없으면 undefined.
const realBanner = import.meta.env.VITE_ADMOB_BANNER;
const realRewarded = import.meta.env.VITE_ADMOB_REWARDED;

/**
 * 실제로 광고에 쓸 ID.
 * 실 ID가 **둘 다** 주입됐을 때만 실 ID를 쓰고, 하나라도 비면 전부 테스트 ID로 떨어진다.
 * → "실 ID 하나 빠뜨리고 릴리스" 사고를 구조적으로 막는다.
 */
export const AD_IDS = {
  banner: realBanner || TEST_AD_IDS.banner,
  rewarded: realRewarded || TEST_AD_IDS.rewarded,
} as const;

/**
 * 테스트 모드 여부. AdMob.initialize(initializeForTesting)와 prepare/show(isTesting)에 쓴다.
 *
 * 기본은 "실 ID가 둘 다 주입됐으면 실 광고(false), 아니면 테스트 광고(true)"로 **자동 결정**한다.
 * 플래그를 손으로 뒤집을 필요가 없어 교체 실수가 없다.
 *
 * ⚠️ 실 ID로 실 광고를 개발 중 클릭하면 무효 트래픽으로 계정이 정지된다.
 * 실기기(삼성 RTL 등) 검증은 실 ID를 넣지 않은 상태(=테스트 광고)에서 한다.
 *
 * 명시적 오버라이드가 필요하면 VITE_ADMOB_USE_TEST=true/false 로 강제할 수 있다.
 */
const override = import.meta.env.VITE_ADMOB_USE_TEST;
export const USE_TEST_ADS =
  override === "true"
    ? true
    : override === "false"
      ? false
      : !(realBanner && realRewarded);

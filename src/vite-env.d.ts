/// <reference types="vite/client" />

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

// [NEW 2026-08-21] vite.config.ts 의 define 으로 주입되는 빌드 타임 상수.
declare const __PLATFORM__: "toss" | "android";

// [NEW 2026-08-28] AdMob 실 광고 ID (빌드 타임 주입, .env.local). 없으면 테스트 ID 폴백.
interface ImportMetaEnv {
  readonly VITE_ADMOB_BANNER?: string;
  readonly VITE_ADMOB_REWARDED?: string;
  /** "true"/"false"로 테스트 모드 강제. 미지정 시 실 ID 주입 여부로 자동 결정. */
  readonly VITE_ADMOB_USE_TEST?: string;
  // [NEW 2026-09-09] 앱인토스 광고그룹 ID. 토스 빌드는 vite.config.ts가 존재를
  // 검증하므로 사실상 필수지만, dev 서버는 통과시키므로 타입은 optional로 둔다.
  readonly VITE_TOSS_AD_BANNER?: string;
  readonly VITE_TOSS_AD_REWARDED_CONTINUE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

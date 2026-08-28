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
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

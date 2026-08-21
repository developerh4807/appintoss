/// <reference types="vite/client" />

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

// [NEW 2026-08-21] vite.config.ts 의 define 으로 주입되는 빌드 타임 상수.
declare const __PLATFORM__: "toss" | "android";

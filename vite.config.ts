import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// [NEW 2026-08-21] 플랫폼 어댑터 alias.
//
// `@platform`을 **빌드 타임 정적 해석**으로 한쪽에 확정한다. 런타임 if로 고르면
// 양쪽 구현이 모두 번들에 들어가 산출물 격리가 깨진다 —
// docs/plans/android-port.md 2️⃣ "필수 제약" 및 리스크 ③ 참고.
//
// 기본값이 toss인 이유: `granite dev`/`ait build`가 PLATFORM 없이 호출되므로
// 앱인토스 경로가 아무 설정 없이도 기존과 동일하게 동작해야 한다.
const platform = process.env.PLATFORM === "android" ? "android" : "toss";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@platform": fileURLToPath(
        new URL(`./src/platform/${platform}/index.ts`, import.meta.url),
      ),
    },
  },
  define: {
    // i18n 기본 언어 결정 등 순수 데이터 분기에만 쓴다. 구현 선택에는 쓰지 않는다.
    __PLATFORM__: JSON.stringify(platform),
  },
  server: {
    // 실기기 샌드박스 테스트: LAN에서 접근 가능하도록 모든 인터페이스에 바인딩
    host: true,
  },
});

import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import aitDevtools from "@apps-in-toss/devtools/unplugin";

// [NEW 2026-08-21] 플랫폼 어댑터 alias.
//
// `@platform`을 **빌드 타임 정적 해석**으로 한쪽에 확정한다. 런타임 if로 고르면
// 양쪽 구현이 모두 번들에 들어가 산출물 격리가 깨진다 —
// docs/plans/android-port.md 2️⃣ "필수 제약" 및 리스크 ③ 참고.
//
// 기본값이 toss인 이유: `granite dev`/`ait build`가 PLATFORM 없이 호출되므로
// 앱인토스 경로가 아무 설정 없이도 기존과 동일하게 동작해야 한다.
const platform = process.env.PLATFORM === "android" ? "android" : "toss";

/**
 * [NEW 2026-09-09] 토스 릴리스 빌드의 광고그룹 ID 검증.
 *
 * 왜 여기서 막나: src/platform/toss/adIds.ts 는 이제 폴백 없이 env 값을 그대로 쓴다.
 * 값이 비면 `undefined`가 광고 SDK로 넘어가 조용히 광고만 안 뜨는 번들이 만들어진다.
 * 예전엔 테스트 ID 폴백이 그 역할을 했지만, 그 폴백이 번들에 문자열로 남아 심사
 * 반려의 원인이 됐다(adIds.ts 주석 참고). 그래서 폴백 대신 **빌드를 실패시킨다** —
 * 잘못된 번들이 애초에 만들어지지 않는 쪽이 안전하다.
 *
 * 테스트 광고그룹 ID도 여기서 거른다. 소스에서 리터럴을 없앤 이상 테스트 ID가
 * 번들에 들어갈 경로는 `.env.local` 뿐인데, 그대로 두면 같은 사유로 또 반려된다.
 * (이 파일은 빌드 설정이라 번들에 포함되지 않으므로, 여기 있는 문자열은 안전하다.)
 */
function assertTossAdGroupIds(env: Record<string, string>) {
  const required = ["VITE_TOSS_AD_BANNER", "VITE_TOSS_AD_REWARDED_CONTINUE"];

  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `토스 릴리스 빌드에 광고그룹 ID가 없습니다: ${missing.join(", ")}\n` +
        `.env.local 에 앱인토스 콘솔에서 발급한 광고그룹 ID를 채우세요 ` +
        `(형식은 .env.local.example 참고).`,
    );
  }

  const testIds = required.filter((key) => env[key].startsWith("ait-ad-test"));
  if (testIds.length > 0) {
    throw new Error(
      `토스 릴리스 빌드에 테스트 광고그룹 ID가 들어 있습니다: ${testIds.join(", ")}\n` +
        `출시 번들에는 테스트 ID를 넣을 수 없습니다(심사 반려 사유). ` +
        `.env.local 을 실제 발급받은 ID로 바꾸세요.`,
    );
  }
}

export default defineConfig(({ command, mode }) => {
  // .env.local 은 process.env 에 자동으로 들어오지 않으므로 직접 읽는다.
  // (검증용으로만 쓴다 — 앱 코드로의 주입은 Vite가 알아서 한다.)
  const env = loadEnv(mode, process.cwd(), "VITE_");

  // dev 서버는 통과시킨다. 값이 없으면 광고가 안 뜰 뿐이고, 실기기 검증 중에
  // 광고 ID 때문에 개발이 막히는 편이 더 나쁘다. 막는 건 산출물이 나가는 빌드뿐이다.
  if (platform === "toss" && command === "build") {
    assertTossAdGroupIds(env);
  }

  return {
    plugins: [aitDevtools.vite(), react()],
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
  };
});

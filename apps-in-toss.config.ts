import { defineConfig } from "@apps-in-toss/web-framework/config";

// [MIGRATED 2026-09-08] SDK 3.x 마이그레이션으로 granite.config.ts 에서 이름이 바뀌었다.
// 3.x에서 사라진 것들:
//   - brand.displayName / brand.icon → 콘솔에서 관리한다(설정 파일에 두지 않는다)
//   - web 블록 → dev/build 커맨드는 package.json scripts 로 이동
//   - outdir → webBundleDir 로 개명
export default defineConfig({
  appName: "matchingking",
  brand: {
    primaryColor: "#BA68C8",
  },
  permissions: [],
  webBundleDir: "dist",
});

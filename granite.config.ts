import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "matchingking",
  brand: {
    displayName: "틀리면 끝, 동물찾기",
    primaryColor: "#BA68C8", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});

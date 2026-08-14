import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "matchingking",
  brand: {
    displayName: "틀리면 끝, 동물찾기",
    primaryColor: "#BA68C8", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    // 실기기 샌드박스 테스트용 — 맥의 LAN IP (Wi-Fi 바뀌면 다시 확인해서 갱신해야 함: `ipconfig getifaddr en0`)
    host: "172.30.1.6",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});

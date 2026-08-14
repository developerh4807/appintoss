import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 실기기 샌드박스 테스트: LAN에서 접근 가능하도록 모든 인터페이스에 바인딩
    host: true,
  },
});

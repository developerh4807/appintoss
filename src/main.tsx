import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// [UPDATED 2026-08-21] TDS Provider를 플랫폼 어댑터 뒤로 옮겼다.
// 토스는 TDSMobileAITProvider, Android는 toast/dialog 오버레이 호스트가 된다.
import { PlatformProvider } from "@platform";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlatformProvider>
      <App />
    </PlatformProvider>
  </StrictMode>,
);

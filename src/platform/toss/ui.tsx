/* eslint-disable react-refresh/only-export-components */
// 어댑터 barrel이라 컴포넌트와 TDS 재수출을 한 파일에 모은다 — HMR 경고는 무해하다.
import { Button, useDialog, useToast } from "@toss/tds-mobile";
import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import type { ReactNode } from "react";

import config from "../../../granite.config.ts";

// [MOVED 2026-08-21] TDS 컴포넌트를 어댑터 뒤로 감춘다. 토스 빌드는 TDS를 그대로 쓰고,
// Android 빌드는 같은 이름의 경량 자체 구현을 제공한다(리스크 ④).
export { Button, useDialog, useToast };

/** 앱 루트를 감싸는 플랫폼 Provider. 토스는 TDS Provider가 필요하다. */
export function PlatformProvider({ children }: { children: ReactNode }) {
  return (
    <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
      {children}
    </TDSMobileAITProvider>
  );
}

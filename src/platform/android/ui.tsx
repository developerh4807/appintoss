/* eslint-disable react-refresh/only-export-components */
// 어댑터 barrel이라 컴포넌트와 훅을 한 파일에 모은다 — HMR 경고는 무해하다.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";

import { colors, radius } from "../../theme";

// [NEW 2026-08-21] TDS 대체 경량 구현 (리스크 ④).
// 시각적 동등성은 목표가 아니다 — 게임 화면은 자체 스타일이고 TDS는 주변부에만 쓰인다.
// TDS와 동일한 호출 시그니처(Button props, toast.openToast, dialog.openAlert)만 지킨다.

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
  variant?: "primary" | "weak";
  disabled?: boolean;
  /** 로딩 중에는 라벨을 스피너 대신 점 표기로 바꾸고 입력을 막는다. */
  loading?: boolean;
  style?: CSSProperties;
}

export function Button({
  children,
  onClick,
  size = "medium",
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isWeak = variant === "weak";
  // 로딩 중 클릭은 disabled와 동일하게 막는다 — 광고 로드 중 중복 호출 방지.
  const isBlocked = disabled || loading;
  const padding = size === "small" ? "8px 14px" : "12px 20px";
  const fontSize = size === "small" ? "13px" : "15px";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBlocked}
      style={{
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: radius.sm,
        border: isWeak ? `1px solid ${colors.border}` : "none",
        background: isWeak ? colors.surfaceRaised : colors.primary,
        color: isWeak ? colors.inkSecondary : colors.inkPrimary,
        // disabled 상태를 색이 아니라 투명도로 표현해 어떤 variant든 일관되게 보인다.
        opacity: isBlocked ? 0.4 : 1,
        cursor: isBlocked ? "default" : "pointer",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {loading ? "· · ·" : children}
    </button>
  );
}

interface AlertOptions {
  title: string;
  description?: string;
}

interface OverlayApi {
  openToast: (message: string) => void;
  openAlert: (options: AlertOptions) => void;
}

const OverlayContext = createContext<OverlayApi | null>(null);

// Provider 밖에서 호출돼도 게임이 멈추면 안 되므로 콘솔 폴백을 둔다.
const FALLBACK: OverlayApi = {
  openToast: (message) => console.info("[toast]", message),
  openAlert: (options) => console.info("[alert]", options.title),
};

export function useToast(): { openToast: (message: string) => void } {
  const ctx = useContext(OverlayContext) ?? FALLBACK;
  return { openToast: ctx.openToast };
}

export function useDialog(): { openAlert: (options: AlertOptions) => void } {
  const ctx = useContext(OverlayContext) ?? FALLBACK;
  return { openAlert: ctx.openAlert };
}

const TOAST_DURATION_MS = 2200;

/** 앱 루트를 감싸는 플랫폼 Provider. toast/dialog 오버레이 호스트 역할을 한다. */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);

  const openToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      // 뒤에 온 토스트가 이미 덮어썼다면 그건 그대로 두고 이 타이머는 흘려보낸다.
      setToastMessage((current) => (current === message ? null : current));
    }, TOAST_DURATION_MS);
  }, []);

  const openAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options);
  }, []);

  const api = useMemo(
    () => ({ openToast, openAlert }),
    [openToast, openAlert],
  );

  return (
    <OverlayContext.Provider value={api}>
      {children}

      {toastMessage !== null && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: "72px",
            transform: "translateX(-50%)",
            maxWidth: "88%",
            padding: "12px 16px",
            borderRadius: radius.sm,
            background: "rgba(58, 50, 42, 0.94)",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 600,
            textAlign: "center",
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          {toastMessage}
        </div>
      )}

      {alertOptions !== null && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "320px",
              background: colors.surfaceRaised,
              borderRadius: radius.md,
              padding: "24px 20px 16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                color: colors.inkPrimary,
              }}
            >
              {alertOptions.title}
            </p>
            {alertOptions.description !== undefined && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "14px",
                  color: colors.inkSecondary,
                }}
              >
                {alertOptions.description}
              </p>
            )}
            <div style={{ marginTop: "20px" }}>
              <Button onClick={() => setAlertOptions(null)} style={{ width: "100%" }}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}

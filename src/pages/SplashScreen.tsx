import { useEffect, useState } from "react";
import { colors } from "../theme";

// mockups/key-splash.html 참고. 최소 600ms 노출(브랜드 모먼트 보장) 후 320ms 페이드아웃으로 전환.
const HOLD_MS = 800;
const FADE_MS = 320;

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => setFadingOut(true), HOLD_MS);
    return () => clearTimeout(holdTimer);
  }, []);

  useEffect(() => {
    if (!fadingOut) return;
    const fadeTimer = setTimeout(onFinished, FADE_MS);
    return () => clearTimeout(fadeTimer);
  }, [fadingOut, onFinished]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: colors.surfaceBase,
        opacity: fadingOut ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
      }}
    >
      <div
        style={{
          width: "112px",
          height: "112px",
          borderRadius: "999px",
          background: colors.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "56px",
          boxShadow: "0 8px 24px rgba(58,50,42,0.14)",
          marginBottom: "24px",
        }}
      >
        🐿️
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: colors.inkPrimary,
          marginBottom: "8px",
          letterSpacing: "-0.2px",
        }}
      >
        틀리면 끝, 동물찾기
      </div>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 500,
          color: colors.inkSecondary,
          marginBottom: "56px",
        }}
      >
        맞추는 즐거움
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "64px",
          display: "flex",
          gap: "8px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              background: colors.accent,
              animation: "splash-dot-pulse 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

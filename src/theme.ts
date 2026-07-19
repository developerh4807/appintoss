// DESIGN.md 토큰 그대로 반영 (status: final, 2026-07-19). 임의 변경 금지 — 색상은 스펙 문서가 진실.
export const colors = {
  primary: "#FFC93C",
  primaryPressed: "#E6A800",
  accent: "#0F6E6B",
  accentLight: "#DCEFEC",
  surfaceBase: "#FFF8EC",
  surfaceRaised: "#FFFFFF",
  inkPrimary: "#3A322A",
  inkSecondary: "#726858",
  border: "#EDE6D6",
  success: "#4CAF7D",
  error: "#FF6B5C",
  currencyGold: "#F2A93B",
  legendarySparkle: "#B98CE0",
} as const;

export const radius = {
  sm: "12px",
  md: "20px",
  pill: "999px",
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "24px",
  6: "32px",
  7: "40px",
} as const;

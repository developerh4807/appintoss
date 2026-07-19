import { colors } from "../theme";

export type GameTab = "puzzle" | "gacha";

interface BottomTabBarProps {
  active: GameTab;
  onChange: (tab: GameTab) => void;
}

const TABS: { tab: GameTab; label: string; glyph: string }[] = [
  { tab: "puzzle", label: "퍼즐", glyph: "🧩" },
  { tab: "gacha", label: "뽑기", glyph: "🎁" },
];

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <div
      style={{
        display: "flex",
        borderTop: `1px solid ${colors.border}`,
        background: colors.surfaceRaised,
      }}
    >
      {TABS.map(({ tab, label, glyph }) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              flex: 1,
              padding: "10px 0 14px",
              textAlign: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: isActive ? colors.accent : colors.inkSecondary,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "18px",
                marginBottom: "2px",
                width: "30px",
                height: "22px",
                lineHeight: "22px",
                borderRadius: "999px",
                background: isActive ? colors.accentLight : "transparent",
              }}
            >
              {glyph}
            </span>
            <div>{label}</div>
          </button>
        );
      })}
    </div>
  );
}

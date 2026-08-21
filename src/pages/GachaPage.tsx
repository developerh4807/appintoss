import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { itemDef, ITEM_ILLUSTRATIONS, ITEM_POOL, PULL_COST } from "../game/items";
import type { ItemType } from "../game/items";
import { colors } from "../theme";

const TOOLTIP_SEEN_KEY = "appintoss.puzzle.inventoryTooltipSeen";

type Segment = "gacha" | "inventory";

interface GachaPageProps {
  currency: number;
  items: Record<ItemType, number>;
  onPull: () => void;
  onPullAd: () => void;
  pullAdLoaded: boolean;
  pullAdSupported: boolean;
  /** 로드 시도 중인지 — 실패 상태와 구분해야 버튼이 영원히 "준비 중"에 머물지 않는다. */
  pullAdLoading: boolean;
  adCapCanWatch: boolean;
  onUseItem: (type: ItemType) => void;
  revealedItem: ItemType | null;
  onDismissReveal: () => void;
  onContinue: () => void;
}

export function GachaPage({
  currency,
  items,
  onPull,
  onPullAd,
  pullAdLoaded,
  pullAdSupported,
  pullAdLoading,
  adCapCanWatch,
  onUseItem,
  revealedItem,
  onDismissReveal,
  onContinue,
}: GachaPageProps) {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>("gacha");
  const [showTooltip, setShowTooltip] = useState(false);

  const totalItems =
    items.timeBoost + items.mismatchShield + items.doubleReward;

  useEffect(() => {
    if (segment !== "inventory" || totalItems === 0) return;
    if (localStorage.getItem(TOOLTIP_SEEN_KEY)) return;
    setShowTooltip(true);
  }, [segment, totalItems]);

  const dismissTooltip = () => {
    setShowTooltip(false);
    try {
      localStorage.setItem(TOOLTIP_SEEN_KEY, "1");
    } catch (error) {
      console.error("툴팁 확인 상태 저장 실패:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        position: "relative",
        background: colors.surfaceBase,
      }}
    >
      <div
        style={{
          padding: "20px 20px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.inkPrimary }}>
          {t("gacha.pull")}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: colors.surfaceRaised,
            borderRadius: "999px",
            padding: "8px 14px",
            boxShadow: "0 2px 8px rgba(58,50,42,0.08)",
            fontWeight: 700,
            color: colors.currencyGold,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ fontSize: "16px" }}>🪙</span>
          {currency}
        </div>
      </div>

      <div
        style={{
          margin: "0 20px 16px",
          background: colors.border,
          borderRadius: "999px",
          padding: "4px",
          display: "flex",
        }}
      >
        {(["gacha", "inventory"] as Segment[]).map((seg) => (
          <button
            key={seg}
            onClick={() => setSegment(seg)}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "13px",
              fontWeight: 700,
              padding: "8px 0",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: segment === seg ? colors.accent : "transparent",
              color: segment === seg ? colors.surfaceRaised : colors.inkSecondary,
            }}
          >
            {seg === "gacha" ? t("gacha.pull") : t("gacha.inventory")}
          </button>
        ))}
      </div>

      {segment === "gacha" ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "170px",
              height: "170px",
              borderRadius: "50%",
              background: `linear-gradient(180deg, ${colors.accent} 0%, #0c5754 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "60px",
              boxShadow: "0 8px 24px rgba(15,110,107,0.35)",
            }}
          >
            🎁
          </div>
          <div
            style={{
              fontSize: "15px",
              color: colors.inkSecondary,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {t("gacha.pullHint", { cost: PULL_COST })}
          </div>
          <button
            onClick={onPull}
            style={{
              width: "240px",
              background: colors.primary,
              color: colors.inkPrimary,
              fontWeight: 700,
              fontSize: "17px",
              borderRadius: "999px",
              padding: "16px 0",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t("gacha.pull")}
          </button>
          <button
            onClick={onPullAd}
            disabled={!pullAdSupported || !adCapCanWatch || !pullAdLoaded}
            style={{
              fontSize: "13px",
              color: colors.inkSecondary,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              opacity:
                !pullAdSupported || !adCapCanWatch || !pullAdLoaded ? 0.4 : 1,
            }}
          >
            {/* 로딩 중이면 "준비 중", 실패했으면 원래 라벨을 비활성 상태로 보여준다 —
                "준비 중"이 영원히 남으면 곧 될 것처럼 오해된다. */}
            {pullAdLoading ? t("gacha.adLoading") : t("gacha.pullFree")}
          </button>
        </div>
      ) : totalItems === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px" }}>🎒</div>
          <div style={{ fontSize: "15px", color: colors.inkSecondary, lineHeight: 1.5 }}>
            {t("gacha.emptyTitle")}
            <br />
            {t("gacha.emptyHint")}
          </div>
          <button
            onClick={() => setSegment("gacha")}
            style={{
              width: "200px",
              background: colors.primary,
              color: colors.inkPrimary,
              fontWeight: 700,
              fontSize: "17px",
              borderRadius: "999px",
              padding: "16px 0",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t("gacha.goPull")}
          </button>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            padding: "0 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflowY: "auto",
          }}
        >
          {ITEM_POOL.map((item) => {
            const count = items[item.type];
            if (count <= 0) return null;
            return (
              <button
                key={item.type}
                onClick={() => onUseItem(item.type)}
                style={{
                  background: colors.surfaceRaised,
                  borderRadius: "20px",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 2px 8px rgba(58,50,42,0.06)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: colors.accentLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  {ITEM_ILLUSTRATIONS[item.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: colors.inkPrimary }}>
                    {t(item.labelKey)}
                  </div>
                  <div style={{ fontSize: "12px", color: colors.inkSecondary, marginTop: "2px" }}>
                    {t(item.descriptionKey)}
                  </div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: colors.accent }}>
                  ×{count}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div
        style={{
          padding: "14px 20px 20px",
          background: colors.surfaceRaised,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={onContinue}
          style={{
            width: "100%",
            background: colors.primary,
            color: colors.inkPrimary,
            fontWeight: 700,
            fontSize: "16px",
            borderRadius: "999px",
            padding: "14px 0",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("gacha.startNextStage")}
        </button>
      </div>

      {showTooltip && (
        <div
          onClick={dismissTooltip}
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            right: "20px",
            background: colors.inkPrimary,
            color: colors.surfaceBase,
            borderRadius: "16px",
            padding: "14px 16px",
            fontSize: "13px",
            lineHeight: 1.5,
            cursor: "pointer",
          }}
        >
          {t("gacha.inventoryHint")}
        </div>
      )}

      {revealedItem && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(58,50,42,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "260px",
              background: colors.surfaceRaised,
              borderRadius: "24px",
              padding: "32px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "68px", marginBottom: "12px" }}>
              {ITEM_ILLUSTRATIONS[revealedItem]}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: colors.inkPrimary, marginBottom: "4px" }}>
              {t(itemDef(revealedItem).labelKey)}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: colors.inkSecondary,
                marginBottom: "18px",
                lineHeight: 1.5,
              }}
            >
              {t(itemDef(revealedItem).descriptionKey)}
            </div>
            <button
              onClick={() => {
                onDismissReveal();
                setSegment("inventory");
              }}
              style={{
                width: "100%",
                background: colors.accent,
                color: colors.surfaceRaised,
                fontWeight: 700,
                fontSize: "15px",
                borderRadius: "999px",
                padding: "12px 0",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t("gacha.checkInventory")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

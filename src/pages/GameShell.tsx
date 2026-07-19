import { useEffect, useRef, useState } from "react";
import { useToast } from "@toss/tds-mobile";

import type { GameTab } from "../components/BottomTabBar";
import { BottomTabBar } from "../components/BottomTabBar";
import { initialSecondsForStage } from "../game/balance";
import { itemDef, PULL_COST, rollItem } from "../game/items";
import type { ItemType } from "../game/items";
import { useCurrency } from "../hooks/useCurrency";
import { useDailyAdCap } from "../hooks/useDailyAdCap";
import { useInAppAds } from "../hooks/useInAppAds";
import { useInventory } from "../hooks/useInventory";
import { useStageTimer } from "../hooks/useStageTimer";
import { useTossBanner } from "../hooks/useTossBanner";
import { colors } from "../theme";
import { GachaPage } from "./GachaPage";
import { PuzzlePage } from "./PuzzlePage";

// TODO: 서비스를 출시하기 전에 앱인토스 콘솔에서 발급한 광고그룹ID로 변경해주세요.
const PULL_AD_ID = "ait-ad-test-rewarded-id";
const BANNER_AD_ID = "ait-ad-test-banner-id";

interface GameShellProps {
  onBack: () => void;
}

export function GameShell({ onBack }: GameShellProps) {
  const [tab, setTab] = useState<GameTab>("puzzle");
  const { currency, stage, clearStage, spendCurrency } = useCurrency();
  const { items, addItem, consumeItem } = useInventory();
  const [shieldActive, setShieldActive] = useState(false);
  const [doubleRewardActive, setDoubleRewardActive] = useState(false);
  const [revealedItem, setRevealedItem] = useState<ItemType | null>(null);
  const toast = useToast();
  const pullAd = useInAppAds(PULL_AD_ID);
  const adCap = useDailyAdCap();
  const timer = useStageTimer(initialSecondsForStage(stage));
  const banner = useTossBanner();
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!banner.isInitialized || !bannerRef.current) return;

    const attached = banner.attachBanner(BANNER_AD_ID, bannerRef.current, {
      variant: "expanded",
    });

    return () => {
      attached?.destroy();
    };
    // banner 객체 자체는 매 렌더 새로 생성되므로 deps에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner.isInitialized, banner.attachBanner]);

  const handlePull = () => {
    if (!spendCurrency(PULL_COST)) {
      toast.openToast(`재화가 부족해요. 뽑기에는 ${PULL_COST}개가 필요해요.`);
      return;
    }
    const rolled = rollItem();
    addItem(rolled);
    setRevealedItem(rolled);
  };

  const handlePullAd = () => {
    if (!adCap.canWatch) {
      toast.openToast("오늘의 광고 시청 횟수를 모두 사용했어요. 내일 다시 시도해 주세요.");
      return;
    }
    pullAd.showAd();
  };

  const handleUseItem = (type: ItemType) => {
    if (!consumeItem(type)) return;
    if (type === "timeBoost") {
      timer.addTime(5);
      toast.openToast("제한시간 +5초 추가!");
    } else if (type === "mismatchShield") {
      setShieldActive(true);
      toast.openToast("다음 오답은 페널티 없이 넘어가요.");
    } else if (type === "doubleReward") {
      setDoubleRewardActive(true);
      toast.openToast("다음 스테이지 클리어 보상이 2배가 돼요.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: colors.surfaceBase,
      }}
    >
      <button
        onClick={onBack}
        style={{
          alignSelf: "flex-start",
          margin: "8px 0 0 12px",
          background: "none",
          border: "none",
          color: colors.inkSecondary,
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        ← 홈으로
      </button>

      <div
        style={{
          display: tab === "puzzle" ? "flex" : "none",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <PuzzlePage
          currency={currency}
          stage={stage}
          clearStage={clearStage}
          timer={timer}
          shieldActive={shieldActive}
          onConsumeShield={() => setShieldActive(false)}
          doubleRewardActive={doubleRewardActive}
          onConsumeDoubleReward={() => setDoubleRewardActive(false)}
          adCap={adCap}
        />
      </div>

      <div
        style={{
          display: tab === "gacha" ? "flex" : "none",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <GachaPage
          currency={currency}
          items={items}
          onPull={handlePull}
          onPullAd={handlePullAd}
          pullAdLoaded={pullAd.isAdLoaded}
          pullAdSupported={pullAd.isSupported}
          adCapCanWatch={adCap.canWatch}
          onUseItem={handleUseItem}
          revealedItem={revealedItem}
          onDismissReveal={() => {
            if (revealedItem) {
              toast.openToast(`뽑기 성공: ${itemDef(revealedItem).label} 획득!`);
            }
            setRevealedItem(null);
          }}
        />
      </div>

      <div
        style={{
          margin: "0 20px 8px",
          background: colors.surfaceRaised,
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: colors.inkSecondary,
            background: "#F3EFE4",
            borderRadius: "6px",
            padding: "2px 6px",
          }}
        >
          광고
        </span>
        <div ref={bannerRef} style={{ flex: 1, height: "96px" }} />
      </div>

      <BottomTabBar active={tab} onChange={setTab} />
    </div>
  );
}

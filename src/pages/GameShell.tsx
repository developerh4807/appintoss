import { useEffect, useRef, useState } from "react";
import { useToast } from "@toss/tds-mobile";

import { initialSecondsForStage } from "../game/balance";
import { itemDef, PULL_COST, rollItem } from "../game/items";
import type { ItemType } from "../game/items";
import { scoreForRun, submitScore } from "../game/leaderboard";
import { useCurrency } from "../hooks/useCurrency";
import { useDailyAdCap } from "../hooks/useDailyAdCap";
import { useInAppAds } from "../hooks/useInAppAds";
import { useRunState } from "../hooks/useRunState";
import { useInventory } from "../hooks/useInventory";
import { useStageTimer } from "../hooks/useStageTimer";
import { useTossBanner } from "../hooks/useTossBanner";
import { colors } from "../theme";
import { GachaPage } from "./GachaPage";
import { PuzzlePage } from "./PuzzlePage";

// TODO: 서비스를 출시하기 전에 앱인토스 콘솔에서 발급한 광고그룹ID로 변경해주세요.
const PULL_AD_ID = "ait-ad-test-rewarded-id";
const BANNER_AD_ID = "ait-ad-test-banner-id";

type Screen = "puzzle" | "gacha";

export function GameShell() {
  // [UPDATED 2026-07-20] 하단 탭 제거 — 뽑기는 스테이지 클리어 다이얼로그의 분기로만 진입한다.
  // 타이머가 도는 스테이지 중엔 화면 전환 자체가 불가능해 "보이지 않는 동안 시간이 새는" 문제가 없다.
  const [screen, setScreen] = useState<Screen>("puzzle");
  const { currency, stage, addReward, advanceStage, resetStage, spendCurrency } =
    useCurrency();
  const { items, addItem, consumeItem } = useInventory();
  const [shieldActive, setShieldActive] = useState(false);
  const [doubleRewardActive, setDoubleRewardActive] = useState(false);
  const [revealedItem, setRevealedItem] = useState<ItemType | null>(null);
  const toast = useToast();
  const pullAd = useInAppAds(PULL_AD_ID);
  const adCap = useDailyAdCap();
  const runState = useRunState();
  const timer = useStageTimer(initialSecondsForStage(stage));
  const banner = useTossBanner();
  const bannerRef = useRef<HTMLDivElement>(null);

  // 배너는 뽑기 화면에서만 mount되므로 퍼즐 화면에서는 bannerRef.current가 null이고
  // attach 자체가 일어나지 않는다. screen을 deps에 넣어야 뽑기 화면 재진입 시
  // 새로 mount된 엘리먼트에 다시 attach된다(화면 전환 기반 — 주기적 refresh 아님).
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
  }, [banner.isInitialized, banner.attachBanner, screen]);

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

  // 뽑기 화면으로 이동만 할 뿐 스테이지/타이머는 건드리지 않는다 — 다음 스테이지 진행은
  // handleContinueToNextStage에서만 일어난다.
  const handleGoToGacha = () => setScreen("gacha");

  // "다음 스테이지" 버튼(퍼즐 클리어 다이얼로그)과 "다음 스테이지 시작하기" 버튼(뽑기 화면)의
  // 공통 진입점 — 여기서만 스테이지를 올린다. PuzzlePage가 이 시점에 (재)마운트되며 그때
  // 비로소 다음 스테이지 타이머가 시작된다.
  const handleContinueToNextStage = () => {
    // 최고 기록은 "클리어한" 스테이지 기준이다 — 여기서 stage+1(이제 막 진입하는 스테이지)을
    // 기록하면 한 번도 깬 적 없는 스테이지가 최고기록이 돼버린다.
    runState.recordStage(stage);
    advanceStage();
    setScreen("puzzle");
  };

  // [NEW 2026-08-11] 오락실 컨티뉴 — 무료 재시도 2회와 광고 1회를 모두 소진했을 때
  // 스테이지 1로 되돌리고 재시도 카운트를 리충한다. 재화·아이템은 유지된다.
  const handleRunReset = () => {
    // 리더보드 제출은 런이 끝나는 이 시점에만 한다 — 게임 프로필이 없으면
    // PROFILE_NOT_FOUND가 나므로 "플레이 완료 후 호출" 권고를 따른다.
    // 실패는 어댑터가 전부 삼키므로 await하지 않고 흘려보낸다(콘솔 미승인 상태에서도
    // 런 리셋이 지연 없이 진행돼야 한다).
    // 제출 기준은 bestStage(실제로 클리어한 최고 스테이지)다 — 이 시점의 stage는
    // "실패한 스테이지"라서 그대로 쓰면 점수가 한 단계 부풀려진다.
    void submitScore(scoreForRun(runState.bestStage));

    resetStage();
    runState.resetRun();
    // 아이템 효과는 런에 딸린 일시 상태라 함께 정리한다 — 실패한 런에서 켜둔 방패가
    // 새 런 1스테이지로 넘어가면 안 된다.
    setShieldActive(false);
    setDoubleRewardActive(false);
    setScreen("puzzle");
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
      {screen === "puzzle" ? (
        <PuzzlePage
          currency={currency}
          stage={stage}
          onReward={addReward}
          onAdvanceStage={handleContinueToNextStage}
          onGoToGacha={handleGoToGacha}
          timer={timer}
          shieldActive={shieldActive}
          onConsumeShield={() => setShieldActive(false)}
          doubleRewardActive={doubleRewardActive}
          onConsumeDoubleReward={() => setDoubleRewardActive(false)}
          adCap={adCap}
          runState={runState}
          onRunReset={handleRunReset}
        />
      ) : (
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
          onContinue={handleContinueToNextStage}
        />
      )}

      {/* [UPDATED 2026-08-11] 타이머가 도는 퍼즐 화면에서는 배너를 아예 mount하지 않는다.
          CSS로 숨기는 방식은 토스 정책상 금지(광고를 인지하기 어렵게 만드는 행위)이므로
          반드시 DOM에서 제거하는 형태여야 한다. 재노출은 화면 전환 시에만 일어나며,
          타이머·인터벌 기반 재attach(광고 Refresh)는 트래픽 조작으로 금지돼 있다. */}
      {screen === "gacha" && (
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
      )}
    </div>
  );
}

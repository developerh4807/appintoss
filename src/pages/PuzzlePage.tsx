import { share } from "@apps-in-toss/web-framework";
import { Button, useDialog } from "@toss/tds-mobile";
import { useEffect, useRef, useState } from "react";

import {
  CRITICAL_TIME_RATIO,
  initialSecondsForStage,
  MISMATCH_PENALTY_SECONDS,
} from "../game/balance";
import { openLeaderboard, scoreForRun, tierForStage } from "../game/leaderboard";
import { generateBoard, isMatch } from "../game/patternMatch";
import type { Tile } from "../game/patternMatch";
import { useInAppAds } from "../hooks/useInAppAds";
import type { UseStageTimerReturn } from "../hooks/useStageTimer";
import { colors } from "../theme";

const CLEAR_REWARD = 10;
const MISMATCH_DELAY_MS = 500;
const COLUMNS = 4;
// 타이머 게이지의 CSS 전환 시간(1s linear, 아래 timer-track 참고)과 맞춘 지연 —
// 게이지가 시각적으로 완전히 비기 전에 "시간이 다 됐어요" 배너가 먼저 뜨는 걸 방지한다.
const FAILURE_BANNER_DELAY_MS = 1000;
// TODO: 서비스를 출시하기 전에 앱인토스 콘솔에서 발급한 광고그룹ID로 변경해주세요.
const CONTINUE_AD_ID = "ait-ad-test-rewarded-id";

interface RunState {
  retriesUsed: number;
  maxRetries: number;
  canRetry: boolean;
  bestStage: number;
  bestStageAtRunStart: number;
  recordRetry: () => void;
}

interface PuzzlePageProps {
  currency: number;
  stage: number;
  onReward: (reward: number) => void;
  onAdvanceStage: () => void;
  onGoToGacha: () => void;
  timer: UseStageTimerReturn;
  shieldActive: boolean;
  onConsumeShield: () => void;
  doubleRewardActive: boolean;
  onConsumeDoubleReward: () => void;
  adCap: { canWatch: boolean; recordWatch: () => void };
  runState: RunState;
  onRunReset: () => void;
}

export function PuzzlePage({
  currency,
  stage,
  onReward,
  onAdvanceStage,
  onGoToGacha,
  timer,
  shieldActive,
  onConsumeShield,
  doubleRewardActive,
  onConsumeDoubleReward,
  adCap,
  runState,
  onRunReset,
}: PuzzlePageProps) {
  const [board, setBoard] = useState<Tile[]>(() => generateBoard(stage));
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Tile[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [showPenalty, setShowPenalty] = useState(false);
  const [showFailureBanner, setShowFailureBanner] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [clearedReward, setClearedReward] = useState(0);
  const dialog = useDialog();
  const continueAd = useInAppAds(CONTINUE_AD_ID);
  const clearedRef = useRef(false);
  const thresholdAnnouncedRef = useRef(false);
  const failureAnnouncedRef = useRef(false);
  const handledRewardRef = useRef<typeof continueAd.lastReward>(null);

  const cleared = matchedIds.length === board.length;
  const failed = timer.isExpired && !cleared;
  // 결과 카드는 전부 "클리어한" 스테이지 기준으로 말한다. 런이 끝나는 시점의 `stage`는
  // 실패한(=클리어 못 한) 스테이지라 그대로 쓰면 "도달 2 / 1,000점"처럼 표시가 어긋나고,
  // 스테이지 2에서 처음 죽어도 매번 "기록 경신"이 뜬다.
  const clearedStage = runState.bestStage;
  const isNewRecord = clearedStage > runState.bestStageAtRunStart;
  const tier = tierForStage(clearedStage);

  useEffect(() => {
    setBoard(generateBoard(stage));
    setMatchedIds([]);
    setSelected([]);
    setWrongIds([]);
    setShowPenalty(false);
    setShowFailureBanner(false);
    setAnnouncement("");
    clearedRef.current = false;
    thresholdAnnouncedRef.current = false;
    failureAnnouncedRef.current = false;
    timer.reset(initialSecondsForStage(stage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (selected.length < 2) return;

    const [first, second] = selected;
    if (isMatch(first, second)) {
      setMatchedIds((prev) => [...prev, first.id, second.id]);
      setSelected([]);
      return;
    }

    setWrongIds([first.id, second.id]);
    if (shieldActive) {
      onConsumeShield();
    } else {
      timer.applyPenalty(MISMATCH_PENALTY_SECONDS);
      setShowPenalty(true);
    }
    const delayTimer = setTimeout(() => {
      setSelected([]);
      setWrongIds([]);
      setShowPenalty(false);
    }, MISMATCH_DELAY_MS);
    return () => clearTimeout(delayTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // [FIXED 2026-07-20] 재화는 클리어 즉시 지급하지만, 스테이지(및 다음 스테이지 타이머)는
  // 여기서 자동으로 넘기지 않는다 — 예전엔 여기서 바로 stage를 올려 다음 스테이지 타이머가
  // "스테이지 클리어!" 알림이 떠 있는 동안에도 몰래 돌고 있었다. 지금은 아래 다이얼로그에서
  // 플레이어가 "다음 스테이지" 또는 "뽑으러 가기"를 실제로 선택해야만 진행된다.
  useEffect(() => {
    if (cleared && !clearedRef.current) {
      clearedRef.current = true;
      const reward = doubleRewardActive ? CLEAR_REWARD * 2 : CLEAR_REWARD;
      if (doubleRewardActive) onConsumeDoubleReward();
      setClearedReward(reward);
      onReward(reward);
      timer.setPaused(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleared]);

  // [FIXED 2026-07-22] "시간이 다 됐어요" 배너는 타이머 게이지의 1초짜리 CSS 전환이 끝난
  // 뒤에 뜬다 — 예전엔 timeLeft가 0이 되는 즉시 떴는데, 그 순간 게이지는 아직 이전 값에서
  // 0%로 애니메이션 중이라 "게이지가 덜 빠졌는데 실패 창이 뜬다"는 인상을 줬다.
  useEffect(() => {
    if (!failed) {
      setShowFailureBanner(false);
      return;
    }
    const bannerTimer = setTimeout(
      () => setShowFailureBanner(true),
      FAILURE_BANNER_DELAY_MS,
    );
    return () => clearTimeout(bannerTimer);
  }, [failed]);

  useEffect(() => {
    if (cleared) return;

    if (timer.timeLeft === 0 && !failureAnnouncedRef.current) {
      failureAnnouncedRef.current = true;
      setAnnouncement("시간이 다 됐어요. 스테이지에 실패했어요.");
      return;
    }

    const ratio = timer.timeLeft / initialSecondsForStage(stage);
    if (
      ratio > 0 &&
      ratio <= CRITICAL_TIME_RATIO &&
      !thresholdAnnouncedRef.current
    ) {
      thresholdAnnouncedRef.current = true;
      setAnnouncement("시간이 얼마 남지 않았어요.");
    }
  }, [timer.timeLeft, cleared, stage]);

  useEffect(() => {
    if (
      continueAd.lastReward &&
      continueAd.lastReward !== handledRewardRef.current
    ) {
      handledRewardRef.current = continueAd.lastReward;
      adCap.recordWatch();
      failureAnnouncedRef.current = false;
      thresholdAnnouncedRef.current = false;
      setAnnouncement("");
      timer.reset(initialSecondsForStage(stage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueAd.lastReward, stage]);

  const handleTap = (tile: Tile) => {
    if (failed || cleared) return;
    if (wrongIds.length > 0) return;
    if (matchedIds.includes(tile.id)) return;

    if (selected.some((t) => t.id === tile.id)) {
      setSelected((prev) => prev.filter((t) => t.id !== tile.id));
      return;
    }

    if (selected.length >= 2) return;
    setSelected((prev) => [...prev, tile]);
  };

  const handleFreeRetry = () => {
    if (!runState.canRetry) return;
    runState.recordRetry();
    setBoard(generateBoard(stage));
    setMatchedIds([]);
    setSelected([]);
    setWrongIds([]);
    failureAnnouncedRef.current = false;
    thresholdAnnouncedRef.current = false;
    setAnnouncement("");
    timer.reset(initialSecondsForStage(stage));
  };

  const handleShare = () => {
    share({
      message: `${tier.icon} 반응속도 ${tier.label}! 스테이지 ${clearedStage}까지 클리어했어요. 같이 맞춰볼래요?`,
    }).catch((error) => {
      console.error("공유 실패:", error);
    });
  };

  // 리더보드 웹뷰를 열면 미니앱이 백그라운드로 전환된다. 이 시점엔 이미 타이머가
  // 만료된 런 종료 상태라 진행 중인 상태가 없어 별도 저장/일시정지가 필요 없다.
  const handleOpenLeaderboard = () => {
    void openLeaderboard();
  };

  const handleContinueAd = () => {
    if (!adCap.canWatch) {
      dialog.openAlert({
        title: "오늘의 광고 시청 횟수를 모두 사용했어요",
        description: "내일 다시 시도해 주세요.",
      });
      return;
    }
    continueAd.showAd();
  };

  const timeRatio = Math.max(
    0,
    Math.min(1, timer.timeLeft / initialSecondsForStage(stage)),
  );
  const isCritical = timeRatio <= CRITICAL_TIME_RATIO;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        position: "relative",
      }}
    >
      <div
        aria-live="assertive"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {announcement}
      </div>

      <div style={{ padding: "20px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.inkPrimary }}>
              패턴매칭 퍼즐
            </h1>
            <div style={{ fontSize: "13px", color: colors.inkSecondary, fontWeight: 500, marginTop: "2px" }}>
              스테이지 {stage}
            </div>
          </div>
          {/* [UPDATED 2026-08-11] 🎒 즉시사용 버튼 제거 — 아이템은 뽑기 화면(GachaPage
              인벤토리 탭)에서 다음 스테이지 시작 전에만 쓴다. 타이머가 도는 도중에도
              즉시 사용이 가능하면 "스테이지 시작 전에 미리 장착"하는 전략 구상이 흐려진다. */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "16px" }}>🪙</span>
              {currency}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "14px" }}>
          <div
            style={{
              flex: 1,
              height: "20px",
              borderRadius: "999px",
              background: colors.border,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${timeRatio * 100}%`,
                background: isCritical ? colors.error : colors.accent,
                borderRadius: "999px",
                boxShadow: isCritical ? "0 0 16px 4px rgba(255,107,92,0.6)" : "none",
                transition: "width 1s linear, background-color 0.3s",
              }}
            />
          </div>
          {isCritical ? (
            <div
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: colors.inkPrimary,
                background: colors.surfaceRaised,
                border: `2px solid ${colors.error}`,
                borderRadius: "999px",
                padding: "2px 12px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {timer.timeLeft}
            </div>
          ) : (
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: colors.accent,
                fontVariantNumeric: "tabular-nums",
                minWidth: "46px",
                textAlign: "right",
              }}
            >
              {timer.timeLeft}
            </div>
          )}
        </div>
      </div>

      {showFailureBanner && (
        <div
          style={{
            margin: "0 20px 16px",
            padding: "16px",
            borderRadius: "20px",
            background: colors.surfaceRaised,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {!runState.canRetry && (!continueAd.isSupported || !adCap.canWatch) ? (
            // 컨티뉴 수단을 모두 소진 — 오락실처럼 런이 끝나고 스테이지 1로 돌아간다.
            // 재화·아이템은 유지되므로 다음 런은 더 유리하게 시작할 수 있다.
            // [NEW 2026-08-11] FR-18 결과 카드 — 런이 끝나는 이 지점이 성과를 보여주고
            // 공유를 유도하기에 가장 자연스러운 순간이다.
            // 실제 등수는 표시하지 않는다: 공식 리더보드 API에 순위를 조회하는 수단이
            // 없어서(openGameCenterLeaderboard는 웹뷰를 띄우기만 함) 등수를 알 방법이
            // 없다. 대신 로컬 최고기록 비교와 동물 티어로 성취감을 표현하고,
            // 전체 순위는 "랭킹 보기"로 토스 웹뷰에 위임한다.
            <>
              <div style={{ fontWeight: 700, color: colors.inkPrimary }}>런 종료</div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "16px",
                  background: colors.surfaceBase,
                }}
              >
                <span style={{ fontSize: "34px", lineHeight: 1 }} aria-hidden="true">
                  {tier.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "17px", fontWeight: 700, color: colors.inkPrimary }}>
                    {tier.label}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.inkSecondary,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    스테이지 {clearedStage} 클리어 · {scoreForRun(clearedStage).toLocaleString()}점
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "13px", color: colors.inkSecondary, lineHeight: 1.5 }}>
                {isNewRecord ? (
                  <strong>최고 기록을 경신했어요!</strong>
                ) : (
                  // 경신 못 했으면 기존 기록을 보여준다. clearedStage와 bestStage는 같은 값이라
                  // 여기서 bestStage를 쓰면 방금 말한 숫자를 되풀이하게 되므로 런 시작 시점 값을 쓴다.
                  <>최고 기록은 스테이지 {runState.bestStageAtRunStart}예요.</>
                )}
                <br />
                모아둔 재화와 아이템은 그대로 남아 있어요.
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button size="small" variant="weak" onClick={handleShare}>
                  공유하기
                </Button>
                <Button size="small" variant="weak" onClick={handleOpenLeaderboard}>
                  랭킹 보기
                </Button>
                <Button size="small" onClick={onRunReset}>
                  다시 도전
                </Button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, color: colors.inkPrimary }}>시간이 다 됐어요!</div>
              <div style={{ fontSize: "12px", color: colors.inkSecondary }}>
                이번 런 무료 재시도 {runState.retriesUsed}/{runState.maxRetries}회 사용
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  size="small"
                  variant="weak"
                  disabled={!runState.canRetry}
                  onClick={handleFreeRetry}
                >
                  무료로 재시도
                </Button>
                <Button
                  size="small"
                  loading={!continueAd.isAdLoaded}
                  disabled={!continueAd.isSupported || !adCap.canWatch}
                  onClick={handleContinueAd}
                >
                  광고 보고 이어하기
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
          gap: "12px",
          padding: "8px 20px 20px",
          alignContent: "start",
          position: "relative",
          opacity: failed ? 0.4 : 1,
          pointerEvents: failed ? "none" : "auto",
        }}
      >
        {showPenalty && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "20px",
              fontSize: "13px",
              fontWeight: 700,
              color: colors.inkPrimary,
              background: colors.surfaceRaised,
              border: `2px solid ${colors.error}`,
              borderRadius: "999px",
              padding: "1px 9px",
            }}
          >
            −{MISMATCH_PENALTY_SECONDS}
          </span>
        )}
        {board.map((tile) => {
          const isSelected = selected.some((t) => t.id === tile.id);
          const isWrong = wrongIds.includes(tile.id);
          const isMatched = matchedIds.includes(tile.id);

          return (
            <button
              key={tile.id}
              onClick={() => handleTap(tile)}
              style={{
                aspectRatio: "1",
                fontSize: "30px",
                borderRadius: "20px",
                border: isSelected ? `2px solid ${colors.accent}` : "none",
                background: isWrong
                  ? colors.error
                  : isSelected
                    ? colors.accentLight
                    : colors.surfaceRaised,
                boxShadow: "0 2px 8px rgba(58,50,42,0.06)",
                opacity: isMatched ? 0.15 : 1,
                cursor: isMatched ? "default" : "pointer",
              }}
            >
              {tile.icon}
            </button>
          );
        })}
      </div>

      {cleared && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(58,50,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "280px",
              background: colors.surfaceRaised,
              borderRadius: "20px",
              padding: "24px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "20px", fontWeight: 700, color: colors.inkPrimary, marginBottom: "8px" }}>
              스테이지 클리어!
            </div>
            <div style={{ fontSize: "15px", color: colors.inkSecondary, marginBottom: "20px", lineHeight: 1.5 }}>
              재화 {clearedReward}개를 획득했어요.
            </div>
            <button
              onClick={onAdvanceStage}
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
                marginBottom: "8px",
              }}
            >
              다음 스테이지
            </button>
            <button
              onClick={onGoToGacha}
              style={{
                width: "100%",
                background: colors.accent,
                color: colors.surfaceRaised,
                fontWeight: 700,
                fontSize: "16px",
                borderRadius: "999px",
                padding: "14px 0",
                border: "none",
                cursor: "pointer",
              }}
            >
              뽑으러 가기 🎁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

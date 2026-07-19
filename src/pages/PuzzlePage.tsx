import { Button, useDialog } from "@toss/tds-mobile";
import { useEffect, useRef, useState } from "react";

import {
  CRITICAL_TIME_RATIO,
  initialSecondsForStage,
  MAX_FREE_RETRIES,
  MISMATCH_PENALTY_SECONDS,
} from "../game/balance";
import { generateBoard, isMatch } from "../game/patternMatch";
import type { Tile } from "../game/patternMatch";
import { useInAppAds } from "../hooks/useInAppAds";
import type { UseStageTimerReturn } from "../hooks/useStageTimer";
import { colors } from "../theme";

const CLEAR_REWARD = 10;
const MISMATCH_DELAY_MS = 500;
const COLUMNS = 4;
// TODO: 서비스를 출시하기 전에 앱인토스 콘솔에서 발급한 광고그룹ID로 변경해주세요.
const CONTINUE_AD_ID = "ait-ad-test-rewarded-id";

interface PuzzlePageProps {
  currency: number;
  stage: number;
  clearStage: (reward: number) => void;
  timer: UseStageTimerReturn;
  shieldActive: boolean;
  onConsumeShield: () => void;
  doubleRewardActive: boolean;
  onConsumeDoubleReward: () => void;
  adCap: { canWatch: boolean; recordWatch: () => void };
}

export function PuzzlePage({
  currency,
  stage,
  clearStage,
  timer,
  shieldActive,
  onConsumeShield,
  doubleRewardActive,
  onConsumeDoubleReward,
  adCap,
}: PuzzlePageProps) {
  const [board, setBoard] = useState<Tile[]>(() => generateBoard(stage));
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Tile[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [showPenalty, setShowPenalty] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const dialog = useDialog();
  const continueAd = useInAppAds(CONTINUE_AD_ID);
  const clearedRef = useRef(false);
  const thresholdAnnouncedRef = useRef(false);
  const failureAnnouncedRef = useRef(false);
  const handledRewardRef = useRef<typeof continueAd.lastReward>(null);

  const cleared = matchedIds.length === board.length;
  const failed = timer.isExpired && !cleared;

  useEffect(() => {
    setBoard(generateBoard(stage));
    setMatchedIds([]);
    setSelected([]);
    setWrongIds([]);
    setShowPenalty(false);
    setRetryCount(0);
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

  useEffect(() => {
    if (cleared && !clearedRef.current) {
      clearedRef.current = true;
      const reward = doubleRewardActive ? CLEAR_REWARD * 2 : CLEAR_REWARD;
      if (doubleRewardActive) onConsumeDoubleReward();
      clearStage(reward);
      dialog.openAlert({
        title: "스테이지 클리어!",
        description: `재화 ${reward}개를 획득했어요. 다음 스테이지로 이동할게요.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleared]);

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
    if (failed) return;
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
    if (retryCount >= MAX_FREE_RETRIES) return;
    setRetryCount((count) => count + 1);
    setBoard(generateBoard(stage));
    setMatchedIds([]);
    setSelected([]);
    setWrongIds([]);
    failureAnnouncedRef.current = false;
    thresholdAnnouncedRef.current = false;
    setAnnouncement("");
    timer.reset(initialSecondsForStage(stage));
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
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
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

      {failed && (
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
          <div style={{ fontWeight: 700, color: colors.inkPrimary }}>시간이 다 됐어요!</div>
          <div style={{ fontSize: "12px", color: colors.inkSecondary }}>
            무료 재시도 {retryCount}/{MAX_FREE_RETRIES}회 사용
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              size="small"
              variant="weak"
              disabled={retryCount >= MAX_FREE_RETRIES}
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
    </div>
  );
}

import { colors } from "@toss/tds-colors";
import { Button, TextButton, Top, useDialog } from "@toss/tds-mobile";
import { useEffect, useRef, useState } from "react";

import {
  CRITICAL_TIME_RATIO,
  initialSecondsForStage,
  MAX_FREE_RETRIES,
  MISMATCH_PENALTY_SECONDS,
} from "../game/balance";
import { generateBoard, isMatch } from "../game/patternMatch";
import type { Tile } from "../game/patternMatch";
import { useCurrency } from "../hooks/useCurrency";
import { useInAppAds } from "../hooks/useInAppAds";
import { useStageTimer } from "../hooks/useStageTimer";

const CLEAR_REWARD = 10;
const MISMATCH_DELAY_MS = 500;
// TODO: 서비스를 출시하기 전에 앱인토스 콘솔에서 발급한 광고그룹ID로 변경해주세요.
const CONTINUE_AD_ID = "ait-ad-test-rewarded-id";

interface PuzzlePageProps {
  onBack: () => void;
}

export function PuzzlePage({ onBack }: PuzzlePageProps) {
  const { currency, stage, clearStage } = useCurrency();
  const [board, setBoard] = useState<Tile[]>(() => generateBoard(stage));
  const [selected, setSelected] = useState<Tile[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const dialog = useDialog();
  const continueAd = useInAppAds(CONTINUE_AD_ID);
  const timer = useStageTimer(initialSecondsForStage(stage));
  const clearedRef = useRef(false);
  const thresholdAnnouncedRef = useRef(false);
  const failureAnnouncedRef = useRef(false);
  const handledRewardRef = useRef<typeof continueAd.lastReward>(null);

  const failed = timer.isExpired && board.length > 0;

  useEffect(() => {
    setBoard(generateBoard(stage));
    setSelected([]);
    setWrongIds([]);
    setRetryCount(0);
    setAnnouncement("");
    clearedRef.current = false;
    thresholdAnnouncedRef.current = false;
    failureAnnouncedRef.current = false;
    // timer.reset은 stage가 바뀔 때만 호출하면 되고, timer 객체 자체는 매 렌더 새로 생성돼
    // deps에 넣으면 의도와 다르게 매번 재실행된다 — useCurrency의 기존 exhaustive-deps 억제 패턴과 동일.
    timer.reset(initialSecondsForStage(stage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (selected.length < 2) return;

    const [first, second] = selected;
    if (isMatch(first, second)) {
      setBoard((prev) =>
        prev.filter((tile) => tile.id !== first.id && tile.id !== second.id),
      );
      setSelected([]);
      return;
    }

    setWrongIds([first.id, second.id]);
    timer.applyPenalty(MISMATCH_PENALTY_SECONDS);
    const delayTimer = setTimeout(() => {
      setSelected([]);
      setWrongIds([]);
    }, MISMATCH_DELAY_MS);
    return () => clearTimeout(delayTimer);
    // timer.applyPenalty는 매 렌더 새로 생성되는 함수라 deps에 넣지 않는다(위와 동일 사유).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    if (board.length === 0 && !clearedRef.current) {
      clearedRef.current = true;
      clearStage(CLEAR_REWARD);
      dialog.openAlert({
        title: "스테이지 클리어!",
        description: `재화 ${CLEAR_REWARD}개를 획득했어요. 다음 스테이지로 이동할게요.`,
      });
    }
    // clearStage/dialog intentionally excluded: clearedRef already guards
    // against re-firing, and both are stable across the tiles-remaining check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  useEffect(() => {
    if (board.length === 0) return;

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
  }, [timer.timeLeft, board.length, stage]);

  useEffect(() => {
    if (
      continueAd.lastReward &&
      continueAd.lastReward !== handledRewardRef.current
    ) {
      handledRewardRef.current = continueAd.lastReward;
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
    setSelected([]);
    setWrongIds([]);
    failureAnnouncedRef.current = false;
    thresholdAnnouncedRef.current = false;
    setAnnouncement("");
    timer.reset(initialSecondsForStage(stage));
  };

  const columns = board.length > 12 ? 4 : 3;
  const timeRatio = Math.max(
    0,
    Math.min(1, timer.timeLeft / initialSecondsForStage(stage)),
  );
  const isCritical = timeRatio <= CRITICAL_TIME_RATIO;

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>패턴매칭 퍼즐</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            스테이지 {stage} · 재화 {currency}
          </Top.SubtitleParagraph>
        }
      />

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

      <div style={{ padding: "0 24px" }}>
        <div
          style={{
            height: "20px",
            borderRadius: "999px",
            background: colors.grey100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${timeRatio * 100}%`,
              background: isCritical ? colors.red500 : colors.blue500,
              transition: "width 1s linear, background-color 0.3s",
            }}
          />
        </div>
        <div style={{ marginTop: "4px", fontSize: "14px", color: colors.grey700 }}>
          남은 시간 {timer.timeLeft}초
        </div>
      </div>

      {failed && (
        <div
          style={{
            margin: "16px 24px 0",
            padding: "16px",
            borderRadius: "16px",
            background: colors.red100,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ fontWeight: "bold" }}>시간이 다 됐어요!</div>
          <div style={{ fontSize: "14px", color: colors.grey700 }}>
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
              disabled={!continueAd.isSupported}
              onClick={continueAd.showAd}
            >
              광고 보고 이어하기
            </Button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "12px",
          padding: "24px",
          opacity: failed ? 0.4 : 1,
          pointerEvents: failed ? "none" : "auto",
        }}
      >
        {board.map((tile) => {
          const isSelected = selected.some((t) => t.id === tile.id);
          const isWrong = wrongIds.includes(tile.id);

          return (
            <button
              key={tile.id}
              onClick={() => handleTap(tile)}
              style={{
                aspectRatio: "1",
                fontSize: "32px",
                borderRadius: "16px",
                border: "none",
                background: isWrong
                  ? colors.red100
                  : isSelected
                    ? colors.blue100
                    : colors.grey100,
                cursor: "pointer",
              }}
            >
              {tile.icon}
            </button>
          );
        })}
      </div>

      <TextButton
        style={{ padding: "16px 24px" }}
        size="medium"
        color={colors.blue500}
        onClick={onBack}
      >
        ← 홈으로
      </TextButton>
    </>
  );
}

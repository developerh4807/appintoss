import { colors } from "@toss/tds-colors";
import { TextButton, Top, useDialog } from "@toss/tds-mobile";
import { useEffect, useRef, useState } from "react";

import { generateBoard, isMatch } from "../game/patternMatch";
import type { Tile } from "../game/patternMatch";
import { useCurrency } from "../hooks/useCurrency";

const CLEAR_REWARD = 10;
const MISMATCH_DELAY_MS = 500;

interface PuzzlePageProps {
  onBack: () => void;
}

export function PuzzlePage({ onBack }: PuzzlePageProps) {
  const { currency, stage, clearStage } = useCurrency();
  const [board, setBoard] = useState<Tile[]>(() => generateBoard(stage));
  const [selected, setSelected] = useState<Tile[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const dialog = useDialog();
  const clearedRef = useRef(false);

  useEffect(() => {
    setBoard(generateBoard(stage));
    setSelected([]);
    setWrongIds([]);
    clearedRef.current = false;
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
    const timer = setTimeout(() => {
      setSelected([]);
      setWrongIds([]);
    }, MISMATCH_DELAY_MS);
    return () => clearTimeout(timer);
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

  const handleTap = (tile: Tile) => {
    if (wrongIds.length > 0) return;

    if (selected.some((t) => t.id === tile.id)) {
      setSelected((prev) => prev.filter((t) => t.id !== tile.id));
      return;
    }

    if (selected.length >= 2) return;
    setSelected((prev) => [...prev, tile]);
  };

  const columns = board.length > 12 ? 4 : 3;

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
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "12px",
          padding: "24px",
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

// [NEW 2026-08-21] 로컬 최고기록 리더보드 (3️⃣ 확정 사항).
//
// 토스 게임센터도 순위 조회 API가 없어 등수를 보여주지 못했으므로, 로컬 최고점으로
// 바꿔도 유저가 보는 기능은 사실상 동일하다. Play Games Services를 붙이지 않는 이유는
// 구글 계정 로그인·콘솔 설정이 필요해 PoC 범위(0원 트랙)를 벗어나기 때문이다.
//
// bestStage(useRunState)가 진행도의 원천이고, 여기 저장하는 최고 "점수"는
// scoreForRun 결과라서 축이 다르다 — 별도 키로 둔다.

const STORAGE_KEY = "appintoss.puzzle.bestScore";

/** 순위 화면을 띄울 수 없다 — 호출부는 이 값으로 리더보드 버튼을 숨긴다. */
export const canOpenLeaderboard = false;

/** 저장된 최고 점수를 읽는다. 손상된 값은 0으로 취급한다. */
export function readBestScore(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  } catch (error) {
    console.error("최고 점수 불러오기 실패:", error);
    return 0;
  }
}

/**
 * 점수를 로컬에 기록한다. 기존 최고점보다 낮으면 no-op이다.
 * 토스 구현과 동일하게 어떤 실패도 밖으로 던지지 않는다.
 */
export async function submitScore(score: number): Promise<void> {
  try {
    if (!Number.isFinite(score)) return;
    const best = readBestScore();
    if (score <= best) return;
    localStorage.setItem(STORAGE_KEY, String(Math.floor(score)));
  } catch (error) {
    console.error("최고 점수 저장 실패:", error);
  }
}

/** 순위 화면이 없으므로 아무것도 하지 않고 false를 반환한다. */
export async function openLeaderboard(): Promise<boolean> {
  return false;
}

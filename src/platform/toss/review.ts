import { Review } from "@apps-in-toss/web-framework";

import type { RequestReviewFn } from "../types";
import { logEvent } from "./analytics";

// [NEW 2026-09-11] 미니앱 리뷰(별점) 요청 — 그로스 1라운드 P1-2.
//
// 토스는 호출해도 리뷰 창을 반드시 띄우지 않는다. 유저 피로도·리뷰 이력·사용 빈도를 보고 토스가
// 정하고, 떴는지·썼는지도 알려주지 않는다(담당자 답변 — 리뷰 여부에 따른 기능 차별을 막으려고
// 일부러 제공하지 않음). 이미 평가한 유저는 조용히 넘어간다. 그래서 기회를 아끼도록 한 번 더 거른다:
//   - 세션당 1회 — 가이드가 "같은 세션 안에서 반복적으로 호출하지 마세요"라고 못박는다
//   - 같은 기기에서 30일에 1회 — 떴는지 알 수 없으니 "호출한 날"을 기준으로 간격을 둔다
//
// 흐름은 결과와 무관하게 그대로 이어져야 한다(가이드 금지 사항: 노출 여부에 따라 화면을 넘기거나
// 보상을 주지 말 것). 그래서 결과를 기다리지 않고 실패는 전부 삼킨다. 미지원 앱 버전이면 문서는
// 업데이트 안내 문구를 보여주라고 하지만, 필수 기능이 아니라 조용히 건너뛴다.
// 조사·의사결정: notes/2026-09-11_리뷰-요청-조사와-적용-설계.md

const STORAGE_KEY = "appintoss.review.lastRequestedAt";
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

// 모듈 상태라 미니앱을 새로 열면(= 새 세션) 다시 false로 시작한다.
let requestedThisSession = false;

function readLastRequestedAt(): number {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    return Number.isFinite(value) ? value : 0;
  } catch (error) {
    console.error("리뷰 요청 시각 불러오기 실패:", error);
    return 0;
  }
}

function writeLastRequestedAt(time: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(time));
  } catch (error) {
    console.error("리뷰 요청 시각 저장 실패:", error);
  }
}

// 쿨다운 안이면 true. 기기 시계가 뒤로 가 경과 시간이 음수가 되면 쿨다운이 끝난 것으로 본다 —
// 그대로 두면 시계가 원래대로 돌아올 때까지 영영 요청하지 못한다.
function isInCooldown(now: number): boolean {
  const elapsed = now - readLastRequestedAt();
  return elapsed >= 0 && elapsed < COOLDOWN_MS;
}

// isSupported()는 브라우저처럼 네이티브 브릿지가 없는 곳에서 호출 자체가 throw할 수 있다
// (ads.tsx의 loadFullScreenAd.isSupported와 같은 사정). 최소 토스앱 5.253.0.
function isSupported(): boolean {
  try {
    return Review.request.isSupported();
  } catch (error) {
    console.error(
      "리뷰 요청 지원 여부 확인 실패 (브라우저/샌드박스 환경일 수 있음):",
      error,
    );
    return false;
  }
}

export const requestReview: RequestReviewFn = ({ stage }) => {
  if (requestedThisSession) return;
  const now = Date.now();
  if (isInCooldown(now)) return;
  if (!isSupported()) return;

  requestedThisSession = true;
  writeLastRequestedAt(now);
  // 토스가 창을 실제로 띄웠는지는 알 수 없다 — "요청한 횟수"만 센다. 결과는 콘솔 '평점 및 리뷰'와 비교.
  logEvent("review_request", { stage });
  Promise.resolve()
    .then(() => Review.request())
    .catch((error: unknown) => console.error("리뷰 요청 실패:", error));
};

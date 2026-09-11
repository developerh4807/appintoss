import type { RequestReviewFn } from "../types";

// [NEW 2026-09-11] Play 빌드에는 리뷰 요청이 없다 — no-op.
// 토스 미니앱 리뷰(Review.request)는 Android 빌드에 없고, Play In-App Review는 네이티브 플러그인과
// 새 AAB 출시가 필요한 별개 작업이라 이번 범위 밖이다(사용자 결정: Android에 영향 없이).
// 호출부가 플랫폼을 몰라도 되도록 시그니처만 맞춘다 — 저장·계측도 하지 않는다.
export const requestReview: RequestReviewFn = () => {};

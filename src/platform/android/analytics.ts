import type { LogEventFn, LogScreenFn } from "../types";

// [NEW 2026-09-11] Android(Play) 빌드에는 아직 계측 수단이 없다 — no-op.
// 호출부가 플랫폼을 몰라도 되도록 토스 어댑터와 같은 시그니처만 맞춘다.
// Play 쪽 계측이 필요해지면(Firebase 등) 여기만 채우면 된다.
export const logEvent: LogEventFn = () => {};

export const logScreen: LogScreenFn = () => {};

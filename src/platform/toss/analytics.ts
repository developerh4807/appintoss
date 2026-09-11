import { Analytics } from "@apps-in-toss/web-framework";

import type { LogEventFn, LogScreenFn } from "../types";

// [NEW 2026-09-11] 토스 Analytics 어댑터 — 그로스 1라운드 P0-1.
//
// 새 SDK·새 대시보드 없이 이미 쓰고 있는 @apps-in-toss/web-framework 의 Analytics 로 보낸다.
// 콘솔 `분석 > 이벤트`에 배포 다음날부터 쌓인다. sandbox·로컬에서는 전송되지 않고
// 콘솔(devtools 패널)에만 찍히므로, 실제 수집 확인은 라이브 배포 후에만 가능하다.
//
// 계측은 부가 기능이다 — 어떤 실패도 게임 흐름으로 새지 않게 여기서 전부 삼킨다.
// 미지원 앱 버전은 SDK가 알아서 조용히 무시한다. Promise.resolve로 감싸는 이유는
// 환경에 따라 반환값이 Promise가 아닐 수 있어서다(screen은 타입부터 `| undefined`).

export const logEvent: LogEventFn = (name, params) => {
  try {
    Promise.resolve(
      Analytics.log({ log_name: name, log_type: "event", params }),
    ).catch((error: unknown) => console.error("이벤트 기록 실패:", name, error));
  } catch (error) {
    console.error("이벤트 기록 실패:", name, error);
  }
};

export const logScreen: LogScreenFn = (name) => {
  try {
    Promise.resolve(Analytics.screen({ log_name: name })).catch(
      (error: unknown) => console.error("화면 기록 실패:", name, error),
    );
  } catch (error) {
    console.error("화면 기록 실패:", name, error);
  }
};

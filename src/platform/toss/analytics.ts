import { Analytics } from "@apps-in-toss/web-framework";

import { consoleEventName } from "../../game/analyticsNaming";
import type { LogEventFn, LogScreenFn } from "../types";

// [NEW 2026-09-11] 토스 Analytics 어댑터 — 그로스 1라운드 P0-1.
//
// 새 SDK·새 대시보드 없이 이미 쓰고 있는 @apps-in-toss/web-framework 의 Analytics 로 보낸다.
// 콘솔 `분석 > 이벤트`에 쌓인다. 토스앱 QR 테스트에서도 수집된다(2026-09-11 확인). sandbox 앱과
// 로컬에서는 전송되지 않고 콘솔(devtools 패널)에만 찍힌다.
//
// log_name은 consoleEventName으로 만든다 — 콘솔이 파라미터 값별로 세지 못해서, 값별로 봐야
// 하는 축은 이름 뒤에 붙인다(game/analyticsNaming.ts). 파라미터는 원본 그대로 같이 보낸다.
//
// 계측은 부가 기능이다 — 어떤 실패도 게임 흐름으로 새지 않게 여기서 전부 삼킨다.
// 미지원 앱 버전은 SDK가 알아서 조용히 무시한다. Promise.resolve로 감싸는 이유는
// 환경에 따라 반환값이 Promise가 아닐 수 있어서다(screen은 타입부터 `| undefined`).
//
// [FIX 2026-09-11] 한 번에 하나씩 순서대로 보낸다.
// QR 테스트에서 앱을 여는 순간 `puzzle` 화면 로그와 같은 ms에 보낸 `stage_reach_01`이 콘솔에
// 0건이었다(먼저 보낸 화면 로그는 들어왔다). 코드는 둘 다 보냈고(devtools 목 확인), SDK에서
// log·screen은 같은 네이티브 메서드(eventLog)로 나간다 — 같은 순간 연달아 보낸 두 번째 호출이
// 유실되는 것으로 본다. 같은 구조가 run_over → record_break, 뽑기에서 복귀할 때 화면 →
// stage_reach(핵심지표 전환지표 stage_reach_04 포함)에도 있어서, 호출부를 하나하나 고치지 않고
// 여기서 줄을 세운다: 앞 호출이 끝나고 SEND_GAP_MS 뒤에 다음을 보낸다. 브릿지가 응답하지
// 않아도 줄이 영원히 막히지 않게 SEND_TIMEOUT_MS가 지나면 다음으로 넘어간다.
const SEND_GAP_MS = 16;
const SEND_TIMEOUT_MS = 1000;

let queue: Promise<void> = Promise.resolve();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise: Promise<unknown>, ms: number): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(resolve, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// 줄 자체는 절대 reject되지 않는다 — 실패는 호출마다 여기서 삼키고 다음 호출로 넘어간다.
function enqueue(label: string, send: () => unknown) {
  queue = queue
    .then(() => {
      const sending = Promise.resolve()
        .then(send)
        .catch((error: unknown) => console.error("이벤트 기록 실패:", label, error));
      return withTimeout(sending, SEND_TIMEOUT_MS);
    })
    .then(() => wait(SEND_GAP_MS));
}

export const logEvent: LogEventFn = (name, params) => {
  try {
    // 이름은 호출 시점에 확정한다 — 줄에서 기다리는 동안 기록 내용이 바뀌지 않게.
    const log_name = consoleEventName(name, params);
    enqueue(name, () => Analytics.log({ log_name, log_type: "event", params }));
  } catch (error) {
    console.error("이벤트 기록 실패:", name, error);
  }
};

export const logScreen: LogScreenFn = (name) => {
  enqueue(name, () => Analytics.screen({ log_name: name }));
};

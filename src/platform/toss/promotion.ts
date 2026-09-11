import { Promotion } from "@apps-in-toss/web-framework";

import type { ShareRewardHandlers } from "../types";

// [NEW 2026-09-11] 공유 리워드(친구 초대) — PRD FR-20, 그로스 1라운드 P0-2.
//
// 무료 재시도 2회 + 광고 이어하기 1회를 다 쓴 뒤 "친구에게 공유하고 한 판 더"로 쓰인다.
// 보상은 게임 안의 이어하기이고, 토스가 따로 지급하는 것은 없다 — 콘솔 `공유 리워드`
// 모듈의 리워드명·수량은 초대 시트에 표시되는 문구일 뿐이다.
//
// moduleId(콘솔 공유 리워드 UUID)는 광고그룹 ID와 같은 이유로 env에서만 받는다(adIds.ts 참고).
// 값이 없으면 기능을 끈다 — 버튼 자체가 안 뜨고 재시도 사다리는 광고 단계에서 끝난다.
// 그런 번들이 모르게 나가지 않도록 vite.config.ts 가 빌드 때 경고를 찍는다.
const MODULE_ID = import.meta.env.VITE_TOSS_SHARE_REWARD_MODULE_ID;

/**
 * 이 환경에서 공유 리워드를 띄울 수 있는지. 버튼 노출 판단에 쓴다(최소 토스앱 5.223.0).
 *
 * isSupported()는 브라우저처럼 네이티브 브릿지가 없는 곳에서 호출 자체가 throw할 수 있어
 * (ads.tsx의 loadFullScreenAd.isSupported와 같은 사정) 호출 시점에 감싸서 판정한다.
 */
export function isShareRewardSupported(): boolean {
  if (!MODULE_ID) return false;
  try {
    return Promotion.openContactsInvite.isSupported();
  } catch (error) {
    console.error(
      "공유 리워드 지원 여부 확인 실패 (브라우저/샌드박스 환경일 수 있음):",
      error,
    );
    return false;
  }
}

/**
 * 공유 리워드 시트를 연다. 반환값은 구독 해제 함수 — 시트가 닫히면 알아서 해제되므로
 * 호출부는 화면을 떠날 때만 부르면 된다(여러 번 불러도 안전하다).
 *
 * 보상 판정은 시트가 닫힐 때 한 번에 한다. sendViral이 오는 순간 이어하기를 주면 시트가
 * 아직 떠 있는 동안 보드가 깔리고 타이머가 돌기 시작한다. 닫힘 이벤트의 sentRewardsCount를
 * 함께 보는 이유는 sendViral을 놓쳐도 공유한 유저가 보상을 잃지 않게 하기 위해서다.
 */
export function openShareReward(handlers: ShareRewardHandlers): () => void {
  let sent = false;
  let closed = false;
  let unsubscribe: (() => void) | undefined;

  const release = () => {
    try {
      unsubscribe?.();
    } catch (error) {
      console.error("공유 리워드 정리(cleanup) 중 에러:", error);
    }
    unsubscribe = undefined;
  };

  const finish = (rewarded: boolean) => {
    if (closed) return;
    closed = true;
    // SDK가 이벤트를 전달하는 도중에 구독을 끊지 않도록 해제는 한 틱 미룬다.
    // 시트가 동기적으로 닫히는 경우에도 아래에서 unsubscribe가 채워진 뒤에 실행된다.
    queueMicrotask(release);
    handlers.onClose({ rewarded });
  };

  if (!MODULE_ID) {
    finish(false);
    return release;
  }

  try {
    unsubscribe = Promotion.openContactsInvite({
      options: { moduleId: MODULE_ID },
      onEvent: (event) => {
        if (event.type === "sendViral") {
          sent = true;
          handlers.onSent();
          return;
        }
        finish(sent || (event.data.sentRewardsCount ?? 0) > 0);
      },
      onError: (error) => {
        console.error("공유 리워드 실패:", error);
        finish(sent);
      },
    });
  } catch (error) {
    console.error("공유 리워드 열기 실패:", error);
    finish(false);
  }

  return release;
}

import { Promotion } from "@apps-in-toss/web-framework";

import { SHARE_REWARD_DAILY_LIMIT } from "../../game/balance";
import type { ShareRewardHandlers } from "../types";

// [NEW 2026-09-11] 공유 리워드(친구 초대) — PRD FR-20, 그로스 1라운드 P0-2.
//
// 무료 재시도 2회 + 광고 이어하기 1회를 다 쓴 뒤 "친구에게 공유하고 한 판 더"로 쓰인다.
// [UPDATED 2026-09-11] 보상은 두 가지이고 둘 다 게임이 지급한다 — 토스는 아무것도 지급하지 않는다
// (콘솔 주의사항: "공유에 따른 보상은 파트너사의 책임과 비용으로 직접 지급하고 관리해야 해요").
//   - 친구 1명마다 코인: 토스 시트가 친구별로 "코인 N개 받기"라고 약속하는 보상이다. 수량은 콘솔
//     공유 리워드 설정(단위 "코인", 수량)을 sendViral 이벤트로 받아 그대로 따른다 — 숫자를 코드에
//     두 번 적지 않는다. 하루 SHARE_REWARD_DAILY_LIMIT명분까지만 준다: 같은 친구에겐 하루 1회라는
//     토스 정책이 있지만, 시트를 닫았다 열면 같은 친구에게 다시 보낼 수 있다는 신고가 있다(#2768).
//   - 한 판 더 1회: 우리 버튼이 약속하는 보상. 시트가 닫힐 때 1명 이상 보냈으면 호출부가 준다.
// 이어하기를 친구 수만큼 주지 않는 이유: 이어하기는 게임의 핵심 긴장이라, 쌓아 두게 하면
// 랭킹이 실력이 아니라 초대 수로 갈린다.
//
// moduleId(콘솔 공유 리워드 UUID)는 광고그룹 ID와 같은 이유로 env에서만 받는다(adIds.ts 참고).
// 값이 없으면 기능을 끈다 — 버튼 자체가 안 뜨고 재시도 사다리는 광고 단계에서 끝난다.
// 그런 번들이 모르게 나가지 않도록 vite.config.ts 가 빌드 때 경고를 찍는다.
const MODULE_ID = import.meta.env.VITE_TOSS_SHARE_REWARD_MODULE_ID;

const DAILY_STORAGE_KEY = "appintoss.shareReward.daily";

// "하루 N명"은 유저가 느끼는 하루라 UTC가 아니라 기기 로컬 자정 기준으로 센다.
function todayKey(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * 오늘 코인 지급 한도가 남았으면 1명분을 차감하고 true를 돌려준다. 저장소가 막힌 환경에서는
 * 지급한다 — 우리 쪽 상한을 못 지키는 것보다 공유한 유저가 보상을 못 받는 쪽이 더 나쁘다.
 */
function claimDailyReward(): boolean {
  try {
    const today = todayKey();
    const saved = JSON.parse(localStorage.getItem(DAILY_STORAGE_KEY) ?? "null");
    const count =
      saved?.date === today && Number.isInteger(saved.count) ? saved.count : 0;
    if (count >= SHARE_REWARD_DAILY_LIMIT) return false;
    localStorage.setItem(
      DAILY_STORAGE_KEY,
      JSON.stringify({ date: today, count: count + 1 }),
    );
    return true;
  } catch (error) {
    console.error("공유 보상 하루 한도 확인 실패:", error);
    return true;
  }
}

// 콘솔에 넣은 수량. 비정상 값이면 0 — 설정 실수로 코인이 엉뚱하게 지급되지 않게 한다.
function toRewardCoins(amount: unknown): number {
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0
    ? Math.floor(amount)
    : 0;
}

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
 * 코인은 공유 한 건(sendViral)마다 바로 넘기고, 이어하기 판정은 시트가 닫힐 때 한 번에 한다.
 * sendViral이 오는 순간 이어하기를 주면 시트가 아직 떠 있는 동안 보드가 깔리고 타이머가 돌기
 * 시작한다. 닫힘 이벤트의 sentRewardsCount를 함께 보는 이유는 sendViral을 놓쳐도 공유한 유저가
 * 이어하기를 잃지 않게 하기 위해서다(이 경우 코인은 줄 수 없다 — 건별 신호가 없다. QR에서 확인).
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
          const coins = toRewardCoins(event.data.rewardAmount);
          // 수량이 정상일 때만 하루 한도를 차감한다(0개 지급에 한도를 쓰지 않게).
          handlers.onSent({ coins: coins > 0 && claimDailyReward() ? coins : 0 });
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

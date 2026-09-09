import { Share } from "@apps-in-toss/web-framework";

import config from "../../../apps-in-toss.config.ts";
import type { SharePayload } from "../types";

// [MOVED 2026-08-21] PuzzlePage.tsx:283의 share() 호출을 어댑터 뒤로 옮겼다.
//
// [FIX 2026-09-09] 실기기 QA에서 "문구만 복사되고 앱 진입 링크가 없다"는 문제가 나왔다.
// 원인은 두 가지였다.
//   ① 구 `share()`는 message 하나만 받는다 — 링크를 넣을 자리가 애초에 없었다.
//      SDK 3.x에서 deprecated 되기도 해서 `Share.sendMessage`로 옮겼다.
//   ② 공유 링크는 `Share.createLink`로 따로 만들어야 하는데 한 번도 호출하지 않았다.
//      path는 `intoss://`로 시작하는 딥링크여야 한다.
//
// appName을 문자열로 박지 않고 설정에서 읽는다 — 콘솔 등록 후 변경이 불가능한 값이라
// 두 곳에 복사해두면 어긋났을 때 조용히 깨진 링크가 나간다.
const DEEP_LINK_PATH = `intoss://${config.appName}`;

/**
 * 공유 링크를 만든다. 실패하면 undefined.
 *
 * createLink는 isSupported()를 제공하지 않고 구버전 토스앱에서는 그냥 throw된다.
 * 링크를 못 만들었다고 공유 자체를 막을 이유는 없으므로 조용히 문구만 보낸다.
 */
async function createShareLink(): Promise<string | undefined> {
  try {
    const link = await Share.createLink({ path: DEEP_LINK_PATH });
    return link || undefined;
  } catch (error) {
    console.error("공유 링크 생성 실패:", error);
    return undefined;
  }
}

export async function sharePayload(payload: SharePayload): Promise<void> {
  try {
    const link = await createShareLink();
    const message = link ? `${payload.message}\n${link}` : payload.message;

    await Share.sendMessage({ message });
  } catch (error) {
    console.error("공유 실패:", error);
  }
}

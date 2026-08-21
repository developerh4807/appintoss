import { share } from "@apps-in-toss/web-framework";

import type { SharePayload } from "../types";

// [MOVED 2026-08-21] PuzzlePage.tsx:283의 share() 호출을 어댑터 뒤로 옮겼다.
export async function sharePayload(payload: SharePayload): Promise<void> {
  try {
    await share({ message: payload.message });
  } catch (error) {
    console.error("공유 실패:", error);
  }
}

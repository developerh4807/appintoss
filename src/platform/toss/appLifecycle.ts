// [NEW 2026-08-21] 토스 미니앱은 하드웨어 뒤로가기를 토스 앱이 직접 처리한다.
// 미니앱이 가로채면 오히려 토스의 네비게이션과 충돌하므로 no-op으로 둔다.
import type { BackHandler } from "../types";

export function registerBackButton(_handler: BackHandler): () => void {
  void _handler;
  return () => {};
}

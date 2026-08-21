import { useEffect, useState } from "react";

// [NEW 2026-08-21] 오프라인 안내 (8️⃣④ 대응).
//
// 게임 자체는 서버가 없어 오프라인에서도 완전히 동작한다. 안내가 필요한 이유는
// 광고뿐이다 — 오프라인이면 광고가 안 떠서 "보상형으로 이어하기"가 조용히 실패하는데,
// 이유를 알려주지 않으면 버그로 읽힌다.
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

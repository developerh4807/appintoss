import {
  loadFullScreenAd,
  showFullScreenAd,
  TossAds,
} from "@apps-in-toss/web-framework";
import { useToast } from "@toss/tds-mobile";
import { useCallback, useEffect, useRef, useState } from "react";

import type { BannerApi, BannerHandle, InAppAdsApi, Reward } from "../types";

// [MOVED 2026-08-21] 기존 src/hooks/useInAppAds.tsx + useTossBanner.ts 를 그대로 옮겼다.
// 로직은 한 줄도 바꾸지 않았다 — 1단계의 목적은 "동작 변화 0"이다.
// 참고문서: https://developers-apps-in-toss.toss.im/ads/intro.html

export function useInAppAds(adGroupId: string): InAppAdsApi {
  const toast = useToast();

  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [lastReward, setLastReward] = useState<Reward | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const unregisterRef = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    setIsAdLoaded(false);

    try {
      unregisterRef.current = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === "loaded") {
            setIsAdLoaded(true);
          }
        },
        onError: (error) => {
          console.error("광고 로드 실패:", error);
        },
      });
    } catch (error) {
      console.error("광고 로드 실패:", error);
      setIsAdLoaded(false);
    }
  }, [adGroupId]);

  useEffect(() => {
    try {
      setIsSupported(loadFullScreenAd.isSupported());

      if (loadFullScreenAd.isSupported()) {
        load();
      }
    } catch (error) {
      // 브라우저/로컬 개발 환경 등 네이티브 브릿지가 없는 곳에서는 isSupported() 호출 자체가 throw된다.
      // 정상적인 미지원 상황이므로 플레이를 막는 alert 대신 조용히 로그만 남긴다.
      console.error(
        "광고 지원 여부 확인 실패 (브라우저/샌드박스 환경일 수 있음):",
        error,
      );
      setIsSupported(false);
    }

    return () => {
      try {
        unregisterRef.current?.();
      } catch (error) {
        console.error("광고 정리(cleanup) 중 에러:", error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAd = useCallback(() => {
    if (!isSupported) {
      console.info("현재 환경에서는 인앱 광고가 지원되지 않습니다.");
      return;
    }

    if (!isAdLoaded) {
      console.info("아직 광고가 로드되지 않았습니다.");
      return;
    }

    try {
      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          switch (event.type) {
            case "userEarnedReward":
              toast.openToast(
                `보상 획득: ${event.data.unitType} ${event.data.unitAmount}개`,
              );
              setLastReward(event.data);
              break;
            case "dismissed":
              setIsAdLoaded(false);
              load();
              break;
            case "failedToShow":
              console.error("광고 표시 실패");
              setIsAdLoaded(false);
              // 실패한 경우에도 다시 로드를 시도해 다음 기회를 준비합니다.
              load();
              break;
          }
        },
        onError: (error) => {
          console.error("광고 표시 실패:", error);
          setIsAdLoaded(false);
          load();
        },
      });
    } catch (error) {
      console.error("광고 표시 실패:", error);
      setIsAdLoaded(false);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adGroupId, isAdLoaded, isSupported, load]);

  return { isAdLoaded, isSupported, showAd, lastReward };
}

// 참고문서: https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/web-banner.md
export function useBanner(): BannerApi {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    try {
      if (!TossAds.initialize.isSupported()) return;

      TossAds.initialize({
        callbacks: {
          onInitialized: () => setIsInitialized(true),
          onInitializationFailed: (error) => {
            console.error("배너 광고 SDK 초기화 실패:", error);
          },
        },
      });
    } catch (error) {
      console.error("배너 광고 지원 여부 확인 실패:", error);
    }
  }, [isInitialized]);

  const attachBanner = useCallback(
    (adGroupId: string, element: HTMLElement): BannerHandle | undefined => {
      if (!isInitialized) return;
      try {
        return TossAds.attachBanner(adGroupId, element, {
          variant: "expanded",
        });
      } catch (error) {
        console.error("배너 광고 부착 실패:", error);
        return undefined;
      }
    },
    [isInitialized],
  );

  return { isInitialized, attachBanner };
}

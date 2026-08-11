import { TossAds } from "@apps-in-toss/web-framework";
import type { TossAdsAttachBannerOptions } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useState } from "react";

interface UseTossBannerReturn {
  isInitialized: boolean;
  attachBanner: (
    adGroupId: string,
    element: HTMLElement,
    options?: TossAdsAttachBannerOptions,
  ) => ReturnType<typeof TossAds.attachBanner> | undefined;
}

// 참고문서: https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/web-banner.md
export function useTossBanner(): UseTossBannerReturn {
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
    (
      adGroupId: string,
      element: HTMLElement,
      options?: TossAdsAttachBannerOptions,
    ) => {
      if (!isInitialized) return;
      try {
        return TossAds.attachBanner(adGroupId, element, options);
      } catch (error) {
        console.error("배너 광고 부착 실패:", error);
        return undefined;
      }
    },
    [isInitialized],
  );

  return { isInitialized, attachBanner };
}

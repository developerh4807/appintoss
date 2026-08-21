import type { BannerApi, BannerHandle, InAppAdsApi } from "../types";

// [NEW 2026-08-21] 1단계 stub — 실제 AdMob 연결은 4단계(feat/admob)다.
// 인터페이스만 맞춰 두면 호출부는 4단계에서도 한 줄도 바뀌지 않는다.
// isSupported=false 이므로 호출부의 기존 가드가 광고 UI를 알아서 숨긴다.

export function useInAppAds(_adGroupId: string): InAppAdsApi {
  void _adGroupId;
  return {
    isAdLoaded: false,
    isSupported: false,
    showAd: () => {},
    lastReward: null,
  };
}

export function useBanner(): BannerApi {
  return {
    isInitialized: false,
    attachBanner: (): BannerHandle | undefined => undefined,
  };
}

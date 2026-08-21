import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  RewardAdPluginEvents,
} from "@capacitor-community/admob";
import type { AdMobRewardItem } from "@capacitor-community/admob";
import type { PluginListenerHandle } from "@capacitor/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BannerApi, BannerHandle, InAppAdsApi, Reward } from "../types";
import { TEST_AD_IDS, USE_TEST_ADS } from "./adIds";
import { ensureAdMobInitialized } from "./admob";
import { useToast } from "./ui";

// [NEW 2026-08-21] AdMob 보상형/배너 구현 (4단계).
//
// 반환 형태 { isAdLoaded, isSupported, showAd, lastReward }는 토스 구현과 동일하다 —
// 그래서 GameShell/PuzzlePage 호출부는 한 줄도 바뀌지 않는다(6️⃣ 4단계 조건).
//
// 호출부가 넘기는 adGroupId는 토스 광고그룹ID라 AdMob에서는 쓸 수 없다.
// 여기서 AdMob 광고 단위 ID로 갈아끼운다 — 호출부를 고치지 않기 위한 의도적 무시다.

/** 토스 광고그룹ID → AdMob 광고 단위 ID. 실 ID 교체는 adIds.ts 한 곳만 고치면 된다. */
function resolveRewardedAdId(_tossAdGroupId: string): string {
  void _tossAdGroupId;
  return TEST_AD_IDS.rewarded;
}

// [NEW 2026-08-21] AdMob 보상형은 **전역 슬롯이 하나**다. 토스와 달리 광고그룹별로
// 따로 들고 있을 수 없어서, useInAppAds가 두 곳(GameShell 뽑기 / PuzzlePage 이어하기)에서
// 마운트되면 같은 슬롯을 두 번 prepare하게 된다 — 실제로 로그에 중복 요청이 찍혔다.
// 로드를 모듈 스코프에서 한 번만 수행하고 결과를 구독자에게 방송한다.
interface AdLoadState {
  loaded: boolean;
  loading: boolean;
}

const loadSubscribers = new Set<(state: AdLoadState) => void>();
let adStateGlobal: AdLoadState = { loaded: false, loading: false };
let inFlightLoad: Promise<boolean> | null = null;

function broadcast(state: AdLoadState): void {
  adStateGlobal = state;
  loadSubscribers.forEach((fn) => fn(state));
}

function broadcastLoaded(loaded: boolean): void {
  broadcast({ loaded, loading: false });
}

/** 전역 보상형 광고를 채운다. 이미 로드돼 있거나 진행 중이면 그 결과를 재사용한다. */
function loadRewardedOnce(adId: string): Promise<boolean> {
  if (adStateGlobal.loaded) return Promise.resolve(true);
  if (inFlightLoad) return inFlightLoad;

  broadcast({ loaded: false, loading: true });
  inFlightLoad = AdMob.prepareRewardVideoAd({ adId, isTesting: USE_TEST_ADS })
    .then(() => {
      broadcastLoaded(true);
      return true;
    })
    .catch((error) => {
      // 로드 실패는 흔하다(네트워크 없음, 인벤토리 없음, 에뮬레이터 미지원).
      // 게임을 막지 않고 광고 버튼만 비활성 상태로 남긴다.
      console.debug("보상형 광고 로드 실패:", error);
      broadcastLoaded(false);
      return false;
    })
    .finally(() => {
      inFlightLoad = null;
    });

  return inFlightLoad;
}

export function useInAppAds(adGroupId: string): InAppAdsApi {
  const { t } = useTranslation();
  const toast = useToast();

  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastReward, setLastReward] = useState<Reward | null>(null);

  // 리스너 핸들을 모아 두었다가 언마운트 시 한 번에 정리한다.
  const listenersRef = useRef<PluginListenerHandle[]>([]);
  // 언마운트 이후 도착하는 비동기 콜백이 setState를 때리지 않게 막는다.
  const mountedRef = useRef(true);

  const adId = resolveRewardedAdId(adGroupId);

  const load = useCallback(async () => {
    await loadRewardedOnce(adId);
  }, [adId]);

  // 전역 로드 상태를 구독한다 — 어느 인스턴스가 로드/소진하든 모두 같은 값을 본다.
  useEffect(() => {
    const onChange = (state: AdLoadState) => {
      setIsAdLoaded(state.loaded);
      setIsLoading(state.loading);
    };
    loadSubscribers.add(onChange);
    return () => {
      loadSubscribers.delete(onChange);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    void (async () => {
      try {
        await ensureAdMobInitialized();
      } catch {
        // 네이티브 브릿지가 없는 환경 — 정상적인 미지원 상황이다.
        if (mountedRef.current) setIsSupported(false);
        return;
      }
      if (!mountedRef.current) return;
      setIsSupported(true);
      // 다른 훅 인스턴스가 이미 로드해 뒀을 수 있으므로 현재 상태를 먼저 반영한다.
      setIsAdLoaded(adStateGlobal.loaded);
      setIsLoading(adStateGlobal.loading);

      const handles = await Promise.all([
        AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
          if (!mountedRef.current) return;
          const earned: Reward = {
            unitType: reward.type,
            unitAmount: reward.amount,
          };
          setLastReward(earned);
          toast.openToast(
            t("toast.adReward", {
              unitType: earned.unitType,
              amount: earned.unitAmount,
            }),
          );
        }),
        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          // 소진됐으므로 전역 상태를 내리고 다음 기회를 위해 다시 채운다
          // (토스 구현과 동일한 정책).
          broadcastLoaded(false);
          void load();
        }),
        AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
          console.debug("보상형 광고 표시 실패:", error);
          if (!mountedRef.current) return;
          broadcastLoaded(false);
          void load();
        }),
        // 이 리스너가 없으면 로드 실패가 "No listeners found"로 흘러가 버려서
        // 버튼이 로딩 상태(· · ·)에 영원히 머문다.
        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
          console.debug("보상형 광고 로드 실패(이벤트):", error);
          broadcastLoaded(false);
        }),
      ]);

      if (!mountedRef.current) {
        await Promise.all(handles.map((h) => h.remove()));
        return;
      }
      listenersRef.current = handles;
      await load();
    })();

    return () => {
      mountedRef.current = false;
      const handles = listenersRef.current;
      listenersRef.current = [];
      handles.forEach((h) => void h.remove());
    };
    // t/toast는 매 렌더 새 참조일 수 있어 deps에 넣으면 리스너가 계속 재등록된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId]);

  const showAd = useCallback(() => {
    if (!isSupported) {
      console.info("현재 환경에서는 인앱 광고가 지원되지 않습니다.");
      return;
    }
    if (!isAdLoaded) {
      console.info("아직 광고가 로드되지 않았습니다.");
      return;
    }

    void AdMob.showRewardVideoAd().catch((error) => {
      console.debug("보상형 광고 표시 실패:", error);
      broadcastLoaded(false);
      void load();
    });
  }, [isAdLoaded, isSupported, load]);

  return { isAdLoaded, isSupported, showAd, lastReward, isLoading };
}

// [NEW 2026-08-21] AdMob 배너.
//
// 토스 배너는 DOM 엘리먼트에 붙지만 AdMob 배너는 네이티브 뷰라 웹뷰 위에 겹쳐 뜬다.
// 그래서 element 인자는 위치 계산에 쓰이지 않고, 대신 화면 하단에 고정한다.
// 호출부 시그니처를 유지하기 위해 인자는 그대로 받는다.
export function useBanner(): BannerApi {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensureAdMobInitialized()
      .then(() => {
        if (!cancelled) setIsInitialized(true);
      })
      .catch(() => {
        // 미지원 환경 — 배너 없이 진행한다.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const attachBanner = useCallback(
    (_adGroupId: string, _element: HTMLElement): BannerHandle | undefined => {
      void _adGroupId;
      void _element;
      if (!isInitialized) return undefined;

      void AdMob.showBanner({
        adId: TEST_AD_IDS.banner,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: USE_TEST_ADS,
      }).catch((error) => {
        console.debug("배너 광고 표시 실패:", error);
      });

      // 퍼즐 화면으로 넘어갈 때 반드시 제거돼야 한다 — 타이머가 도는 화면에
      // 광고를 띄우지 않는 정책은 양 플랫폼 공통이다(GameShell 주석 참고).
      return {
        destroy: () => {
          void AdMob.removeBanner().catch((error) => {
            console.debug("배너 광고 제거 실패:", error);
          });
        },
      };
    },
    [isInitialized],
  );

  return { isInitialized, attachBanner };
}

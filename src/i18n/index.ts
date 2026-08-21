import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { ko } from "./locales/ko";

// [NEW 2026-08-21] i18n 부트스트랩 (3️⃣ — global 출시가 조건이라 ko/en 양쪽).
//
// fallback을 en으로 두는 이유: Play는 global 배포라 ko/en 외 언어 기기가 다수다.
// 한국어 기기는 detector가 ko로 잡고, 나머지는 전부 en으로 떨어진다.
//
// 게임 화면 핵심(동물 타일)은 전부 이모지라 언어 중립이다 — i18n 대상은 주변부 UI뿐이다.

export const defaultNS = "translation";

export const resources = {
  ko: { translation: ko },
  en: { translation: en },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    // ko-KR 같은 지역 변형을 ko 로 접어서 찾는다.
    load: "languageOnly",
    supportedLngs: ["ko", "en"],
    interpolation: {
      // React가 이미 XSS 이스케이프를 하므로 이중 이스케이프를 끈다.
      escapeValue: false,
    },
    detection: {
      // Capacitor 웹뷰에서는 navigator.language 가 기기 언어를 그대로 준다.
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "appintoss.lang",
      caches: ["localStorage"],
    },
  });

export default i18n;

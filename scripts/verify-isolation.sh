#!/usr/bin/env bash
# [NEW 2026-08-21] 산출물 격리 검사 — docs/plans/android-port.md 완료조건 3·4.
#
# 리스크 ③(런타임 분기 유혹)이 조용히 격리를 깨는 것을 막는 자동 검사다.
# platform/index.ts 에서 양쪽을 다 import하면 번들에 둘 다 들어가는데, 그때
# 이 스크립트가 실패한다. 매 PR마다 돌린다.
set -euo pipefail

cd "$(dirname "$0")/.."

fail=0

echo "▶ 양 플랫폼 빌드"
npm run build:toss  >/dev/null 2>&1 || { echo "✗ 조건 1: 토스 빌드 실패"; exit 1; }
echo "  ✓ 조건 1: PLATFORM=toss 빌드 성공"
npm run build:android >/dev/null 2>&1 || { echo "✗ 조건 2: Android 빌드 실패"; exit 1; }
echo "  ✓ 조건 2: PLATFORM=android 빌드 성공"

# Capacitor 플러그인이 동적 import로 별도 청크를 만들 수 있으므로 청크 전체를 검사한다.
# 파일 하나만 보면 새 청크에 섞여 들어간 참조를 놓친다.
toss_js=(dist-toss/assets/*.js)
android_js=(dist-android/assets/*.js)

# 조건 3 — 토스 번들에 Capacitor/AdMob 이 0바이트여야 한다.
# 주의: 토스 SDK 내부에 "AppsInTossAdMob" 심볼이 있어 단순 `grep admob` 은 오탐이다.
# 우리가 막으려는 것은 @capacitor-community/admob 이므로 capacitor 로 검사한다.
count=$(cat "${toss_js[@]}" | grep -ioc "capacitor" || true)
if [ "$count" -eq 0 ]; then
  echo "  ✓ 조건 3: 토스 번들에 Capacitor/AdMob 0바이트"
else
  echo "  ✗ 조건 3: 토스 번들에서 capacitor 참조 $count 건 발견"; fail=1
fi

# 조건 4 — Android 번들에 토스 SDK/TDS 가 0바이트여야 한다.
count=$(cat "${android_js[@]}" | grep -ioc "apps-in-toss\|tds-mobile" || true)
if [ "$count" -eq 0 ]; then
  echo "  ✓ 조건 4: Android 번들에 토스 SDK 0바이트"
else
  echo "  ✗ 조건 4: Android 번들에서 토스 SDK 참조 $count 건 발견"; fail=1
fi

echo "▶ 번들 크기"
echo "  toss    : $(cat "${toss_js[@]}"    | wc -c | awk '{printf "%.0fK", $1/1024}') (청크 ${#toss_js[@]}개)"
echo "  android : $(cat "${android_js[@]}" | wc -c | awk '{printf "%.0fK", $1/1024}') (청크 ${#android_js[@]}개)"

exit $fail

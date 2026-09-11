#!/usr/bin/env bash
# compose.html?frame=N 을 636×1048 PNG로 뽑는다.
#
#   ./render.sh          3장 전부
#   ./render.sh 2        2번 컷만
#
# 글자가 선명하도록 DPR 2로 렌더(1272×2096)한 뒤 636×1048로 축소한다.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$(cd "$HERE/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

frames=("$@")
if [ ${#frames[@]} -eq 0 ]; then frames=(1 2 3); fi

for n in "${frames[@]}"; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=636,1048 \
    --virtual-time-budget=3000 \
    --screenshot="$TMP/ss$n@2x.png" \
    "file://$HERE/compose.html?frame=$n" >/dev/null 2>&1

  magick "$TMP/ss$n@2x.png" -resize '636x1048!' "$OUT/ss$n-636x1048.png"
  echo "→ $OUT/ss$n-636x1048.png  ($(magick identify -format '%wx%h' "$OUT/ss$n-636x1048.png"))"
done

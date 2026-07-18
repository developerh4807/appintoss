# Deferred Work

## 동물 캐릭터 가챠 / 도감 (PRD FR-4~6)

재화 소모 뽑기, 보상형 광고 시청 뽑기, 도감 화면. 퍼즐 코어루프(재화 획득원)에 의존하므로 코어루프 완료 후 진행.

**Source:** step-01 multi-goal split, 2026-07-18. PRD §4.2 참고.

## 광고 배치 (PRD FR-7~9)

하단 고정 배너 상시 노출 + 뽑기 직전 보상형 광고. 가챠 플로우가 먼저 있어야 보상형 광고 삽입 지점이 의미 있음.

**Source:** step-01 multi-goal split, 2026-07-18. PRD §4.3 참고.

## 공유 버튼 (PRD FR-10)

`getTossShareLink` 또는 기본 공유 시트를 통한 최소 공유 기능.

**Source:** step-01 multi-goal split, 2026-07-18. PRD §4.4 참고.

## 퍼즐 코어루프 — 리뷰에서 나온 비차단 개선점

`src/game/patternMatch.ts`, `src/hooks/useCurrency.ts`, `src/pages/PuzzlePage.tsx` 리뷰(step-04, 2026-07-18)에서 나왔으나 이번 스토리를 막지 않는 항목들:

- **순수 게임 로직 유닛테스트 부재** — `tilesForStage`/`generateBoard`/`isMatch`는 부작용 없는 순수 함수라 테스트하기 쉬운데 테스트가 없음. 프로젝트에 테스트 러너 자체가 아직 없음(package.json에 test 스크립트 없음). 7일 출시 스코프에서는 의도적으로 제외.
- **타일 버튼 접근성 부재** — 선택/오답 상태가 배경색으로만 전달됨(`aria-pressed`/`aria-label` 없음). 스크린리더 사용자는 상태를 알 수 없음.
- **`App.tsx` 페이지 라우팅이 타입 없는 문자열 리터럴** — `useState<string | null>`로 `"iaa"`/`"puzzle"` 등을 관리, 오타(`"puzzel"`)가 컴파일은 통과하고 런타임에 조용히 아무 동작도 안 함. 이번 변경이 만든 패턴이 아니라 기존 패턴을 그대로 따른 것.
- **localStorage 쓰기 실패가 UI에 드러나지 않음** — quota 초과/프라이빗 브라우징 등으로 `setItem`이 실패하면 콘솔 에러만 남고, 새로고침 시 진행도가 조용히 되돌아감. Toss WebView 환경에서는 발생 가능성이 낮다고 판단해 이번 스코프에서는 보류.

**Source:** step-04 review (blind hunter + edge case hunter), 2026-07-18.

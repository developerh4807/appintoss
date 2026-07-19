# Deferred Work

`[정리 2026-07-19]` 아래 항목들은 07-17 구 PRD 기준 FR 번호(가챠=FR-4~6, 광고=FR-7~9, 공유=FR-10)로 작성돼 있었고, "동물 캐릭터 가챠/도감" 항목은 07-18 PRD 재작성에서 이미 폐기된 기능(§5 Non-Goal)을 그대로 할 일로 담고 있었다. Implementation Readiness 체크(`implementation-readiness-report-2026-07-19.md`)와 `game-architecture.md`(L113) 양쪽에서 독립적으로 발견된 문제라 현재 PRD(FR-1~20) 기준으로 전면 재작성한다. 실제 구현 대상 기능(재화 뽑기, 광고 배치, 공유)의 의도는 그대로 유효하다 — 번호와 "가챠 대상"만 최신화한다.

## 기능성 아이템 뽑기 + 인벤토리 (PRD FR-10~13)

재화 소모 또는 보상형 광고 시청으로 기능성 아이템(시간 회복/오답 무효화/재화 2배) 3종을 뽑고, 인벤토리에서 확인·소비. **캐릭터 수집/도감이 아니다** — 07-18에 전면 폐기된 기능이므로 재구현하지 않는다. 코어루프(재화 획득원)에 의존하므로 `useStageTimer` 통합 이후 진행.

**Source:** step-01 multi-goal split, 2026-07-18(구 FR 라벨) → 2026-07-19 FR 번호·내용 정정. PRD §4.2 참고.

## 광고 배치 (PRD FR-14~17)

하단 고정 배너 상시 노출(FR-14), 뽑기 직전 보상형 광고(FR-15), 일일 상한(FR-16), **스테이지 실패 시 즉시 이어하기용 보상형 광고(FR-17, 07-18 신설 — 이전 버전에 누락돼 있었음, 이번 정리에서 추가)**. 아이템 뽑기 플로우가 먼저 있어야 뽑기 직전 삽입 지점이 의미 있고, 타이머(FR-3/5/6/7)가 먼저 있어야 실패 트리거(FR-17)가 의미 있음.

**Source:** step-01 multi-goal split, 2026-07-18(구 FR 라벨) → 2026-07-19 FR 번호 정정 + FR-17 추가. PRD §4.3 참고.

## 결과 카드 + 공유 + 초대 보상 (PRD FR-18~20)

스테이지 클리어/세션 종료 시 동물 티어 결과 카드(FR-18), 기본 공유 시트 공유(FR-19, 항상 노출·무보상), `contactsViral` 연락처 초대 보상(FR-20, 미니앱 승인 후에만 노출). 이전 버전은 "공유 버튼(FR-10)"만 담고 있었는데, FR-18(결과 카드)과 FR-20(초대 보상)이 07-18 세션에서 신설됐음에도 이 백로그에 반영된 적이 없었다 — 이번 정리에서 추가.

**Source:** step-01 multi-goal split, 2026-07-18(구 FR 라벨, FR-18/FR-20 누락) → 2026-07-19 전면 정정. PRD §4.4 참고.

## 코어루프 제한시간 압박 (PRD FR-3, FR-5~9)

제한시간 점진적 감소(FR-3), 오답 시 페널티(FR-5), 타이머 0 도달 시 실패(FR-6), 실패 시 광고/무료재시도 최대 2회(FR-7), 개인 최고 기록(FR-8), 강제 튜토리얼 없는 온보딩(FR-9). **07-18 PRD 재작성 이후 세 번째 세션(PRD→UX→Architecture)째 이 프로젝트의 선언된 코어루프인데도 이전까지 이 백로그 어디에도 없었다** — Implementation Readiness 체크에서 발견된 가장 중요한 공백. `game-architecture.md`가 `useStageTimer` 훅의 구현 코드까지 이미 제공했으므로(Novel Pattern: 스테이지 타이머 생명주기), 설계는 끝났고 통합만 남음.

**Source:** implementation-readiness-report-2026-07-19.md Step 3(Epic Coverage Validation) 발견 → 2026-07-19 신규 추가. PRD §4.1 FR-1~9, `game-architecture.md` Novel Pattern 참고.

## 퍼즐 코어루프 — 리뷰에서 나온 비차단 개선점

`src/game/patternMatch.ts`, `src/hooks/useCurrency.ts`, `src/pages/PuzzlePage.tsx` 리뷰(step-04, 2026-07-18)에서 나왔으나 이번 스토리를 막지 않는 항목들:

- **순수 게임 로직 유닛테스트 부재** — `tilesForStage`/`generateBoard`/`isMatch`는 부작용 없는 순수 함수라 테스트하기 쉬운데 테스트가 없음. 프로젝트에 테스트 러너 자체가 아직 없음(package.json에 test 스크립트 없음). 7일 출시 스코프에서는 의도적으로 제외.
- **타일 버튼 접근성 부재** — 선택/오답 상태가 배경색으로만 전달됨(`aria-pressed`/`aria-label` 없음). 스크린리더 사용자는 상태를 알 수 없음.
- **`App.tsx` 페이지 라우팅이 타입 없는 문자열 리터럴** — `useState<string | null>`로 `"iaa"`/`"puzzle"` 등을 관리, 오타(`"puzzel"`)가 컴파일은 통과하고 런타임에 조용히 아무 동작도 안 함. 이번 변경이 만든 패턴이 아니라 기존 패턴을 그대로 따른 것.
- **localStorage 쓰기 실패가 UI에 드러나지 않음** — quota 초과/프라이빗 브라우징 등으로 `setItem`이 실패하면 콘솔 에러만 남고, 새로고침 시 진행도가 조용히 되돌아감. Toss WebView 환경에서는 발생 가능성이 낮다고 판단해 이번 스코프에서는 보류.

**Source:** step-04 review (blind hunter + edge case hunter), 2026-07-18.

## 패턴매칭 난이도 재설계 — 아이콘 그룹핑 + 보조 도형 배지 + 그리드 상한 확장 (PRD FR-4)

2026-07-19 게임 디자인 세션에서 확정된 난이도 재설계. 그리드 크기·제한시간 두 축만으로는 후반 스테이지가 단조롭거나(같은 종류 압박 반복) 물리적으로 클리어 불가능에 가까워지는 문제가 있어, 아이콘 실루엣 그룹핑(타겟-방해물 유사도)과 보조 도형 배지(모양+배지 conjunction match)를 신규 축으로 추가하고 `MAX_TILES`를 24→36으로 상향하기로 함. `[FIXED 2026-07-19]` 최초엔 배지 대신 색상 변주(hue-rotate)로 검토했으나, 같은 날 Implementation Readiness 체크에서 `DESIGN.md`/`EXPERIENCE.md`의 "매칭 판별은 형태로만, 색상 단독 신호 금지" 원칙과 충돌함이 발견돼 도형 배지로 전환 — UX 문서는 수정하지 않아도 된다(원칙을 깨지 않으므로).

**구현 시 필요한 것**:
- `src/game/patternMatch.ts`: 아이콘을 그룹(개과/고양이과/곰과/기타)으로 분류하는 상수, 배지 도형(●▲■◆ 등) 배정 로직, `isMatch`가 스테이지 구간에 따라 "모양만" 또는 "모양+배지"를 비교하도록 확장, `MAX_TILES` 24→36.
- `src/pages/PuzzlePage.tsx`: 타일 렌더링에 배지 오버레이 추가(색은 보조 신호로만, 배지 모양이 유일한 판별 기준). 컬럼 수는 4 유지(터치 정확도 보호 — 5 이상은 실험 후 결정, 6 이상 금지).
- `spec-pattern-match-core-loop.md`의 frozen 섹션("경로 탐색 로직 없음 — 매칭 조건을 만족하면 매칭 성립")은 이미 2026-07-19에 재협상·갱신 완료 — 이 항목 착수 시 추가 renegotiation 불필요, 다만 실제 코드 구현 시 새 스펙/스토리로 진행할 것.
- 정확한 구간표·배지 종류 수·그룹 구성은 `_bmad-output/planning-artifacts/prds/prd-appintoss-2026-07-17/addendum.md`의 "퍼즐 난이도(그리드 크기 + 아이콘 유사도 + 보조 도형 배지) 밸런스 초안" 섹션 참고.

**Source:** 게임 디자이너 세션(gds-agent-game-designer), 2026-07-19. PRD §4.1 FR-4, `decision-log.md` 2026-07-19 참고.

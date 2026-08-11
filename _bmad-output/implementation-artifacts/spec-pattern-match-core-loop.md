---
title: '패턴매칭 퍼즐 코어루프 프로토타입'
type: 'feature'
created: '2026-07-18'
status: 'done'
context: ['{project-root}/_bmad-output/planning-artifacts/prds/prd-appintoss-2026-07-17/prd.md']
baseline_commit: 'a8b239aeeef584648c88b04f7d24c8acbff9a068'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** PRD의 코어루프(패턴매칭 퍼즐 클리어 → 재화 획득)가 아직 플레이 가능한 형태로 존재하지 않는다. 7일 출시 스코프 전체가 이 시스템 위에 얹힌다.

**Approach:** 항상 화면에 노출된(숨김·암기 없는) 동물 아이콘 타일 그리드에서 같은 아이콘 두 개를 탭해 매칭·제거하는 퍼즐을 새 페이지로 구현한다. 클리어 시 로컬(localStorage) 재화를 지급하고 다음 스테이지로 진행하며, 스테이지가 오를수록 타일 수를 완만히 늘린다.

## Boundaries & Constraints

**Always:**
- 모든 타일은 항상 화면에 보여야 한다 — 뒤집기/암기 메커닉 금지(PRD §5, 기억력 게임 유형은 non-goal).
- 스테이지 클리어 시 정확히 1회만 재화를 지급한다(중복 지급 금지).
- 기존 TDS 컴포넌트(`Top`, `Button`, `TextButton`, `useDialog` 등)와 `App.tsx`의 `useState` 기반 페이지 전환 패턴을 그대로 따른다 — 새 라우터 라이브러리 도입 금지.
- 의료적 효능을 암시하는 문구(치매예방, 인지능력 개선 등)는 사용하지 않는다(PRD §10) — "두뇌 자극/운동" 톤만 허용.

**Ask First:** 그리드가 실제 기기 화면 폭에 맞지 않거나 이 스펙의 난이도 곡선/재화 수치를 크게 바꿔야 한다고 판단되면, 진행 전 확인.

**Never:**
- 가챠/도감, 광고 배치, 공유 기능은 구현하지 않는다 — `_bmad-output/implementation-artifacts/deferred-work.md`로 분리됨.
- 서버/백엔드 연동, 사용자 인증을 추가하지 않는다 — 재화·진행도는 localStorage에만 저장.
- 실제 동물 캐릭터 아트 에셋을 제작하지 않는다 — 프로토타입은 이모지로 대체.
- 경로 탐색(인접/라인 매칭) 로직을 넣지 않는다 — 화면에 보이는 임의의 두 타일이 매칭 조건을 만족하면 매칭 성립(경로/인접 무관). `[2026-07-19 재협상, 마스터 승인]` v1 프로토타입의 매칭 조건은 "같은 아이콘"이었으나, 난이도 재설계(PRD FR-4)로 스테이지 구간에 따라 "모양만" 또는 "모양+보조 도형 배지"로 조건이 확장될 예정 — 최초 검토안(색상 변주)은 UX 접근성 원칙과 충돌해 도형 배지로 대체됐다(같은 날 발견, `decision-log.md` 참고). 정확한 조건·배지 로직은 `addendum.md`와 `deferred-work.md`의 해당 항목 참고, 이 확장은 별도 구현 스토리에서 진행하며 착수 시 이 스펙을 갱신하거나 새 스펙을 만든다.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 매칭 성공 | 서로 다른 두 타일 탭, 아이콘 동일 | 두 타일 제거, 남은 타일 수 갱신 | N/A |
| 매칭 실패 | 서로 다른 두 타일 탭, 아이콘 다름 | 잠깐 하이라이트 후 선택 해제, 상태 원복 | N/A |
| 같은 타일 재탭 | 이미 선택된 타일을 다시 탭 | 선택 해제 | N/A |
| 스테이지 클리어 | 보드의 마지막 페어 매칭 | 재화 +N 지급, 클리어 다이얼로그 표시, 확인 후 자동으로 다음 스테이지 보드 생성 | N/A |
| 재진입 시 진행 유지 | 퍼즐 페이지를 나갔다 재입장 | 이전에 저장된 재화·스테이지 번호로 복원 | localStorage 읽기/파싱 실패 시 스테이지1·재화0으로 초기화 |

</frozen-after-approval>

## Code Map

- `src/game/patternMatch.ts` -- NEW: 순수 함수(`generateBoard(stage)`, 매칭 판정, 타일 아이콘 상수) — UI와 분리된 게임 로직
- `src/hooks/useCurrency.ts` -- NEW: 재화·현재 스테이지를 localStorage에 persist하는 훅
- `src/pages/PuzzlePage.tsx` -- NEW: 그리드 렌더링, 탭 매칭 인터랙션, 클리어 다이얼로그
- `src/App.tsx` -- MODIFY: 홈 화면에 "패턴매칭 퍼즐" 진입 버튼과 `page === "puzzle"` 라우팅 추가

## Tasks & Acceptance

**Execution:**
- [x] `src/game/patternMatch.ts` -- `generateBoard(stage)`, `TILE_ICONS`, 매칭 판정 유틸 작성 -- 로직을 UI에서 분리해 테스트 가능하게 만듦
- [x] `src/hooks/useCurrency.ts` -- currency/stage를 localStorage로 읽고 쓰는 훅 작성 -- FR-2 충족, 재진입 시 진행 유지
- [x] `src/pages/PuzzlePage.tsx` -- 그리드 렌더 + 탭 매칭 인터랙션 + 클리어 다이얼로그(`useDialog`) 구현 -- FR-1, FR-2 충족
- [x] `src/App.tsx` -- 홈에 "패턴매칭 퍼즐" 버튼과 `page="puzzle"` 라우팅 추가 -- 진입점 연결

**Acceptance Criteria:**
- Given 유저가 처음 퍼즐 페이지에 진입, when 스테이지 1 보드가 로드되면, then 모든 타일이 뒤집기 없이 항상 보이는 상태로 렌더된다.
- Given 유저가 마지막 남은 페어를 매칭, when 클리어 처리가 실행되면, then 재화가 정확히 1회 증가하고 클리어 다이얼로그가 표시된다.
- Given 유저가 앱을 나갔다가 재입장, when 퍼즐 페이지에 다시 진입하면, then 이전 재화·스테이지 진행이 유지된다.

## Spec Change Log

- **2026-07-18, step-04 review (patch findings)** — 3개 리뷰 서브에이전트(blind hunter, edge case hunter, acceptance auditor)가 찾은 아래 항목을 코드에 직접 패치:
  - `handleTap`이 I/O 매트릭스 "같은 타일 재탭 → 선택 해제" 행을 구현하지 않고 있던 버그 수정(재탭 시 no-op이던 것을 deselect로 변경).
  - `loadProgress`가 타입만 검사하고 값 범위를 검사하지 않아 손상된 localStorage(`stage`가 음수/소수 등)가 `generateBoard`에서 `RangeError`로 이어질 수 있던 문제 수정 — `Number.isInteger` + 범위 검사 추가.
  - 클리어 처리에 `clearedRef` 가드 추가(React StrictMode 등으로 인한 중복 지급 방지).
  - `TILE_ICONS`/`MAX_TILES` 결합 관계와 `exhaustive-deps` 억제 사유를 설명하는 주석 추가.
  - 비차단 항목은 `deferred-work.md`로 이동.
- **2026-07-18, intent_gap 해소 (human-approved)** — 어셉턴스 오디터가 지적한 모순: "Approach"는 자동 진행을 서술하는데 I/O 매트릭스는 "'다음 스테이지' 버튼 노출"이라고 적어 상충. 마스터에게 확인한 결과 **자동 진행 유지**로 확정(현재 코드가 이미 이 동작). I/O 매트릭스 "스테이지 클리어" 행 문구를 자동 진행에 맞게 수정. **KEEP**: 클리어 다이얼로그 확인 즉시 자동으로 다음 스테이지가 생성되는 현재 동작은 그대로 유지 — 버튼 게이팅으로 바꾸지 말 것.
- **2026-07-19, 재미요소/난이도 재설계 세션 (human-approved, frozen 섹션 renegotiation)** — 게임 디자이너 세션에서 그리드+타이머 두 축만으로는 난이도 곡선이 단조롭고, 후반 스테이지에서 타이머 하한+그리드 상한이 겹쳐 클리어가 거의 불가능한 구간이 생길 위험이 확인됨. 매치 조건을 스테이지 구간별로 "모양만" → "모양+색"으로 확장하고 `MAX_TILES`를 24→36으로 올리기로 결정 — frozen Boundaries의 매칭 조건 서술을 바꾸는 사안이라 마스터에게 재협상 승인받음(위 Never 항목 갱신). **실제 코드 구현은 아직 하지 않음** — 별도 구현 스토리로 분리(`deferred-work.md` "패턴매칭 난이도 재설계" 항목), 착수 시 이 스펙을 갱신하거나 새 스펙 작성. 상세 근거는 PRD `addendum.md`/`decision-log.md` 2026-07-19 항목 참고.
- **2026-07-25, 난이도 재설계 아키텍처 명세화 (gds-agent-game-architect)** — 위 항목이 예고한 "별도 스펙"을 `spec-pattern-match-difficulty.md`로 작성. `Tile.badge` 필드 추가·`isMatch` badgeRequired 확장·`balance.ts`에 난이도 파생 SoT 집약·**배지→상한 순서 의존성**(pairCount>12에서 아이콘 중복으로 매치가 깨지는 균열) 등 4개 아키텍처 결정 확정. 이 스펙의 frozen "경로 탐색 없음" 계약은 유효하게 유지되며 매치 판별 축만 확장. 실제 코드 구현은 dev 스토리에서 진행.
## Design Notes

스테이지별 타일 수 기본값: `min(6 + (stage-1) * 2, 24)` (3쌍 시작, 스테이지당 1쌍씩 증가, 최대 12쌍/24타일). PRD FR-3의 "완만한 난이도 상승" 요구를 구체 수치로 확정한 것 — `[ASSUMPTION]`, 이후 플레이테스트로 튜닝 가능.

`[UPDATE 2026-07-19]` 이 상한(24)과 단순 증가 방식은 난이도 재설계(FR-4)로 대체될 예정이다 — 새 구간표(그리드 + 아이콘 그룹핑 + 색 변주, 최대 36타일/18쌍)는 `addendum.md`의 "퍼즐 난이도" 섹션 참고. 이 문서의 위 수치는 실제 구현된 v1 코드 상태를 그대로 반영한 기록이므로 수정하지 않고 유지하며, 새 구현 시 별도 스펙/스토리에서 갱신한다.

클리어 보상: 스테이지당 재화 +10 고정 — `[ASSUMPTION]`, PRD §3에서 재화 정식 명칭·수치가 미정임을 승계.

## Verification

**Commands:**
- `npm run lint` -- expected: 에러 없음
- `npm run dev` -- expected: 홈 → "패턴매칭 퍼즐" 진입 → 매칭 플레이 → 클리어 다이얼로그까지 수동 확인

**Manual checks (if no CLI):**
- 브라우저에서 그리드가 화면 폭 안에 들어오는지 확인
- devtools localStorage에 재화·스테이지 값이 저장되는지 확인

## Suggested Review Order

**게임 로직 (엔트리 포인트)**

- 순수 함수만으로 매칭 판정/보드 생성/난이도 곡선을 UI와 분리 — 여기서 게임 규칙을 먼저 이해하면 나머지가 쉬워짐.
  [`patternMatch.ts:26`](../../src/game/patternMatch.ts#L26)

- 스테이지당 페어 수를 셔플해 보드를 만드는 핵심 로직.
  [`patternMatch.ts:39`](../../src/game/patternMatch.ts#L39)

**탭 상호작용 상태머신**

- 재탭 시 선택 해제, 2개 초과 탭 차단 — 리뷰에서 재탭 버그가 발견돼 수정된 지점.
  [`PuzzlePage.tsx:65`](../../src/pages/PuzzlePage.tsx#L65)

- 매칭/미스매치 판정과 500ms 후 초기화 타이머.
  [`PuzzlePage.tsx:31`](../../src/pages/PuzzlePage.tsx#L31)

- 스테이지 클리어 감지 + `clearedRef` 가드(중복 지급 방지, 리뷰에서 추가) + 다이얼로그.
  [`PuzzlePage.tsx:51`](../../src/pages/PuzzlePage.tsx#L51)

**진행도 영속화**

- localStorage 값 검증(정수·범위) — 손상된 데이터로 인한 크래시를 막기 위해 리뷰 후 추가.
  [`useCurrency.ts:12`](../../src/hooks/useCurrency.ts#L12)

- 클리어 시 재화/스테이지 갱신.
  [`useCurrency.ts:50`](../../src/hooks/useCurrency.ts#L50)

**진입점 연결 (주변부)**

- 홈 화면에 퍼즐 진입 버튼과 페이지 라우팅 추가.
  [`App.tsx:11`](../../src/App.tsx#L11)

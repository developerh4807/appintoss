---
title: '패턴매칭 난이도 재설계 — 아이콘 그룹핑 + 보조 도형 배지 + 그리드 상한 확장 (FR-4)'
type: 'feature'
created: '2026-07-25'
status: 'ready-for-dev'
architect: 'Cloud Dragonborn (gds-agent-game-architect)'
context:
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-appintoss-2026-07-17/prd.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-appintoss-2026-07-17/addendum.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-pattern-match-core-loop.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-appintoss-2026-07-18/DESIGN.md'
supersedes_note: 'spec-pattern-match-core-loop.md가 예고한 "난이도 재설계 별도 스펙"이 이 문서다. 그 스펙의 frozen Never 항목("경로 탐색 없음")은 유효하게 유지되며, 이 문서는 매치 판별 축만 확장한다.'
baseline_commit: 'a367662'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 현재 난이도는 그리드 크기(`tilesForStage`)와 제한시간(`initialSecondsForStage`) 두 축뿐이다. 이 두 축만으로는 (a) 후반 스테이지가 "같은 종류의 압박 반복"이라 단조롭고, (b) 타이머 하한(5초)과 그리드 상한(24타일)이 겹치는 구간에서 물리적으로 클리어 불가능에 가까워진다. PRD FR-4가 요구하는 "완만하고 지속 가능한 난이도 상승"이 성립하지 않는다.

**Approach:** 시각 탐색 난이도의 세 번째·네 번째 축을 추가한다 — (1) **아이콘 그룹핑**(target-distractor 유사도): 후반부터 실루엣이 비슷한 같은 그룹 안에서만 타일을 뽑아 변별을 어렵게 한다. (2) **보조 도형 배지**(conjunction search): 타일 우측 상단에 도형 배지(●▲■◆)를 얹고, 후반부터 "모양+배지가 모두 같아야" 매치되게 한다. 그리드 상한은 배지 축이 조합 공간을 넓혀준 만큼 24→36으로 올리되, 터치 정확도를 지키기 위해 **컬럼 수는 4로 고정**한다.

이 확장으로 그리드를 더 키우지 않고도 난이도를 계속 올릴 수 있다.

## Boundaries & Constraints

**Always:**
- 매치 판별은 **아이콘 형태(+후반엔 배지 도형)로만** 이뤄진다 — 색상 단독 신호 금지(DESIGN.md/EXPERIENCE.md `final` 접근성 계약). 배지에 색을 입혀도 되나 **배지 도형이 유일한 판별 기준**이어야 하고, 색은 항상 redundant 보조 신호다.
- 배지 도형(●▲■◆…)은 DOM에 실제 문자/요소로 존재해야 한다 — CSS 배경/의사요소 색만으로 표현 금지(스크린리더·색맹 대응).
- 난이도 파생 로직(아이콘 풀 선택, 배지 종수, 매치 모드)은 스테이지를 입력으로 받는 **순수 함수**로 작성하고, 시간 축 함수들이 이미 사는 SoT 근처에 모은다 (아래 §Code Map 참고).
- 기존 코어루프 계약을 그대로 유지한다 — 항상 보이는 타일(뒤집기 금지), 클리어 1회 재화 지급, `App.tsx` useState 라우팅, localStorage-only 영속화.

**Ask First:**
- 컬럼 수를 4에서 바꿔야 한다고 판단되면 진행 전 확인(5는 실험적, 6+ 금지 — 360px 기준 컬럼당 폭이 44px 터치 최소치 아래로 떨어짐).
- 아래 §Design Data의 그룹 구성/구간표를 코드의 실제 `TILE_ICONS`와 맞추다가 밸런스를 크게 바꿔야 하면 확인.

**Never:**
- **경로 탐색(인접/라인 매칭) 로직을 넣지 않는다** — spec-pattern-match-core-loop.md의 frozen 계약 유지. 화면에 보이는 임의의 두 타일이 매치 조건을 만족하면 성립.
- 새 동물 아트 에셋을 제작하지 않는다 — 기존 12종 이모지 그대로. 배지는 도형 문자로 얹는다(신규 아트 불필요).
- 아이콘 풀을 12종에서 늘리지 않는다 — 난이도는 그룹핑·배지·상한으로 올리며, `[SUPERSEDED 2026-07-19]` "아이콘 종류 확장" 방향은 폐기됐다.
- 서버/인증/백엔드를 추가하지 않는다.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 매치 성공 (모양만 구간) | badgeRequired=false 스테이지, 두 타일 아이콘 동일 | 매치 성립(배지 무관) | N/A |
| 매치 성공 (모양+배지 구간) | badgeRequired=true 스테이지, 아이콘·배지 모두 동일 | 매치 성립 | N/A |
| 매치 실패 (배지만 다름) | badgeRequired=true, 아이콘 같고 배지 다름 | 미스매치 처리(기존 페널티 경로 재사용) | N/A |
| 그룹 구간 보드 생성 | 같은-그룹-only 구간 | 해당 스테이지의 아이콘이 한 그룹 안에서만 선택됨 | 그룹 크기 < 필요 페어수면 그룹 내에서 아이콘 재사용 허용(배지로 쌍 고유성 확보) |
| 상한 도달 | stage가 커서 tilesForStage=36 | 36타일(18쌍)까지만 생성, 그 이상 안 늘어남 | N/A |
| **쌍 고유성(핵심)** | pairCount > 12 (배지 구간) | 각 쌍이 (아이콘, 배지) 조합으로 유일해야 함 — 같은 조합이 두 쌍 생기면 안 됨 | 조합 공간(아이콘수 × 배지종수)이 pairCount보다 작으면 배지 종수를 먼저 늘려 공간 확보 |
| 컬럼 유지 | 타일 수 6~36 전 구간 | 항상 4컬럼, 타일은 세로로만 증가 | N/A |

</frozen-after-approval>

## Design Data (플레이테스트로 조정 가능한 시작값)

`[ASSUMPTION]` 아래 수치는 addendum.md 밸런스 초안을 **코드의 실제 `TILE_ICONS` 12종에 맞춰 확정**한 것이다. addendum 예시는 🐺(코드에 없음)를 썼고 🐸를 누락했으나, 아래 표가 실제 구현 기준이다.

**아이콘 그룹 구성 (코드 실측 12종 기준):**

현재 `TILE_ICONS` = 🐶 🐱 🐰 🐻 🐼 🦊 🐨 🐯 🦁 🐷 🐮 🐸

| 그룹 | 아이콘 | 근거 |
|------|--------|------|
| 개·여우과 | 🐶 🦊 | 뾰족귀 실루엣 |
| 고양이과 | 🐱 🐯 🦁 | 둥근 얼굴+귀 실루엣 |
| 곰·판다과 | 🐻 🐼 🐨 | 둥근 귀+넓은 얼굴 |
| 기타(농장·소동물) | 🐰 🐷 🐮 🐸 | 서로 실루엣이 뚜렷이 달라 가장 쉬움 |

→ dev 판단 포인트: 그룹당 아이콘 수가 2~4로 고르지 않다. 같은-그룹-only 구간에서 필요 페어수가 그룹 크기를 넘으면 **배지로 쌍을 구별**하므로 문제없다(그래서 그룹 구간과 배지 구간이 겹치도록 구간표를 짰다).

**통합 스테이지 구간표:**

| 구간(stage) | 타일 수(페어) | 컬럼 | 아이콘 풀 | 배지 종수 | 매치 조건 |
|------|------|------|------|------|------|
| 1~5 | 6~14개(3~7쌍) | 4 | 전체 12종 랜덤 혼합 | 0 (배지 없음) | 모양만 |
| 6~10 | 16개(8쌍) | 4 | 같은 그룹 내에서만 | 0 | 모양만 |
| 11~15 | 20개(10쌍) | 4 | 같은 그룹 + | 2~3종 | 모양+배지 |
| 16~18 | 24개(12쌍) | 4 | 같은 그룹 + | 3~4종 | 모양+배지 |
| 19+ | 36개(18쌍) | 4 | 그룹+배지 고정, 조합 랜덤성 최대 | 4종 | 모양+배지 |

배지 도형 4종 제안: ● ▲ ■ ◆ (원·삼각·사각·다이아 — 서로 실루엣이 뚜렷이 구분). 플레이테스트에서 사각↔다이아 오판별이 잦으면 종수를 줄이거나 더 구분되는 도형으로 교체.

**조합 공간 검산:** 19+ 구간은 18쌍 필요. 같은 그룹(최대 4아이콘 in 고양이/곰/기타는 3~4) × 배지 4종 = 12~16조합 → 18쌍에 부족할 수 있다. 따라서 19+ 구간은 **그룹 제약을 완화(전체 12종 허용)**하거나 배지를 쌍마다 랜덤 배정해 12아이콘 × 4배지 = 48조합에서 18쌍을 뽑는다. → §Tasks에서 dev가 이 지점을 명시적으로 처리해야 한다(균열 검산).

## Architecture Decisions (아키텍트 확정 — 이게 이 문서의 핵심)

### AD-1. `Tile`에 `badge` 필드 추가, 매치 정체성 확장
`Tile`을 `{ id: string; icon: string; badge: BadgeShape | null }`로 확장한다. `badge`가 `null`이면 배지 없는 구간(1~10)이다. 이렇게 하면 배지 없는 구간과 있는 구간이 같은 타입으로 표현된다.

### AD-2. `isMatch`에 매치 모드를 주입 (스테이지를 직접 알게 하지 않음)
`isMatch(a, b)`를 `isMatch(a, b, { badgeRequired: boolean })`로 확장한다. **`isMatch`가 stage를 직접 받지 않는 이유**: 매치 판별 순수 함수는 "무엇으로 비교하는가"만 알면 되고, "몇 스테이지가 배지 구간인가"는 별도 밸런스 함수의 책임이다(관심사 분리). 호출부(`PuzzlePage`)가 `badgeRequiredForStage(stage)`를 계산해 넘긴다.

### AD-3. 난이도 파생 로직의 SoT는 `balance.ts`
신규 스테이지 함수들을 `balance.ts`에 모은다 — 이미 `initialSecondsForStage`가 여기 살고 있어 "스테이지→난이도 파라미터" 파생이 한 파일에 모인다. `patternMatch.ts`는 순수 보드 생성/매치 로직만 유지한다.
- `iconPoolForStage(stage): string[]` — 전체 12종 or 특정 그룹 반환
- `badgeCountForStage(stage): number` — 0/2/3/4
- `badgeRequiredForStage(stage): boolean` — badgeCount > 0
- (`tilesForStage`는 현재 `patternMatch.ts`에 있음 → 상한만 36으로 수정, 이동은 선택. 이동하면 밸런스 함수가 한 곳에 모이므로 권장하나 필수는 아님 — dev 판단.)

### AD-4. 구현 순서 의존성 (하드 제약)
**배지 축을 먼저, `MAX_TILES` 상향을 나중에.** 이유: 현재 `generateBoard`는 `TILE_ICONS[i % 12]`로 아이콘을 순환 배정하는데, pairCount가 12를 넘으면 **같은 아이콘이 두 쌍 이상 생성**되고 `isMatch(icon만 비교)`가 잘못된 쌍을 매치로 인정한다. 지금은 상한 24(12쌍)라 딱 막혀 안 터진다. 배지가 쌍의 고유 키를 `(icon, badge)` 조합으로 복원하기 전에 상한만 36으로 올리면 **게임이 깨진다**. → 배지 도입 → 쌍 고유성 검증 → 그 다음 상한 확장.

### AD-5. 접근성 배지 라벨 (P2 타일 접근성과 통합)
배지를 넣는 순간이 타일 `aria-label`을 넣을 적기다(같은 벽). 각 타일 버튼은 `aria-label`로 "곰, 삼각 배지" / "곰"(배지 없는 구간)을, 상태를 `aria-pressed`(선택 여부)로 노출한다. → deferred-work.md "타일 접근성" 항목이 이 스토리에서 함께 해소된다.

## Code Map

- `src/game/patternMatch.ts` -- MODIFY: `Tile`에 `badge` 추가, `BadgeShape` 타입/상수, `generateBoard`가 `iconPool`·`badgeCount`를 받아 `(icon,badge)` 조합으로 유일한 쌍 생성, `isMatch`에 `badgeRequired` 옵션, `MAX_TILES` 24→36(배지 로직 완료 후)
- `src/game/balance.ts` -- MODIFY: `iconPoolForStage`, `badgeCountForStage`, `badgeRequiredForStage` 추가. 아이콘 그룹 상수 정의(또는 patternMatch.ts에 두고 import — dev 판단)
- `src/pages/PuzzlePage.tsx` -- MODIFY: 타일 렌더에 배지 오버레이(우측 상단, 도형 문자), `isMatch` 호출부에 `badgeRequiredForStage(stage)` 주입, 타일 버튼에 `aria-label`/`aria-pressed`. 컬럼은 기존 `COLUMNS=4` 유지
- `spec-pattern-match-core-loop.md` -- MODIFY(최소): Spec Change Log에 "난이도 재설계는 spec-pattern-match-difficulty.md로 이관·구현" 한 줄 추가

## Tasks & Acceptance

**Execution:**
- [ ] `patternMatch.ts` -- `BadgeShape` 타입(●▲■◆)·상수, `Tile.badge` 필드 추가
- [ ] `patternMatch.ts` -- `generateBoard`를 `(iconPool, badgeCount)` 파라미터화, `(icon,badge)` 조합이 쌍마다 유일하도록 생성(AD-4 균열 처리), 조합 공간 부족 시 배지로 확장
- [ ] `patternMatch.ts` -- `isMatch(a, b, { badgeRequired })` 시그니처 확장, badgeRequired면 icon+badge 둘 다 비교
- [ ] `balance.ts` -- `iconPoolForStage`/`badgeCountForStage`/`badgeRequiredForStage` + 그룹 상수, §Design Data 구간표 반영
- [ ] `patternMatch.ts` -- `MAX_TILES` 24→36 (**위 배지 태스크 완료 후에만**)
- [ ] `PuzzlePage.tsx` -- 배지 오버레이 렌더 + `isMatch` 호출부에 badgeRequired 주입
- [ ] `PuzzlePage.tsx` -- 타일 버튼 `aria-label`(아이콘+배지)·`aria-pressed` 추가 (P2 통합)

**Acceptance Criteria:**
- Given 스테이지 3(모양만 구간), when 보드가 로드되면, then 모든 타일에 배지가 없고(badge=null) 아이콘만으로 매치된다.
- Given 스테이지 12(모양+배지 구간), when 아이콘은 같지만 배지가 다른 두 타일을 탭하면, then 미스매치로 처리된다(기존 페널티 경로).
- Given 스테이지 20(36타일 구간), when 보드가 생성되면, then 어떤 (아이콘,배지) 조합도 두 쌍 이상 존재하지 않는다(쌍 고유성).
- Given 배지 있는 타일, when 스크린리더로 읽으면, then 아이콘과 배지 도형이 모두 음성으로 구별된다(색 없이).
- Given 전 구간, when 렌더되면, then 컬럼 수는 항상 4다.

## Verification

**Commands:**
- `npm run lint` -- expected: 에러 없음
- `npm run dev` -- expected: 스테이지 1→6→11→16→19 진행하며 아이콘풀/배지/매치조건이 구간표대로 바뀌는지 수동 확인

**Manual checks:**
- 브라우저 devtools로 20+ 스테이지 보드 생성 후 (아이콘,배지) 조합 중복이 없는지 확인
- 색맹 시뮬레이션(devtools rendering emulation)으로 배지가 색 없이 구별되는지 확인
- 360px 폭에서 4컬럼 타일이 44px 이상 유지되는지 확인

## Open Questions
- 19+ 구간의 그룹 제약 완화 vs 배지 랜덤 배정 — 어느 쪽이 "조합 랜덤성 최대화" 의도에 더 맞는지는 dev 구현 후 플레이테스트로 결정(§Design Data 조합 공간 검산 참고).
- 배지 4종(●▲■◆) 중 사각↔다이아 소화면 변별력 — QR 실기기 테스트에서 확인.

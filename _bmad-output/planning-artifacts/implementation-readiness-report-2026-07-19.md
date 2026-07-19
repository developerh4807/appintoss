---
stepsCompleted: [step-01-document-discovery, step-02-gdd-analysis, step-03-epic-coverage-validation, step-04-ux-alignment, step-05-epic-quality-review, step-06-final-assessment]
documentInventory:
  gdd: none
  architecture:
    - path: _bmad-output/planning-artifacts/architecture/architecture-appintoss-2026-07-19/game-architecture.md
      note: whole document, 401 lines, updated 2026-07-19 (SUPERSEDED icon-pool note patched same day)
  epics: none
  ux:
    - path: _bmad-output/planning-artifacts/ux-designs/ux-appintoss-2026-07-18/DESIGN.md
      note: whole document, 142 lines
    - path: _bmad-output/planning-artifacts/ux-designs/ux-appintoss-2026-07-18/EXPERIENCE.md
      note: whole document, 194 lines
  prd:
    - path: _bmad-output/planning-artifacts/prds/prd-appintoss-2026-07-17/prd.md
      note: active/current PRD, 224 lines, updated 2026-07-19 (FR-4 재작성)
    - path: _bmad-output/planning-artifacts/prds/prd-appintoss-2026-07-17/addendum.md
      note: balance drafts, updated 2026-07-19
    - path: _bmad-output/planning-artifacts/prds/prd-appintoss-2026-07-17/decision-log.md
      note: decision history, updated 2026-07-19
  brief:
    - path: _bmad-output/planning-artifacts/briefs/brief-appintoss-2026-07-16/addendum.md
      note: only substantive brief content that exists; no separate brief.md file
  priorReadinessReport: _bmad-output/planning-artifacts/implementation-readiness-report-2026-07-18.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-07-19
**Project:** appintoss

## GDD Analysis

**GDD 부재 — PRD로 대체 분석.** 이 프로젝트는 GDD 문서가 존재하지 않는다. `decision-log.md`(2026-07-18)에 따르면 이는 사고 누락이 아니라 의도적 결정이다 — "프로토타입 우선으로 빠르게 움직여온 이 프로젝트의 흐름상 GDD 선행 없이 PRD 안에서 바로 진행"하기로 확인됨. 따라서 이 단계는 GDD 대신 `prd.md`(`prd-appintoss-2026-07-17/`)를 완독해 FR/NFR을 추출한다.

### Functional Requirements

FR-1: 유저는 패턴매칭 퍼즐 스테이지를 제한시간 내에 플레이하고 클리어할 수 있다.
FR-2: 유저는 스테이지 클리어 시 재화를 획득한다. `[ASSUMPTION]` 클리어당 획득량은 스테이지 난이도와 무관하게 고정값(addendum.md: 스테이지당 +1단위).
FR-3: `[ASSUMPTION]` 제한시간은 스테이지 진행에 따라 점진적으로 감소한다. 초반 스테이지는 완화된 고정 구간을 둘 수 있다. 정확한 초 단위 값·감소폭·하한선은 플레이테스트로 조정(addendum.md 초안 참고).
FR-4: *(2026-07-18 신설, 2026-07-19 재설계)* 퍼즐 자체의 난이도도 스테이지 진행에 따라 상승한다. 그리드 크기, 아이콘 실루엣 유사도(그룹핑), 색 변주(conjunction match) 세 축을 결합해 난이도를 올린다. `[ASSUMPTION]` 그룹·색 도입 구간, 색상 수, 그리드 상한은 addendum.md 참고, 플레이테스트로 조정.
FR-5: 오답(미스매치) 시 제한시간에서 즉시 페널티가 차감된다. `[ASSUMPTION]` 정확한 차감폭은 플레이테스트로 조정.
FR-6: 제한시간이 0에 도달하면 해당 스테이지는 실패 처리된다.
FR-7: 스테이지 실패 시, 유저는 보상형 광고를 시청해 제한시간을 회복하고 즉시 이어할 수 있다. 광고를 보지 않으면 처음부터 무료 재시도 가능하나, 동일 스테이지 연속 무료 재시도는 최대 2회까지만 허용(3회차부터 광고 필수). `[ASSUMPTION]` 정확한 허용 횟수는 플레이테스트로 조정.
FR-8: 유저는 자신의 개인 최고 기록(도달한 최고 스테이지)을 확인할 수 있다 — 아이템 뽑기의 동기부여 엔진.
FR-9: *(NEW 2026-07-18)* 유저는 별도의 강제 튜토리얼 없이 앱 실행 직후 바로 스테이지 1을 플레이하며 규칙을 직관적으로 파악할 수 있다. 아이템 메커닉은 첫 획득 시점에 한해 1회성 컨텍스트 툴팁으로 설명.
FR-10: 유저는 재화를 소모해 아이템 뽑기를 할 수 있다. `[ASSUMPTION]` 뽑기 비용은 클리어 획득량의 배수(초안: 3단위).
FR-11: 유저는 보상형 광고를 시청해 무료로 아이템 뽑기 기회를 얻을 수 있다.
FR-12: MVP 아이템 풀은 3종으로 고정한다 — (a) 제한시간 즉시 회복, (b) 오답 페널티 1회 무효화, (c) 다음 스테이지 클리어 시 재화 2배 획득. `[ASSUMPTION]` 등장 확률은 addendum.md 참고.
FR-13: 유저는 보유한 아이템을 인벤토리 화면에서 확인하고, 스테이지 시작 전 또는 플레이 중 소모해 즉시 효과를 적용할 수 있다.
FR-14: 메인/인벤토리 화면에 하단 고정 배너 광고가 상시 노출된다.
FR-15: 아이템 뽑기 직전 시점에 보상형 광고 시청 옵션이 노출된다.
FR-16: `[ASSUMPTION]` 일일 보상형 광고 시청 상한은 높게 설정한다(정확한 수치 미정).
FR-17: *(NEW 2026-07-18)* 스테이지 실패(제한시간 소진) 시점에 보상형 광고 시청 옵션이 노출된다.
FR-18: 유저는 스테이지 클리어 또는 세션 종료 시 성과 프레이밍 결과 카드(동물 티어 등급)를 확인할 수 있다. `[ASSUMPTION]` 티어 판정 기준은 addendum.md 참고.
FR-19: 유저는 결과 카드를 기본 공유 시트(또는 `getTossShareLink`)를 통해 누구에게나 공유할 수 있다. 보상 없음, 미니앱 승인 여부와 무관하게 항상 노출.
FR-20: 유저는 `contactsViral`을 통해 연락처 기반으로 친구를 초대할 수 있다. 초대받은 친구가 미니앱을 실행하면 초대자는 아이템 뽑기권을 보상으로 받는다.

**Total FRs: 20**

### Non-Functional Requirements

NFR-1 (Platform/호환성): 배너 광고는 토스앱 5.241.0 이상에서만 지원 — 하위 버전 예외 처리 필요 (§4.3).
NFR-2 (Platform/호환성): `contactsViral`은 토스앱 5.223.0 미만에서 호출 결과가 `undefined` — 버전 분기 처리 필요 (§4.4).
NFR-3 (Reliability/플랫폼 상태 의존): `contactsViral`은 미니앱 승인 완료 전 Internal Server Error 반환 — 승인 전에는 초대 보상 버튼 숨기고 공유만 노출 (§4.4).
NFR-4 (Compliance/정책): 리워드 정책상 현금성/사행성 보상 등록 불가 — 아이템 뽑기권(가상재화)만 지급 가능. 리워드 ID당 유저 1일 1회 발송 제한 (§4.4).
NFR-5 (Compliance/법적 리스크): 치매예방·인지능력 개선 등 의료적 효능 주장을 절대 하지 않는다 — Lumosity 2016 FTC $2M 배상 사례가 직접 반면교사. 국내 건강기능식품법·의료법·표시광고법 저촉 우려. "두뇌 자극/두뇌 운동" 등 완곡 표현만 허용 (§10).
NFR-6 (Compliance/카피 정책): 결과 카드 카피는 "측정/검사/진단" 등 과학적 평가를 함의하는 단어를 쓰지 않는다 — 동물 티어는 재미 요소이지 인지능력 평가가 아님을 명확히 (§4.4).
NFR-7 (Business): 인앱광고 수익화를 위해 사업자 등록이 필요할 수 있음. `[ASSUMPTION]` 등록 상태 미확인 (§7).

**Total NFRs: 7**

### Additional Requirements (Constraints/Assumptions)

- **하드 데드라인**: 14일 내 개발 완료 + 앱인토스 심사 제출 완료가 유일한 게이팅 지표. DAU/매출/완성도는 게이팅 아님(§11).
- **Counter-metrics**: 완성도를 높이려 출시를 늦추는 것, 아이템 뽑기 동기부여를 정교화하려 새 시스템(레어도·마스터리 등)을 추가하는 것 — 둘 다 이 프로젝트에서는 안티패턴으로 명시(§11).
- **Non-Goals (§5)**: 기억력 게임 유형, 동물 캐릭터 수집/도감, 토스포인트 실지급 연동, 친구 랭킹/리더보드, IAP, `contactsViral` 표준 플로우를 벗어나는 커스텀 리퍼럴, 정밀 밸런싱(이 PRD 단계), 반응속도의 "나이" 환산 프레이밍, 강제 스킵불가 튜토리얼.
- **플랫폼 미확정**: WebView(`@apps-in-toss/web-framework`) vs React Native(`@apps-in-toss/framework`) 중 최종 선택 미확정 — 개발 착수 시점에 결정 필요(§7, Open Question #5).
- **재화 정식 명칭 미정**(§3, Open Question #4).
- **콘솔 작업 필요**: `contactsViral` 리워드 등록(이름, 수량, 일일 제한)은 코드 작업이 아니라 앱인토스 콘솔 설정 — 이 PRD 세션 범위 밖(Open Question #7).
- **심사 SLA 리스크**: 게임 카테고리 심사 기간이 2-4주로 확인되어, 14일 개발 목표를 채워도 "라이브 출시"까지의 시점은 플랫폼 SLA에 달려있어 확정 불가(§11, Open Question #1) — 이 PRD는 "심사 제출 완료"를 성공 기준으로 재정의해 이 리스크를 팀 통제 범위 밖으로 명시적으로 분리함.

### GDD Completeness Assessment

GDD 자체는 없지만, PRD가 FR 20개·NFR 7개를 구체적으로 명시하고 있어 requirement-traceability 관점에서 큰 공백은 아니다 — 이 프로젝트 규모(솔로 개발, 14일 목표)에서는 GDD를 따로 만드는 것보다 PRD+addendum(수치 초안)+decision-log(결정 이력) 조합으로 대체하는 편이 합리적이라는 이전 세션 판단과 일치한다.

다만 두 가지는 이 시점에서 명확히 짚어야 한다:
1. **PRD는 구조를 정의할 뿐 실행 단위로 쪼개져 있지 않다** — Epics/Stories 문서가 없으므로(Step 1 WARNING), 20개 FR이 어떤 순서로, 어떤 스토리로 나뉘어 구현되는지는 아직 어디에도 없다. 지금까지는 `spec-pattern-match-core-loop.md` 같은 개별 스펙 파일로 그때그때 스코프를 잘라왔는데, 이 방식이 남은 FR(10~20)까지 계속 유지 가능한지는 Step 3(Epic Coverage)에서 판단한다.
2. **FR-4(오늘 재설계)는 PRD엔 있지만 코드엔 전혀 없다** — 프로토타입은 FR-1~3 수준(타이머조차 없음)까지만 구현됨. FR 개수 대비 구현 진행률이 낮다는 점은 Epic Coverage 단계에서 갭으로 잡힐 것이다.

## Epic Coverage Validation

**Epics/Stories 문서 자체가 없다.** Step 1에서 이미 WARNING으로 잡힌 사항 — 형식적 의미의 "Epic 커버리지"는 0/20(0%)이다. 대신 이 프로젝트는 개별 스펙 파일(`spec-pattern-match-core-loop.md`)과 `deferred-work.md` 백로그 목록으로 FR을 느슨하게 추적해왔다. 이 두 문서를 Epic의 대용으로 취급해 커버리지를 분석한다.

### Coverage Matrix

| FR | 내용(요약) | 추적 문서 | 상태 |
|---|---|---|---|
| FR-1 | 제한시간 내 퍼즐 플레이·클리어 | `spec-pattern-match-core-loop.md` | ⚠️ 부분 구현 — 클리어는 되지만 "제한시간 내"가 없음(타이머 자체가 코드에 없음) |
| FR-2 | 클리어 시 재화 획득 | `spec-pattern-match-core-loop.md` | ✓ 구현됨 (단, 수치 불일치 — 아래 참고) |
| FR-3 | 제한시간 점진적 감소 | **없음** | ❌ MISSING — 코드에도 문서에도 없음 |
| FR-4 | 그리드+그룹핑+색변주 난이도 | `addendum.md`, `deferred-work.md`(오늘 추가) | ⚠️ 추적만 됨, 미구현 |
| FR-5 | 오답 시 시간 페널티 | **없음** | ❌ MISSING |
| FR-6 | 타이머 0 → 스테이지 실패 | **없음** | ❌ MISSING |
| FR-7 | 실패 시 광고/무료재시도(2회 상한) | **없음** | ❌ MISSING |
| FR-8 | 개인 최고 기록 | **없음** | ❌ MISSING |
| FR-9 | 강제 튜토리얼 없는 온보딩 | **없음** | ❌ MISSING (구현 안 된 게 아니라 "타이머가 없어서 결과적으로 참"인 우연의 일치 — FR-3 구현되면 그레이스 구간 로직이 새로 필요) |
| FR-10~13 | 기능성 아이템 뽑기+인벤토리 | `deferred-work.md` "동물 캐릭터 가챠 / 도감" 항목 | 🔴 **내용 자체가 폐기된 기능을 설명 중** — 아래 참고 |
| FR-14~17 | 광고 배치(배너+보상형+실패시이어하기) | `deferred-work.md` "광고 배치" 항목 | ⚠️ FR 번호 라벨 낡음, FR-17(실패 시 이어하기)은 항목에 없음 |
| FR-18 | 결과 카드(동물 티어) | **없음** | ❌ MISSING |
| FR-19 | 결과 카드 공유 | `deferred-work.md` "공유 버튼" 항목 | ⚠️ FR 번호 낡음(舊 FR-10) |
| FR-20 | `contactsViral` 초대 보상 | **없음** | ❌ MISSING — 07-18에 신설된 FR인데 백로그에 전혀 없음 |

### Critical Missing Coverage

**🔴 CRITICAL — `deferred-work.md`의 FR 번호·내용이 07-18 PRD 전면 재번호화 이전 것으로 멈춰있다.** "PRD FR-4~6", "FR-7~9", "FR-10"이라는 라벨은 07-17 초안 시절 번호이고, 지금 PRD의 같은 번호는 완전히 다른 내용(FR-4=퍼즐 난이도, FR-7=무료재시도 상한 등)을 가리킨다. 더 심각한 건 "동물 캐릭터 가챠 / 도감" 항목 — 이건 07-18에 **PRD가 명시적으로 폐기한 기능**(§5 Non-Goal)을 여전히 백로그 작업 항목으로 들고 있는 것이다. 누군가 이 문서만 보고 구현에 들어가면 이미 죽은 기능을 만들게 된다.

**🔴 CRITICAL — 이 프로젝트의 실제 핵심 경험(제한시간 압박, FR-3/5/6/7)이 어디에도 추적되고 있지 않다.** `deferred-work.md`의 서두는 "퍼즐 코어루프(재화 획득원)에 의존하므로 코어루프 완료 후 진행"이라고 적어, **코어루프가 이미 완료됐다는 전제**로 후속 작업 순서를 짜놨다. 하지만 07-18 PRD가 코어루프를 "제한시간 압박형"으로 뒤집은 이후, 그 압박 메커닉(FR-3/5/6/7) 자체는 프로토타입에 전혀 구현되지 않았다 — 즉 이 백로그가 깔고 있는 "코어루프 완료" 전제 자체가 현재 PRD 기준으로는 틀렸다.

**🟡 HIGH — FR-8(개인 최고 기록), FR-9(온보딩), FR-18(결과 카드), FR-20(초대 보상)은 어떤 문서에도 없다.** 04개 FR이 완전히 백로그 바깥에 떠 있음 — 다음에 누가 "무엇부터 만들지" 볼 때 이 4개는 아예 보이지 않는다.

**🟢 LOW — 재화 수치 불일치.** 코드(`PuzzlePage.tsx`의 `CLEAR_REWARD = 10`)와 `addendum.md`("클리어당 고정 1단위")가 다른 수치를 쓰고 있다. 큰 문제는 아니지만("1단위=10원" 같은 환산일 수도 있음) 명시적으로 확인된 적은 없다.

### Coverage Statistics

- Total FRs: 20
- 코드에 구현됨: 2개 (FR-1 부분, FR-2) — 10%
- 문서에 추적은 되나 미구현(라벨 낡음 포함): 6개 (FR-4, FR-10~13, FR-14~17, FR-19) — 30%
- 완전히 미추적(코드도 문서도 없음): 8개 (FR-3, FR-5, FR-6, FR-7, FR-8, FR-9, FR-18, FR-20) — 40%
- 형식적 Epic 커버리지(Epics 문서 자체 부재): **0%**

## UX Alignment Assessment

### UX Document Status

**Found.** `DESIGN.md` + `EXPERIENCE.md` (`ux-appintoss-2026-07-18/`), 둘 다 `status: final`, `updated: 2026-07-19` — PRD §0의 "07-18 개정으로 EXPERIENCE.md/DESIGN.md가 무효화됐다"는 노트가 이미 별도 gds-ux 세션(오늘 게임 디자이너 세션 이전)으로 해소된 상태다. `addendum.md`의 "후속 조치 — gds-ux 재설계 필요" 목록은 이제 **stale** — 실제로는 이미 처리됨.

### UX ↔ PRD(GDD 대체) Alignment

전반적으로 강함 — FR-1~20이 Information Architecture·Component Patterns·Key Flows(UJ-1~4)에 구체적으로 반영돼 있다.

**🔴 CRITICAL (오늘 세션이 새로 만든 충돌)** — 오늘 결정한 색 변주(모양+색이 모두 같아야 매치, FR-4 재설계)가 이미 `final`인 UX 문서의 명시적 접근성 원칙과 정면으로 부딪힌다:
- `DESIGN.md` L81: "매칭 판별은 색상이 아니라 동물/과일 아이콘 형태로 하므로... **색맹 접근성은 팔레트 선택과 무관하게 안전하다**."
- `EXPERIENCE.md` L115: "매칭 판별은 아이콘 형태로만 — **색상 단독 신호 금지**(색맹 안전)."
- `DESIGN.md` L114 (Tile 컴포넌트): "아이콘 자체가 매칭 판별 신호 — 배경색은 상태 피드백 전용, **판별 기준 아님**."

색이 매치 여부를 가르는 필수 판별 기준이 되는 순간(스테이지 11+, "모양은 같은데 색이 달라 매치 아님" 방해물 도입) 색맹/색약 유저는 실제 매치와 방해물을 구별할 방법이 없다 — "형태만으로 충분히 안전하다"던 기존 전제가 오늘 결정으로 깨졌다. 오늘 설계 세션에서 이 리스크를 addendum.md 조정 신호에 "플레이테스트에서 문제 나오면 패턴으로 대체 검토"로 가볍게만 남겼는데, 실제로는 이미 확정된 UX 접근성 원칙과의 정면 충돌이라 플레이테스트 이후로 미룰 사안이 아니라 **구현 착수 전에 결정**해야 한다. 대안: (a) 색 대신 패턴/무늬(줄무늬·점무늬)로 대체, (b) 색+아이콘 형태 자체를 다르게(예: 색상별로 미세하게 다른 액세서리를 추가) 해서 형태만으로도 구별 가능하게 유지, (c) 색맹 모드 토글 제공. 이번 리포트에서는 확정하지 않고 CRITICAL 오픈 이슈로만 기록한다.

**🟡 기존에 이미 열려있던 항목 (오늘 세션이 만든 게 아니라 carried-over)** — `EXPERIENCE.md`의 `[OPEN — NOTE FOR PM, 2026-07-19]` WCAG 2.2.1(Timing Adjustable) 갭: 하드 타이머에 대한 접근성 보완 수단이 없음. PM/사용자 결정 대기 중, 아직 미해결.

### UX ↔ Architecture Alignment

대체로 양호함:
- 타이머 성능 요구(1초 틱마다 보드 전체 리렌더 금지)가 아키텍처의 `useStageTimer` 설계와 Technical Requirements에 명시적으로 반영됨.
- 아이템↔타이머 결합(`addTime`/`applyPenalty`)이 UX의 "시간 회복 아이템 소비" 플로우(FR-13)를 지원.
- 플랫폼 버전/승인 게이팅(`usePlatformFeature`)이 UX의 State Patterns("하위 토스앱 버전", "미니앱 승인 대기 중")을 지원.

**🟡 MEDIUM** — `EXPERIENCE.md`가 요구하는 `aria-live="assertive"` 안내(임계구간 진입 1회, 스테이지 실패 1회, 매초 금지)가 아키텍처의 `useStageTimer` 구현 가이드 코드에 반영돼 있지 않다 — 구조적 블로커는 아니지만 구현 시 누락되기 쉬운 지점이라 스토리 작성 시 명시적으로 짚어야 한다.

**Step 3 finding 보정** — Step 3(Epic Coverage)에서 "FR-3/5/6/7/8/9/18/20이 완전히 미추적"이라고 했던 건 `deferred-work.md`만 봤을 때 얘기다. `game-architecture.md`의 Core Systems 표는 실제로 20개 FR 전부를 6개 시스템에 파일 단위까지 매핑해뒀다(`useStageTimer.ts`=FR-1~9, `gacha.ts`+`useInventory.ts`=FR-10~13, 배너/보상형 광고=FR-14~17, `resultTier.ts`+`usePlatformFeature.ts`=FR-18~20). 즉 **요구사항→시스템 추적성은 실제로 양호**하다. 다만 이건 "어떤 파일이 이 FR을 담당하는가" 수준의 매핑이지, "어떤 순서로 무슨 스토리로 쪼개서 구현하는가"는 아니다 — 아키텍처 문서 스스로도 `Epic Mapping: N/A`라고 명시하고 다음 단계(`gds-create-epics-and-stories`)로 넘기고 있다. 진짜 공백은 FR 추적성이 아니라 **실행 단위 분해(Epics/Stories)의 부재**다.
- 참고로 `deferred-work.md`의 스테일 문제(Step 3에서 발견)는 이미 architecture.md L113에서도 독립적으로 같은 문제를 짚어놨다("현재 PRD와 어긋난 상태... 갱신 필요, 권장") — 두 세션이 각각 같은 문제를 발견했는데도 아직 아무도 고치지 않은 상태로 남아있다.

## Epic Quality Review

**리뷰 대상 없음.** Epics/Stories 문서가 존재하지 않으므로(Step 1 WARNING, Step 3 확인) 플레이어 가치 중심 여부·독립성·순방향 의존성·스토리 사이징 등 표준 체크리스트를 적용할 대상 자체가 없다. 이 단계 자체가 **최대 강도의 발견**이다: 20개 FR과 6개 시스템(`game-architecture.md` Core Systems 매핑)이 있는데, 이걸 "무엇을 먼저, 어떤 순서로, 어떤 단위로 구현할지"로 쪼갠 문서가 없다.

지금까지 이 프로젝트가 실제로 써온 방식(`spec-pattern-match-core-loop.md` 같은 개별 기능 스펙을 그때그때 작성)은 1개 기능 단위에서는 잘 작동했지만, 그 자체로 Epic/Story 구조를 대체하지는 못한다 — 스펙 파일들 사이의 의존성 순서, 우선순위, 스코프 경계를 한눈에 보여주는 상위 문서가 없다. `game-architecture.md`도 스스로 "Ready for: 에픽/스토리 생성 단계(`gds-create-epics-and-stories`)"라고 명시하며 이 공백을 인지하고 있다.

**권장**: 구현 착수 전에 `gds-create-epics-and-stories`를 한 번 돌려 20개 FR을 실행 단위로 쪼개는 것이 좋다 — 특히 지금 시점엔 우선순위 판단이 중요하다(예: FR-3/5/6/7의 타이머 코어루프가 다른 모든 시스템의 전제 조건인데도 아직 구현되지 않은 상태). 다만 이 프로젝트 규모(솔로, 14일, 가벼운 아키텍처 선호)를 감안하면 정식 Epic/Story 산출물이 아니라 **순서가 있는 우선순위 목록** 수준으로 가볍게 가는 것도 실용적 대안이다 — 이 판단은 Final Assessment에서 종합적으로 정리한다.

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK.** "NOT READY"로 부르기엔 기반이 이미 탄탄하다 — PRD(FR 20개 명세), UX(final, 07-18 개정 반영 완료), Architecture(6개 시스템 전부 파일 단위 매핑, 노블 패턴 2개 코드 스니펫까지 확정)가 서로 잘 맞물려 있다. 하지만 구현에 바로 들어가기엔 두 가지 실질적 블로커가 남아있고, 실행 순서를 정하는 상위 구조(Epics/Stories)가 아예 없다.

### Critical Issues Requiring Immediate Action

1. **🔴 (오늘 세션이 만든 새 충돌) 색 변주 vs UX 접근성 원칙** — "매칭 판별은 형태로만, 색상 단독 신호 금지"라는 이미 `final`인 원칙과, 오늘 결정한 "모양+색 conjunction match"가 정면 충돌. 색맹/색약 유저가 스테이지 11+에서 매치를 구별할 수 없게 된다. 코드로 옮기기 전에 대안(패턴 대체/형태 보조 구별/색맹 모드) 중 하나를 확정해야 한다 — 플레이테스트 이후로 미룰 사안이 아니다.
2. **🔴 코어루프 타이머(FR-3/5/6/7) 미구현** — 07-18에 PRD가 코어루프를 뒤집은 지 세 번째 세션(PRD→UX→Architecture)째인데도 코드에는 여전히 07-17 무압박 버전만 있다. 아이템 효과, 실패 시 광고, 개인 최고 기록, 결과 카드 판정 등 나머지 시스템 대부분이 이 타이머 상태에 의존하므로, 이게 없는 한 다른 걸 먼저 만들어도 결합 지점에서 다시 만지게 된다. 다행히 `game-architecture.md`가 `useStageTimer` 구현까지 코드 스니펫으로 이미 제공해뒀다 — 설계 공백이 아니라 순수하게 "아직 안 짬"인 상태.
3. **🟠 Epics/Stories 부재** — 20개 FR·6개 시스템이 어떤 순서로 구현돼야 하는지 정리한 문서가 없다. `game-architecture.md`도 스스로 이 공백을 인지하고 다음 단계로 명시해뒀다.
4. **🟠 `deferred-work.md` 스테일** — 07-17 구 PRD 기준 라벨과, 이미 폐기된 "동물 캐릭터 가챠/도감" 항목이 그대로 남아있다. 두 개 세션(오늘 게임 디자이너 세션, 07-19 오전 아키텍처 세션)이 각각 독립적으로 이 문제를 발견했는데 아직 아무도 고치지 않았다.

### Carried-over Open Item (not blocking, but unresolved)

- **WCAG 2.2.1 Timing Adjustable 갭** — 하드 타이머에 대한 접근성 보완 수단이 없다는 `EXPERIENCE.md`의 기존 오픈 이슈. PM/사용자 결정 대기 중.

### Minor / Non-blocking

- `PuzzlePage.tsx`의 `CLEAR_REWARD = 10`과 `addendum.md`의 "클리어당 고정 1단위" 수치 불일치 — 확인만 하면 됨.
- `@toss/tds-mobile-ait` 중복 의존성 — architecture.md가 이미 비차단으로 기록.

### Recommended Next Steps

1. **색 변주 접근성 결정부터 확정** — 코드 작성 전에 마스터가 (a) 색 대신 패턴/무늬, (b) 형태로도 구별 가능하게 보완, (c) 색맹 모드 중 하나를 고른다. 이번 리포트는 결정하지 않고 이슈만 기록했다.
2. **`useStageTimer` 구현 착수** — `game-architecture.md`가 이미 제공한 코드 스니펫을 그대로 `PuzzlePage.tsx`에 통합. 이게 이 프로젝트에서 가장 먼저 풀려야 하는 결합 지점이다.
3. **`deferred-work.md` 정리** — 폐기된 가챠/도감 항목을 기능성 아이템 뽑기(FR-10~13) 기준으로 재작성, FR 번호를 현재 PRD(FR-1~20)에 맞게 갱신, FR-8/9/18/20을 새로 추가.
4. **`gds-create-epics-and-stories` 실행 여부 결정** — 정식 문서 대신 가벼운 우선순위 목록으로 대체해도 되는지는 마스터의 선호(1인 개발, 빠른 출시)에 달려있다 — 이 프로젝트 규모에선 후자도 합리적인 선택.

### Final Note

이번 평가는 4개 카테고리(문서 존재/FR 추적성/UX 정합성/Epic 구조)에 걸쳐 총 6개 이슈(Critical 2, Major 2, Open 1, Minor 2)를 찾았다. 이 중 1번(색 변주 접근성)과 2번(타이머 미구현)은 구현 순서에 직접 영향을 주므로 코드를 더 쓰기 전에 정리하는 걸 권한다 — 나머지는 병행하거나 나중에 정리해도 무방하다.

**Assessor:** Game Producer/Scrum Master (gds-check-implementation-readiness), 게임 디자이너(Samus Shepard) 세션에 이어서 진행
**Date:** 2026-07-19

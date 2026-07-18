---
title: 'Game Architecture'
project: 'appintoss'
date: '2026-07-19'
author: '마스터'
version: '1.0'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
status: 'complete'
engine: '@apps-in-toss/web-framework@2.10.4 (Granite, WebView) — React 18 + TypeScript + Vite'
platform: '앱인토스(토스 미니앱), WebView'

# Source Documents
gdd: null
prd: '_bmad-output/planning-artifacts/prds/prd-appintoss-2026-07-17/prd.md'
epics: null
brief: '_bmad-output/planning-artifacts/briefs/brief-appintoss-2026-07-16/addendum.md'
ux: '_bmad-output/planning-artifacts/ux-designs/ux-appintoss-2026-07-18/'
---

# Game Architecture

## Executive Summary

**{게임명 TBD} — 제한시간 패턴매칭 + 기능성 아이템 뽑기**는 앱인토스(토스 미니앱) Granite WebView(`@apps-in-toss/web-framework` v2.10.4, React 18 + TypeScript + Vite)를 대상으로 한다. 1인 개발·14일 스코프에 맞춰, 이론적 리스크보다 데이터로 증명된 리스크만 다루는 경량 아키텍처를 채택했다.

**핵심 아키텍처 결정:**
- 상태 관리는 리듀서/전역상태 없이 컴포넌트 로컬 훅(`useCurrency`, `useStageTimer`, `useInventory`) 조합으로 처리한다.
- 백그라운드 전환은 표준 `document.visibilitychange`로 감지해 타이머를 일시정지한다(프레임워크의 `useVisibility`는 검증 결과 WebView에 미제공됨을 확인).
- 플랫폼 버전·승인 게이팅(배너광고, `contactsViral`)은 `usePlatformFeature` 훅 하나로 통일한다.
- 광고·뽑기 보상의 클라이언트 자기신고 구조는 알려진 리스크로 수용하고 서버 검증은 v2로 미룬다.

**Project Structure:** By Type(`game/`·`hooks/`·`pages/` 3분할) 조직, 6개 핵심 시스템 전부 매핑 완료.

**Implementation Patterns:** 2개 노블 패턴(스테이지 타이머 생명주기, 플랫폼 기능 게이팅) + 4개 표준 패턴 정의.

**Ready for:** 에픽/스토리 생성 단계(`gds-create-epics-and-stories`)

## Development Environment

### Prerequisites

- Node.js (현재 프로젝트 `node_modules` 기준 기존 개발 환경 그대로 사용 — 별도 신규 설치 없음)
- 기존 `package.json`의 의존성 그대로: `@apps-in-toss/web-framework@^2.10.4`, `@toss/tds-mobile`, React 18, Vite 6
- 앱인토스 콘솔 계정 (배포·`contactsViral` 리워드 등록·미니앱 승인 신청용)

### AI Tooling (MCP Servers)

`apps-in-toss` MCP가 이미 이 세션에 연결되어 있으며, 이번 아키텍처 검증(라우팅 규칙, 버전 API, `useVisibility` 미제공 확인, 배너광고 버전 등)에 실제로 사용했다. 별도 설치 필요 없음 — 이 프로젝트를 이어서 구현할 AI 에이전트도 동일하게 이 MCP로 공식 문서를 실시간 조회하면 된다.

### Setup Commands

```bash
npm install   # 기존 의존성 그대로
npm run dev   # granite dev — 로컬 개발 서버
npm run lint  # 기존 검증 커맨드
```

### First Steps

1. Step 4~7에서 결정한 신규 파일(`useStageTimer.ts`, `useInventory.ts`, `usePlatformFeature.ts`, `game/balance.ts`, `game/gacha.ts`, `game/resultTier.ts`) 스캐폴딩
2. 기존 `PuzzlePage.tsx`에 `useStageTimer` 통합 (frozen intent spec을 깨지 않는 리모델링)
3. 에픽/스토리 생성 워크플로우(`gds-create-epics-and-stories`)로 이 아키텍처 문서를 입력해 구현 단위로 쪼개기
4. `App.tsx`의 `Page` 유니언 타입 도입부터 착수(가장 저비용·고가치 항목)

---

## Project Context

### Game Overview

**{게임명 TBD} — 제한시간 패턴매칭 + 기능성 아이템 뽑기.** 앱인토스(토스 미니앱) 게임 카테고리 출시용 캐주얼 퍼즐. 14일 내 개발완료+심사제출이 유일한 게이팅 지표(DAU/매출 무관).

### Technical Scope

**Platform:** 앱인토스 Granite Web Framework (`@apps-in-toss/web-framework@^2.10.4`) — React 18 + TypeScript + Vite, WebView 기반. React Native 아님 — 이미 코드로 확정된 결정이며, PRD Open Question #5를 이 사실로 해소한다.
**Design System:** `@toss/tds-mobile` (Web TDS). `package.json`에 레거시 `@toss/tds-mobile-ait`도 함께 존재 — 실제 사용 여부 확인 필요(정리 대상, 별도 blocking 아님).
**Genre:** 캐주얼 리액션 퍼즐 (제한시간 압박 + 가챠 소비 루프).
**Project Level:** 소규모, 1인 개발, 서버 없음(클라이언트 전용) — 아키텍처는 미래 확장이 아니라 14일 안에 무너지지 않는 최소 구조에 최적화한다.

### Core Systems

| System | Complexity | Status | PRD Ref |
| --- | --- | --- | --- |
| 코어루프 (제한시간 패턴매칭) | High | ⚠️ 프로토타입 존재하나 07-17 구버전(무압박) 기준 — 07-18 개정(타이머·페널티·재시도 상한)이 아직 코드에 없음. 기존 구조 위에 타이머 레이어를 이식하는 리모델링 필요 | §4.1 FR-1~9 |
| 아이템 뽑기 + 인벤토리 | High | 미구현. 아이템 효과(예: 제한시간 즉시 회복)가 코어루프의 타이머 상태를 직접 조작 — 두 시스템 간 결합 지점 설계가 핵심 | §4.2 FR-10~13 |
| 광고 배치 | Medium | 부분 프로토타입 존재(`useInAppAds.tsx`, `InAppAdsPage.tsx`) — 보상형 풀스크린 광고 패턴 검증됨. 배너(상시노출)·신규 트리거 지점(뽑기 직전/스테이지 실패) 미구현 | §4.3 FR-14~17 |
| 레퍼럴 (결과카드 + contactsViral) | High (신규 개념) | 미구현. 앱 버전 분기(5.223.0+/5.241.0+)와 미니앱 승인 전/후 기능 게이팅(승인 전 Internal Server Error)이라는 프로젝트 고유 제약 | §4.4 FR-18~20 |
| 진행도/경제 영속화 | Low-Medium | `useCurrency.ts`가 localStorage 패턴 확립. 아이템 인벤토리 저장을 위한 스키마 확장 필요 | §3, §8 |
| 페이지 라우팅 | Low(현재)→확장 시 리스크 | `App.tsx`의 문자열 리터럴 `useState<string\|null>` — 페이지가 2개→5~6개로 늘어나기 전에 타입화 필요 | (구현 세부사항) |

### Technical Requirements

- 서버/백엔드/사용자 인증 없음 — 모든 상태는 클라이언트 localStorage가 유일한 소스.
- 기존 스펙에서 이미 확정된 제약 승계: 새 라우터 라이브러리 도입 금지, 의료적 효능 주장 문구 절대 금지(Lumosity FTC 선례).
- 타이머 재렌더링 성능 — 1초 틱마다 전체 그리드가 리렌더되지 않도록 타이머 표시와 보드 상태를 분리해야 함(저사양 WebView 고려).
- 플랫폼 기능 가용성이 앱 버전 및 미니앱 승인 상태에 따라 런타임에 갈린다(하드코딩 불가, feature-detection 필수).

### Complexity Drivers

**High Complexity:**
- 기존 무압박 코어루프 프로토타입에 카운트다운·오답 페널티·재시도 상한을 이식하는 리모델링 (frozen intent spec을 깨지 않으면서 진행)
- 아이템 효과 ↔ 타이머 상태의 결합 설계
- `contactsViral`/배너광고의 버전+승인 이중 게이팅

**Novel Concepts (표준 패턴 없음):**
- 앱인토스 특유의 "미승인 시 Internal Server Error" 게이팅 — 일반적인 feature-flag가 아니라 승인 프로세스라는 외부 상태에 의존
- 클라이언트가 스스로 "보상 자격"을 신고하는 광고/뽑기 리워드 구조 (서버 검증 부재)

**Technical Risks (파티모드 검토에서 확정된 사항 포함):**
- **[합의 완료]** 광고·뽑기 보상 자기신고 리스크 — `useInAppAds`의 `userEarnedReward`는 클라이언트가 스스로 보상 자격을 주장하는 구조이며, 서버 측 검증이 없다. IAP가 없어 직접적 금전 손실은 없지만, 광고 네트워크가 이를 "이상 트래픽"으로 판단하면 유일한 수익원(광고)과 미니앱 계정 자체가 리스크에 노출된다. **결정:** 이 리스크를 알고 받아들이며, 아키텍처 문서에 명시한다 — 별도 서버 검증 계층은 14일 스코프 밖(v2 후보).
- **[합의 완료 → Step 3에서 구현 방식 수정]** 타이머-백그라운드 상호작용 — 앱이 백그라운드로 전환되면 감지해 **게임을 일시정지**한다(카운트다운 정지, 밀린 시간을 몰아서 따라잡지 않음). 포그라운드 복귀 시 정지된 지점부터 재개. (구체적 감지 API는 Step 3 검증 결과 표준 `document.visibilitychange`로 확정 — 아래 참고)
- **[합의 완료]** 플랫폼 기능 게이팅 재사용 패턴 — `useInAppAds`가 이미 검증한 `isSupported` 체크 + graceful degradation 패턴을 일반화한 `usePlatformFeature`류 훅으로 뽑아, `contactsViral` 버전분기+승인게이팅과 배너광고 버전분기(5.241.0+)에 동일하게 재사용한다. 세 곳에서 각자 새로 구현하지 않는다.
- `deferred-work.md`는 07-17 구 PRD 기준(동물 캐릭터 가챠/도감)으로 작성되어 **현재 PRD(07-18, 기능성 아이템)와 어긋난 상태** — 참고 시 갱신 필요, 이번 아키텍처 스코프 밖이지만 별도 정리 권장.

## Engine & Framework

### Selected Engine

**앱인토스 Granite Web Framework** (`@apps-in-toss/web-framework`) v2.10.4 — 이미 프로젝트에 설치·구현되어 있는 기존 결정으로, 이번 단계는 "선택"이 아니라 "검증"이었다.

**Rationale:** 앱인토스 미니앱 플랫폼 자체가 이 프레임워크를 요구한다(Unity/Unreal/Godot 대안 없음). PRD Open Question #5(WebView vs React Native)는 `package.json`에 이미 `@apps-in-toss/web-framework`가 설치되어 WebView로 확정된 상태 — 이번 검증으로 재확인.

**버전 검증(npm 레지스트리 직접 조회, 2026-07-19):**
- `@apps-in-toss/web-framework`: 설치 `2.10.4` / 최신 `2.10.6` — 패치 1개 차이, 착수 시 갱신 권장(비긴급)
- `@toss/tds-mobile`: 설치·최신 모두 `2.5.0` — 최신 상태
- `@toss/tds-mobile-ait` 중복 설치 확인 — 실사용 여부 점검 후 정리 권장(비차단)

**⚠️ 정정 (Step 4 진행 중 발견):** 처음엔 백그라운드 감지에 프레임워크 공식 `useVisibility` 훅을 쓰기로 했으나, 실제 설치된 패키지의 타입 선언을 직접 확인한 결과 `useVisibility`는 `@granite-js/react-native` 전용이며 WebView가 사용하는 공개 API 표면(`@apps-in-toss/web-framework`의 `dist-web/index.d.ts` → `@apps-in-toss/web-bridge` 재수출분)에는 존재하지 않는다. `web-bridge`에 있는 유일한 가시성 관련 함수(`onVisibilityChangedByTransparentServiceWeb`)는 이름상 "투명 서비스" 특수 임베딩용으로 보이며 공식 문서에도 없어 일반 목적으로 신뢰하기 부적절하다. **따라서 표준 브라우저 `document.visibilitychange` 이벤트를 그대로 사용한다** — WebView도 브라우저 컨텍스트이므로 항상 존재가 보장되는 표준 API이며, 존재가 불확실한 프레임워크 전용 훅에 기대는 것보다 안전하다. 아래 Engine-Provided Architecture 표와 이후 모든 섹션에 이 정정을 반영했다.

### Engine-Provided Architecture

| Component | Solution | Notes |
| --- | --- | --- |
| Rendering | React 18 DOM in WebView | Framework 제공 |
| Routing/화면전환 | WebView 환경은 프로젝트가 설정한 웹 라우터 규칙을 그대로 따름(공식문서 확인) | 현재는 라우터 라이브러리 없이 `App.tsx`의 단일 `useState` 스위치 유지 — 기존 스펙 제약("새 라우터 도입 금지") 승계 |
| Build/배포 | Vite(`granite.config.ts`) + `ait build`/`ait deploy` CLI | Framework 제공 |
| Physics/Audio | 해당없음 | 2D UI 퍼즐, 물리엔진 불필요 |
| Input | 표준 DOM 터치/클릭 이벤트 | Framework 제공 |
| 가시성 감지 | 표준 브라우저 `document.visibilitychange` 이벤트 | `useVisibility`(프레임워크 공식 훅)는 `@granite-js/react-native` 전용이라 WebView 공개 API에 없음을 타입 선언 확인으로 검증 — WebView 표준 API로 대체 |

### Remaining Architectural Decisions

다음 결정은 Step 4(아키텍처 결정)에서 명시적으로 다룬다:

1. 페이지 라우팅 타입화 (문자열 리터럴 `useState<string\|null>` → union type)
2. 타이머 상태 관리 위치 및 `document.visibilitychange` 기반 백그라운드 일시정지 구현
3. 플랫폼 기능 게이팅 재사용 패턴(`usePlatformFeature`류) — `contactsViral`(5.223.0+), 배너광고(5.241.0+) 버전분기에 공통 적용
4. localStorage 스키마 확장(아이템 인벤토리 포함, 버저닝)
5. 아이템 효과 ↔ 타이머 결합 인터페이스

### Development Environment (MCP)

`apps-in-toss` MCP가 이미 이 세션에 연결되어 있어 공식 문서(라우팅, 버전 API, 광고, `contactsViral` 등)를 실시간 조회할 수 있다 — 이번 아키텍처 검증에 실제로 활용함. 별도 설치 불필요.

## Architectural Decisions

**결정 원칙(마스터 확정, 2026-07-19):** 1인 개발·14일 스코프의 미니게임에는 구조적 정합성보다 가벼움을 우선한다. 이론적 동시성 리스크를 막으려고 무거운 패턴(리듀서, 상태머신, 전역 컨텍스트)을 미리 들이지 않는다 — 실제 문제가 나타나면 그때 보강한다. 이하 모든 결정은 이 원칙 아래 "가장 가벼운 옵션"을 선택했다.

### Decision Summary

| Category | Decision | Rationale |
| --- | --- | --- |
| 타이머 상태 관리 | `useStageTimer` 훅 (기존 `useCurrency` 패턴과 동일한 결) | 새 리듀서/상태머신 도입 없이 기존 코드 스타일 유지. 동시성 리스크는 "틱/페널티/아이템소비 모두 훅이 노출하는 몇 개 메서드로만 상태를 건드린다"는 규칙으로 억제 |
| 아이템 ↔ 타이머 결합 | `useStageTimer`가 `{ timeLeft, addTime(ms), applyPenalty(ms), pause(), resume() }`를 반환하는 명령형 API | 이벤트버스 등 중간 레이어 없이 직접 호출 — 가장 단순한 결합 |
| 백그라운드 일시정지 | 표준 `document.visibilitychange` 이벤트로 `pause()`/`resume()` 호출 | Step 3에서 정정·확정(프레임워크 `useVisibility`는 WebView 미제공 확인됨) |
| localStorage 스키마 | 기존 JSON에 아이템 인벤토리 필드 추가 + `version` 숫자 1개, 버전 불일치 시 기본값으로 리셋 | `useCurrency.ts`가 이미 하는 정수/범위 검증 패턴 그대로 확장, 별도 마이그레이션 프레임워크 없음 |
| 페이지 라우팅 | `type Page = "home" \| "puzzle" \| "iaa" \| "inventory" \| "gacha" \| "result" \| null` 유니언 타입 | 라우터 라이브러리 도입 없이(기존 제약 유지) 타입 안전성만 확보, 5분 미만 비용 |
| 플랫폼 기능 게이팅 | `useInAppAds`의 `isSupported` 패턴을 일반화한 `usePlatformFeature(check)` 훅 | 배너광고(5.241.0+)·`contactsViral`(5.223.0+)에 동일 패턴 재사용, 세 번 새로 구현하지 않음 |
| `tds-mobile-ait` 중복 의존성 | 지금 정리하지 않음, 백로그 기록만 | 14일 스코프 밖 — blocking 아님 |

### State Management

**Approach:** 컴포넌트 로컬 훅(`useStageTimer`, `useCurrency`, 추후 `useInventory`) 조합. 전역 상태 관리 라이브러리·React Context·리듀서 도입 없음. 각 훅은 자신의 상태만 소유하고, 페이지 컴포넌트가 이를 조합해서 사용한다.

### Data Persistence

**Save System:** 클라이언트 localStorage 단일 소스, JSON 직렬화. `useCurrency.ts`의 기존 검증 패턴(정수/범위 체크, 손상 시 기본값 폴백)을 아이템 인벤토리에도 동일하게 적용. 스키마에 `version` 필드를 두되, 버전 마이그레이션 로직은 만들지 않고 불일치 시 초기화한다.

### Platform Integration

**게이팅 패턴:** `usePlatformFeature(check: () => boolean)` — `useInAppAds`의 `isSupported` 체크·에러 캐치·기능 숨김 패턴을 재사용 가능한 훅으로 추출. 배너광고 버전분기(5.241.0+), `contactsViral` 버전분기(5.223.0+) 및 미니앱 승인 전 게이팅에 공통 적용.

### Architecture Decision Records

- **[수용된 리스크]** 광고·뽑기 보상 자기신고 구조 — `useInAppAds`의 `userEarnedReward`는 서버 검증 없이 클라이언트가 스스로 보상 자격을 주장한다. IAP가 없어 직접적 금전 손실은 없으나, 광고 네트워크가 이상 트래픽으로 판단할 경우 유일한 수익원과 미니앱 계정이 리스크에 노출된다. 별도 서버 검증 계층은 이번 스코프 밖(v2 후보) — 마스터 승인.
- **[의도적 단순화]** 위 Decision Summary의 모든 항목은 "가장 가벼운 옵션"을 택한 결과다. 향후 실제 버그·확장 필요가 데이터로 확인되면 그때 리듀서/전역상태/서버 검증 등으로 보강한다.

## Cross-cutting Concerns

이 프로젝트의 규모(1인 개발, 14일 스코프)에 맞춰 모든 크로스커팅 패턴은 기존 코드가 이미 쓰고 있는 방식을 그대로 승계·최소 확장한다.

### Error Handling

**Strategy:** 플랫폼 API 호출부(광고, `contactsViral`, localStorage 등)마다 try-catch. 복구 가능한 실패는 `console.error`로만 남기고 자동 재시도(`useInAppAds.tsx`의 기존 패턴), 사용자에게 알려야 하는 치명적 실패만 `dialog.openAlert`. 전역 에러 이벤트 시스템은 두지 않는다.

**추가:** `main.tsx` 최상위에 React `ErrorBoundary` 1개만 배치 — 화면이 하얗게 죽는 것을 막는 안전망. 새로운 에러 처리 체계가 아니라 기존 패턴에 대한 최소 보강.

```tsx
// main.tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Logging

**Format:** 구조화 로그·외부 로깅 서비스 없음. `console.error`/`console.warn`만 사용(기존 코드 그대로).
**Destination:** 브라우저 콘솔뿐.

### Configuration

**Approach:** 밸런싱 수치(제한시간 곡선, 오답 페널티, 무료 재시도 상한, 뽑기 확률 등 — PRD가 플레이테스트로 조정하라고 명시한 값들)를 `src/game/balance.ts` 하나에 상수로 모은다. 현재 `patternMatch.ts`에 인라인으로 흩어진 공식(`min(6 + (stage-1)*2, 24)` 등)을 여기로 이동. 새 추상화가 아니라 상수 위치 정리 — 플레이테스트 튜닝 시 한 파일만 보면 되게 함.

**[NEW 2026-07-19, 마스터 확정]** 검증 과정에서 `TILE_ICONS`가 12종 고정이라 그리드 상한(12쌍) 도달 이후 "패턴 종류 수 증가"라는 난이도 축이 실제로 존재하지 않음을 발견(스테이지 10 이후 보드가 완전히 고정됨). `TILE_ICONS`를 **20~30종으로 확장**하기로 결정 — 정확한 종수·전환 스테이지는 플레이테스트로 조정하되, 이 축 자체가 존재할 수 있도록 최소 물량을 미리 확보한다. 상세 근거는 PRD `addendum.md`("퍼즐 난이도 밸런스 초안" 섹션, 2026-07-19 추가분) 참고.

### Event System

**Pattern:** 없음. Step 4에서 정한 훅 API(`addTime()`, `applyPenalty()` 등) 직접 호출로 시스템 간 통신을 대신한다. 이벤트버스/옵저버 패턴 도입하지 않음.

### Debug Tools

**Available Tools:** 없음. 브라우저 devtools로 localStorage를 직접 확인/편집(스펙 문서에 이미 명시된 검증 방식) — 별도 인게임 디버그 콘솔·치트 명령 없음.

## Project Structure

### Organization Pattern

**Pattern:** By Type (Hybrid 아님) — 이미 프로젝트에 확립된 `game/`(순수 로직) / `hooks/`(상태·영속화·플랫폼 연동) / `pages/`(화면) 3분할을 그대로 확장한다. 새 폴더 카테고리를 만들지 않는다.

**Rationale:** 시스템 수가 적고(6개 내외) 1인 개발이라 By Feature/Domain-Driven 같은 조직 패턴은 과함. 기존 3분할이 이미 "게임 규칙 / 상태·부수효과 / 렌더링"이라는 명확한 책임 경계를 갖고 있어 그대로 확장.

### Directory Structure

```
appintoss/
├── src/
│   ├── game/                   # 순수 함수만 — React/훅 import 금지
│   │   ├── patternMatch.ts     # 보드 생성, 매칭 판정 (기존)
│   │   ├── gacha.ts            # NEW: 뽑기 확률 가중치 추첨 순수 함수 (§4.2 FR-12)
│   │   ├── resultTier.ts       # NEW: 도달 스테이지 → 동물 티어 판정 순수 함수 (§4.4 FR-18)
│   │   └── balance.ts          # NEW: 밸런싱 상수 (제한시간 곡선, 페널티, 재시도 상한, 뽑기 확률)
│   ├── hooks/                  # 상태 관리 + localStorage 영속화 + 플랫폼 SDK 연동
│   │   ├── useCurrency.ts      # 재화/스테이지 영속화 (기존)
│   │   ├── useStageTimer.ts    # NEW: 카운트다운 + document.visibilitychange 기반 일시정지
│   │   ├── useInventory.ts     # NEW: 아이템 인벤토리 영속화
│   │   ├── useInAppAds.tsx     # 보상형 광고 (기존)
│   │   └── usePlatformFeature.ts # NEW: 버전/승인 게이팅 공통 훅
│   ├── pages/                  # 화면 단위 컴포넌트 — 훅을 조합해 렌더링
│   │   ├── PuzzlePage.tsx      # 기존, 타이머 통합 예정
│   │   ├── InAppAdsPage.tsx    # 기존
│   │   ├── InventoryPage.tsx   # NEW
│   │   ├── GachaPage.tsx       # NEW
│   │   └── ResultCardPage.tsx  # NEW
│   ├── App.tsx                 # Page 유니언 타입 기반 라우팅
│   ├── main.tsx                # ErrorBoundary 최상위 배치
│   ├── App.css / index.css
│   └── vite-env.d.ts
├── public/                     # 정적 에셋 (로고 등) — 별도 art 파이프라인 없음
├── granite.config.ts
└── (기존 설정 파일들)
```

**Asset/Test 폴더를 두지 않는 이유:** 프로토타입은 이모지로 아트를 대체(스펙 확정 사항) — 별도 art 파이프라인 불필요. 테스트 러너 자체가 프로젝트에 없음(`deferred-work.md`에 이미 기록된 의도적 스코프 제외) — `tests/` 폴더 생성하지 않음.

### System Location Mapping

| System | Location | Responsibility |
| --- | --- | --- |
| 코어루프 게임 로직 | `src/game/patternMatch.ts`, `src/game/balance.ts` | 보드 생성, 매칭 판정, 밸런싱 수치 — 순수 함수만 |
| 뽑기 추첨 로직 | `src/game/gacha.ts` | 확률 가중치 기반 아이템 추첨 — 순수 함수, `useInventory`가 결과를 소비 |
| 결과 티어 판정 | `src/game/resultTier.ts` | 도달 스테이지 → 동물 티어 매핑 — 순수 함수, `ResultCardPage.tsx`가 소비 |
| 타이머 | `src/hooks/useStageTimer.ts` | 카운트다운, 페널티, 아이템 회복 적용, 백그라운드 일시정지 |
| 재화/진행도 | `src/hooks/useCurrency.ts` | localStorage 영속화 (기존) |
| 아이템 인벤토리 | `src/hooks/useInventory.ts` | localStorage 영속화, 아이템 소비 |
| 광고 | `src/hooks/useInAppAds.tsx`, `src/pages/InAppAdsPage.tsx` | 보상형 풀스크린 광고 (기존) — 배너는 신규 컴포넌트로 별도 추가 |
| 플랫폼 기능 게이팅 | `src/hooks/usePlatformFeature.ts` | 버전 분기, 미니앱 승인 게이팅 공통 로직 |
| 화면 라우팅 | `src/App.tsx` | `Page` 유니언 타입 기반 `useState` 스위치 |

### Naming Conventions

**Files:**
- 훅: `useXxx.ts`(또는 `.tsx`, JSX 반환 시) — 기존 관례
- 페이지 컴포넌트: `XxxPage.tsx` (PascalCase) — 기존 관례
- 게임 로직: camelCase 파일명(`patternMatch.ts`, `balance.ts`)

**Code Elements:**

| Element | Convention | Example |
| --- | --- | --- |
| 컴포넌트/타입 | PascalCase | `PuzzlePage`, `Page`, `Reward` |
| 함수/변수 | camelCase | `generateBoard`, `applyPenalty` |
| 상수 | UPPER_SNAKE_CASE | `TILE_ICONS`, `MAX_TILES`(기존 확인) |
| 훅 | `use` 접두사 camelCase | `useStageTimer`, `usePlatformFeature` |

### Architectural Boundaries

- `game/`는 React를 import하지 않는다 — 부수효과 없는 순수 함수만(기존 스펙 제약 승계, "로직을 UI에서 분리해 테스트 가능하게 만듦").
- `hooks/`가 상태·영속화·플랫폼 SDK 호출을 전담한다 — `pages/` 컴포넌트에서 직접 `localStorage`나 `@apps-in-toss/web-framework` API를 호출하지 않는다.
- `pages/`는 `hooks/`가 반환한 값과 메서드를 조합해 렌더링만 한다 — 새 비즈니스 로직을 페이지 컴포넌트 안에 직접 작성하지 않는다.

## Implementation Patterns

이 프로젝트는 시스템 수가 적어 표준 패턴 대부분은 Step 4~6에서 이미 결정됐다(컴포넌트 통신 = 훅 메서드 직접 호출, 엔티티 생성 = `generateBoard(stage)` 순수 함수, 상태 전이 = 컴포넌트 로컬 `useState`, 데이터 접근 = `hooks/`가 전담). 이 단계는 이 프로젝트만의 노블 패턴 두 가지를 코드로 못박는다.

### Novel Pattern: 스테이지 타이머 생명주기

**Purpose:** 구버전 PRD 기준(무압박)으로 지어진 기존 `PuzzlePage.tsx`에, 07-18 개정의 카운트다운·오답 페널티·아이템 회복·백그라운드 일시정지를 안전하게 이식한다.

**Components:** `useStageTimer` 훅(`hooks/`) — `PuzzlePage.tsx`가 소비.

**Data Flow:** `visibilitychange` 이벤트 → `isPaused` 갱신 → 1초 인터벌이 `isPaused`일 때 멈춤 → 아이템 소비/오답 판정이 `addTime()`/`applyPenalty()`를 직접 호출해 `timeLeft`를 갱신.

**Implementation Guide:**

```ts
// hooks/useStageTimer.ts
export function useStageTimer(initialSeconds: number) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(document.visibilityState === "hidden");

  useEffect(() => {
    const onVisibilityChange = () => setIsPaused(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;
    const id = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [isPaused, timeLeft <= 0]);

  const addTime = (seconds: number) => setTimeLeft((t) => t + seconds);
  const applyPenalty = (seconds: number) => setTimeLeft((t) => Math.max(0, t - seconds));

  return { timeLeft, isPaused, addTime, applyPenalty };
}
```

**Usage:** `PuzzlePage.tsx`가 오답 판정 시 `applyPenalty()`, 아이템 소비 시 `addTime()`을 직접 호출한다. 타이머 표시(`timeLeft`)는 별도의 작은 컴포넌트로 분리해 1초 틱마다 보드 전체가 리렌더되지 않게 한다(§Technical Requirements의 성능 제약).

### Novel Pattern: 플랫폼 기능 게이팅

**Purpose:** 앱 버전과 미니앱 승인 상태에 따라 런타임에 갈리는 기능(배너광고, `contactsViral`)을 세 곳에서 각자 새로 구현하지 않고 하나의 패턴으로 통일한다.

**Components:** `usePlatformFeature` 훅(`hooks/`) — `useInAppAds.tsx`의 `isSupported` 패턴을 일반화.

**Implementation Guide:**

```ts
// hooks/usePlatformFeature.ts
export function usePlatformFeature(check: () => boolean) {
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    try { setIsSupported(check()); }
    catch (error) { console.error("플랫폼 기능 확인 실패:", error); setIsSupported(false); }
  }, [check]);
  return isSupported;
}
```

**Usage:**
- 배너광고 — 버전만 체크: `usePlatformFeature(() => compareVersions(getTossAppVersion(), "5.241.0") >= 0)`
- `contactsViral` — 버전 체크는 사전에 가능하나, **미니앱 승인 여부를 사전 조회하는 API가 없다**(공식문서 확인). 따라서 최초 호출이 Internal Server Error로 실패하면 그 사실을 localStorage에 캐싱해, 이후에는 재시도 없이 초대 보상 버튼을 숨기고 공유 버튼(FR-19)만 노출한다.

### Consistency Rules

| Pattern | Convention | Enforcement |
| --- | --- | --- |
| 컴포넌트 통신 | 훅이 반환한 메서드 직접 호출 (이벤트버스 없음) | 코드리뷰 — 새 이벤트버스/pub-sub 도입 시 반려 |
| 순수 로직 위치 | `game/`에만, React import 금지 | 코드리뷰 |
| 상태 소유권 | 각 훅이 자신의 상태만 소유, 전역 상태 없음 | 코드리뷰 |
| 플랫폼 게이팅 | 항상 `usePlatformFeature` 경유 | 새 플랫폼 API 추가 시 직접 `try/catch` 대신 이 훅 사용 |

## Architecture Validation

### Validation Summary

| Check | Result | Notes |
| --- | --- | --- |
| Decision Compatibility | PASS | 훅 기반 상태관리(4단계) + 3분할 구조(6단계) + 이벤트버스 없음(5,7단계)이 서로 모순 없이 일관됨. `useVisibility` 오참조는 검증 중 발견해 3~4단계에서 이미 정정 완료(아래 참고) |
| PRD Coverage (GDD 대체) | PASS (1건 보강) | Project Context의 6개 핵심 시스템 중 5개는 구조에 반영돼 있었으나, **뽑기 추첨(§4.2 FR-12)과 결과 티어 판정(§4.4 FR-18)의 순수 로직 위치가 누락**되어 있었음 — `src/game/gacha.ts`, `src/game/resultTier.ts`로 이번 단계에서 보강(Project Structure 섹션에 반영 완료) |
| Pattern Completeness | PASS | 엔티티 생성(보드 생성)·컴포넌트 통신·상태관리·에러처리·데이터접근·이벤트 처리 6개 시나리오 모두 커버 |
| Epic Mapping | N/A | 이 프로젝트에는 별도 Epics 문서가 없음(frontmatter `epics: null`) — 다음 워크플로우 단계(`gds-create-epics-and-stories`)에서 이 아키텍처 문서를 입력으로 에픽을 뽑을 때 매핑 예정 |
| Document Completeness | PASS (1건 의도적 보류) | 필수 섹션(엔진/버전, 결정요약, 프로젝트구조, 크로스커팅, 구현패턴, 네이밍) 모두 존재. Game Overview의 `{게임명 TBD}`는 워크플로우 placeholder가 아니라 **PRD 자체가 아직 확정하지 않은 값**(§3 재화 명칭과 함께 PRD Assumptions Index에 이미 기록됨) — 이 아키텍처 문서가 대신 확정할 사안이 아니므로 그대로 둠 |

### Coverage Report

**Systems Covered:** 6/6 (Project Context의 핵심 시스템 전부 구조·패턴·위치가 매핑됨)
**Patterns Defined:** 2개 노블 패턴(스테이지 타이머, 플랫폼 게이팅) + 4개 표준 패턴(엔티티 생성/통신/상태/데이터접근)
**Decisions Made:** 7개(Step 4 Decision Summary 기준)

### Issues Resolved

- **[검증 중 발견·수정]** `useVisibility`가 WebView 공개 API에 없음을 타입 선언 직접 확인으로 발견 → `document.visibilitychange`로 전체 문서(Step 3, 4, 6, 7) 일괄 정정.
- **[검증 중 발견·보강]** 뽑기 추첨·결과 티어 판정의 순수 로직 위치가 Project Structure에서 누락 → `src/game/gacha.ts`, `src/game/resultTier.ts` 추가.

### Validation Date

2026-07-19


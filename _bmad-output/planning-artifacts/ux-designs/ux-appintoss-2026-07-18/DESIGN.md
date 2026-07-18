---
name: 패턴매칭 두뇌자극 + 동물 가챠 수집 게임
description: 앱인토스 캐주얼 미니앱. 패턴매칭 퍼즐로 두뇌를 가볍게 자극하고, 재화로 동물을 뽑아 도감을 채운다. 밝고 따뜻한 에너지, 둥글고 귀여운 타이포.
status: final
updated: 2026-07-18
colors:
  primary: '#FFC93C'
  primaryPressed: '#E6A800'
  accent: '#0F6E6B'
  accentLight: '#DCEFEC'
  surfaceBase: '#FFF8EC'
  surfaceRaised: '#FFFFFF'
  inkPrimary: '#3A322A'
  inkSecondary: '#8C8275'
  border: '#EDE6D6'
  success: '#4CAF7D'
  error: '#FF6B5C'
  currencyGold: '#F2A93B'
  legendarySparkle: '#B98CE0'
typography:
  display: '카페24 슈퍼매직 (Cafe24 Supermagic) — [ASSUMPTION: 무료 상업 라이선스로 알려져 있으나 최종 확인 필요, 대체 후보 여기어때 잘난체]'
  body: 'Pretendard'
  numeric: 'Pretendard, tabular-nums'
  scale: '16 / 18 / 22 / 28 / 36 (base 16px)'
  weights: '500 본문, 700 헤드라인/버튼/숫자 강조'
rounded:
  sm: 12px
  md: 20px
  pill: 999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 40px
components:
  button: '필/라운드 필, 채워진 primary, 텍스트는 항상 inkPrimary(옐로우 위 흰 텍스트 금지)'
  tile: '매칭 그리드 셀, rounded/md, 정사각, 상태별 배경 전환'
  progressBar: '스테이지 진행, pill 트랙 + primary 필'
  currencyBadge: 'pill 배지, currencyGold 텍스트/아이콘, 상단 고정'
  capsule: '뽑기 오픈 연출, accent 캡슐 + 흔들림 → 오픈 → 바운스 리빌'
  bottomNavTab: '3탭(퍼즐/뽑기/도감), 액티브 상태 accent, 비활성 inkSecondary'
  adBannerSlot: '하단 고정, surfaceRaised 배경, "광고" 라벨 필수'
---

## Brand & Style

"맞추는 즐거움"이 감정의 전부다 — 어려운 걸 해냈다는 성취감이 아니라, 짝을 찾았을 때의 작고 확실한 만족감. 그래서 화면은 시험지가 아니라 간식 같아야 한다: 따뜻한 크림 바탕 위에 햇살 같은 옐로우, 그 옆에서 차분히 받쳐주는 딥 틸. 둥근 타이포와 필 모양 버튼으로 각진 데는 없이 전부 손에 쥐면 부드러운 형태다.

동시에 이 게임은 토스 3천만 유저 중 30-50대 이상, 특히 부모 세대를 향한다. 그래서 "귀엽다"는 유치함이 아니라 정돈된 귀여움이어야 한다 — 캔디크러시식 과포화 이펙트나 촘촘한 정보 밀도는 피하고, 화면당 할 일은 하나, 텍스트는 크고, 여백은 넉넉하게 둔다. 그리고 이 앱은 절대 "두뇌 훈련 클리닉"처럼 보여선 안 된다 — 의료적 효능을 암시하는 순간(§ PRD Constraints) 법적 리스크로 직결되므로, 톤은 처음부터 끝까지 "체험/재미" 쪽으로만 기울어 있어야 한다.

옐로우/틸 조합은 코랄/샌드나 라벤더/민트보다 더 에너제틱하고 젊게 읽힐 수 있다는 트레이드오프를 알고 선택한 방향이다 — 채도를 과하게 올리지 않고, 아래 Colors 섹션의 명도/채도 범위를 지켜야 이 타겟에서도 "발랄"이지 "유치"로 넘어가지 않는다.

## Colors

| Role | Token | Hex | Use |
|---|---|---|---|
| Primary | `primary` | `#FFC93C` | 주요 CTA(퍼즐 시작, 뽑기 버튼), 스테이지 진행바 필, 선택된 상태 |
| Primary Pressed | `primaryPressed` | `#E6A800` | 버튼 눌림/포커스 |
| Accent | `accent` | `#0F6E6B` | 보조 액션, 탭바 액티브, 헤더 텍스트, 캡슐 오픈 연출 |
| Accent Light | `accentLight` | `#DCEFEC` | 매칭 성공 타일 배경, 정보성 배지 배경 |
| Surface Base | `surfaceBase` | `#FFF8EC` | 전체 배경 (웜 크림) |
| Surface Raised | `surfaceRaised` | `#FFFFFF` | 카드, 타일 기본 배경, 배너 광고 슬롯 |
| Ink Primary | `inkPrimary` | `#3A322A` | 본문/헤드라인 텍스트 (순검정 대신 웜 차콜) |
| Ink Secondary | `inkSecondary` | `#8C8275` | 보조 텍스트, 비활성 탭 |
| Border | `border` | `#EDE6D6` | 카드 구분선, 인풋 테두리 |
| Success | `success` | `#4CAF7D` | 매칭 완료 플래시, 클리어 다이얼로그 강조 |
| Error | `error` | `#FF6B5C` | 오답 타일 플래시 — 경고용 순수 레드 대신 부드러운 코랄 |
| Currency Gold | `currencyGold` | `#F2A93B` | 재화 카운터 텍스트/아이콘 (primary와 구분되는 별도 톤) |
| Legendary Sparkle | `legendarySparkle` | `#B98CE0` | 희귀 동물 뽑기 결과 강조 (전체 팔레트에서 유일한 저채도 포인트, 남발 금지) |

대비: `inkPrimary` on `surfaceBase` ≈ 11:1, `inkSecondary` on `surfaceBase` ≈ 4.6:1(WCAG AA 통과선). **`primary`(옐로우) 배경 위에는 항상 `inkPrimary` 텍스트만 사용 — 흰 텍스트는 대비 부족으로 금지.** 매칭 판별은 색상이 아니라 동물/과일 아이콘 형태로 하므로(기존 `patternMatch.ts` 로직과 일치) 색맹 접근성은 팔레트 선택과 무관하게 안전하다.

Avoid: 순수 레드(`#FF0000`류) 경고색 — 의료/경고 앱처럼 보임. 그라디언트 남발 — 카드 하나 이상엔 쓰지 않는다. 파스텔 톤으로 희석 — 에너지 방향을 골랐으면 채도를 지킨다.

## Typography

헤드라인/버튼/스테이지 숫자는 둥근 디스플레이 서체(`display` 토큰)로 "귀엽고 게임답게", 본문·설명 텍스트는 `Pretendard`로 가독성을 확보한다 — 두 서체를 섞는 이유는 30-50대+ 타겟에게 장문 설명(도감 캡션, 광고 시청 안내 등)까지 둥근 서체로 밀어붙이면 오히려 읽기 피로가 커지기 때문이다.

스케일은 16px 베이스에서 16 / 18 / 22 / 28 / 36 — 접근성 베이스라인(본문 16px+)을 하한으로 잡았다. 재화·스테이지 숫자는 `numeric` 토큰(tabular-nums)으로 자릿수가 바뀌어도 레이아웃이 흔들리지 않게 한다. 굵기는 본문 500, 헤드라인/버튼/숫자 강조는 700 — 중간 굵기(600)는 쓰지 않아 위계를 명확히 이분한다.

`[ASSUMPTION]` 카페24 슈퍼매직은 방향성 제안 폰트다. 실제 웹폰트 임베드 전 라이선스 조건(상업적 무료 이용 범위)을 개발 착수 시점에 재확인할 것 — 7일 스코프상 라이선스 이슈로 막히면 즉시 시스템 폰트로 폴백.

## Layout & Spacing

8px 그리드(4/8/12/16/24/32/40). 화면 좌우 마진은 16px 이상 — 접근성 "넉넉하게" 결정에 따라 TDS 기본값보다 한 단계 넓게 잡는다. 단일 컬럼, 모달은 한 겹까지만(공유 시트, 클리어 다이얼로그, 뽑기 결과 — 절대 두 겹으로 쌓지 않는다).

화면 상단은 항상 스테이지/재화 상태(`Top` 헤더 영역), 하단은 항상 3탭 네비게이션 + 그 위에 고정 배너 광고 슬롯(FR-7, 메인/도감 화면 상시 노출) — 이 두 앵커는 모든 화면에서 위치가 바뀌지 않는다.

## Elevation & Depth

전투 게임처럼 계층이 복잡하지 않다 — 카드/타일은 `surfaceRaised` 위 아주 옅은 그림자(과자 상자를 들어올린 듯한 촉각적 느낌, `0 2px 8px rgba(58,50,42,0.08)` 정도)만 쓰고, 배경(`surfaceBase`)과의 톤 차이로 우선 구분한다. 유일하게 진짜 "떠 있는" 레이어는 뽑기 캡슐 오픈 오버레이와 스테이지 클리어 다이얼로그 — 배경을 어둡게 스크림(60% `inkPrimary`) 처리해 시선을 강제로 고정한다.

## Shapes

전부 둥글다 — 이게 "귀여운" 톤의 핵심 장치다. `rounded/sm`(12px)은 배지·칩, `rounded/md`(20px)는 타일·카드, `rounded/pill`(999px)은 버튼·탭바·재화 배지. 완전한 직각은 화면 어디에도 쓰지 않는다(광고 슬롯 컨테이너 제외 — 광고는 플랫폼 렌더링이라 게임 스킨의 라운딩 규칙을 강제하지 않는다).

## Components

- **Button** — `pill` 필, 기본 `primary` 채움 + `inkPrimary` 텍스트, 최소 48px 높이·너비(접근성 탭 타겟). 보조 버튼은 `accent` 아웃라인 + `accent` 텍스트.
- **Tile (매칭 그리드 셀)** — `rounded/md` 정사각, 기본 `surfaceRaised`, 선택 시 `accentLight` 배경 + `accent` 2px 테두리, 오답 시 `error` 배경 500ms 플래시 후 원상복귀, 매칭 성공 시 `success` 플래시 후 페이드아웃. 아이콘 자체(동물/과일 이모지 또는 커스텀 일러스트)가 매칭 판별 신호 — 배경색은 상태 피드백 전용, 판별 기준 아님.
- **Progress bar (스테이지 진행)** — `pill` 트랙(`border` 색), `primary` 필. 헤더 안에 스테이지 번호와 함께 배치.
- **Currency badge** — `pill`, `currencyGold` 아이콘 + `numeric` 폰트 텍스트, 헤더 우측 고정. 재화 획득 시 카운트업 애니메이션.
- **Capsule (뽑기 오픈)** — `accent` 톤의 캡슐/상자 일러스트, 탭 시 흔들림 → 오픈 → 캐릭터 바운스 리빌 시퀀스. 레어 등급은 `legendarySparkle` 파티클 오버레이 추가.
- **Bottom nav tab** — 3탭 고정(퍼즐/뽑기/도감), 액티브 아이콘·라벨 `accent`, 비활성 `inkSecondary`. 최소 48px 탭 타겟.
- **Ad banner slot** — `surfaceRaised` 배경의 고정 하단 컨테이너, 상단에 작은 "광고" 라벨 필수(오인 방지, 플랫폼 정책 및 사용자 신뢰 양쪽 이유). 게임 스킨 라운딩 규칙 미적용.

→ 톤/토큰 시각 레퍼런스: [mockups/key-puzzle-main.html](mockups/key-puzzle-main.html), [mockups/key-gacha.html](mockups/key-gacha.html), [mockups/key-collection.html](mockups/key-collection.html). 이 문서(DESIGN.md)와 목업이 충돌하면 이 문서가 이긴다.

## Do's and Don'ts

| Do | Don't |
|---|---|
| 옐로우 배경엔 항상 진한(`inkPrimary`) 텍스트 | 옐로우 배경에 흰 텍스트 |
| 매칭 판별은 아이콘 형태로 | 매칭 판별을 색상에만 의존 |
| 모달은 한 겹까지만 | 다이얼로그 위에 다이얼로그 쌓기 |
| "두뇌 자극", "두뇌 운동" 등 체험 중심 카피 | "치매예방", "인지능력 개선" 등 효능 주장 |
| 광고 슬롯에 "광고" 라벨 명시 | 광고를 게임 UI처럼 위장 |
| `legendarySparkle`는 레어 등급 뽑기 결과에만 | 저채도 포인트 컬러를 장식용으로 남발 |
| 순수 레드 대신 `error`(코랄) 사용 | 경고/의료 앱처럼 읽히는 순수 레드 |

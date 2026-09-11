// [NEW 2026-08-21] 한국어 리소스. en.ts와 키 집합이 정확히 일치해야 한다
// (완료조건 6 — scripts/verify-i18n.mjs 가 기계 검증한다).
export const ko = {
  common: {
    confirm: "확인",
    offline: "오프라인 상태예요. 광고 보상은 연결된 뒤에 받을 수 있어요.",
  },
  splash: {
    title: "틀리면 끝, 동물찾기",
    tagline: "맞추는 즐거움",
  },
  puzzle: {
    title: "틀리면 끝, 동물찾기",
    stage: "스테이지 {{stage}}",
    timeBoostApplied: "시간 회복 적용 — {{base}}초 → <1>{{total}}초</1>",
    shieldRemaining: "오답 방패 <1>×{{count}}</1> 남음",
    runOver: "런 종료",
    stageCleared: "스테이지 {{stage}} 클리어 · {{score}}점",
    newRecord: "최고 기록을 경신했어요!",
    // [FIX 2026-09-11] "{{stage}}예요"는 받침 있는 숫자(1·3·6·7·8·0)에서 "이에요"가 맞아 어색했다.
    // 받침과 무관한 "까지예요"로 바꿔 한 문자열로 모든 숫자를 커버한다.
    bestRecord: "최고 기록은 스테이지 {{stage}}까지예요.",
    keepsBelongings: "모아둔 재화와 아이템은 그대로 남아 있어요.",
    share: "공유하기",
    ranking: "랭킹 보기",
    timeUp: "시간이 다 됐어요!",
    retriesUsed: "이번 런 무료 재시도 {{used}}/{{max}}회 사용",
    freeRetry: "무료로 재시도",
    watchAdContinue: "광고 보고 이어하기",
    shareContinue: "친구에게 공유하고 한 판 더",
    shareContinueHint:
      "친구에게 공유하면 이 스테이지를 한 번 더 할 수 있어요. 친구 1명마다 코인도 받아요(하루 {{limit}}명까지).",
    endRun: "결과 보기",
    clearTitle: "스테이지 클리어!",
    clearReward: "재화 {{reward}}개를 획득했어요.",
    nextStage: "다음 스테이지",
    goToGacha: "뽑으러 가기 🎁",
    adCapTitle: "오늘의 광고 시청 횟수를 모두 사용했어요",
    adCapDescription: "내일 다시 시도해 주세요.",
    // [UPDATED 2026-09-11] 소개형 → 도전장형. 받는 사람의 승부욕을 건드려야 링크를 누른다.
    // 토스는 이 뒤에 줄바꿈 + 딥링크를 붙인다(src/platform/toss/share.ts).
    shareMessage:
      "{{icon}} {{tier}} · 스테이지 {{stage}} 달성!!! 이거 이길 수 있어요?\n[틀리면 끝, 동물찾기]",
    // 스크린리더 전용 안내 — 시각 정보를 음성으로 대체하는 문장이라 번역 대상이다.
    a11yTimeUp: "시간이 다 됐어요. 스테이지에 실패했어요.",
    a11yTimeLow: "시간이 얼마 남지 않았어요.",
    a11yHiddenTile: "숨겨진 타일",
    a11yAnimal: "동물",
    a11yAnimalDisguised: "동물, {{disguise}} 착용",
  },
  gacha: {
    pull: "뽑기",
    inventory: "인벤토리",
    pullHint: "재화 {{cost}}개로 기능성 아이템을 하나 뽑을 수 있어요",
    emptyTitle: "아직 보유한 아이템이 없어요",
    emptyHint: "뽑기로 얻어볼까요?",
    goPull: "뽑기 하러 가기",
    startNextStage: "다음 스테이지 시작하기",
    inventoryHint:
      "아이템은 여기 인벤토리에서 다음 스테이지를 시작하기 전에 미리 쓸 수 있어요.",
    checkInventory: "인벤토리에서 확인하기",
  },
  toast: {
    notEnoughCurrency: "재화가 부족해요. 뽑기에는 {{cost}}개가 필요해요.",
    doubleRewardAlready: "이미 다음 스테이지에 재화 2배가 적용돼 있어요.",
    timeBoostReady:
      "다음 스테이지 제한시간이 {{seconds}}초 늘어나요! (누적 {{count}}개)",
    shieldReady: "오답 방패가 {{count}}개 준비됐어요. 오답마다 1개씩 소모돼요.",
    doubleRewardReady: "다음 스테이지 클리어 보상이 2배가 돼요.",
    pullSuccess: "뽑기 성공: {{item}} 획득!",
    adReward: "보상 획득: {{unitType}} {{amount}}개",
    shareRewardCoins: "친구 공유 보상으로 코인 {{amount}}개를 받았어요!",
  },
  items: {
    timeBoost: { label: "시간 회복", description: "다음 스테이지 제한시간 +5초" },
    mismatchShield: {
      label: "미스매치 방패",
      description: "다음 미스매치 1회 페널티 없음",
    },
    doubleReward: {
      label: "재화 2배",
      description: "다음 스테이지 클리어 시 재화 획득량 2배",
    },
  },
  // 티어명 — 동물 은유를 유지하되 영어권에서도 등급으로 읽히게 옮긴다.
  tiers: {
    cheetah: "치타급",
    fox: "여우급",
    deer: "사슴급",
    hippo: "하마급",
    sloth: "나무늘보급",
  },
  // [NEW 2026-09-11] 결과 카드 등급별 한 줄 메시지. 낮은 등급은 도발, 높은 등급은 자격부여.
  // 숫자 뒤 조사는 받침에 따라 갈리므로(3이요 / 5요) 받침과 무관한 "까지예요"만 쓴다.
  // 반말 금지 — 토스 UX 라이팅 가이드가 모든 문구에 해요체를 요구한다.
  tierMessages: {
    cheetah: "치타급 인증 🐆 이 기록을 깰 친구가 있을까요?",
    fox: "여우급 달성! 이 정도면 친구한테 자랑해도 돼요",
    deer: "사슴급이면 제법이에요. 친구는 여기까지 올 수 있을까요?",
    hippo: "하마급에서 멈추기엔 아까워요. 한 판만 더 해봐요",
    sloth: "고작 스테이지 {{stage}}까지예요? 나무늘보도 이것보단 빨라요 🦥",
  },
  disguises: {
    sunglasses: "선글라스",
    hat: "모자",
    ribbon: "리본",
    crown: "왕관",
  },
} as const;

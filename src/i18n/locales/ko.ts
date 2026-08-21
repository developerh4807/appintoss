// [NEW 2026-08-21] 한국어 리소스. en.ts와 키 집합이 정확히 일치해야 한다
// (완료조건 6 — scripts/verify-i18n.mjs 가 기계 검증한다).
export const ko = {
  common: {
    confirm: "확인",
    ad: "광고",
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
    bestRecord: "최고 기록은 스테이지 {{stage}}예요.",
    keepsBelongings: "모아둔 재화와 아이템은 그대로 남아 있어요.",
    share: "공유하기",
    ranking: "랭킹 보기",
    retryRun: "다시 도전",
    timeUp: "시간이 다 됐어요!",
    retriesUsed: "이번 런 무료 재시도 {{used}}/{{max}}회 사용",
    freeRetry: "무료로 재시도",
    watchAdContinue: "광고 보고 이어하기",
    clearTitle: "스테이지 클리어!",
    clearReward: "재화 {{reward}}개를 획득했어요.",
    nextStage: "다음 스테이지",
    goToGacha: "뽑으러 가기 🎁",
    adCapTitle: "오늘의 광고 시청 횟수를 모두 사용했어요",
    adCapDescription: "내일 다시 시도해 주세요.",
    shareMessage:
      "{{icon}} [틀리면 끝, 동물찾기] 반응속도 {{tier}}! 스테이지 {{stage}}까지 클리어했어요. 같이 해볼래요?",
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
    pullFree: "광고 보고 무료로 뽑기",
    adLoading: "광고 준비 중...",
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
    adCapReached: "오늘의 광고 시청 횟수를 모두 사용했어요. 내일 다시 시도해 주세요.",
    doubleRewardAlready: "이미 다음 스테이지에 재화 2배가 적용돼 있어요.",
    timeBoostReady:
      "다음 스테이지 제한시간이 {{seconds}}초 늘어나요! (누적 {{count}}개)",
    shieldReady: "오답 방패가 {{count}}개 준비됐어요. 오답마다 1개씩 소모돼요.",
    doubleRewardReady: "다음 스테이지 클리어 보상이 2배가 돼요.",
    pullSuccess: "뽑기 성공: {{item}} 획득!",
    adReward: "보상 획득: {{unitType}} {{amount}}개",
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
  disguises: {
    sunglasses: "선글라스",
    hat: "모자",
    ribbon: "리본",
    crown: "왕관",
  },
} as const;

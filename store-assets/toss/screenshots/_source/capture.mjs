#!/usr/bin/env node
/**
 * 토스 미니앱 스토어 스크린샷 — 원본 캡처 스크립트
 *
 * 헤드리스 Chrome + CDP로 dev 서버(기본 http://localhost:5188)의 실제 게임 화면을 찍는다.
 * 앱 코드는 건드리지 않는다 — 상태는 localStorage 심기와 자동 플레이로만 만든다.
 *
 *   node capture.mjs [--url http://localhost:5188] [--out ./raw] [--shot 1|2|3]
 *
 * 산출물: raw/ss1-raw.png, raw/ss2-raw.png, raw/ss3-raw.png (780×1688, DPR 2)
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const URL_BASE = argOf("url", "http://localhost:5188");
const OUT_DIR = resolve(HERE, argOf("out", "./raw"));
const ONLY_SHOT = argOf("shot", null);

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;
const PROFILE = resolve(tmpdir(), `appintoss-shots-chrome-${process.pid}`);

// 원본 캡처 해상도: 390×844 논리 픽셀 × DPR 2 = 780×1688
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };

const SPLASH_MS = 1400; // HOLD_MS 800 + FADE_MS 320 + 여유
const MISMATCH_MS = 950; // MISMATCH_DELAY_MS 900 + 여유
const FAILURE_BANNER_MS = 1300; // FAILURE_BANNER_DELAY_MS 1000 + 여유

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[capture]", ...a);

/* ─────────────────────────── CDP 최소 클라이언트 ─────────────────────────── */

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: res, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : res(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, reject) => {
      this.pending.set(id, { resolve: res, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 30000);
    });
  }

  /** 페이지에서 함수를 실행하고 JSON 직렬화된 값을 돌려받는다. */
  async evaluate(fn, ...args) {
    const expression = `(${fn.toString()})(${args
      .map((a) => JSON.stringify(a))
      .join(",")})`;
    const { result, exceptionDetails } = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(
        `page eval failed: ${exceptionDetails.text} ${
          exceptionDetails.exception?.description ?? ""
        }`,
      );
    }
    return result.value;
  }
}

/* ───────────────────────────── Chrome 띄우기 ───────────────────────────── */

async function launchChrome() {
  rmSync(PROFILE, { recursive: true, force: true });
  const proc = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--lang=ko-KR",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  // CDP HTTP 엔드포인트가 열릴 때까지 대기
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) break;
    } catch {
      /* 아직 안 떴다 */
    }
    await sleep(250);
  }
  return proc;
}

async function connectPage() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === "page");
  if (!page) throw new Error("page 타깃을 찾지 못했다");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, reject) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new Cdp(ws);
}

/* ───────────────────── 로드 전 주입: 언어·상태·가시성·개발 UI ───────────────────── */

/**
 * @param {Cdp} cdp
 * @param {object} storage localStorage에 심을 key→value(문자열)
 */
async function prepare(cdp, storage) {
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", VIEWPORT);
  await cdp.send("Emulation.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    acceptLanguage: "ko-KR,ko",
    platform: "iPhone",
  });

  // 새 문서마다: (1) 타이머가 멈추지 않게 visibilityState 고정 (useStageTimer.ts)
  //             (2) localStorage 심기  (3) devtools 오버레이 숨김 CSS
  const source = `
    (() => {
      try {
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
        Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      } catch {}
      try {
        const seed = ${JSON.stringify(storage)};
        for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
      } catch {}
      const inject = () => {
        if (!document.head || document.getElementById("__shots-hide")) return;
        const s = document.createElement("style");
        s.id = "__shots-hide";
        // @apps-in-toss/devtools 패널/토글/시뮬레이션 오버레이 — 캡처에만 숨긴다
        s.textContent = \`
          .ait-panel-root, .ait-panel-toggle,
          #__ait-viewport-notch, #__ait-viewport-home-indicator,
          #__ait-viewport-navbar { display: none !important; }
        \`;
        document.head.appendChild(s);
        document.documentElement.classList.remove("ait-viewport-active");
      };
      inject();
      document.addEventListener("DOMContentLoaded", inject);
    })();
  `;
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source });
}

async function gotoApp(cdp) {
  await cdp.send("Page.navigate", { url: URL_BASE });
  await sleep(SPLASH_MS);
  // 개발 오버레이가 뒤늦게 붙는 경우 대비
  await cdp.evaluate(() => {
    document
      .querySelectorAll(".ait-panel-root, .ait-panel-toggle")
      .forEach((el) => el.remove());
    document.documentElement.classList.remove("ait-viewport-active");
  });
}

/* ──────────────────────────── 페이지 조작 헬퍼 ──────────────────────────── */

/** 텍스트가 일치(포함)하는 버튼을 클릭한다. 찾으면 true. */
const clickButtonByText = (cdp, text) =>
  cdp.evaluate((t) => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.trim().includes(t),
    );
    if (!btn) return false;
    btn.click();
    return true;
  }, text);

/** 보드 타일 상태 스냅숏. */
const readTiles = (cdp) =>
  cdp.evaluate(() =>
    [...document.querySelectorAll("button[aria-pressed]")].map((b, i) => ({
      i,
      matched: b.disabled,
      selected: b.getAttribute("aria-pressed") === "true",
      face: b.textContent.trim(),
    })),
  );

const clickTile = (cdp, index) =>
  cdp.evaluate((i) => {
    const tiles = [...document.querySelectorAll("button[aria-pressed]")];
    if (!tiles[i] || tiles[i].disabled) return false;
    tiles[i].click();
    return true;
  }, index);

/** 스테이지 클리어 오버레이가 떠 있나 (rgba(58,50,42,0.6)). */
const isStageClear = (cdp) =>
  cdp.evaluate(
    () => !!document.querySelector('div[style*="rgba(58, 50, 42, 0.6)"]'),
  );

/** 타이머가 빨간 임계 상태인가 — 게이지 채움 색이 error(#FF6B5C). */
const isCritical = (cdp) =>
  cdp.evaluate(() =>
    [...document.querySelectorAll("div")].some(
      (d) =>
        getComputedStyle(d).backgroundColor === "rgb(255, 107, 92)" &&
        d.getBoundingClientRect().width > 20,
    ),
  );

/** 남은 초(타이머 숫자 표시)를 읽는다. 못 읽으면 null. */
const readSeconds = (cdp) =>
  cdp.evaluate(() => {
    const el = [...document.querySelectorAll("div")]
      .filter((d) => /^\d+$/.test(d.textContent.trim()) && d.children.length === 0)
      .sort(
        (a, b) =>
          parseFloat(getComputedStyle(b).fontSize) -
          parseFloat(getComputedStyle(a).fontSize),
      )[0];
    return el ? Number(el.textContent.trim()) : null;
  });

/**
 * 앞면이 보이는 타일들로 짝을 지어 클릭한다.
 * 보드가 전부 앞면인 스테이지 시작 직후에 호출하면 전체 짝 지도를 얻는다.
 *
 * @param {number} stopAfterPairs 이만큼 짝을 맞추면 멈춘다(null이면 전부)
 */
async function solveStage(cdp, { stopAfterPairs = null } = {}) {
  // 스테이지 시작 직후 전부 앞면일 때 지도를 뜬다
  const snapshot = await readTiles(cdp);
  const byFace = new Map();
  for (const t of snapshot) {
    if (t.face === "?" || t.matched) continue;
    if (!byFace.has(t.face)) byFace.set(t.face, []);
    byFace.get(t.face).push(t.i);
  }

  const pairs = [];
  for (const indices of byFace.values()) {
    for (let k = 0; k + 1 < indices.length; k += 2) {
      pairs.push([indices[k], indices[k + 1]]);
    }
  }

  let done = 0;
  for (const [a, b] of pairs) {
    if (stopAfterPairs !== null && done >= stopAfterPairs) break;
    await clickTile(cdp, a);
    await sleep(120);
    await clickTile(cdp, b);
    await sleep(260);
    done++;
    if (await isStageClear(cdp)) break;
  }
  return done;
}

/** 스테이지 클리어까지 자동 플레이하고 클리어 카드를 기다린다. */
async function clearStage(cdp) {
  await solveStage(cdp);
  for (let i = 0; i < 40; i++) {
    if (await isStageClear(cdp)) return true;
    await sleep(150);
  }
  return false;
}

/** 스테이지 N까지 연속 클리어한다(클리어 카드에서 "다음 스테이지"). */
async function clearUpToStage(cdp, target) {
  for (let stage = 1; stage <= target; stage++) {
    const cleared = await clearStage(cdp);
    if (!cleared) throw new Error(`스테이지 ${stage} 클리어 실패`);
    log(`  스테이지 ${stage} 클리어`);
    if (stage < target) {
      await clickButtonByText(cdp, "다음 스테이지");
      await sleep(500);
    }
  }
}

async function screenshot(cdp, filename) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  const path = resolve(OUT_DIR, filename);
  writeFileSync(path, Buffer.from(data, "base64"));
  log(`  → ${path}`);
}

/* ───────────────────────────── 컷별 시나리오 ───────────────────────────── */

const today = () => new Date().toISOString().slice(0, 10);

const BASE_STORAGE = {
  "appintoss.lang": '"ko"',
  "appintoss.puzzle.inventoryTooltipSeen": "1",
  "appintoss.puzzle.dailyAdCap": JSON.stringify({ date: today(), count: 20 }),
};

/**
 * ① 긴장 장면 — 스테이지 5(14장, 4행)에서 짝 몇 개만 맞추고
 *    타이머 게이지가 빨개진 순간(남은시간 ≤ 25%)에 캡처.
 */
async function shot1(cdp) {
  log("① 긴장 장면");
  await prepare(cdp, {
    ...BASE_STORAGE,
    "appintoss.puzzle.progress": JSON.stringify({ currency: 240, stage: 1 }),
  });
  await gotoApp(cdp);

  const TARGET_STAGE = 5; // 14장 = 4열×4행(마지막 줄 2장) — 합성 화면에서 잘 읽힌다
  for (let stage = 1; stage < TARGET_STAGE; stage++) {
    if (!(await clearStage(cdp))) throw new Error(`스테이지 ${stage} 클리어 실패`);
    await clickButtonByText(cdp, "다음 스테이지");
    await sleep(500);
  }
  log(`  스테이지 ${TARGET_STAGE} 진입`);

  // 짝 3개만 맞추고 멈춘다 → 남은 ? 타일이 넉넉히 보인다
  await solveStage(cdp, { stopAfterPairs: 3 });

  // 게이지가 빨개질 때까지 기다린다(스테이지 5 = 13초, 임계 25%)
  let red = false;
  for (let i = 0; i < 80; i++) {
    if (await isCritical(cdp)) {
      red = true;
      break;
    }
    await sleep(250);
  }
  if (!red) log("  ⚠️ 임계(빨강) 상태를 감지하지 못했다 — 그대로 캡처한다");
  await sleep(400); // 색 전환(0.3s) 안착

  const secs = await readSeconds(cdp);
  const tiles = await readTiles(cdp);
  const hidden = tiles.filter((t) => t.face === "?" && !t.matched).length;
  log(`  남은 ${secs}초 · 숨겨진 타일 ${hidden}장 · 전체 ${tiles.length}장`);

  await screenshot(cdp, "ss1-raw.png");
}

/**
 * ② 결과 카드 — bestStage 20을 심어 🐆 치타급 결과 카드를 띄운다.
 *    헤드리스에는 광고·공유 단계가 없으므로 무료재시도 2회를 소진하면 결과 카드가 뜬다.
 */
async function shot2(cdp) {
  log("② 결과 카드");
  await prepare(cdp, {
    ...BASE_STORAGE,
    "appintoss.puzzle.progress": JSON.stringify({ currency: 240, stage: 1 }),
    // bestStage만 복원된다 → 치타급(≥20) 결과 카드
    "appintoss.puzzle.runState": JSON.stringify({
      retriesUsed: 0,
      adUsed: false,
      shareUsed: false,
      bestStage: 20,
      bestStageAtRunStart: 20,
    }),
  });
  await gotoApp(cdp);

  // 아무것도 하지 않고 시간 만료 → 실패 카드 → 무료재시도, 총 3번 만료시키면 런 종료
  for (let attempt = 0; attempt < 3; attempt++) {
    // 타이머 만료 대기
    let expired = false;
    for (let i = 0; i < 100; i++) {
      const s = await readSeconds(cdp);
      if (s === 0 || s === null) {
        expired = true;
        break;
      }
      await sleep(300);
    }
    if (!expired) log(`  ⚠️ ${attempt + 1}회차 만료 감지 실패`);
    await sleep(FAILURE_BANNER_MS);

    const retried = await clickButtonByText(cdp, "무료로 재시도");
    log(`  ${attempt + 1}회차 만료 · 재시도 버튼 ${retried ? "클릭" : "없음(런 종료)"}`);
    if (!retried) break;
    await sleep(600);
  }

  // 공유 단계가 떠 있으면 "결과 보기"로 넘어간다
  if (await clickButtonByText(cdp, "결과 보기")) {
    log("  공유 단계 → 결과 보기");
    await sleep(700);
  }

  const card = await cdp.evaluate(() => {
    const texts = [...document.querySelectorAll("div, strong, p")]
      .map((e) => e.textContent.trim())
      .filter(Boolean);
    return {
      hasRunOver: texts.some((t) => t === "런 종료"),
      tier: texts.find((t) => /급$/.test(t)) ?? null,
      record: texts.find((t) => t.includes("클리어 ·")) ?? null,
      newRecord: texts.some((t) => t.includes("경신")),
      buttons: [...document.querySelectorAll("button")].map((b) =>
        b.textContent.trim(),
      ),
    };
  });
  log(`  결과 카드: ${JSON.stringify(card)}`);
  if (!card.hasRunOver) throw new Error("결과 카드가 뜨지 않았다");

  await screenshot(cdp, "ss2-raw.png");
}

/**
 * ③ 뽑기 공개 모달 — 재화 240을 심고 스테이지 1 클리어 → 뽑으러 가기 → 뽑기.
 *    가챠 화면 하단 96px 토스 배너 자리는 캡처에서만 제거한다(앱 코드는 그대로).
 */
async function shot3(cdp) {
  log("③ 뽑기 공개");
  await prepare(cdp, {
    ...BASE_STORAGE,
    "appintoss.puzzle.progress": JSON.stringify({ currency: 240, stage: 1 }),
  });
  await gotoApp(cdp);

  if (!(await clearStage(cdp))) throw new Error("스테이지 1 클리어 실패");
  log("  스테이지 1 클리어");

  if (!(await clickButtonByText(cdp, "뽑으러 가기"))) {
    throw new Error("'뽑으러 가기 🎁' 버튼을 찾지 못했다");
  }
  await sleep(700);

  // 토스 배너 광고 자리(빈 96px 스페이서) 제거 — 스크린샷 연출용, 앱 코드는 안 고친다
  await cdp.evaluate(() => {
    document
      .querySelectorAll('div[style*="height: 96px"]')
      .forEach((el) => el.remove());
  });

  // 뽑기 CTA는 width 240px — 같은 텍스트의 탭/제목과 구분한다
  const pulled = await cdp.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === "뽑기" && b.style.width === "240px",
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!pulled) throw new Error("뽑기 버튼을 찾지 못했다");
  await sleep(900);

  const modal = await cdp.evaluate(() => {
    const overlay = document.querySelector(
      'div[style*="rgba(58, 50, 42, 0.75)"]',
    );
    if (!overlay) return null;
    return {
      text: overlay.textContent.trim().slice(0, 120),
    };
  });
  log(`  공개 모달: ${JSON.stringify(modal)}`);
  if (!modal) throw new Error("뽑기 공개 모달이 뜨지 않았다");

  await screenshot(cdp, "ss3-raw.png");
}

/* ──────────────────────────────── 엔트리 ──────────────────────────────── */

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  log(`dev 서버: ${URL_BASE}`);
  log(`출력: ${OUT_DIR}`);

  const chrome = await launchChrome();
  const shots = [
    ["1", shot1],
    ["2", shot2],
    ["3", shot3],
  ].filter(([n]) => !ONLY_SHOT || ONLY_SHOT === n);

  try {
    for (const [n, fn] of shots) {
      // 컷마다 새 탭에 붙어 상태를 깨끗이 시작한다
      const cdp = await connectPage();
      try {
        await fn(cdp);
      } catch (err) {
        log(`  ❌ 컷 ${n} 실패: ${err.message}`);
        // 디버깅용으로 실패 시점을 남긴다
        try {
          await screenshot(cdp, `ss${n}-FAILED.png`);
        } catch {}
        throw err;
      } finally {
        cdp.ws.close();
      }
    }
    log("완료");
  } finally {
    chrome.kill();
    await sleep(500); // Chrome이 프로필을 놓을 때까지
    try {
      rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5 });
    } catch {
      /* 임시 프로필이 남아도 무해하다 */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

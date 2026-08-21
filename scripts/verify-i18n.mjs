// [NEW 2026-08-21] i18n 검증 — docs/plans/android-port.md 완료조건 6.
//   (1) ko/en 키 집합 일치
//   (2) 각 키의 보간 변수({{...}}) 집합 일치 — 한쪽만 변수를 빠뜨리면 런타임에 빈칸이 된다
//   (3) UI 코드에 하드코딩된 한국어 0건
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

let failed = false;
const fail = (msg) => { console.error(`  ✗ ${msg}`); failed = true; };

// ── 리소스는 TS 파일이라 tsx 로 직접 import 한다.
const { ko } = await import("../src/i18n/locales/ko.ts");
const { en } = await import("../src/i18n/locales/en.ts");

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

const flatKo = flatten(ko);
const flatEn = flatten(en);
const keysKo = Object.keys(flatKo).sort();
const keysEn = Object.keys(flatEn).sort();

console.log("▶ 조건 6-1: ko/en 키 집합 일치");
const missingInEn = keysKo.filter((k) => !keysEn.includes(k));
const missingInKo = keysEn.filter((k) => !keysKo.includes(k));
if (missingInEn.length) fail(`en 에 없는 키: ${missingInEn.join(", ")}`);
if (missingInKo.length) fail(`ko 에 없는 키: ${missingInKo.join(", ")}`);
if (!missingInEn.length && !missingInKo.length)
  console.log(`  ✓ 키 ${keysKo.length}개 양쪽 일치`);

console.log("▶ 조건 6-2: 보간 변수 일치");
const vars = (s) => [...String(s).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort().join(",");
let varMismatch = 0;
for (const k of keysKo) {
  if (!(k in flatEn)) continue;
  if (vars(flatKo[k]) !== vars(flatEn[k])) {
    fail(`"${k}" 변수 불일치 — ko:{${vars(flatKo[k])}} en:{${vars(flatEn[k])}}`);
    varMismatch++;
  }
}
if (!varMismatch) console.log("  ✓ 모든 키의 보간 변수 일치");

console.log("▶ 조건 6-3: UI 코드 하드코딩 한국어 0건");
// 검사 대상은 화면에 뜨는 코드만이다. 로케일 리소스·주석·console·throw(개발자용 에러)는 제외한다.
const roots = ["src/pages", "src/game", "src/hooks", "src/platform/android", "src/App.tsx", "src/main.tsx"];
const files = [];
const walk = (p) => {
  let st;
  try { st = readdirSync(p, { withFileTypes: true }); } catch { files.push(p); return; }
  for (const d of st) {
    const full = join(p, d.name);
    if (d.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(d.name)) files.push(full);
  }
};
roots.forEach(walk);

const hangul = /[가-힣]/;
let hardcoded = 0;
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  let inBlockComment = false;
  // throw new Error(`...`) 가 여러 줄에 걸치는 경우가 있어 상태로 추적한다.
  let inThrow = false;
  // console.error(`...`) 도 여러 줄에 걸칠 수 있다 — throw 와 같은 방식으로 추적한다.
  let inConsole = false;
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    // 블록 주석 및 여러 줄 JSX 주석({/* ... */})을 함께 처리한다.
    if (inBlockComment) { if (trimmed.includes("*/")) inBlockComment = false; return; }
    if (trimmed.startsWith("/*") || trimmed.startsWith("{/*")) {
      if (!trimmed.includes("*/")) inBlockComment = true;
      return;
    }
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    if (inConsole) { if (trimmed.includes(");")) inConsole = false; return; }
    if (/console\./.test(trimmed)) {
      if (!trimmed.includes(");")) inConsole = true;
      return;
    }

    if (inThrow) { if (trimmed.includes(");")) inThrow = false; return; }
    if (/throw new/.test(trimmed)) {
      if (!trimmed.includes(");")) inThrow = true;
      return;
    }

    const code = line.split("//")[0];
    if (!hangul.test(code)) return;
    // console.* 는 개발자용 진단 문자열이라 번역 대상이 아니다.
    if (/console\./.test(code)) return;
    fail(`하드코딩 한국어 ${f}:${i + 1} — ${trimmed.slice(0, 80)}`);
    hardcoded++;
  });
}
if (!hardcoded) console.log("  ✓ 하드코딩 한국어 0건");

process.exit(failed ? 1 : 0);

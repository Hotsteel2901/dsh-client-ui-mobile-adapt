#!/usr/bin/env node
/**
 * dsh-client-ui-mobile-adapt — 纯逻辑单元测试
 *
 * 从 lib/client.js 中抽取 fmtN / fmtD 源码，在隔离沙箱里求值后逐条断言。
 * 覆盖本次修复的进位溢出（999999 → "1000K" / 59999ms → "60s"）。
 *
 * 用法: node tools/unit.test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "lib", "client.js"), "utf8");

/** 从源码里截出某个 `const NAME = (...) => { ... };` 的完整定义。
 *  做法：定位 `const NAME = `，然后逐个字符扫描做括号配平。
 *  关键点：必须同时跟踪 () [] {} 三类括号并跳过字符串/模板串/注释，
 *  否则函数体内的箭头函数、模板串花括号都会让配平提前结束。 */
function extractArrowFn(name) {
  const marker = `const ${name} = `;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`未找到 ${name}`);

  let i = start + marker.length;
  // 跳过形参列表，找到函数体起始的 {
  while (i < src.length && src[i] !== "{") i += 1;
  if (i >= src.length) throw new Error(`${name} 未找到函数体`);

  const open = { "{": "}", "(": ")", "[": "]" };
  const closer = new Set(["}", ")", "]"]);
  const stack = [];
  let inStr = null; // ', ", `
  let inLineComment = false;
  let inBlockComment = false;

  for (; i < src.length; i += 1) {
    const c = src[i];
    const next = src[i + 1];

    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (inStr !== null) {
      if (c === "\\") {
        i += 1;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }

    if (c === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (c === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }

    if (c === "{" || c === "(" || c === "[") {
      stack.push(open[c]);
    } else if (closer.has(c)) {
      const want = stack.pop();
      if (want !== c) throw new Error(`${name} 括号不匹配：期望 ${want} 得到 ${c}`);
      if (stack.length === 0) {
        const end = src.indexOf(";", i);
        return src.slice(start, end + 1);
      }
    }
  }
  throw new Error(`${name} 括号不配平`);
}

const code = `${extractArrowFn("fmtN")}\n${extractArrowFn("fmtD")}\nreturn { fmtN, fmtD };`;
const { fmtN, fmtD } = new Function(code)();

let pass = 0;
let fail = 0;
const failures = [];

function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass += 1;
  } else {
    fail += 1;
    failures.push(`${label}\n     expected ${e}\n     actual   ${a}`);
  }
}

/* ---------- fmtN：常规 ---------- */
eq(fmtN(0), null, "fmtN(0) 视为无数据");
eq(fmtN(-5), null, "fmtN(负数) 视为无数据");
eq(fmtN(NaN), null, "fmtN(NaN) 视为无数据");
eq(fmtN(Infinity), null, "fmtN(Infinity) 视为无数据");
eq(fmtN(undefined), null, "fmtN(undefined) 视为无数据");
eq(fmtN(null), null, "fmtN(null) 视为无数据");
eq(fmtN(1), "1", "fmtN(1)");
eq(fmtN(999), "999", "fmtN(999) 不进 K");
eq(fmtN(1000), "1K", "fmtN(1000)");
eq(fmtN(1234), "1.2K", "fmtN(1234) 一位小数");
eq(fmtN(999499), "999K", "fmtN(999499)");
eq(fmtN(1234567), "1.2M", "fmtN(1234567)");

/* ---------- fmtN：进位溢出（本次修复的核心） ---------- */
eq(fmtN(999500), "1M", "fmtN(999500) 四舍五入不得读作 1000K");
eq(fmtN(999999), "1M", "fmtN(999999) 不得读作 1000K");
eq(fmtN(999999999), "1G", "fmtN(999999999) 不得读作 1000M");
eq(fmtN(1e9), "1G", "fmtN(1e9)");
eq(fmtN(1.5e9), "1.5G", "fmtN(1.5e9)");
eq(fmtN(1e12), "1T", "fmtN(1e12)");
eq(fmtN(999999999999), "1T", "fmtN(近 1e12) 不得读作 1000G");

/* ---------- fmtD：常规 ---------- */
eq(fmtD(0), null, "fmtD(0) 视为无数据");
eq(fmtD(-1), null, "fmtD(负数) 视为无数据");
eq(fmtD(NaN), null, "fmtD(NaN) 视为无数据");
eq(fmtD(1500), "1.5s", "fmtD(1500)");
eq(fmtD(1000), "1s", "fmtD(1000)");
eq(fmtD(59900), "59.9s", "fmtD(59900)");
eq(fmtD(60000), "1m", "fmtD(60000)");
eq(fmtD(90000), "1m30s", "fmtD(90000)");
eq(fmtD(120000), "2m", "fmtD(120000) 整分不带 0s");

/* ---------- fmtD：进位溢出（本次修复的核心） ---------- */
eq(fmtD(59999), "1m", "fmtD(59999) 四舍五入不得读作 60s");
eq(fmtD(59950), "1m", "fmtD(59950) 不得读作 60s");
eq(fmtD(89999), "1m30s", "fmtD(89999) 正常进到 1m30s");
eq(fmtD(599999), "10m", "fmtD(599999)");

console.log(`\n通过 ${pass} 项，失败 ${fail} 项`);
if (fail > 0) {
  console.log("\n失败详情:");
  failures.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
console.log("✅ 全部通过");

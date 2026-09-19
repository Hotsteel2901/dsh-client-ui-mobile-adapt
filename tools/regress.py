#!/usr/bin/env python3
"""
dsh-client-ui-mobile-adapt — 验收回归测试

覆盖两类断言：
  A. 触摸目标：设置面板四个 tab 内所有可交互控件 >= 44x44（WCAG 2.5.5 / Material 48dp）
  B. 布局：6 视口下无横向溢出、无越界元素；手机端单栏、桌面端保持原生三栏

另外回归 issue #2：字号 stepper 两个箭头不得重叠，且点击必须真实生效。

用法: python3 tools/regress.py <base_url>
退出码 0 = 全部通过
"""
import json
import sys
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome"

VIEWPORTS = [
    # name, width, height, dpr, is_phone
    # is_phone=True 断言单栏+汉堡；False 断言保持上游布局（汉堡隐藏）
    # 边界：插件断点为 767，故 768(iPad Mini) 归入上游的 56px 图标窄栏档
    ("iPhone SE",   375, 667, 2,   True),
    ("iPhone 14",   390, 844, 3,   True),
    ("Pixel 7",     412, 915, 2.6, True),
    ("iPad Mini",   768, 1024, 2,  False),
    ("Laptop",     1024, 768, 2,   False),
    ("Desktop",    1440, 900, 1,   False),
]

MIN_TAP = 44  # 允许恰好 44


def dismiss_dialogs(pg, rounds=6):
    for _ in range(rounds):
        if not pg.query_selector('[role="dialog"][aria-modal="true"]'):
            return True
        clicked = False
        for text in ["Configure later", "Continue", "Later", "Close", "Skip",
                     "稍后", "关闭", "跳过", "确定"]:
            el = pg.query_selector(f'button:has-text("{text}")')
            if el:
                try:
                    el.click(timeout=3000)
                    pg.wait_for_timeout(800)
                    clicked = True
                    break
                except Exception:
                    pass
        if not clicked:
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(500)
    return False


def make_swiper(ctx, pg):
    cdp = ctx.new_cdp_session(pg)

    def swipe(x, y, dy, steps=12):
        cdp.send("Input.dispatchTouchEvent",
                 {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
        for i in range(1, steps + 1):
            cdp.send("Input.dispatchTouchEvent",
                     {"type": "touchMove", "touchPoints": [{"x": x, "y": y + dy * i / steps}]})
            pg.wait_for_timeout(14)
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        pg.wait_for_timeout(380)
    return swipe


def scan_tap_targets(pg):
    return pg.evaluate(
        """(minTap) => {
        const out = [];
        document.querySelectorAll(
          '[role="dialog"] button,[role="dialog"] [role="switch"],' +
          '[role="dialog"] input,[role="dialog"] a,[role="dialog"] select'
        ).forEach(e => {
            const r = e.getBoundingClientRect();
            const cs = getComputedStyle(e);
            if (r.width < 1 || r.height < 1) return;
            if (cs.display === 'none' || cs.visibility === 'hidden') return;
            if (r.height < minTap || r.width < minTap) {
                out.push({
                    cls: (e.className || '').toString().slice(0, 46),
                    aria: e.getAttribute('aria-label'),
                    text: (e.innerText || '').trim().slice(0, 22),
                    w: Math.round(r.width), h: Math.round(r.height),
                });
            }
        });
        const seen = new Set();
        return out.filter(o => {
            const k = o.cls + o.w + 'x' + o.h;
            if (seen.has(k)) return false;
            seen.add(k); return true;
        });
    }""",
        MIN_TAP,
    )


def layout_probe(pg):
    return pg.evaluate(
        """() => {
        const out = {};
        const frame = document.querySelector('[class*="_frame"]');
        out.cols = frame ? getComputedStyle(frame).gridTemplateColumns : null;
        out.pluginCss = !!document.querySelector(
            'style[data-plugin-css="dsh-client-ui-mobile-adapt/client.css"]');

        const ham = document.querySelector('.dsh-mobile-hamburger');
        out.hamburger = ham ? getComputedStyle(ham).display : null;

        out.docW = document.documentElement.clientWidth;
        out.scrollW = document.documentElement.scrollWidth;
        out.hOverflow = out.scrollW - out.docW;

        const sb = document.querySelector('[class*="_sidebarCol"]');
        out.sidebarPos = sb ? getComputedStyle(sb).position : null;

        // 越界元素（排除收起态抽屉）
        const bad = [];
        document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) return;
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' && parseFloat(cs.left) < -100) return;
            const cls = (el.className || '').toString();
            if (cls.includes('sidebarCol')) return;
            if (r.right > window.innerWidth + 2) {
                bad.push({ tag: el.tagName, cls: cls.slice(0, 50) });
            }
        });
        out.offRight = bad.slice(0, 8);

        // 统计胶囊是否越出视口
        const pill = document.querySelector('.dsh-stats-pill');
        if (pill) {
            const r = pill.getBoundingClientRect();
            out.pill = {right: Math.round(r.right), vw: window.innerWidth,
                        ok: r.right <= window.innerWidth + 2};
        }
        return out;
    }"""
    )


def test_viewports(browser, url):
    """A/B: 逐视口布局断言。"""
    res = {}
    for name, w, h, dpr, mobile in VIEWPORTS:
        ctx = browser.new_context(viewport={"width": w, "height": h},
                                 device_scale_factor=dpr,
                                 is_mobile=mobile, has_touch=mobile)
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:250]))
        rec = {"viewport": f"{name} {w}x{h}"}
        try:
            pg.goto(url, wait_until="networkidle", timeout=45000)
            pg.wait_for_timeout(2200)
            dismiss_dialogs(pg)
            pg.wait_for_timeout(400)
            m = layout_probe(pg)
            rec.update(m)
            # 断言
            rec["pass_css"] = m["pluginCss"] is True
            rec["pass_noHScroll"] = m["hOverflow"] <= 1
            rec["pass_noOffRight"] = len(m["offRight"]) == 0
            if mobile:
                # 手机端：中栏独占、无侧栏列宽
                cols = m["cols"] or ""
                rec["pass_singleCol"] = cols.startswith("0px")
                rec["pass_hamburgerShown"] = m["hamburger"] not in (None, "none")
                rec["pass_sidebarFixed"] = m["sidebarPos"] == "fixed"
            else:
                # 桌面端：保持原生多栏，汉堡隐藏
                rec["pass_desktopNative"] = m["hamburger"] in (None, "none")
            rec["pageErrors"] = errs
            rec["pass"] = all(v for k, v in rec.items()
                              if k.startswith("pass_")) and not errs
        except Exception as e:
            rec["error"] = str(e)[:250]
            rec["pass"] = False
        finally:
            ctx.close()
        res[name] = rec
    return res


def test_settings_taps(browser, url):
    """A: 设置面板触摸目标 + issue #2 字号 stepper 回归。"""
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                             device_scale_factor=3, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:250]))
    out = {}
    pg.goto(url, wait_until="networkidle", timeout=45000)
    pg.wait_for_timeout(2400)
    dismiss_dialogs(pg)
    pg.wait_for_timeout(500)

    pg.query_selector(".dsh-mobile-hamburger").click()
    pg.wait_for_timeout(900)
    pg.query_selector('button[aria-label*="Settings"]').click()
    pg.wait_for_timeout(1500)
    swipe = make_swiper(ctx, pg)

    tabs = pg.evaluate(
        """() => Array.from(document.querySelectorAll('[class*="_navCell"]'))
                  .map(c => (c.innerText || '').trim())"""
    )

    all_small = {}
    for i, nm in enumerate(tabs):
        pg.evaluate(
            f"""() => {{const c = document.querySelectorAll('[class*="_navCell"]');
                        c[{i}] && c[{i}].click();}}"""
        )
        pg.wait_for_timeout(1100)
        for _ in range(5):
            swipe(195, 760, -600)
        small = scan_tap_targets(pg)
        all_small[nm] = small
    out["smallTargets"] = all_small
    out["totalSmall"] = sum(len(v) for v in all_small.values())
    out["pass_tapTargets"] = out["totalSmall"] == 0

    # --- issue #2 回归：字号 stepper ---
    pg.evaluate(
        """() => {const c = document.querySelectorAll('[class*="_navCell"]');
                  c[0] && c[0].click();}"""
    )
    pg.wait_for_timeout(1100)
    for _ in range(6):
        swipe(195, 760, -600)

    stepper = pg.evaluate(
        """() => {
        const a = document.querySelector('[aria-label="Increase font size"]');
        const b = document.querySelector('[aria-label="Decrease font size"]');
        if (!a || !b) return {found: false};
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const overlap = !(ra.right <= rb.left || rb.right <= ra.left ||
                          ra.bottom <= rb.top || rb.bottom <= ra.top);
        return {
            found: true, overlap,
            a: [Math.round(ra.width), Math.round(ra.height)],
            b: [Math.round(rb.width), Math.round(rb.height)],
            pass_size: ra.width >= 44 && ra.height >= 44 &&
                       rb.width >= 44 && rb.height >= 44,
            pass_noOverlap: !overlap,
        };
    }"""
    )
    out["fontStepper"] = stepper

    # 真实点击生效性
    def read_size():
        return pg.evaluate(
            """() => {const v = document.querySelector('.bVCLcG_value');
                       return v ? (v.innerText || '').trim() : null;}"""
        )
    s0 = read_size()
    pg.query_selector('[aria-label="Increase font size"]').click()
    pg.wait_for_timeout(700)
    s1 = read_size()
    pg.query_selector('[aria-label="Decrease font size"]').click()
    pg.wait_for_timeout(700)
    s2 = read_size()
    out["fontClicks"] = {"initial": s0, "afterInc": s1, "afterDec": s2,
                         "pass": s0 is not None and s1 != s0 and s2 == s0}
    out["pageErrors"] = errs
    out["pass"] = (out["pass_tapTargets"] and stepper.get("pass_size")
                   and stepper.get("pass_noOverlap")
                   and out["fontClicks"]["pass"] and not errs)
    ctx.close()
    return out


def test_breakpoint(browser, url):
    """断点边界回归：767 单栏带汉堡，768 起交还上游（汉堡隐藏）。"""
    out = {}
    for w in (767, 768):
        ctx = browser.new_context(viewport={"width": w, "height": 900},
                                 is_mobile=w < 768, has_touch=w < 768)
        pg = ctx.new_page()
        try:
            pg.goto(url, wait_until="networkidle", timeout=45000)
            pg.wait_for_timeout(2000)
            dismiss_dialogs(pg)
            pg.wait_for_timeout(400)
            r = pg.evaluate(
                """() => {
                const f = document.querySelector('[class*="_frame"]');
                const ham = document.querySelector('.dsh-mobile-hamburger');
                return {
                    cols: f ? getComputedStyle(f).gridTemplateColumns : null,
                    ham: ham ? getComputedStyle(ham).display : null,
                };
            }"""
            )
            out[w] = r
        except Exception as e:
            out[w] = {"error": str(e)[:200]}
        finally:
            ctx.close()
    phone = out.get(767, {})
    upper = out.get(768, {})
    out["pass"] = (
        isinstance(phone.get("cols"), str) and phone["cols"].startswith("0px")
        and phone.get("ham") not in (None, "none")
        and isinstance(upper.get("cols"), str) and not upper["cols"].startswith("0px")
        and upper.get("ham") in (None, "none")
    )
    return out


def main():
    if len(sys.argv) < 2:
        print("用法: regress.py <base_url>")
        sys.exit(1)
    url = sys.argv[1]
    report = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME,
                                    args=["--no-sandbox", "--disable-dev-shm-usage"])
        report["viewports"] = test_viewports(browser, url)
        report["breakpoint"] = test_breakpoint(browser, url)
        report["settings"] = test_settings_taps(browser, url)
        browser.close()

    ok = (all(v.get("pass") for v in report["viewports"].values())
          and report["breakpoint"].get("pass")
          and report["settings"].get("pass"))
    report["ALL_PASS"] = ok
    print(json.dumps(report, ensure_ascii=False, indent=1))
    print("\n==== RESULT:", "✅ 全部通过" if ok else "❌ 存在失败项", "====")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()

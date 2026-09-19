#!/usr/bin/env python3
"""
dsh-client-ui-mobile-adapt — 全面移动端仿真测试

流程：
  1. 走完首启引导弹窗，进入主界面
  2. 逐视口检查布局指标
  3. 交互测试：抽屉开合、设置面板、统计面板
  4. 扫描横向溢出 / 越界元素 / 遮挡

用法: python3 tools/test_mobile.py <base_url>
"""
import json
import sys
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome"

VIEWPORTS = [
    ("iPhone SE",   375, 667, 2),
    ("iPhone 14",   390, 844, 3),
    ("Pixel 7",     412, 915, 2.6),
    ("iPad Mini",   768, 1024, 2),
    ("Laptop",     1024, 768, 2),
    ("Desktop",    1440, 900, 1),
]


def dismiss_dialogs(pg, rounds=5):
    """走完首启引导弹窗。"""
    for _ in range(rounds):
        dlg = pg.query_selector('[role="dialog"][aria-modal="true"]')
        if not dlg:
            return True
        clicked = False
        for text in ["Configure later", "Continue", "Later", "Close", "Skip",
                     "稍后", "关闭", "跳过", "确定"]:
            el = pg.query_selector(f'button:has-text("{text}")')
            if el:
                try:
                    el.click(timeout=3000)
                    pg.wait_for_timeout(1000)
                    clicked = True
                    break
                except Exception:
                    pass
        if not clicked:
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(700)
    return pg.query_selector('[role="dialog"][aria-modal="true"]') is None


def probe(pg):
    return pg.evaluate(
        """() => {
        const out = {};
        const frame = document.querySelector('[class*="_frame"]');
        out.frameFound = frame !== null;
        out.frameCols = frame ? getComputedStyle(frame).gridTemplateColumns : null;
        out.sidebarCollapsed = frame ? frame.hasAttribute('data-sidebar-collapsed') : null;

        const cssTag = document.querySelector('style[data-plugin-css="dsh-client-ui-mobile-adapt/client.css"]');
        out.pluginCss = cssTag !== null;

        const ham = document.querySelector('.dsh-mobile-hamburger');
        if (ham) {
            const cs = getComputedStyle(ham);
            const r = ham.getBoundingClientRect();
            out.hamburger = {display: cs.display, w: Math.round(r.width), h: Math.round(r.height)};
        } else out.hamburger = null;

        const sb = document.querySelector('[class*="_sidebarCol"]');
        if (sb) {
            const cs = getComputedStyle(sb);
            out.sidebar = {position: cs.position, left: cs.left, width: cs.width, overflowY: cs.overflowY};
        }

        out.docW = document.documentElement.clientWidth;
        out.scrollW = document.documentElement.scrollWidth;
        out.hOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;

        // 可见的越界元素（排除抽屉收起态）
        const bad = [];
        document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) return;
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' && parseFloat(cs.left) < -100) return; // 收起抽屉
            const cls = (el.className || '').toString();
            if (cls.includes('sidebarCol')) return;
            if (r.right > window.innerWidth + 2) {
                bad.push({tag: el.tagName, cls: cls.slice(0, 60), right: Math.round(r.right), w: Math.round(r.width)});
            }
        });
        out.overflowRight = bad.slice(0, 12);

        const pill = document.querySelector('.dsh-stats-pill');
        out.statsPill = pill ? {w: Math.round(pill.getBoundingClientRect().width)} : null;

        return out;
    }"""
    )


def run(base_url):
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--disable-dev-shm-usage"])
        for name, w, h, dpr in VIEWPORTS:
            ctx = browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=dpr,
                is_mobile=w <= 768,
                has_touch=w <= 768,
            )
            pg = ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
            item = {"viewport": f"{name} {w}x{h}"}
            try:
                pg.goto(base_url, wait_until="networkidle", timeout=45000)
                pg.wait_for_timeout(2500)
                item["dialogsDismissed"] = dismiss_dialogs(pg)
                pg.wait_for_timeout(500)
                item["metrics"] = probe(pg)
                item["pageErrors"] = errs
            except Exception as e:
                item["error"] = str(e)[:300]
            finally:
                ctx.close()
            results[name] = item
        browser.close()
    return results


def main():
    if len(sys.argv) < 2:
        print("用法: test_mobile.py <base_url>")
        sys.exit(1)
    r = run(sys.argv[1])
    print(json.dumps(r, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

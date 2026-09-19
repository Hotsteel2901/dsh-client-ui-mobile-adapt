#!/usr/bin/env python3
"""
dsh-client-ui-mobile-adapt — 交互路径验证

目的：
  1. 打开抽屉 → 点击「设置」→ 验证设置面板可滚动（复现 issue #2「无法滑动导致无法保存配置」）
  2. 点击统计胶囊 → 展开面板 → 验证在视口内不被裁切、可滚动
  3. 轨迹 tab → 点击行 → 详情面板验证
  4. 每个交互态复扫懒加载 hash 类名有效性

用法: python3 tools/test_interactions.py <base_url>
"""
import json
import sys
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome"

# 插件 CSS 中引用、但首屏未渲染的懒加载类名
LAZY_CLASSES = [
    "JObwrW_", "Nqubda_", "Sh0Q9G_", "Y0dWHa_", "_7KE1Ra_",
    "fV0t5q_", "mufS8W_", "qBU-ya_",
]


def dismiss_dialogs(pg, rounds=6):
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
                    pg.wait_for_timeout(900)
                    clicked = True
                    break
                except Exception:
                    pass
        if not clicked:
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(600)
    return pg.query_selector('[role="dialog"][aria-modal="true"]') is None


def scan_classes(pg):
    """扫描页面上实际存活的所有 _xxx_ 形式 hash 前缀。"""
    return pg.evaluate(
        """() => {
        const prefixRe = /^_?([A-Za-z0-9_-]{5,8})_/;
        const found = new Set();
        document.querySelectorAll('*').forEach(el => {
            const cls = (el.className || '').toString();
            if (typeof cls !== 'string') return;
            cls.split(/\\s+/).forEach(c => {
                const m = prefixRe.exec(c);
                if (m) found.add(m[1] + '_');
            });
        });
        return Array.from(found).sort();
    }"""
    )


def scroll_probe(pg, sel, label):
    """检查某元素是否可滚动 / 是否被父层裁切。"""
    return pg.evaluate(
        """(sel) => {
        const el = document.querySelector(sel);
        if (!el) return {found: false};
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        // 向上回溯找第一个 overflow != visible 的祖先
        let anc = el.parentElement, chain = [];
        while (anc && anc !== document.body) {
            const acs = getComputedStyle(anc);
            if (acs.overflowY !== 'visible' || acs.overflowX !== 'visible') {
                chain.push({
                    cls: (anc.className||'').toString().slice(0,50),
                    ovY: acs.overflowY, ovX: acs.overflowX,
                    h: Math.round(anc.getBoundingClientRect().height),
                    scrollH: anc.scrollHeight, clientH: anc.clientHeight,
                    scrollable: anc.scrollHeight > anc.clientHeight + 2,
                });
            }
            anc = anc.parentElement;
        }
        return {
            found: true,
            ovY: cs.overflowY, ovX: cs.overflowX,
            h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom),
            scrollH: el.scrollHeight, clientH: el.clientHeight,
            selfScrollable: el.scrollHeight > el.clientHeight + 2,
            vpH: window.innerHeight,
            clippedBottom: r.bottom > window.innerHeight + 2,
            ancestors: chain,
        };
    }""",
        sel,
    )


def run(base_url):
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME,
                                    args=["--no-sandbox", "--disable-dev-shm-usage"])
        # 用 iPhone 14 视口（issue #2 最可能出现在手机端）
        ctx = browser.new_context(viewport={"width": 390, "height": 844},
                                  device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:400]))
        pg.goto(base_url, wait_until="networkidle", timeout=45000)
        pg.wait_for_timeout(2500)
        out["dialogsDismissed"] = dismiss_dialogs(pg)
        pg.wait_for_timeout(600)

        # ---- 基线类名 ----
        out["classes_initial"] = scan_classes(pg)

        # ---- 1. 打开抽屉 ----
        ham = pg.query_selector(".dsh-mobile-hamburger")
        if not ham:
            out["fatal"] = "hamburger not found"
            ctx.close(); browser.close(); return out
        ham.click()
        pg.wait_for_timeout(900)
        out["drawer_opened"] = pg.evaluate(
            """() => {
            const f = document.querySelector('[class*="_frame"]');
            const sb = document.querySelector('[class*="_sidebarCol"]');
            return {
              collapsed: f ? f.hasAttribute('data-sidebar-collapsed') : null,
              sbLeft: sb ? getComputedStyle(sb).left : null,
              sbOvY: sb ? getComputedStyle(sb).overflowY : null,
              sbScrollable: sb ? sb.scrollHeight > sb.clientHeight + 2 : null,
            };
        }"""
        )
        out["classes_drawer"] = scan_classes(pg)

        # ---- 2. 抽屉内滚动（issue #2 场景 A） ----
        out["drawer_scroll"] = scroll_probe(pg, '[class*="_sidebarCol"]', "sidebar")

        # ---- 3. 找设置入口 ----
        settings_candidates = [
            'button[aria-label*="Settings"]', 'button[aria-label*="设置"]',
            'button[title*="Settings"]', 'button[title*="设置"]',
            '[data-settings]', 'a[href*="settings"]',
            'button:has-text("Settings")', 'button:has-text("设置")',
        ]
        hit = None
        for sel in settings_candidates:
            el = pg.query_selector(sel)
            if el and el.is_visible():
                hit = sel
                break
        out["settings_selector"] = hit

        # 若找不到，列出抽屉内所有可点按钮供分析
        if not hit:
            out["drawer_buttons"] = pg.evaluate(
                """() => {
                const sb = document.querySelector('[class*="_sidebarCol"]');
                if (!sb) return [];
                return Array.from(sb.querySelectorAll('button,[role="button"],[role="menuitem"],[role="tab"],a'))
                  .map(b => ({
                    tag: b.tagName, role: b.getAttribute('role'),
                    aria: b.getAttribute('aria-label'), title: b.getAttribute('title'),
                    text: (b.innerText||'').trim().slice(0,40),
                    cls: (b.className||'').toString().slice(0,60),
                    vis: b.offsetParent !== null,
                  })).slice(0, 40);
            }"""
            )
            out["drawer_html_sample"] = pg.evaluate(
                """() => {
                const sb = document.querySelector('[class*="_sidebarCol"]');
                return sb ? sb.innerHTML.slice(0, 2500) : null;
            }"""
            )

        out["pageErrors"] = errs
        ctx.close()
        browser.close()
    return out


def main():
    if len(sys.argv) < 2:
        print("用法: test_interactions.py <base_url>")
        sys.exit(1)
    r = run(sys.argv[1])
    print(json.dumps(r, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

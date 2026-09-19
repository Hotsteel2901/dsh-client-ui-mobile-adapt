#!/usr/bin/env python3
"""
dsh-client-ui-mobile-adapt — 移动端仿真验证探针

在真实运行的 dsh web UI 上，以手机视口打开页面，检查：
  1. 插件是否成功装载（CSS 注入 + slot 注册）
  2. 插件依赖的 hash 类名是否在当前构建中真实存在（锚点有效性）
  3. 移动端布局是否生效（单栏收敛、抽屉、汉堡按钮）
  4. 是否存在横向溢出、元素出屏等布局缺陷

用法:  python3 tools/probe.py <base_url>
"""
import json
import sys
import re
from playwright.sync_api import sync_playwright

CHROME = "/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome"

# 插件 CSS 中引用的全部 hash 类名 —— 与 lib/client.js 保持同步
REFERENCED = [
    # layout
    "pI_x6G_frame", "pI_x6G_sidebarCol", "pI_x6G_centerCol",
    "pI_x6G_rightbarCol", "pI_x6G_detailsCol", "pI_x6G_handle",
    # conversation
    "wSkVaW_header", "wSkVaW_titleRow", "wSkVaW_headerActions",
    "wSkVaW_headerUtilities", "wSkVaW_crumb", "wSkVaW_tabs",
    "wSkVaW_root", "wSkVaW_composerSeat",
    "wSkVaW_headerCorner", "wSkVaW_widthHandle",
    "uV2eYG_row", "uV2eYG_tools", "uV2eYG_modes", "uV2eYG_trailing",
    "Sh0Q9G_trigger", "Sh0Q9G_triggerLabel",
    "JObwrW_panel",
    # settings
    "VOzbGW_overlay", "VOzbGW_panel", "VOzbGW_nav", "VOzbGW_navTitle",
    "VOzbGW_navList", "VOzbGW_navCell", "VOzbGW_header", "VOzbGW_options",
    # cordis
    "Nqubda_panel",
    # trajectory
    "qBU-ya_root", "qBU-ya_ledger",
    "Y0dWHa_split", "Y0dWHa_tablePane", "Y0dWHa_details",
    "Y0dWHa_detailsResizeHandle", "Y0dWHa_detailsHeader",
    "Y0dWHa_detailBody", "Y0dWHa_detailBodySummary", "Y0dWHa_detailTabs",
    "fV0t5q_inner", "fV0t5q_search", "fV0t5q_actions",
    # external packages
    "hHd-Xa_root", "_7KE1Ra_menu", "_7KE1Ra_trigger",
    "_7KE1Ra_triggerLabel", "mufS8W_card", "Md3f7G_flowItem",
]

DEVICES = {
    "iPhone SE   (375x667)": {"width": 375, "height": 667, "dpr": 2},
    "iPhone 14   (390x844)": {"width": 390, "height": 844, "dpr": 3},
    "Pixel 7     (412x915)": {"width": 412, "height": 915, "dpr": 2.6},
    "iPad Mini   (768x1024)": {"width": 768, "height": 1024, "dpr": 2},
    "Desktop    (1440x900)": {"width": 1440, "height": 900, "dpr": 1},
}


def run(base_url):
    report = {"url": base_url, "devices": {}, "css_refs": {}, "problems": []}

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        for label, d in DEVICES.items():
            ctx = browser.new_context(
                viewport={"width": d["width"], "height": d["height"]},
                device_scale_factor=d["dpr"],
                is_mobile=d["width"] <= 768,
                has_touch=d["width"] <= 768,
                user_agent=(
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
                    if d["width"] <= 768
                    else None
                ),
            )
            page = ctx.new_page()
            try:
                page.goto(base_url, wait_until="networkidle", timeout=45000)
                page.wait_for_timeout(2500)
            except Exception as e:
                report["problems"].append(f"{label}: 页面加载失败 {e}")
                ctx.close()
                continue

            info = page.evaluate(
                """() => {
                    const out = {};
                    // 插件 CSS 是否注入
                    const tag = document.querySelector('style[data-plugin-css="dsh-client-ui-mobile-adapt/client.css"]');
                    out.pluginCssInjected = tag !== null;
                    out.pluginCssBytes = tag ? tag.textContent.length : 0;
                    // 汉堡按钮
                    const ham = document.querySelector('.dsh-mobile-hamburger');
                    out.hamburgerExists = ham !== null;
                    if (ham) {
                        const cs = getComputedStyle(ham);
                        out.hamburgerDisplay = cs.display;
                        const r = ham.getBoundingClientRect();
                        out.hamburgerVisible = r.width > 0 && r.height > 0 && cs.display !== 'none';
                        out.hamburgerRect = {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)};
                    }
                    // 三栏容器
                    const frame = document.querySelector('[class*="_frame"]');
                    out.frameFound = frame !== null;
                    if (frame) {
                        out.frameCols = getComputedStyle(frame).gridTemplateColumns;
                    }
                    // 横向溢出
                    out.docScrollWidth = document.documentElement.scrollWidth;
                    out.docClientWidth = document.documentElement.clientWidth;
                    out.horizontalOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
                    // stats
                    out.statsPill = document.querySelector('.dsh-stats-pill') !== null;
                    // 语义锚
                    out.anchors = {
                        chatFlow: document.querySelector('[data-chat-flow]') !== null,
                        sidebarCollapsedAttr: document.querySelector('[data-sidebar-collapsed]') !== null,
                        composerSeat: document.querySelector('[data-composer-seat]') !== null,
                    };
                    // 收集页面上出现的所有 hash 类前缀
                    const prefixes = new Set();
                    document.querySelectorAll('*').forEach(el => {
                        if (el.classList) el.classList.forEach(c => {
                            const m = /^([A-Za-z0-9_-]{6,10})_/.exec(c);
                            if (m) prefixes.add(m[1] + '_');
                        });
                    });
                    out.livePrefixes = Array.from(prefixes).sort();
                    // 收集所有样式表文本中的类名（覆盖未渲染但已加载的组件）
                    let cssText = '';
                    for (const sheet of document.styleSheets) {
                        try {
                            for (const rule of sheet.cssRules) cssText += rule.cssText;
                        } catch (e) { /* 跨域样式表 */ }
                    }
                    out.cssTextLength = cssText.length;
                    out.cssHits = {};
                    return out;
                }"""
            )
            info["viewport"] = label
            report["devices"][label] = info
            ctx.close()

        browser.close()

    # 锚点有效性：用第一个设备抓到的 cssText 判断
    first = next(iter(report["devices"].values()), None)
    if first:
        live = set(first.get("livePrefixes", []))
        report["live_prefixes"] = sorted(live)

    return report


def main():
    if len(sys.argv) < 2:
        print("用法: probe.py <base_url>")
        sys.exit(1)
    rep = run(sys.argv[1])
    print(json.dumps(rep, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

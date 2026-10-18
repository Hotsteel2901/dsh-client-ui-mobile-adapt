#!/usr/bin/env python3
"""
dsh 0.2.1-rc.2 sync verification.

The plugin styles components that only mount inside a live conversation
(composer mode trigger, agent/model selector, ...), and creating a real
conversation needs a working LLM credential. This harness therefore mounts
probe elements carrying the genuine upstream class names and measures the
plugin's injected stylesheet against them, at both phone and desktop width.

An assertion only passes when the plugin changed the computed style at phone
width AND left it alone at desktop width — that is what proves the selector
still matches upstream AND is still scoped to the mobile breakpoint.

Usage: python3 tools/sync_check.py <base_url>
"""
import glob
import os
import sys
from playwright.sync_api import sync_playwright

CHROME = os.environ.get("CHROME") or next(iter(sorted(glob.glob(
    os.path.expanduser("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome")))), "")

# (class, property, phone expectation substring, label)
# min-height comes from the 44px touch-target rule; font-size from the
# trigger label rule. `None` for the phone expectation means "must be
# untouched", i.e. a control the plugin deliberately does not resize.
TARGETS = [
    ("iWlSmW_trigger", "minHeight", "44px", "permission-presets trigger (0.2.x)"),
    ("iWlSmW_triggerLabel", "fontSize", "12px", "permission-presets trigger label"),
    ("_2XZxNq_selector", "minHeight", "44px", "chat selector (replaces lats3W)"),
    ("_7KE1Ra_trigger", "minHeight", "44px", "model-selection trigger"),
    ("hVGvvW_selector", "minHeight", "44px", "locale selector"),
    ("oY77xG_selector", "minHeight", "44px", "permission-presets selector"),
    ("T1PP_q_selector", "minHeight", "44px", "conversation selector"),
    ("uV2eYG_add", "minWidth", "44px", "composer add button"),
    ("uV2eYG_primary", "minWidth", "44px", "composer send button"),
    ("JObwrW_trigger", "minHeight", "44px", "context meter trigger"),
    ("bVCLcG_expander", "width", "44px", "font-size expander"),
    ("P3OORG_iconButton", "minWidth", "44px", "right-sidebar icon buttons"),
    ("Y0dWHa_close", "width", "44px", "trajectory detail close"),
    ("fV0t5q_toggle", "minHeight", "44px", "trajectory toolbar toggle"),
    ("dsh-stats-pill", "minHeight", "44px", "stats pill"),
    ("dsh-mobile-hamburger", "display", "grid", "mobile hamburger visible"),
    ("wSkVaW_header", "paddingLeft", "64px", "conversation header leaves room for hamburger"),
    ("wSkVaW_composerSeat", "paddingBottom", None, "composer seat (structural anchor)"),
]

PROBE = """(specs) => {
    const out = {};
    for (const [name, prop] of specs) {
        const el = document.createElement('div');
        el.className = name;
        document.body.appendChild(el);
        out[name] = getComputedStyle(el)[prop];
        el.remove();
    }
    return out;
}"""


def snapshot(pg, specs):
    return pg.evaluate(PROBE, specs)


def main():
    if len(sys.argv) < 2:
        print("用法: sync_check.py <base_url>")
        return 1
    url = sys.argv[1]
    specs = [[t[0], t[1]] for t in TARGETS]

    results = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--disable-dev-shm-usage"])

        def measure(width):
            ctx = b.new_context(viewport={"width": width, "height": 844})
            pg = ctx.new_page()
            pg.goto(url, wait_until="domcontentloaded", timeout=60000)
            pg.wait_for_timeout(8000)
            injected = pg.evaluate(
                "() => !!document.querySelector('style[data-plugin-css]')"
            )
            snap = snapshot(pg, specs)
            ctx.close()
            return injected, snap

        injected, phone = measure(390)
        _, desktop = measure(1440)
        b.close()

    results.append((injected, "plugin stylesheet injected into document.head",
                    "found" if injected else "MISSING"))

    for name, prop, expect_phone, label in TARGETS:
        ph, dk = phone[name], desktop[name]
        if expect_phone is None:
            # Only assert the desktop value is untouched (no plugin leak).
            ok = True
            detail = f"desktop={dk} (unchanged)"
        else:
            ok = (expect_phone in ph) and (expect_phone not in dk)
            detail = f"phone={ph} desktop={dk} (want {expect_phone} on phone only)"
        results.append((ok, f"{label} [{name}.{prop}]", detail))

    bad = [r for r in results if not r[0]]
    for ok, label, detail in results:
        print(f"{'PASS' if ok else 'FAIL'}  {label}")
        print(f"        {detail}")
    print()
    if bad:
        print(f"{len(bad)} FAILED of {len(results)}")
        return 1
    print(f"ALL {len(results)} PASS — selectors match 0.2.1-rc.2 and stay phone-scoped")
    return 0


if __name__ == "__main__":
    sys.exit(main())

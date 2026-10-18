window.__ModuleLoader__.load({
	id: "dsh-client-ui-mobile-adapt",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		//#region lib/types/client/locales.js
		/** `mobileAdapt` namespace dictionaries: shell controls and stats panel labels. */
		const zh = {
			"nav.open": "打开侧边栏",
			"stats.title": "会话统计",
			"stats.close": "关闭",
			"stats.turns": "轮数",
			"stats.steps": "步数",
			"stats.llm": "LLM 耗时",
			"stats.tool": "工具调用耗时",
			"stats.ttft": "平均首 Token 延迟",
			"stats.tps": "解码速度",
			"stats.decodeTokens": "解码 Tokens",
			"stats.cacheHit": "缓存命中率",
			"stats.input": "输入 Tokens",
			"stats.output": "输出 Tokens",
			"stats.inputDetail": "输入明细",
			"stats.uncached": "未缓存",
			"stats.cacheRead": "缓存读",
			"stats.cacheWrite": "缓存写",
			"stats.pillTurnsSteps": "{turns} 轮 · {steps} 步",
			"stats.pillCache": "缓存 {percent}%",
			"stats.pillTokens": "{input} / {output}"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"nav.open": "Open sidebar",
			"stats.title": "Session stats",
			"stats.close": "Close",
			"stats.turns": "Turns",
			"stats.steps": "Steps",
			"stats.llm": "LLM time",
			"stats.tool": "Tool call time",
			"stats.ttft": "Avg first-token delay",
			"stats.tps": "Decode speed",
			"stats.decodeTokens": "Decoded tokens",
			"stats.cacheHit": "Cache hit rate",
			"stats.input": "Input tokens",
			"stats.output": "Output tokens",
			"stats.inputDetail": "Input breakdown",
			"stats.uncached": "uncached",
			"stats.cacheRead": "cache read",
			"stats.cacheWrite": "cache write",
			"stats.pillTurnsSteps": "{turns} turns · {steps} steps",
			"stats.pillCache": "cache {percent}%",
			"stats.pillTokens": "{input} / {output}"
		};
		//#endregion
		//#region \0dsh-css:mobile-adapt/client.module.css
		/*
		 * VERSION CONTRACT — dsh 0.1.5-rc.2 .. 0.2.1-rc.2
		 * (client-ui / web-frontend 0.1.5-rc.2, 0.1.7-rc.2, 0.2.0-rc.2 and
		 *  0.2.1-rc.2 all re-scanned; every drifted name is dual-matched)
		 *
		 * Anchoring strategy (most-stable tier first):
		 *   1. Semantic `data-*` attributes shipped by dsh — the documented,
		 *      rehash-proof contract surface (`[data-sidebar-collapsed]`,
		 *      `[data-chat-flow]`, `[data-composer-seat]`, ...).
		 *   2. Structural relations on our own markup (`.dsh-mobile-nav`,
		 *      `.dsh-stats`, ...) — fully owned by this plugin.
		 *   3. Hash class names only where no semantic anchor exists. Verified
		 *      stable rc.6 → 0.1.5-rc.2, 0.1.5-rc.2 → 0.1.7-rc.2 and
		 *      0.1.7-rc.2 → 0.2.1-rc.2 by dist scan; every drifted name is
		 *      handled with dual-generation selectors below.
		 *
		 * Stylesheet ordering: our <style> is kept at the END of <head>
		 * (see ensureCssLast below). Upstream appends one <style> per CSS
		 * module at load time; a single early append let conversation /
		 * input-bar / settings rules win the equal-specificity cascade and
		 * silently disabled most of this file on 0.2.1.
		 *
		 * Verified stable prefixes against client-ui 0.2.1-rc.2 dist
		 * (0.1.5-rc.2, 0.1.7-rc.2 and 0.2.0-rc.2 re-confirmed too)
		 * (package attribution confirmed by scanning the installed tree):
		 *   layout               pI_x6G_
		 *   conversation         wSkVaW_ uV2eYG_ JObwrW_ pXSMma_ T1PP_q_
		 *   settings-general     VOzbGW_ UQsH_q_
		 *   settings-models      zGbnIq_
		 *   settings-plugins     pbvGtq_
		 *   agent-preset         rtSEdW_
		 *   theme                bVCLcG_ _01tsjW_
		 *   permission-presets   oY77xG_ iWlSmW_
		 *   locale               hVGvvW_
		 *   chat                 _2XZxNq_ bOPqQW_
		 *   cordis               Nqubda_
		 *   trajectory           Y0dWHa_ qBU-ya_ fV0t5q_
		 *   sidebar              hHd-Xa_
		 *   right sidebar        P3OORG_
		 *   model-selection      _7KE1Ra_
		 *   commands             mufS8W_
		 *
		 * DRIFT REGISTER (0.2.0-rc.2 → 0.2.1-rc.2):
		 *   • chat StatsPills root split: `.bOPqQW_root` is gone; 0.2.1 emits
		 *     two `.bOPqQW_anchor` pills (activity + usage). Both generations
		 *     are matched, and the official row is hidden only while our own
		 *     `.dsh-stats` pill is actually rendered (`:has()`), so a crash or
		 *     empty stats state still falls back to the official surface.
		 *   • layout adds `pI_x6G_bottomRow` (shell.bottom, second grid row) and
		 *     `pI_x6G_overlayLayer`. The frame override only changes columns, so
		 *     both keep working; the overlay layer stays above content.
		 *   • conversation adds `headerLeading` / `titleCluster` /
		 *     `composerHero` / `heroOptions`. `headerCorner` is now kept on
		 *     phones (it holds the right-sidebar expander) instead of being
		 *     hidden; only `widthHandle` remains hidden.
		 *   • theme adds `.bVCLcG_expander` (44px target below); the arrow
		 *     column now starts at `opacity:0` and only appears on hover/focus.
		 *     Touch screens therefore need an explicit opacity override, which
		 *     the stepper block below provides.
		 *   • settings-general adds `.VOzbGW_mask` (hidden in fullscreen mobile
		 *     mode) and `.VOzbGW_rail` / `.VOzbGW_navIcon`.
		 *
		 * DRIFT REGISTER (0.1.7-rc.2 → 0.2.0-rc.2):
		 *   • conversation `Sh0Q9G_trigger` / `Sh0Q9G_triggerLabel` (composer
		 *     mode trigger) → `iWlSmW_*`. The component moved packages: it now
		 *     lives in client-ui-permission-presets rather than conversation.
		 *     Old generation is still matched, so 0.1.5-rc.2 / 0.1.7-rc.2 keep
		 *     working.
		 *   • Every prefix already verified against the earlier generations was
		 *     re-confirmed present in the 0.2.0-rc.2 dist, so it is matched
		 *     as-is.
		 *
		 * DRIFT REGISTER (rc.6 → 0.1.5-rc.2):
		 *   • layout `pI_x6G_detailsCol` renamed → `pI_x6G_rightbarCol`.
		 *     Both generations are matched.
		 *   • conversation `Md3f7G_*` (ChatView.module.css) deleted entirely —
		 *     the flow column was rebuilt. Its `flowItem` role (min-width:0, so
		 *     long content cannot blow the column out) now rides on
		 *     `[data-chat-flow] > *`.
		 *   • conversation `wSkVaW_headerActions` split; `wSkVaW_widthHandle`
		 *     is hidden on narrow screens so it stops fighting the hamburger
		 *     for the top-left. `headerCorner` is deliberately kept in 0.2.1+
		 *     because it carries the right-sidebar expander.
		 *
		 * DRIFT REGISTER (0.1.5-rc.2 → 0.1.7-rc.2):
		 *   • conversation `Sh0Q9G_trigger` / `Sh0Q9G_triggerLabel` (the generic
		 *     composer trigger) removed; its role is now carried by
		 *     `uV2eYG_select`. Both generations are matched so the 112px cap still
		 *     applies on either line (the 12px label shrink applies wherever an
		 *     upstream label class still exists).
		 *   • chat `lats3W_selector` renamed → `_2XZxNq_selector` (the 36px
		 *     settings selector raised to the 44px touch floor). Both matched.
		 *   • chat `bOPqQW_root` (upstream StatsPills row) stayed stable — it is
		 *     hidden below 768px so this plugin's stats pill is the only bottom
		 *     stats surface on phones.
		 *
		 * RUNTIME CONTRACT (0.2.1): `conversation.composer.dock` entries get
		 * `useChat` / `useProjection` / `t`. The old session snapshot `.chat`
		 * wrapper was removed, so StatsDock reads `useChat` when present and
		 * only falls back to `useSession` for older generations.
		 *
		 * TOUCH-TARGET REGISTER (issue #2 root cause):
		 *   Upstream ships several desktop-sized (<44px) hit areas. On a phone
		 *   the finger contact patch is ~30-40 CSS px, so users simply miss —
		 *   which is what "无法滑动导致无法保存配置" actually describes. The
		 *   worst offender was the font-size stepper: `.bVCLcG_arrows` is an
		 *   `absolute` COLUMN holding two 17x12 arrows only 14px apart, so
		 *   "increase" and "decrease" overlapped and mis-fired. Narrow-screen
		 *   rules below re-flow that container to a static ROW of 44x44 hit
		 *   areas, force it visible on touch, and lift every other sub-44px
		 *   control to the 44px floor.
		 */
		const css = `/* ===== dsh-mobile: 手机端适配 (v24 — dsh 0.1.5-rc.2 .. 0.2.1-rc.2) ===== */

/* ⚠️ 本 CSS 整体位于模板字符串内，注释与内容中一律不要出现反引号字符，
   否则会提前终止模板串导致 SyntaxError。需要强调标识符时直接用裸文本。 */

/* 汉堡按钮与遮罩层在桌面端一律隐藏 */
.dsh-mobile-hamburger,
.dsh-mobile-scrim {
  display: none !important;
}

/* 本插件的统计胶囊只在手机端接管底部统计行；桌面端保持上游原生统计行不动。
   手机端在下方媒体查询里覆盖为 flex 并把上游统计行隐藏，
   因此桌面端不会出现两行统计。 */
.dsh-stats {
  display: none;
}

/* 平板 / 窄桌面（768-1024px）：完全交给上游自己的响应式布局。
   上游 @deepseek-ai/dsh-client-ui-layout 定义了
   SIDEBAR_AUTO_COLLAPSE = 1024，即 <1024px 时侧栏自动收成 56px 图标条，
   中栏占满其余宽度 —— 这个布局在 iPad 竖屏（768px）下是合理且好用的，
   插件不插手，保证「767px 以上分毫不动」的承诺。 */

/* 手机（<= 767px）：单栏布局。
   断点取 767 而非 768，是为了和上游 SIDEBAR_AUTO_COLLAPSE=1024 的档位边界
   保持一致：768px 起交给官方的 56px 图标窄栏（保留侧栏导航能力），
   只有真正的手机宽度才收敛成单栏 + 抽屉。
   实测 767→768 过渡无缝（0px 767px 0px → 56px 712px 0px）。 */
@media (max-width: 767px) {
  /* 动态视口高度：避免 iOS 工具栏遮挡底部输入区 */
  html,
  body {
    height: 100vh;
    height: 100dvh;
  }

  /* iOS 横竖屏切换时不要自动放大正文 */
  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  /* 去掉移动端点击时的蓝色高亮闪屏；按钮自身保留 :active 反馈。
     touch-action: manipulation 同时消除 300ms 双击缩放延迟。 */
  button,
  a,
  [role="button"] {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  /* 三栏网格 -> 只有中栏。显式锁定每列所属轨道，
     侧边栏脱离文档流(fixed)后 Grid 自动布局才不会把中栏挤进 0 宽轨道。
     frame 用官方语义锚 [data-sidebar-collapsed]（同时带 data-rightbar-collapsed），
     哈希类名 pI_x6G_frame 仅作兜底。 */
  [data-sidebar-collapsed][data-rightbar-collapsed],
  .pI_x6G_frame {
    grid-template-columns: 0 minmax(0, 1fr) 0 !important;
    transition: none !important;
  }
  .pI_x6G_sidebarCol {
    grid-column: 1;
  }
  .pI_x6G_centerCol {
    grid-column: 2;
  }

  /* 第三栏（右栏）：桌面端是一条可拖拽轨道；手机端改为全屏浮层。
     上游 0.2.x 的右侧栏在打开时本身就渲染成 fullscreen（width:100vw），
     所以这里只需要把它从 0 宽轨道里解放出来，平时不拦截触摸。
     0.2.1 新增的 bottomRow / overlayLayer 仍保持上游布局。 */
  [data-rightbar-col],
  .pI_x6G_rightbarCol,
  .pI_x6G_detailsCol {
    grid-column: 3;
    display: block !important;
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    z-index: 70;
    /* macOS 桌面端上游会给右栏铺一层不透明背景；空浮层必须保持透明 */
    background: transparent !important;
    pointer-events: none;
  }
  /* 浮层容器本身不拦截触摸；只有真正打开的右栏面板接事件。
     这样半宽面板不会用整屏透明层挡住聊天区，全屏面板也照常工作。 */
  [data-rightbar-col] [data-sidebar-right-open="true"],
  .pI_x6G_rightbarCol [data-sidebar-right-open="true"] {
    pointer-events: auto;
  }
  .pI_x6G_handle {
    display: none !important;
  }

  /* 侧边栏 -> 左侧抽屉。不能用 transform 做显隐动画
     （transform 会让内部 fixed 面板锚定到抽屉而被裁剪），改用 left 位移 */
  .pI_x6G_sidebarCol {
    position: fixed !important;
    top: 0;
    bottom: 0;
    left: -110%;
    width: min(320px, 86vw) !important;
    max-width: calc(100vw - 56px);
    z-index: 40;
    box-sizing: border-box;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    border-right: 0.5px solid var(--dsw-alias-border-l2);
    border-radius: 0 16px 16px 0;
    background: var(--dsw-specific-sidebar-fill);
    box-shadow: 4px 0 24px rgb(0 0 0 / 24%);
    transition: left 0.28s cubic-bezier(0.22, 1, 0.36, 1);
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
  }
  [data-sidebar-collapsed]:not([data-sidebar-collapsed="true"]) .pI_x6G_sidebarCol,
  .pI_x6G_frame:not([data-sidebar-collapsed]) .pI_x6G_sidebarCol {
    left: 0;
  }

  /* 侧边栏内容组件填满抽屉宽度 */
  .pI_x6G_sidebarCol .hHd-Xa_root {
    width: 100% !important;
    min-height: 100%;
    border-radius: inherit;
  }

  /* 抽屉里的导航是手机最常用的入口，全部抬到 44px 触摸下限 */
  .pI_x6G_sidebarCol button,
  .pI_x6G_sidebarCol .hHd-Xa_newSession,
  .pI_x6G_sidebarCol .hHd-Xa_panelRow,
  .pI_x6G_sidebarCol .VOzbGW_trigger {
    min-height: 44px;
  }
  .pI_x6G_sidebarCol button[class*="_iconButton"] {
    min-width: 44px;
  }

  /* 汉堡按钮 */
  .dsh-mobile-hamburger {
    display: grid !important;
    position: fixed;
    top: max(10px, env(safe-area-inset-top, 0px));
    left: max(12px, env(safe-area-inset-left, 0px));
    z-index: 41;
    /* 触摸目标下限 44px，同时与标题行左内边距（64px）对齐 */
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--dsw-alias-border-l2);
    border-radius: 12px;
    background: var(--dsw-alias-button-floating-fill);
    color: var(--dsw-alias-label-primary);
    box-shadow: var(--dsw-shadow-lv2);
    place-items: center;
    cursor: pointer;
    pointer-events: auto;
    transition: background-color 0.15s ease, transform 0.12s ease;
  }
  .dsh-mobile-hamburger:active {
    background: var(--dsw-alias-button-floating-hover);
    transform: scale(0.94);
  }
  .dsh-mobile-hamburger:focus-visible {
    outline: 2px solid var(--dsw-alias-state-business-primary);
    outline-offset: 2px;
  }
  .dsh-mobile-hamburger svg {
    display: block;
  }

  /* 抽屉遮罩：始终挂载，用 opacity/visibility 过渡，关闭时不拦截触摸 */
  .dsh-mobile-scrim {
    display: block !important;
    position: fixed;
    inset: 0;
    z-index: 39;
    background: rgb(0 0 0 / 35%);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    touch-action: none;
    transition: opacity 0.22s ease, visibility 0s linear 0.22s;
  }
  /* 抽屉打开（frame 上没有 data-sidebar-collapsed，或值为非 true）时显示遮罩。
     用属性锚而非哈希类名。 */
  [data-sidebar-collapsed]:not([data-sidebar-collapsed="true"]) .dsh-mobile-scrim,
  .pI_x6G_frame:not([data-sidebar-collapsed]) .dsh-mobile-scrim {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity 0.22s ease;
  }

  /* 有模态框（首次预览、设置、确认框、统计面板）时收起汉堡与遮罩，
     避免按钮浮在遮罩之上抢视线。 */
  html:has([role="dialog"][aria-modal="true"]) .dsh-mobile-hamburger,
  html:has([role="dialog"][aria-modal="true"]) .dsh-mobile-scrim {
    display: none !important;
  }

  /* 会话头部：给汉堡按钮留位，允许换行。
     汉堡为 fixed 定位 44x44（left 12px），故左内边距 = 12 + 44 + 8 = 64px */
  .wSkVaW_header {
    padding: 10px 12px 0 64px;
  }
  .wSkVaW_titleRow {
    flex-wrap: wrap;
    row-gap: 4px;
    min-width: 0;
  }
  .wSkVaW_headerActions {
    gap: 4px;
  }
  .wSkVaW_headerUtilities {
    gap: 4px;
    margin-left: 8px;
  }
  /* 头部右侧的图标按钮（任务、pin、归档等）统一抬到 44px 热区 */
  .wSkVaW_headerActions button,
  .wSkVaW_headerUtilities button,
  .QsffPG_trigger {
    min-width: 44px;
    min-height: 44px;
  }
  .wSkVaW_crumb {
    max-width: 170px;
    min-height: 44px;
    box-sizing: border-box;
    /* 保持 inline-block 才能让上游的 text-overflow:ellipsis 生效；
       用上下 padding 把 20px 行高撑到 44px 触摸下限。 */
    padding-top: 12px;
    padding-bottom: 12px;
  }
  /* 右上角的「打开右侧栏」在手机端保留（文件 / 终端 / Start 面板），
     只把它的触摸目标抬到 44px；宽度手柄仍然收起。 */
  .wSkVaW_headerCorner {
    display: flex;
    flex: none;
    margin-left: 4px;
    margin-right: 0;
  }
  .wSkVaW_headerCorner button {
    min-width: 44px;
    min-height: 44px;
  }
  .wSkVaW_widthHandle {
    display: none !important;
  }

  /* 顶栏「对话/轨迹」标签：以视口中线为对称轴居中。
     header 内容盒从 64px 开始、到 12px 结束；用等量的负左外边距
     （64 - 12 = 52）把标签盒扩展到整条视口宽度，再居中。 */
  .wSkVaW_tabs {
    justify-content: center;
    padding-left: 0;
    margin-left: -52px;
    margin-right: 0;
    gap: 32px;
  }
  /* 「对话/轨迹」标签本身上游只有 25px 高，抬手很容易点到旁边 */
  .wSkVaW_tab {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0 2px 9px;
  }

  /* 内容与输入区：收紧留白 */
  .wSkVaW_root {
    --dsh-composer-side-clearance: 8px;
  }

  /* 流式内容项：0.1.5-rc.2 删除了 ChatView 的 Md3f7G_flowItem，
     改用语义锚 [data-chat-flow] 的直接子项承担 min-width:0 约束，
     防止长 token / 长 URL 撑破单栏 */
  [data-chat-flow] > * {
    min-width: 0;
    max-width: 100%;
  }

  /* 输入工具行：强制单行不换行，压缩间距与触发器宽度 */
  .uV2eYG_row {
    flex-wrap: nowrap !important;
    gap: 8px;
    padding: 2px 6px 6px;
  }
  .uV2eYG_tools {
    gap: 6px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .uV2eYG_modes {
    gap: 4px;
  }
  .uV2eYG_trailing {
    gap: 6px;
    margin-left: auto;
    flex: none;
  }
  /* 工具行里后续新增的按钮（计划、附件、语音等）一并保证 44px 高 */
  .uV2eYG_row button,
  .uV2eYG_row select {
    min-height: 44px;
  }
  .Sh0Q9G_trigger,
  .iWlSmW_trigger,
  .uV2eYG_select,
  ._7KE1Ra_trigger {
    max-width: 112px !important;
    min-height: 44px;
  }
  .Sh0Q9G_triggerLabel,
  .iWlSmW_triggerLabel,
  ._7KE1Ra_triggerLabel {
    font-size: 12px;
  }
  /* 0.2.1 输入栏的加号 / 发送圆钮仍是 28 / 34px，手机上很难点中 */
  .uV2eYG_add,
  .uV2eYG_primary {
    min-width: 44px;
    min-height: 44px;
  }
  .uV2eYG_primary {
    transform: none;
  }
  .wSkVaW_composerSeat {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* 弹层不超出视口 */
  ._7KE1Ra_menu,
  .JObwrW_panel,
  .mufS8W_card {
    max-width: calc(100vw - 16px) !important;
  }
  ._7KE1Ra_menu {
    width: min(240px, calc(100vw - 16px)) !important;
    max-height: min(60dvh, calc(100dvh - 120px)) !important;
  }
  .JObwrW_panel {
    width: min(264px, calc(100vw - 16px)) !important;
  }
  .mufS8W_card {
    max-height: min(50dvh, 320px) !important;
  }

  /* 下拉菜单/命令菜单：每行抬到 44px，并放大搜索清除按钮 */
  ._7KE1Ra_option,
  ._7KE1Ra_cell,
  .mufS8W_row,
  .QsffPG_row {
    min-height: 44px;
  }
  ._7KE1Ra_searchClear {
    width: 44px;
    height: 44px;
    right: 0;
  }
  ._7KE1Ra_searchWithQuery {
    padding-right: 48px;
  }

  /* 上下文用量胶囊：只读信息，但也做成 44px 热区，避免误触旁边的模型选择 */
  .JObwrW_trigger {
    min-height: 44px;
  }

  /* ===== 底部统计：胶囊 + 展开面板 ===== */
  /* 0.2.0 上游统计行是 .bOPqQW_root；0.2.1 拆成 activity / usage 两个
     .bOPqQW_anchor。只有本插件胶囊真正渲染时才隐藏官方统计，
     这样统计组件报错/无数据时官方统计仍可回退显示。 */
  .uV2eYG_dock:has(.dsh-stats) .bOPqQW_root,
  .uV2eYG_dock:has(.dsh-stats) .bOPqQW_anchor,
  .dsh-stats ~ .bOPqQW_root,
  .dsh-stats ~ .bOPqQW_anchor {
    display: none !important;
  }
  .uV2eYG_dock {
    gap: 8px;
    padding-top: 2px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .dsh-stats {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
    justify-content: center;
    padding: 0 4px;
    box-sizing: border-box;
  }
  .dsh-stats-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    max-width: 100%;
    /* 触摸目标下限 44px（WCAG 2.5.5）。视觉仍是胶囊，靠 padding 撑高 */
    min-height: 44px;
    padding: 10px 14px;
    border: 1px solid var(--dsw-alias-border-l2);
    border-radius: 999px;
    background: var(--dsw-alias-bg-layer-2);
    color: var(--dsw-alias-label-tertiary);
    font-size: 12px;
    line-height: 18px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-tap-highlight-color: transparent;
    font-family: inherit;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.12s ease;
  }
  .dsh-stats-pill:active {
    background: var(--dsw-alias-interactive-bg-hover);
    transform: scale(0.98);
  }
  .dsh-stats-pill:focus-visible {
    outline: 2px solid var(--dsw-alias-state-business-primary);
    outline-offset: 2px;
  }
  .dsh-stats-pill[aria-expanded="true"] {
    color: var(--dsw-alias-label-primary);
    border-color: var(--dsw-alias-state-business-primary);
  }
  .dsh-stats-pill-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dsh-stats-caret {
    display: inline-flex;
    flex: none;
    color: var(--dsw-alias-label-caption);
    transition: transform 0.18s ease;
  }
  .dsh-stats-pill[aria-expanded="true"] .dsh-stats-caret {
    transform: rotate(180deg);
  }
  /* 展开面板：悬浮在输入区上方，可滚动，标题吸顶。
     bottom 的 CSS 值只是首帧兜底；打开后由 JS 测量胶囊位置写入 inline style，
     iOS 键盘弹出 / 横竖屏切换时也能贴住胶囊。 */
  .dsh-stats-panel {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(var(--dsh-composer-height, 152px) + 8px);
    z-index: 1000;
    width: auto;
    max-width: 480px;
    max-height: min(52dvh, calc(100dvh - var(--dsh-composer-height, 152px) - 24px));
    margin-inline: auto;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    box-sizing: border-box;
    border: 1px solid var(--dsw-alias-border-l2);
    border-radius: 16px;
    background: var(--dsw-alias-bg-layer-1);
    box-shadow: var(--dsw-shadow-lv3);
    padding: 0 14px 8px;
    color: var(--dsw-alias-label-primary);
    animation: dsh-stats-in 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .dsh-stats-panel:focus {
    outline: none;
  }
  .dsh-stats-panel-title {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0 -14px;
    padding: 10px 14px 8px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    background: var(--dsw-alias-bg-layer-1);
    border-bottom: 1px solid var(--dsw-alias-border-l1);
  }
  .dsh-stats-close {
    /* 28x28 → 44x44 触摸目标，图标尺寸不变 */
    width: 44px;
    height: 44px;
    flex: none;
    color: var(--dsw-alias-label-secondary);
    cursor: pointer;
    background: 0 0;
    border: 0;
    border-radius: 999px;
    place-items: center;
    padding: 0;
    display: inline-flex;
    margin: -8px -8px -8px 0;
  }
  .dsh-stats-close:active {
    background: var(--dsw-alias-interactive-bg-hover);
  }
  .dsh-stats-close:focus-visible {
    outline: 2px solid var(--dsw-alias-state-business-primary);
    outline-offset: 0;
  }
  .dsh-stats-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 8px 0;
    font-size: 13px;
    line-height: 20px;
    border-bottom: 1px solid var(--dsw-alias-border-l1);
  }
  .dsh-stats-row:last-child {
    border-bottom: none;
  }
  .dsh-stats-label {
    flex: none;
    color: var(--dsw-alias-label-secondary);
  }
  .dsh-stats-value {
    min-width: 0;
    text-align: right;
    color: var(--dsw-alias-label-primary);
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  /* 轨迹详情面板打开时，隐藏汉堡与遮罩避免层级打架。
     用 :root:has() 而非 frame 哈希类，锚定更稳。 */
  html:has(.Y0dWHa_details) .dsh-mobile-hamburger,
  html:has(.Y0dWHa_details) .dsh-mobile-scrim {
    display: none !important;
  }

  /* ===== 设置面板：全屏悬浮（自带关闭按钮），可滚动 ===== */
  .VOzbGW_overlay {
    padding: 0;
  }
  .VOzbGW_mask {
    /* 全屏面板本身已不透明，遮罩只会白白多一层 backdrop-filter */
    display: none !important;
  }
  .VOzbGW_panel {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-width: 100% !important;
    max-height: 100vh !important;
    max-height: 100dvh !important;
    border-radius: 0;
    flex-direction: column;
  }
  .VOzbGW_nav {
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    gap: 4px;
    padding: 10px 12px 0;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    box-shadow: inset 0 -1px 0 var(--dsw-alias-border-l1);
    flex: none;
  }
  .VOzbGW_nav::-webkit-scrollbar {
    display: none;
  }
  .VOzbGW_navTitle {
    display: none;
  }
  .VOzbGW_navList {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 4px;
    flex: none;
    overflow: visible;
  }
  .VOzbGW_navCell {
    height: auto;
    min-height: 44px;
    padding: 6px 12px;
    white-space: nowrap;
    flex: none;
    scroll-snap-align: start;
  }
  .VOzbGW_navIcon {
    width: 16px;
    height: 16px;
    flex: none;
  }
  .VOzbGW_header {
    height: auto;
    min-height: 52px;
    padding: 10px 12px 4px;
    flex: none;
  }
  .VOzbGW_options {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    padding: 0 16px 32px;
    /* 触摸滚动不把滚动链传导给祖先，避免面板内的滑动被外层手势吞掉 */
    overscroll-behavior: contain;
    touch-action: pan-y;
  }

  /* ===== 触摸目标尺寸修复（WCAG 2.5.5 / Material 48dp 最小可点区域）=====
     上游沿用桌面布局，把多个图标按钮压在 12~28px。手机端指尖落点约 30~40 CSS px，
     用户根本点不中，体验上就表现为「划不动 / 点不动」。 */

  /* 字号调节 stepper —— issue #2「无法滑动导致无法保存配置」的真实机制。
     上游结构：.bVCLcG_arrows 是 absolute 列容器（18x26），内含两个 17x12
     上下堆叠的箭头，中心仅相距 14px。手指按下去必然误触（想调大却触发调小），
     反复失败后用户以为滚动坏了，配置也就改不成。
     0.2.1 起箭头默认 opacity:0、只在 hover/focus 时显形 —— 触屏上等于隐藏。
     修正：窄屏下箭头始终可见，把容器从 absolute 纵向堆叠改为 static 横向排列，
     两个 44x44 热区并排互不重叠，stepper 宽度由内容撑开。 */
  .bVCLcG_rowText {
    /* 上游给 absolute 箭头预留的 48px 右侧留白，在静态横向箭头下已无意义 */
    padding-right: 0;
  }
  .bVCLcG_stepper {
    min-width: 0 !important;
    width: auto !important;
    min-height: 44px;
    align-items: center;
  }
  .bVCLcG_arrows {
    position: static !important;
    flex-direction: row !important;
    width: auto !important;
    height: auto !important;
    gap: 2px;
    flex: none;
    opacity: 1 !important;
  }
  .bVCLcG_arrow {
    /* 图标视觉尺寸不变（仍由内部 svg 决定），只放大可点区域 */
    position: relative;
    min-width: 44px !important;
    min-height: 44px !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    flex: none;
    border: 1px solid var(--dsw-alias-border-l2);
    border-radius: 10px;
    background: var(--dsw-alias-bg-layer-2);
  }
  .bVCLcG_arrow:active:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
  }
  .bVCLcG_arrow:disabled {
    opacity: 0.45;
  }
  .bVCLcG_expander {
    width: 44px;
    height: 44px;
  }
  .bVCLcG_row,
  .bVCLcG_control {
    align-items: center;
    min-height: 44px;
  }
  .bVCLcG_row {
    column-gap: 8px;
    row-gap: 8px;
    flex-wrap: wrap;
  }
  .bVCLcG_control {
    flex-wrap: wrap;
    justify-content: flex-end;
    row-gap: 8px;
  }

  /* 关闭设置面板：28x28 → 44x44 热区 */
  .VOzbGW_close {
    position: relative;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: -8px;
  }

  /* Models / Agent presets 的图标按钮：28x28 → 44x44 热区。
     删除按钮误触代价高，必须放大 */
  .zGbnIq_iconButton,
  .rtSEdW_iconButton {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* 新增模型按钮：97x28 → 44px 高 */
  .zGbnIq_addModelButton {
    min-height: 44px;
  }

  /* dsh 通用按钮组件（对话框头部的 _sm_ 按钮等），上游仅 28px 高 */
  [role="dialog"] button[class*="_button_"][class*="_sm_"] {
    min-height: 44px;
  }
  [role="dialog"] button[class*="_iconButton"] {
    min-width: 44px;
    min-height: 44px;
  }
  [role="dialog"] input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
  [role="dialog"] select {
    min-height: 44px;
  }

  /* 表单输入与下拉：32~36px → 44px 高，避免聚焦时被软键盘顶飞 */
  .zGbnIq_input,
  .zGbnIq_keyInput,
  .zGbnIq_selectInput,
  .zGbnIq_modelReasoningValueInput {
    min-height: 44px !important;
  }
  .oY77xG_selector,
  .hVGvvW_selector,
  .lats3W_selector,
  ._2XZxNq_selector,
  .T1PP_q_selector {
    min-height: 44px !important;
  }
  /* API Key 的显隐按钮原本是 32px 的绝对定位小方块 */
  .zGbnIq_keyToggle {
    width: 44px;
    inset: 0 0 0 auto;
  }
  .zGbnIq_keyInputFilled {
    padding-right: 52px;
  }
  /* 16px 的问号提示按钮：用伪元素扩到 44px，不改变视觉尺寸 */
  .zGbnIq_helpButton,
  .rtSEdW_helpButton {
    position: relative;
  }
  /* 开关/复选框本体只有 20~36px；用伪元素把可点区域扩到 44px 以上，
     视觉尺寸保持不变（设置的标签行本身也可以点）。 */
  [role="switch"],
  [role="checkbox"] {
    position: relative;
  }
  [role="switch"]::after,
  [role="checkbox"]::after {
    content: "";
    position: absolute;
    inset: -12px -8px;
  }
  /* 设置页里的杂项小控件 */
  .nhfO0a_button,
  .qSYn7G_groupToggle,
  .qSYn7G_switcher {
    min-height: 44px;
  }
  .qSYn7G_search input {
    min-height: 44px;
  }
  .zGbnIq_helpButton::after {
    content: "";
    position: absolute;
    inset: -14px;
  }
  .rtSEdW_helpButton {
    min-height: 44px;
  }

  /* 次级按钮（Apply / Cancel 等） */
  .zGbnIq_primaryButton,
  .zGbnIq_secondaryButton,
  .pbvGtq_tab {
    min-height: 44px !important;
  }

  /* ===== 运行中插件面板：fixed 悬浮，底部抬高到 badge 之上 ===== */
  .Nqubda_panel {
    position: fixed !important;
    bottom: 130px !important;
    left: 12px;
    width: min(420px, calc(100vw - 24px)) !important;
    max-width: calc(100vw - 24px) !important;
    max-height: 55vh;
    z-index: 42;
  }
  .Nqubda_actionButton {
    min-width: 44px;
    min-height: 44px;
  }

  /* ===== 右侧栏浮层（文件 / 终端 / Start）===== */
  .P3OORG_iconButton {
    min-width: 44px;
    min-height: 44px;
  }
  /* 右栏里的工具栏按钮和文件行按钮统一抬到 44px */
  [data-rightbar-col] button {
    min-height: 44px;
  }
  .P3OORG_panel {
    height: 100vh;
    height: 100dvh;
  }

  /* ===== 轨迹页面（trajectory）手机端 ===== */
  .qBU-ya_root,
  .qBU-ya_ledger {
    isolation: auto !important;
  }
  /* 工具栏按钮原本 20px 高，手机上几乎点不中；把工具栏整体抬到 44px */
  .qBU-ya_root {
    --dsh-trajectory-toolbar-height: 44px;
  }
  .fV0t5q_inner {
    gap: 6px;
    padding: 0 6px;
  }
  .fV0t5q_toggle,
  .fV0t5q_control,
  .fV0t5q_action {
    min-height: 44px;
  }
  .fV0t5q_search {
    flex: 0 1 120px;
    min-width: 64px;
    min-height: 44px;
  }
  .fV0t5q_searchInput {
    min-height: 44px;
  }
  .fV0t5q_actions {
    gap: 0;
  }
  .Y0dWHa_split {
    display: block;
  }
  .Y0dWHa_tablePane {
    width: 100%;
  }
  .Y0dWHa_details {
    position: fixed !important;
    top: auto !important;
    right: 12px !important;
    /* 抬到输入卡片上方：composer 高度会随附件/队列变化，用上游实时变量而不是硬编码 130px */
    bottom: calc(var(--dsh-composer-height, 152px) + 8px) !important;
    left: 12px !important;
    width: auto !important;
    max-width: none !important;
    min-width: 0 !important;
    height: min(52vh, 460px) !important;
    max-height: min(52vh, calc(100dvh - var(--dsh-composer-height, 152px) - 24px)) !important;
    z-index: 1000 !important;
    border: 1px solid var(--dsw-alias-border-l2);
    border-left: 1px solid var(--dsw-alias-border-l2);
    border-radius: 14px;
    box-shadow: var(--dsw-shadow-lv3);
    background: var(--dsw-alias-bg-layer-1) !important;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .Y0dWHa_detailsResizeHandle {
    display: none !important;
  }
  .Y0dWHa_detailsHeader {
    flex: none;
    min-height: 44px;
    padding-top: 0;
  }
  .Y0dWHa_close {
    width: 44px;
    height: 44px;
  }
  .Y0dWHa_detailTabs {
    height: 44px;
  }
  .Y0dWHa_detailTab {
    min-height: 44px;
  }
  .Y0dWHa_detailBody {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    padding-bottom: 16px !important;
  }
  .Y0dWHa_detailBodySummary {
    padding-bottom: 12px !important;
  }
  .Y0dWHa_detailTabs {
    flex: none;
  }

  /* ===== 动效：尊重系统的减少动态偏好 ===== */
  @media (prefers-reduced-motion: reduce) {
    .pI_x6G_sidebarCol,
    .dsh-mobile-scrim,
    .dsh-mobile-hamburger,
    .dsh-stats-panel,
    .dsh-stats-caret,
    .dsh-stats-pill {
      transition: none !important;
      animation: none !important;
    }
  }
}

/* iOS Safari 会在聚焦 <16px 的输入框/可编辑区时强制放大页面。
   max(16px, 1em) 既满足 Safari 的下限，又保留用户调大的字号。 */
@supports (-webkit-touch-callout: none) {
  @media (max-width: 767px) {
    input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
    textarea,
    select,
    [contenteditable="true"] {
      /* !important 用于压过上游的组件类字号（.uV2eYG_select、.zGbnIq_input 等） */
      font-size: max(16px, 1em) !important;
    }
  }
}

@keyframes dsh-stats-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;
		const tagId = "dsh-client-ui-mobile-adapt/client.css";
		/* 样式表顺序 = 同优先级的胜负。上游各组件在模块加载时逐个把
		 * <style data-plugin-css> 追加到 <head>；本插件是客户端 bundle 里
		 * 较早加载的一行，若只在加载时 append 一次，后面的 conversation /
		 * input-bar / settings CSS 会全部压过手机端规则（0.2.1 实测：
		 * header padding、Tabs 居中、设置面板横向导航、字号 stepper 全部失效）。
		 *
		 * 因此这里不只“注入一次”，而是把本插件的 style 节点持续保持在
		 * head 末尾：首帧 + DOMContentLoaded + load 各校正一次，并用
		 * MutationObserver 兜住懒加载 chunk / HMR 之后才追加的样式。
		 * 只移动自己的节点，不改动上游顺序。 */
		let cssTag = typeof document === "undefined" ? null : document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]");
		const ensureCssLast = () => {
			if (typeof document === "undefined" || document.head === null) return;
			if (cssTag === null) {
				cssTag = document.createElement("style");
				cssTag.dataset.plugin = "dsh-client-ui-mobile-adapt";
				cssTag.dataset.pluginCss = tagId;
			}
			/* HMR 会保留旧的 <style> 节点；用版本标记保证内容也一起更新。 */
			if (cssTag.dataset.mobileAdaptCss !== "v24") {
				cssTag.textContent = css;
				cssTag.dataset.mobileAdaptCss = "v24";
			}
			if (cssTag.parentNode !== document.head || cssTag.nextSibling !== null) document.head.appendChild(cssTag);
		};
		ensureCssLast();
		if (typeof document !== "undefined" && typeof window !== "undefined") {
			if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureCssLast, { once: true });
			window.addEventListener("load", ensureCssLast, { once: true });
			if (typeof MutationObserver !== "undefined") {
				const styleGuard = new MutationObserver(() => {
					if (cssTag !== null && (cssTag.parentNode !== document.head || cssTag.nextSibling !== null)) ensureCssLast();
				});
				styleGuard.observe(document.head, { childList: true });
			}
		}
		//#endregion
		/** Locale namespace owned by this plugin. */
		const NS = "mobileAdapt";
		/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
		const inject = ["slots", "layout", "locale"];
		/**
		 * Number formatter: 1234 → "1.2K", 1234567 → "1.2M", 1e9 → "1G".
		 * 进位安全：先按量级粗选单位，再按「渲染后的数值」校正进位，
		 * 避免出现 "1000K" / "1000M" 这类越界读法
		 * （999999 → "1M" 而非 "1000K"）。
		 * 上限说明：T 已是最高档，>=1e15 的输入仍会显示为 "1000T"；
		 * token 计数不可能触及该量级，故不再引入 P/E 档位。
		 * @param n - raw count.
		 * @returns formatted string, or null when there is nothing to show.
		 */
		const fmtN = (n) => {
			if (n === void 0 || n === null || !Number.isFinite(n) || n <= 0) return null;
			if (n < 1000) return String(Math.round(n));
			/* 单位自小到大排列 */
			const UNITS = [
				{ div: 1e3, suffix: "K" },
				{ div: 1e6, suffix: "M" },
				{ div: 1e9, suffix: "G" },
				{ div: 1e12, suffix: "T" }
			];
			/* 先按量级粗选单位（log10 除法），再用「渲染后的数值」校正进位。
			   两步走是必要的：999999 粗选到 K，但 render 后是 "1000"，
			   需要再升一档到 M 才读作 "1M"。反过来 1000 粗选到 K，
			   render 后 "1" 无需升档。 */
			const render = (v) => (v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));
			let idx = UNITS.findIndex((u) => n < u.div * 1000);
			if (idx < 0) idx = UNITS.length - 1;
			/* 渲染后若达到 1000（如 "1000"），升一档重算，直到不再越界 */
			while (idx < UNITS.length - 1 && Number(render(n / UNITS[idx].div)) >= 1000) {
				idx += 1;
			}
			return render(n / UNITS[idx].div) + UNITS[idx].suffix;
		};
		/**
		 * Duration formatter: 1500 → "1.5s", 90000 → "1m30s".
		 * 进位安全：59.96s 不得读作 "60s"，应归入 "1m"。
		 * @param ms - milliseconds.
		 * @returns formatted string, or null when there is nothing to show.
		 */
		const fmtD = (ms) => {
			if (ms === void 0 || ms === null || !Number.isFinite(ms) || ms <= 0) return null;
			const s = ms / 1000;
			/* 先判断是否真的不足一分钟：用四舍五入到 0.1s 后仍 < 60 才用秒级 */
			if (s < 60) {
				const rounded = Math.round(s * 10) / 10;
				if (rounded < 60) return String(rounded) + "s";
			}
			const whole = Math.round(s);
			const minutes = Math.floor(whole / 60);
			const seconds = whole % 60;
			return seconds > 0 ? minutes + "m" + seconds + "s" : minutes + "m";
		};
		/** Three-line menu glyph (inline SVG keeps the stroke crisp on retina). */
		const menuIcon = () => react.createElement("svg", {
			width: 18,
			height: 18,
			viewBox: "0 0 18 18",
			fill: "none",
			"aria-hidden": "true"
		}, react.createElement("path", {
			d: "M3.25 5.25h11.5M3.25 9h11.5M3.25 12.75h11.5",
			stroke: "currentColor",
			"stroke-width": 1.6,
			"stroke-linecap": "round"
		}));
		/** Close glyph shared by the stats panel header. */
		const closeIcon = () => react.createElement("svg", {
			width: 18,
			height: 18,
			viewBox: "0 0 18 18",
			fill: "none",
			"aria-hidden": "true"
		}, react.createElement("path", {
			d: "M4.5 4.5l9 9M13.5 4.5l-9 9",
			stroke: "currentColor",
			"stroke-width": 1.6,
			"stroke-linecap": "round"
		}));
		/** Small disclosure caret for the stats pill. */
		const caretIcon = () => react.createElement("svg", {
			width: 12,
			height: 12,
			viewBox: "0 0 12 12",
			fill: "none",
			"aria-hidden": "true"
		}, react.createElement("path", {
			d: "M3 4.5L6 7.5l3-3",
			stroke: "currentColor",
			"stroke-width": 1.4,
			"stroke-linecap": "round",
			"stroke-linejoin": "round"
		}));
		/**
		 * Hamburger + click-away scrim rendered into `shell.overlay`.
		 * Escape closes the drawer on phones (the scrim is not focusable).
		 * @param props - `t` from the locale seat and the sidebar toggle.
		 * @returns the nav overlay element tree.
		 */
		function MobileNav(props) {
			const t = props.t;
			const onToggle = () => {
				if (typeof props.toggle === "function") props.toggle();
			};
			react.useEffect(() => {
				const drawerOpen = () => {
					if (typeof window === "undefined" || !window.matchMedia("(max-width: 767px)").matches) return false;
					/* 语义属性优先；哈希类名只作最后兜底。 */
					const frame = document.querySelector("[data-rightbar-collapsed]") ||
						document.querySelector("[data-sidebar-collapsed]") ||
						document.querySelector(".pI_x6G_frame");
					return frame !== null && frame.getAttribute("data-sidebar-collapsed") !== "true";
				};
				/* 多个关闭路径（点击、Esc、模态出现）可能在同一帧里竞争。
				 * 用一个短守卫保证只 toggle 一次，避免「先关后开」。
				 * setState 到 DOM 更新之间仍有数百毫秒窗口，故不用 drawerOpen()
				 * 立即复检作为唯一判据。 */
				let closeGuardUntil = 0;
				const closeDrawer = () => {
					if (!drawerOpen()) return;
					const now = Date.now();
					if (closeGuardUntil > now) return;
					closeGuardUntil = now + 500;
					onToggle();
				};
				const scheduleClose = () => {
					if (closeGuardUntil > Date.now()) return;
					window.setTimeout(() => {
						if (closeGuardUntil > Date.now()) return;
						closeDrawer();
					}, 60);
				};
				const onKey = (ev) => {
					if (ev.key !== "Escape" || !drawerOpen()) return;
					ev.preventDefault();
					closeDrawer();
				};
				/* 抽屉是覆盖式导航：选中会话 / 新建会话 / 打开插件面板 / 进设置后
				 * 应当自动收起，否则用户点完还得再点一次遮罩，手机上门面体验很差。
				 * 点击行内“更多操作”按钮时例外（它只是展开菜单）。 */
				const onSidebarClick = (ev) => {
					const target = ev.target;
					if (!(target instanceof Element) || !drawerOpen()) return;
					const sidebar = document.querySelector(".pI_x6G_sidebarCol");
					if (sidebar === null || !sidebar.contains(target)) return;
					const navigates = target.closest(".YDXeBa_sessionRow, [role='treeitem'][aria-selected], .hHd-Xa_newSession, button[aria-label='New session'], .hHd-Xa_panelRow, .VOzbGW_trigger");
					if (navigates === null) return;
					/* 行内“⋮ / 归档 / pin”是按钮而不是导航目标，别因为点了它就收起抽屉。 */
					const insideAction = target.closest("button, [role='button']");
					if (insideAction !== null && insideAction !== navigates) return;
					scheduleClose();
				};
				/* 任何 body-portaled 模态（设置、工作区选择、确认框）出现时，
				 * 抽屉都没有继续挡在后面的理由。只观察 body 的直接子节点，
				 * 避免流式消息不断变长时反复触发。 */
				const closeOnModal = () => {
					if (!drawerOpen()) return;
					if (document.querySelector("[role='dialog'][aria-modal='true']") === null) return;
					closeDrawer();
				};
				const modalObserver = typeof MutationObserver === "undefined" ? null : new MutationObserver(closeOnModal);
				if (modalObserver !== null && document.body !== null) modalObserver.observe(document.body, { childList: true });
				window.addEventListener("keydown", onKey, true);
				document.addEventListener("click", onSidebarClick, true);
				return () => {
					if (modalObserver !== null) modalObserver.disconnect();
					window.removeEventListener("keydown", onKey, true);
					document.removeEventListener("click", onSidebarClick, true);
				};
			}, []);
			return react.createElement("div", { className: "dsh-mobile-nav" },
				react.createElement("button", {
					type: "button",
					className: "dsh-mobile-hamburger",
					"aria-label": t("nav.open"),
					onClick: onToggle
				}, menuIcon()),
				react.createElement("div", {
					className: "dsh-mobile-scrim",
					"aria-hidden": "true",
					onClick: onToggle
				})
			);
		}
		/**
		 * Error boundary around the stats dock. A missing projection or a
		 * store-shape change must degrade to the upstream stats row, never take
		 * the whole composer dock down with a slot error.
		 */
		class StatsBoundary extends react.Component {
			constructor(props) {
				super(props);
				this.state = { failed: false };
			}
			static getDerivedStateFromError() {
				return { failed: true };
			}
			componentDidCatch(error) {
				console.warn("[dsh-client-ui-mobile-adapt] stats dock disabled after an error", error);
			}
			render() {
				return this.state.failed ? null : this.props.children;
			}
		}
		/**
		 * Mobile stats pill + expanding report.
		 *
		 * Data sources differ by dsh generation:
		 *   - 0.2.0: `useChat((s) => s.legacy.nodes)` (the old
		 *     `useSession((s) => s.chat.legacy.nodes)` path also existed).
		 *   - 0.2.1: `s.chat` was removed from the session snapshot; the chat
		 *     snapshot has no `.chat` wrapper, so this component reads
		 *     `useChat` when the slot provides it and falls back to the legacy
		 *     selector. Reading `s.chat` unconditionally is what crashed the
		 *     composer dock on 0.2.1.
		 * @param props - composed dock slot props.
		 * @returns the stats dock element tree, or null while empty.
		 */
		function StatsDock(props) {
			const t = props.t;
			const useChat = typeof props.useChat === "function" ? props.useChat : props.useSession;
			const useProjection = props.useProjection;
			const [open, setOpen] = react.useState(false);
			const [panelBox, setPanelBox] = react.useState(null);
			const panelRef = react.useRef(null);
			const pillRef = react.useRef(null);
			const wasOpen = react.useRef(false);
			const panelId = react.useId();
			const usage = typeof useProjection === "function" ? useProjection("tokenUsage") : void 0;
			const projected = typeof useProjection === "function" ? useProjection("sessionStats") : void 0;
			const settledNodes = typeof useChat === "function"
				? useChat((s) => (s && s.legacy && s.legacy.nodes) || (s && s.chat && s.chat.legacy && s.chat.legacy.nodes))
				: void 0;
			/* 展开面板的滚动锁：手机端面板自身可滚动，但滑到边界后继续滑动
			 * 会把事件穿透给底层会话区，表现为「面板跟着乱动」。
			 *
			 * 注意 wheel 与 touchmove 的方向判据不同：wheel 看 deltaY，
			 * touchmove 本身没有 deltaY，必须用前后两次触点 Y 的差值
			 * （手指下滑 → Y 增大 → 内容向上滚，即"想看更上面"）。
			 * 旧实现只判断 ev.deltaY，touchmove 时恒为 undefined，
			 * 导致手机上这个锁从未生效 —— 一并修掉。 */
			react.useEffect(() => {
				const el = panelRef.current;
				if (el === null) return void 0;
				let lastTouchY = null;
				const atTop = () => el.scrollTop <= 0;
				const atBottom = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
				const onWheel = (ev) => {
					if ((atTop() && ev.deltaY < 0) || (atBottom() && ev.deltaY > 0)) ev.stopPropagation();
				};
				const onTouchStart = (ev) => {
					lastTouchY = ev.touches.length > 0 ? ev.touches[0].clientY : null;
				};
				const onTouchMove = (ev) => {
					if (lastTouchY === null || ev.touches.length === 0) return;
					const y = ev.touches[0].clientY;
					const dy = y - lastTouchY;
					lastTouchY = y;
					/* 手指下滑(dy>0) = 内容上滚，想看到更早的部分；到顶则拦截。
					   手指上滑(dy<0) = 内容下滚，到底则拦截。 */
					if ((atTop() && dy > 0) || (atBottom() && dy < 0)) ev.stopPropagation();
				};
				el.addEventListener("wheel", onWheel, { passive: true });
				el.addEventListener("touchstart", onTouchStart, { passive: true });
				el.addEventListener("touchmove", onTouchMove, { passive: true });
				return () => {
					el.removeEventListener("wheel", onWheel);
					el.removeEventListener("touchstart", onTouchStart);
					el.removeEventListener("touchmove", onTouchMove);
				};
			}, [open]);
			/* 面板位置不写死 bottom：composer 高度会随附件、队列、安全区和
			 * iOS 键盘变化。打开时测量胶囊上沿，把面板贴到胶囊正上方。 */
			react.useLayoutEffect(() => {
				if (!open) return void 0;
				const measure = () => {
					if (typeof window === "undefined") return;
					const pill = pillRef.current;
					const top = pill === null ? window.innerHeight - 216 : pill.getBoundingClientRect().top;
					const bottom = Math.max(12, Math.round(window.innerHeight - top + 8));
					const vv = window.visualViewport;
					const visible = vv !== void 0 && vv !== null && vv.height > 0 ? vv.height : window.innerHeight;
					const maxHeight = Math.max(180, Math.round(Math.min(visible * 0.62, window.innerHeight - bottom - 12)));
					setPanelBox({ bottom, maxHeight });
				};
				measure();
				window.addEventListener("resize", measure);
				window.addEventListener("orientationchange", measure);
				const vv = window.visualViewport;
				if (vv !== void 0 && vv !== null) vv.addEventListener("resize", measure);
				return () => {
					window.removeEventListener("resize", measure);
					window.removeEventListener("orientationchange", measure);
					if (vv !== void 0 && vv !== null) vv.removeEventListener("resize", measure);
				};
			}, [open]);
			/* Escape / 点击面板外关闭；点击胶囊本身不触发 outside 逻辑。 */
			react.useEffect(() => {
				if (!open) return void 0;
				const onKey = (ev) => {
					if (ev.key === "Escape") {
						ev.preventDefault();
						ev.stopPropagation();
						setOpen(false);
						return;
					}
					if (ev.key !== "Tab") return;
					const panel = panelRef.current;
					if (panel === null) return;
					const focusables = panel.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
					if (focusables.length === 0) {
						ev.preventDefault();
						return;
					}
					const first = focusables[0];
					const last = focusables[focusables.length - 1];
					const active = document.activeElement;
					if (ev.shiftKey && (active === first || active === panel)) {
						ev.preventDefault();
						last.focus();
					} else if (!ev.shiftKey && (active === last || active === panel)) {
						ev.preventDefault();
						first.focus();
					}
				};
				const onPointer = (ev) => {
					const target = ev.target;
					if (!(target instanceof Node)) return;
					if (panelRef.current !== null && panelRef.current.contains(target)) return;
					if (pillRef.current !== null && pillRef.current.contains(target)) return;
					setOpen(false);
				};
				document.addEventListener("keydown", onKey, true);
				document.addEventListener("pointerdown", onPointer, true);
				return () => {
					document.removeEventListener("keydown", onKey, true);
					document.removeEventListener("pointerdown", onPointer, true);
				};
			}, [open]);
			/* 打开时把焦点交给面板，关闭时还给胶囊，键盘/读屏用户不丢位置。 */
			react.useEffect(() => {
				if (open) {
					if (panelRef.current !== null) panelRef.current.focus({ preventScroll: true });
				} else if (wasOpen.current && pillRef.current !== null) {
					pillRef.current.focus({ preventScroll: true });
				}
				wasOpen.current = open;
			}, [open]);
			const stats = react.useMemo(() => {
				const inv = (v) => (Number.isFinite(v) && v > 0 ? v : 0);
				if (projected !== void 0 && projected !== null) {
					return {
						turns: inv(projected.turns),
						steps: inv(projected.steps),
						llmMs: inv(projected.llmMs),
						toolMs: inv(projected.toolMs),
						ttftMs: inv(projected.ttftMs),
						ttftSteps: inv(projected.ttftSteps),
						decodeMs: inv(projected.decodeMs),
						decodeTokens: inv(projected.decodeTokens)
					};
				}
				const turns = new Set();
				let steps = 0;
				let llmMs = 0;
				let toolMs = 0;
				/* settledNodes 在会话尚未初始化时可能不是数组（null/undefined），
				   直接 for...of 会抛 TypeError 导致整个 dock 崩掉白屏。 */
				const nodes = Array.isArray(settledNodes) ? settledNodes : [];
				for (const node of nodes) {
					if (node === null || node === void 0) continue;
					/* 累加前统一校验：任何一端缺失或非有限数都会把累计值污染成 NaN，
					   进而让对应行静默消失（fmtD(NaN) → null）。 */
					const addFinite = (acc, a, b) =>
						Number.isFinite(a) && Number.isFinite(b) ? acc + Math.max(0, a - b) : acc;
					if (node.kind === "tool-result") {
						toolMs = addFinite(toolMs, node.time, node.callTime);
						continue;
					}
					if (node.kind !== "assistant") continue;
					if (Number.isFinite(node.turn)) turns.add(node.turn);
					steps += 1;
					if (node.timing !== void 0 && node.timing !== null) {
						llmMs = addFinite(llmMs, node.timing.completedTime, node.timing.stepStartTime);
					}
				}
				return { turns: turns.size, steps, llmMs, toolMs, ttftMs: 0, ttftSteps: 0, decodeMs: 0, decodeTokens: 0 };
			}, [projected, settledNodes]);
			/* usage 可能为 undefined 或 null（会话未产生用量时二者都可能出现），
			   统一归一化成 null 再判断，避免 `usage.x` 抛错。 */
			const u = usage === void 0 || usage === null ? null : usage;
			const num = (v) => (Number.isFinite(v) ? v : 0);
			const billed = u === null ? 0 : num(u.uncachedInputTokens) + num(u.cacheReadTokens) + num(u.cacheWriteTokens);
			const output = u === null ? 0 : num(u.outputTokens);
			const cacheRead = u === null ? 0 : num(u.cacheReadTokens);
			const cacheHit = u !== null && billed > 0 ? Math.round(cacheRead / billed * 100) : null;
			const hasAny = stats.steps > 0 || stats.turns > 0 || billed > 0 || output > 0;
			if (!hasAny) return null;
			const pillParts = [];
			if (stats.steps > 0 || stats.turns > 0) pillParts.push(t("stats.pillTurnsSteps", { turns: stats.turns, steps: stats.steps }));
			if (cacheHit !== null) pillParts.push(t("stats.pillCache", { percent: cacheHit }));
			if (billed > 0 || output > 0) {
				const inFmt = fmtN(billed);
				const outFmt = fmtN(output);
				if (inFmt !== null && outFmt !== null) {
					pillParts.push(t("stats.pillTokens", { input: inFmt, output: outFmt }));
				} else if (inFmt !== null) {
					pillParts.push(inFmt);
				} else if (outFmt !== null) {
					pillParts.push(outFmt);
				}
			}
			const pillText = pillParts.join(" · ");
			const row = (label, value) => value === null || value === void 0 || value === ""
				? null
				: react.createElement("div", { className: "dsh-stats-row" },
					react.createElement("span", { className: "dsh-stats-label" }, label),
					react.createElement("span", { className: "dsh-stats-value" }, value));
			const ttftAvg = stats.ttftSteps > 0 && stats.ttftMs > 0 ? fmtD(stats.ttftMs / stats.ttftSteps) : null;
			const tps = stats.decodeMs > 0 && stats.decodeTokens > 0
				? Math.round(stats.decodeTokens / (stats.decodeMs / 1000)) + " tok/s"
				: null;
			const tpsDecode = stats.decodeMs > 0 && stats.decodeTokens > 0 ? fmtN(stats.decodeTokens) : null;
			const inputParts = [];
			if (u !== null) {
				const uncached = num(u.uncachedInputTokens);
				const cached = num(u.cacheReadTokens);
				const written = num(u.cacheWriteTokens);
				const uncachedFmt = uncached > 0 ? fmtN(uncached) : null;
				const cachedFmt = cached > 0 ? fmtN(cached) : null;
				const writtenFmt = written > 0 ? fmtN(written) : null;
				if (uncachedFmt !== null) inputParts.push(uncachedFmt + " " + t("stats.uncached"));
				if (cachedFmt !== null) inputParts.push(cachedFmt + " " + t("stats.cacheRead"));
				if (writtenFmt !== null) inputParts.push(writtenFmt + " " + t("stats.cacheWrite"));
			}
			const inputDetail = inputParts.length > 0 ? inputParts.join(" / ") : null;
			const panelStyle = panelBox === null ? void 0 : {
				bottom: panelBox.bottom + "px",
				maxHeight: panelBox.maxHeight + "px"
			};
			return react.createElement("div", { className: "dsh-stats" },
				react.createElement("button", {
					type: "button",
					ref: pillRef,
					className: "dsh-stats-pill",
					"aria-haspopup": "dialog",
					"aria-expanded": open,
					"aria-controls": open ? panelId : void 0,
					onClick: () => setOpen((v) => !v)
				},
					react.createElement("span", { className: "dsh-stats-pill-text" }, pillText),
					react.createElement("span", { className: "dsh-stats-caret" }, caretIcon())
				),
				open && react.createElement("div", {
					className: "dsh-stats-panel",
					id: panelId,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": t("stats.title"),
					tabIndex: -1,
					ref: panelRef,
					style: panelStyle
				},
					react.createElement("div", { className: "dsh-stats-panel-title" },
						react.createElement("span", null, t("stats.title")),
						react.createElement("button", {
							type: "button",
							className: "dsh-stats-close",
							"aria-label": t("stats.close"),
							onClick: () => setOpen(false)
						}, closeIcon())
					),
					row(t("stats.turns"), stats.turns > 0 ? String(stats.turns) : null),
					row(t("stats.steps"), stats.steps > 0 ? String(stats.steps) : null),
					row(t("stats.llm"), fmtD(stats.llmMs)),
					row(t("stats.tool"), fmtD(stats.toolMs)),
					row(t("stats.ttft"), ttftAvg),
					row(t("stats.tps"), tps),
					row(t("stats.decodeTokens"), tpsDecode),
					row(t("stats.cacheHit"), cacheHit === null ? null : cacheHit + "%"),
					row(t("stats.input"), fmtN(billed)),
					row(t("stats.output"), fmtN(output)),
					row(t("stats.inputDetail"), inputDetail)
				)
			);
		}
		/**
		 * Client plugin body: register the mobile nav (hamburger + scrim) into
		 * `shell.overlay` and the stats pill into `conversation.composer.dock`.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-client-ui-mobile-adapt: dictionaries");
			const toggleSidebar = () => {
				if (ctx.layout !== void 0 && ctx.layout !== null && typeof ctx.layout.toggleSidebar === "function") ctx.layout.toggleSidebar();
			};
			ctx.effect(() => ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-mobile-nav",
				priority: -1,
				locale: NS
			}, (props) => react.createElement(MobileNav, {
				t: props.t,
				toggle: toggleSidebar
			}))), "dsh-client-ui-mobile-adapt: nav overlay");
			/* 底部统计：胶囊 + 展开面板。
			 * 使用插件自有 ID（dsh-mobile-stats），不再冒用上游 ui-chat 的
			 * "stats" 条目 ID —— 同 ID + 更低 priority 会遮蔽官方组件，
			 * 违反 DSH STORE「不替换官方组件」契约。
			 * 手机端 CSS 只在「本插件胶囊确实渲染」时隐藏官方统计行
			 * （0.2.0 的 .bOPqQW_root / 0.2.1 的 .bOPqQW_anchor），
			 * 桌面端完全不动上游。 */
			ctx.effect(() => ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "dsh-mobile-stats",
				priority: -1,
				locale: NS
			}, (props) => react.createElement(StatsBoundary, null, react.createElement(StatsDock, props)))), "dsh-client-ui-mobile-adapt: stats dock");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

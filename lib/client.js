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
		 * VERSION CONTRACT — dsh 0.1.5-rc.2 .. 0.1.7-rc.2
		 * (client-ui / web-frontend 0.1.5-rc.2 and 0.1.7-rc.2 both re-scanned)
		 *
		 * Anchoring strategy (most-stable tier first):
		 *   1. Semantic `data-*` attributes shipped by dsh — the documented,
		 *      rehash-proof contract surface (`[data-sidebar-collapsed]`,
		 *      `[data-chat-flow]`, `[data-composer-seat]`, ...).
		 *   2. Structural relations on our own markup (`.dsh-mobile-nav`,
		 *      `.dsh-stats`, ...) — fully owned by this plugin.
		 *   3. Hash class names only where no semantic anchor exists. Verified
		 *      stable rc.6 → 0.1.5-rc.2 and again 0.1.5-rc.2 → 0.1.7-rc.2 by
		 *      dist scan; every drifted name is handled with dual-generation
		 *      selectors below.
		 *
		 * Verified stable prefixes against client-ui 0.1.7-rc.2 dist
		 * (package attribution confirmed by scanning the installed tree):
		 *   layout               pI_x6G_
		 *   conversation         wSkVaW_ uV2eYG_ JObwrW_ pXSMma_ T1PP_q_
		 *   settings-general     VOzbGW_ UQsH_q_ me01iq_
		 *   settings-models      zGbnIq_
		 *   settings-plugins     pbvGtq_
		 *   agent-preset         rtSEdW_
		 *   theme                bVCLcG_
		 *   permission-presets   oY77xG_
		 *   locale               hVGvvW_
		 *   chat                 _2XZxNq_ bOPqQW_
		 *   cordis               Nqubda_
		 *   trajectory           Y0dWHa_ qBU-ya_ fV0t5q_
		 *   sidebar              hHd-Xa_
		 *   model-selection      _7KE1Ra_
		 *   commands             mufS8W_
		 *
		 * DRIFT REGISTER (rc.6 → 0.1.5-rc.2):
		 *   • layout `pI_x6G_detailsCol` renamed → `pI_x6G_rightbarCol`.
		 *     Both generations are matched.
		 *   • conversation `Md3f7G_*` (ChatView.module.css) deleted entirely —
		 *     the flow column was rebuilt. Its `flowItem` role (min-width:0, so
		 *     long content cannot blow the column out) now rides on
		 *     `[data-chat-flow] > *`.
		 *   • conversation `wSkVaW_headerActions` split; the new
		 *     `wSkVaW_headerCorner` / `wSkVaW_widthHandle` are hidden on narrow
		 *     screens so they stop fighting the hamburger for the top-left.
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
		 * TOUCH-TARGET REGISTER (issue #2 root cause):
		 *   Upstream ships several desktop-sized (<44px) hit areas. On a phone
		 *   the finger contact patch is ~30-40 CSS px, so users simply miss —
		 *   which is what "无法滑动导致无法保存配置" actually describes. The
		 *   worst offender was the font-size stepper: `.bVCLcG_arrows` is an
		 *   `absolute` COLUMN holding two 17x12 arrows only 14px apart, so
		 *   "increase" and "decrease" overlapped and mis-fired. Narrow-screen
		 *   rules below re-flow that container to a static ROW of 44x44 hit
		 *   areas and lift every other sub-44px control to the 44px floor.
		 */
		const css = `
/* ===== dsh-mobile: 手机端适配 (v23 — dsh 0.1.5-rc.2 .. 0.1.7-rc.2) ===== */

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

/* 平板 / 窄桌面（768-1024px）：交给上游自己的响应式布局。
   上游 @deepseek-ai/dsh-client-ui-layout 定义了
   SIDEBAR_AUTO_COLLAPSE = 1024，即 <1024px 时侧栏自动收成 56px 图标条，
   中栏占满其余宽度 —— 这个布局在 iPad 竖屏（768px）下是合理且好用的，
   插件不应插手抢夺。此处只做轻微的头部留白收紧。 */
@media (max-width: 1024px) {
  .wSkVaW_header {
    padding: 12px 20px 0 16px;
  }
  .wSkVaW_tabs {
    gap: 24px;
  }
}

/* 手机（<= 767px）：单栏布局。
   断点取 767 而非 768，是为了和上游 SIDEBAR_AUTO_COLLAPSE=1024 的档位边界
   保持一致：768px 起交给官方的 56px 图标窄栏（保留侧栏导航能力），
   只有真正的手机宽度才收敛成单栏 + 抽屉。
   实测 767→768 过渡无缝（0px 767px 0px → 56px 712px 0px）。 */
@media (max-width: 767px) {
  /* 动态视口高度：避免 iOS 工具栏遮挡底部输入区 */
  html,
  body {
    height: 100dvh;
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
  /* 第三栏（右栏）。优先用官方语义锚 [data-rightbar-col]；
     哈希类名作为兜底，同时兼容 rc.6 的 detailsCol 旧名。 */
  [data-rightbar-col],
  .pI_x6G_rightbarCol,
  .pI_x6G_detailsCol {
    grid-column: 3;
    display: none !important;
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
    z-index: 40;
    transition: left 0.25s ease;
    box-shadow: 4px 0 24px rgb(0 0 0 / 30%);
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  [data-sidebar-collapsed]:not([data-sidebar-collapsed="true"]) .pI_x6G_sidebarCol,
  .pI_x6G_frame:not([data-sidebar-collapsed]) .pI_x6G_sidebarCol {
    left: 0;
  }

  /* 侧边栏内容组件填满抽屉宽度 */
  .pI_x6G_sidebarCol .hHd-Xa_root {
    width: 100% !important;
  }

  /* 汉堡按钮 */
  .dsh-mobile-hamburger {
    display: grid !important;
    position: fixed;
    top: max(10px, env(safe-area-inset-top, 0px));
    left: max(12px, env(safe-area-inset-left, 0px));
    z-index: 41;
    /* 触摸目标下限 44px，同时与标题行左内边距（60px）对齐 */
    width: 44px;
    height: 44px;
    border: 1px solid var(--dsw-alias-border-l2);
    border-radius: 12px;
    background: var(--dsw-alias-button-floating-fill);
    color: var(--dsw-alias-label-primary);
    box-shadow: var(--dsw-shadow-lv2);
    place-items: center;
    cursor: pointer;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
  }
  .dsh-mobile-hamburger:active {
    background: var(--dsw-alias-button-floating-hover);
  }

  /* 抽屉遮罩：仅在抽屉打开时显示，点按关闭 */
  .dsh-mobile-scrim {
    display: none !important;
    position: fixed;
    inset: 0;
    z-index: 39;
    background: rgb(0 0 0 / 35%);
    pointer-events: auto;
  }
  /* 抽屉打开（frame 上没有 data-sidebar-collapsed，或值为非 true）时显示遮罩。
     用属性锚而非哈希类名。 */
  [data-sidebar-collapsed]:not([data-sidebar-collapsed="true"]) .dsh-mobile-scrim,
  .pI_x6G_frame:not([data-sidebar-collapsed]) .dsh-mobile-scrim {
    display: block !important;
  }

  /* 会话头部：给汉堡按钮留位，允许换行。
     汉堡为 fixed 定位 44x44（left 12px），故左内边距 = 12 + 44 + 8 = 64px */
  .wSkVaW_header {
    padding: 10px 12px 0 64px;
  }
  .wSkVaW_titleRow {
    flex-wrap: wrap;
    row-gap: 4px;
  }
  .wSkVaW_headerActions {
    gap: 4px;
  }
  .wSkVaW_headerUtilities {
    gap: 4px;
    margin-left: 8px;
  }
  .wSkVaW_crumb {
    max-width: 130px;
  }
  /* 0.1.5-rc.2 新增的 header 角标与宽度手柄在窄屏收起，
     避免与汉堡按钮争抢左上角、并规避拖拽手势与抽屉手势互斥 */
  .wSkVaW_headerCorner,
  .wSkVaW_widthHandle {
    display: none !important;
  }

  /* 顶栏「对话/轨迹」标签：以中间为对称轴居中放置 */
  .wSkVaW_tabs {
    justify-content: center;
    padding-left: 0;
    gap: 32px;
    margin-left: -36px;
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
  .Sh0Q9G_trigger,
  .uV2eYG_select,
  ._7KE1Ra_trigger {
    max-width: 112px !important;
  }
  .Sh0Q9G_triggerLabel,
  ._7KE1Ra_triggerLabel {
    font-size: 12px;
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
  }
  .JObwrW_panel {
    width: min(264px, calc(100vw - 16px)) !important;
  }

  /* ===== 设置面板：全屏悬浮（自带关闭按钮），可滚动 ===== */
  .VOzbGW_overlay {
    padding: 0;
  }
  .VOzbGW_panel {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
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
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
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
  }
  .VOzbGW_navCell {
    height: 34px;
    padding: 6px 12px;
    white-space: nowrap;
    flex: none;
  }
  .VOzbGW_header {
    height: 46px;
    padding: 12px 12px 4px;
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
     修正：窄屏下把箭头容器从 absolute 纵向堆叠改为 static 横向排列，
     两个 40x40 热区并排互不重叠，stepper 宽度由内容撑开。 */
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
  }
  .bVCLcG_arrow::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  .bVCLcG_row,
  .bVCLcG_control {
    align-items: center;
    min-height: 44px;
  }
  .bVCLcG_row {
    column-gap: 8px;
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
  .VOzbGW_close::after {
    content: "";
    position: absolute;
    inset: 0;
  }

  /* 设置导航 tab：40px 高 → 最小 44px 高 */
  .VOzbGW_navCell {
    min-height: 44px;
  }

  /* Models / Agent presets 的图标按钮：28x28 → 44x44 热区。
     删除按钮误触代价高，必须放大 */
  .zGbnIq_iconButton,
  .rtSEdW_iconButton {
    position: relative;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: -8px;
  }
  .zGbnIq_iconButton::after,
  .rtSEdW_iconButton::after {
    content: "";
    position: absolute;
    inset: 0;
  }

  /* 新增模型按钮：97x28 → 44px 高 */
  .zGbnIq_addModelButton {
    min-height: 44px;
  }

  /* dsh 通用按钮组件（@deepseek-ai/dsh-client-ui-* 共享的 _button_/_sm_ 组合，
     调用点如设置面板头部的「Open configuration file」，上游仅 28px 高）。
     这里用属性锚点而非它的内部 hash，避免哈希漂移导致规则失配。 */
  [role="dialog"] button[class*="_button_"][class*="_sm_"] {
    min-height: 44px;
  }

  /* 表单输入与下拉：32~36px → 44px 高，避免聚焦时被软键盘顶飞 */
  .zGbnIq_input {
    min-height: 44px !important;
  }
  .oY77xG_selector,
  .hVGvvW_selector,
  .lats3W_selector,
  ._2XZxNq_selector,
  .T1PP_q_selector {
    min-height: 44px !important;
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

  /* ===== 轨迹页面（trajectory）手机端 ===== */
  .qBU-ya_root,
  .qBU-ya_ledger {
    isolation: auto !important;
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
    bottom: 130px !important;
    left: 12px !important;
    width: auto !important;
    max-width: none !important;
    min-width: 0 !important;
    height: min(52vh, 460px) !important;
    max-height: min(52vh, 460px) !important;
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
    padding-top: 12px;
  }
  .Y0dWHa_detailBody {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 16px !important;
  }
  .Y0dWHa_detailBodySummary {
    padding-bottom: 12px !important;
  }
  .Y0dWHa_detailTabs {
    flex: none;
  }
  /* 轨迹详情面板打开时，隐藏汉堡与遮罩避免层级打架。
     用 :root:has() 而非 frame 哈希类，锚定更稳。 */
  html:has(.Y0dWHa_details) .dsh-mobile-hamburger,
  html:has(.Y0dWHa_details) .dsh-mobile-scrim {
    display: none !important;
  }
  .fV0t5q_inner {
    gap: 4px;
    padding: 0 4px;
  }
  .fV0t5q_search {
    flex: 0 1 110px;
    min-width: 64px;
  }
  .fV0t5q_actions {
    gap: 0;
  }

  /* ===== 底部统计：胶囊 + 展开面板 ===== */
  /* 手机端由本插件的胶囊接管底部统计行，隐藏上游 ui-chat 的原生统计行
     (.bOPqQW_root)，避免两行统计重复。上游该 root 类名在
     0.1.5-rc.2 与 0.1.7-rc.2 两代 dist 中均稳定；
     本插件的统计条目使用自有 ID（dsh-mobile-stats），不占用官方 stats 条目。 */
  .bOPqQW_root {
    display: none !important;
  }
  .dsh-stats {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0 8px;
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
    padding: 10px 16px;
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
  }
  .dsh-stats-pill:active {
    background: var(--dsw-alias-interactive-bg-hover);
  }
  .dsh-stats-pill[aria-expanded=true] {
    color: var(--dsw-alias-label-primary);
    border-color: var(--dsw-alias-state-business-primary);
  }
  /* 展开面板：悬浮在输入区上方，可滚动。
     0.1.5-rc.2 起输入卡片下方新增 dock 条（ContextMeter 迁入），
     面板底部再抬高 40px 以免压住该条。 */
  .dsh-stats-panel {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 216px;
    z-index: 1000;
    max-height: 48vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    box-sizing: border-box;
    border: 1px solid var(--dsw-alias-border-l2);
    border-radius: 14px;
    background: var(--dsw-alias-bg-layer-1);
    box-shadow: var(--dsw-shadow-lv3);
    padding: 6px 14px 10px;
    color: var(--dsw-alias-label-primary);
  }
  .dsh-stats-panel-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 0 6px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
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
    font-size: 18px;
    line-height: 18px;
    display: inline-flex;
    margin: -8px -8px -8px 0;
  }
  .dsh-stats-close:active {
    background: var(--dsw-alias-interactive-bg-hover);
  }
  .dsh-stats-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 7px 0;
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
  /* 统计展开面板打开时同理隐藏汉堡与遮罩 */
  html:has(.dsh-stats-panel) .dsh-mobile-hamburger,
  html:has(.dsh-stats-panel) .dsh-mobile-scrim {
    display: none !important;
  }
}
`;
		const tagId = "dsh-client-ui-mobile-adapt/client.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-client-ui-mobile-adapt";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
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
		/**
		 * Client plugin body: register the mobile nav (hamburger + scrim) into
		 * `shell.overlay` and the stats pill into `conversation.composer.dock`.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-client-ui-mobile-adapt: dictionaries");
			ctx.effect(() => ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-mobile-nav",
				priority: -1,
				locale: NS
			}, (props) => {
				const toggle = () => {
					ctx.layout.toggleSidebar();
				};
				return react.createElement("div", { className: "dsh-mobile-nav" },
					react.createElement("button", {
						type: "button",
						className: "dsh-mobile-hamburger",
						"aria-label": props.t("nav.open"),
						onClick: toggle
					}, "☰"),
					react.createElement("div", { className: "dsh-mobile-scrim", onClick: toggle })
				);
			})), "dsh-client-ui-mobile-adapt: nav overlay");
			/* 底部统计：胶囊 + 展开面板。
			 * 使用插件自有 ID（dsh-mobile-stats），不再冒用上游 ui-chat 的
			 * "stats" 条目 ID —— 同 ID + 更低 priority 会遮蔽官方组件，
			 * 违反 DSH STORE「不替换官方组件」契约。
			 * 手机端改用 CSS 隐藏上游 .bOPqQW_root 统计行，桌面端不动上游。 */
			ctx.effect(() => ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "dsh-mobile-stats",
				priority: -1,
				locale: NS
			}, (props) => {
				const useSession = props.useSession;
				const useProjection = props.useProjection;
				const t = props.t;
				const [open, setOpen] = react.useState(false);
				const usage = useProjection("tokenUsage");
				const projected = useProjection("sessionStats");
				const settledNodes = useSession((s) => s.chat.legacy.nodes);
				/* 展开面板的滚动锁：手机端面板自身可滚动，但滑到边界后继续滑动
				 * 会把事件穿透给底层会话区，表现为「面板跟着乱动」。
				 *
				 * 注意 wheel 与 touchmove 的方向判据不同：wheel 看 deltaY，
				 * touchmove 本身没有 deltaY，必须用前后两次触点 Y 的差值
				 * （手指下滑 → Y 增大 → 内容向上滚，即"想看更上面"）。
				 * 旧实现只判断 ev.deltaY，touchmove 时恒为 undefined，
				 * 导致手机上这个锁从未生效 —— 一并修掉。 */
				const panelRef = react.useRef(null);
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
				const stats = react.useMemo(() => {
					if (projected !== undefined && projected !== null) return projected;
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
						turns.add(node.turn);
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
				const cacheHit = u !== null && billed > 0 && cacheRead > 0
					? Math.round(cacheRead / billed * 100)
					: null;
				const hasAny = (stats.steps > 0 || billed > 0 || output > 0);
				if (!hasAny) return null;
				const pillParts = [];
				if (stats.steps > 0) pillParts.push(t("stats.pillTurnsSteps", { turns: stats.turns, steps: stats.steps }));
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
				const pillText = pillParts.join("  ·  ");
				const row = (label, value) => value === null || value === void 0 || value === ""
					? null
					: react.createElement("div", { className: "dsh-stats-row" },
						react.createElement("span", { className: "dsh-stats-label" }, label),
						react.createElement("span", { className: "dsh-stats-value" }, value));
				const ttftAvg = stats.ttftSteps > 0 ? fmtD(stats.ttftMs / stats.ttftSteps) : null;
				const tps = stats.decodeMs > 0 ? Math.round(stats.decodeTokens / (stats.decodeMs / 1000)) + " tok/s" : null;
				const tpsDecode = stats.decodeMs > 0 ? fmtN(stats.decodeTokens) : null;
				return react.createElement("div", { className: "dsh-stats" },
					react.createElement("button", {
						type: "button",
						className: "dsh-stats-pill",
						"aria-expanded": open || void 0,
						onClick: () => setOpen((v) => !v)
					}, pillText),
					open && react.createElement("div", { className: "dsh-stats-panel", role: "dialog", ref: panelRef },
						react.createElement("div", { className: "dsh-stats-panel-title" },
							react.createElement("span", null, t("stats.title")),
							react.createElement("button", {
								type: "button",
								className: "dsh-stats-close",
								"aria-label": t("stats.close"),
								onClick: () => setOpen(false)
							}, "×")
						),
						row(t("stats.turns"), stats.steps > 0 ? String(stats.turns) : null),
						row(t("stats.steps"), stats.steps > 0 ? String(stats.steps) : null),
						row(t("stats.llm"), fmtD(stats.llmMs)),
						row(t("stats.tool"), fmtD(stats.toolMs)),
						row(t("stats.ttft"), ttftAvg),
						row(t("stats.tps"), tps),
						row(t("stats.decodeTokens"), tpsDecode),
						row(t("stats.cacheHit"), cacheHit === null ? null : cacheHit + "%"),
						row(t("stats.input"), fmtN(billed)),
						row(t("stats.output"), fmtN(output)),
						row(t("stats.inputDetail"), u === null ? null : [
							num(u.uncachedInputTokens) + " " + t("stats.uncached"),
							num(u.cacheReadTokens) + " " + t("stats.cacheRead"),
							num(u.cacheWriteTokens) + " " + t("stats.cacheWrite")
						].join(" / "))
					)
				);
			})), "dsh-client-ui-mobile-adapt: stats dock");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

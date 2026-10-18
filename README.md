# dsh-client-ui-mobile-adapt

> **Your DeepSeek Harness web UI, rebuilt for the phone in your hand.**
>
> Built for developers who code in **Termux on Android**: the three-column
> desktop shell collapses into a clean single-column mobile layout — sidebar
> becomes a swipe drawer, composer tools stay on one line, settings and
> trajectory details open as full-screen panels that actually scroll, the
> right sidebar becomes a full-screen file/terminal layer, and a tap on the
> stats pill reveals the whole session report. Desktop stays exactly as it is;
> your phone finally works.

> **为在手机上用 Termux 敲代码的你，把 DeepSeek Harness 的 Web 界面真正搬上手机屏。**
>
> 专为 Android 上的 Termux 开发者打造：三栏桌面布局收敛为清爽的单栏移动布局——
> 侧边栏变成滑出抽屉、输入工具保持一行、设置与轨迹详情以可滚动的全屏面板呈现、
> 右侧栏变成全屏文件/终端层、点一下统计胶囊就能看到完整会话报告。
> 桌面端分毫不动，手机端终于能用了。

DeepSeek Harness Web GUI 的手机端适配**客户端插件**。

纯客户端插件：仅在 `max-width: 767px` 视口下生效，其余宽度完全不受影响。
（767 而非 768：上游 `dsh-client-ui-layout` 的 `SIDEBAR_AUTO_COLLAPSE = 1024`，
768–1023px 归上游的 56px 图标窄栏管，768px 起保留侧栏导航更合理。）
采用官方客户端插件格式（`dsh.client` 声明 + `window.__ModuleLoader__.load` 模块），
同时可作为 profile bundle（`dsh.bundle.patch`）一键挂载。

## 功能

| 区域 | 效果 |
| --- | --- |
| 整体布局 | 三栏 Grid 覆盖为 `0 minmax(0,1fr) 0`，中栏占满全宽；桌面端零改动 |
| 侧边栏 | 左侧抽屉（`left` 位移动画 + 弹缓动），选中会话 / 新建会话 / 打开插件面板后自动收起，Esc 或点遮罩关闭 |
| 汉堡按钮 | `shell.overlay` 槽位浮动按钮（左上角，44×44，SVG 图标，按压缩放反馈） |
| 会话头部 | 给汉堡留位、标题/操作可换行、「对话/轨迹」标签精确居中；保留右上角右侧栏入口 |
| 右侧栏 | 文件 / 终端 / Start 面板改为**全屏浮层**（不再被隐藏），关闭按钮 44×44 |
| 输入工具行 | 强制单行（附加/权限/模型/上下文/发送），触发器限宽 112px；主要按钮 44×44 |
| 弹层 | 模型选择、上下文详情、命令菜单限宽 `calc(100vw - 16px)` 不出屏；菜单行 44px |
| 设置面板 | 全屏，顶部导航单行可横滑，内容区可滚动，关闭按钮 44×44；全屏下不再叠一层模糊遮罩 |
| 插件面板 | fixed 悬浮、底部 130px（不遮触发按钮），可开可关 |
| 轨迹页面 | 工具栏 44px 高、按钮 44px；详情面板悬浮在输入区上方（跟随 composer 高度），内部可滚动 |
| 底部统计 | 胶囊摘要（轮/步/缓存/Token），点击展开报表；面板贴着胶囊上沿，标题吸顶，Esc/点外部关闭，焦点自动归还 |
| 触摸目标 | 关键控件 ≥ 44×44 有效热区（WCAG 2.5.5 / Material 48dp）；字号 stepper、开关、设置导航、右栏、轨迹工具栏均已覆盖 |
| 动效 | 抽屉 / 遮罩 / 统计面板有短促过渡，并完整遵守 `prefers-reduced-motion` |
| iOS | `100dvh` 动态视口、刘海/底部安全区适配，输入框聚焦不再触发页面自动放大 |

## 触摸目标修复（issue #2 根因）

上游沿用桌面尺寸，多个控件低于 44px 的最小可点区域。手机端指尖落点约 30–40 CSS px，
用户点不中，体验上就表现为「划不动 / 点不动」，这即是
[issue #2《无法滑动导致无法保存配置》](https://github.com/Hotsteel2901/dsh-client-ui-mobile-adapt/issues/2)
的真实机制。

最严重的是字号调节 stepper：`.bVCLcG_arrows` 是一个 `absolute` **列**容器，
内含两个 **17×12px** 上下堆叠的箭头，中心仅相距 **14px** —— 想调大却触发调小，
反复失败后配置就改不成。本插件在窄屏把它重排为 static **行**，
两个 44×44 热区并排互不重叠。

其余一并抬到 44px 的下限：

| 元素 | 修复前 | 修复后 |
| --- | --- | --- |
| `bVCLcG_arrow`（字号加减） | 17×12，互相重叠；0.2.1 起默认透明 | 44×44，并排，强制可见 |
| `bVCLcG_expander`（字号更多） | 24×24 | 44×44 |
| `VOzbGW_close`（关闭设置） | 28×28 | 44×44 |
| `VOzbGW_navCell`（设置导航） | 40px 高 | 44px 高 |
| `zGbnIq_iconButton` / `rtSEdW_iconButton` | 28×28 | 44×44 |
| `zGbnIq_addModelButton` | 97×28 | 44px 高 |
| `zGbnIq_helpButton`（16px 问号） | 16×16 | 44×44 伪元素热区 |
| `[role=switch]`（设置开关） | 36×20 | 44px 高伪元素热区 |
| `_7KE1Ra_option` / `mufS8W_row`（菜单行） | 34px / 28px | 44px |
| `uV2eYG_add` / `uV2eYG_primary`（输入栏附加/发送） | 28×28 / 34×34 | 44×44 |
| `iWlSmW_trigger` / `_7KE1Ra_trigger`（权限/模型） | 28px 高 | 44px 高 |
| `JObwrW_trigger`（上下文用量） | 20px 高 | 44px 高 |
| `QsffPG_trigger`（任务菜单） | 28px 高 | 44px 高 |
| `wSkVaW_tab`（对话/轨迹） | 25px 高 | 44px 高 |
| `P3OORG_iconButton`（右栏） | 28×28 | 44×44 |
| `Y0dWHa_close` / `Y0dWHa_detailTab` | 28px / 34px | 44px |
| `fV0t5q_toggle/control/action`（轨迹工具栏） | 20px 高 | 44px 高 |
| 设置页下拉 / 输入 / API Key | 32–36px | 44px |
| `dsh-mobile-hamburger` | 40×40 | 44×44 |
| `dsh-stats-pill` / `dsh-stats-close` | 28px | 44px |

## 修复的 JS 逻辑缺陷

除 CSS 之外，一并修掉了 `lib/client.js` 中的若干运行时缺陷：

| 缺陷 | 症状 | 修复 |
| --- | --- | --- |
| **样式表被上游压过**（0.2.1） | 插件 CSS 在 `conversation` / `input-bar` / `settings` 之前注入，同优先级规则全被后加载的上游样式覆盖：头部 padding、Tabs 居中、设置横向导航、字号 stepper 全部失效 | `ensureCssLast()` 把插件 `<style>` 持续保持在 `<head>` 末尾（首帧 + load + `MutationObserver`），不改上游顺序 |
| **`useSession((s) => s.chat…)` 崩溃**（0.2.1） | 0.2.1 从 session snapshot 删除了 `.chat` 包装，统计 dock 读取 `s.chat.legacy` 抛 `TypeError`，整个 `conversation.composer.dock` 出现 slot error，统计胶囊消失 | 优先使用 slot 提供的 `useChat`，selector 同时兼容 `s.legacy.nodes` 与旧 `s.chat.legacy.nodes`；再加 `StatsBoundary`，单点故障只降级不拖垮 dock |
| **官方统计行选择器失效**（0.2.1） | `.bOPqQW_root` 被拆成 `.bOPqQW_anchor`，手机端不再隐藏官方统计，出现两行统计 | 双代匹配，并且只在 `.dsh-stats` 真正渲染时用 `:has()` 隐藏官方行；插件异常时官方行自动回退 |
| 右侧栏被整体隐藏 | 手机端看不到文件 / 终端 / Start 面板，功能不可达 | 右栏改为全屏固定浮层，平时 `pointer-events:none`，打开时接管；保留 header 里的展开按钮并抬到 44px |
| 抽屉点完不收起 | 选中会话、新建会话、进设置后抽屉仍盖在内容上，还要再点一次遮罩 | 导航类点击后 60ms 自动收起（行内“更多操作”按钮除外） |
| 字号箭头在触屏上不可见（0.2.1） | 上游改成 `opacity:0`，只在 hover/focus 显形；手机没有 hover，用户找不到加减号 | 窄屏强制 `opacity:1`，并重排为两个 44×44 并排热区 |
| 统计面板位置写死 | `bottom:216px` 与 composer 实际高度无关，键盘/附件/队列变化后会悬空或压住输入框 | 打开时测量胶囊上沿，写入 `bottom` / `max-height`；监听 resize / orientationchange / visualViewport |
| `fmtN` 进位溢出 | `999999` 读作 `"1000K"`（应为 `"1M"`） | 按「渲染后数值」校正单位，超 1000 则升档 |
| `fmtD` 进位溢出 | `59999ms` 读作 `"60s"`（应为 `"1m"`） | 舍入到 0.1s 后仍 <60 才用秒级 |
| `settledNodes` 无类型保护 | 会话未初始化时 `for...of` 抛 `TypeError`，整个 dock 白屏 | `Array.isArray` 归一化后再遍历 |
| 累计值被 `NaN` 污染 | `callTime` 为 `undefined` 时 `toolMs` 变 `NaN`，对应行静默消失 | 累加前统一校验两端均为有限数 |
| `usage` 只判 `undefined` | `usage` 为 `null` 时读属性抛错 | 归一化为 `null` 再判，数值走 `num()` |
| 统计面板滚动锁失效 | `touchmove` 没有 `deltaY`，方向恒判为 false，手机上面板边界穿透 | 改用前后触点 Y 差值判断方向 |
| 统计面板只能点 × | 点面板外、按 Esc 都不关；键盘用户焦点留在面板里 | 增加 outside-pointer、Esc、Tab 焦点环、关闭后焦点归还胶囊 |

## 修复的上游组件替换（DSH STORE 契约）

底部统计条目此前注册进 `conversation.composer.dock` 时**冒用了上游 `ui-chat` 的条目 ID `"stats"`**
（同 ID + 更低 `priority` = 遮蔽官方组件），违反 DSH STORE「不替换官方组件、只用插件自有 ID」契约。

现已改为插件自有 ID **`dsh-mobile-stats`**，不再遮蔽官方条目。手机端只在
**本插件胶囊确实渲染出来**时，用 `.uV2eYG_dock:has(.dsh-stats)` 隐藏上游统计行：

- 0.2.0 用 `.bOPqQW_root`，0.2.1 用 `.bOPqQW_anchor`（activity / usage 两个胶囊），双代都匹配；
- 桌面端完全不动上游（本插件胶囊基态 `display: none`）；
- 插件统计组件异常或无数据时，官方统计行仍在，不会出现“两边都没有统计”的空窗。

`StatsBoundary` 会把这个 dock 的渲染错误限制在插件内部：捕获后渲染 `null`，
官方统计继续工作，控制台留下一条告警。

## 安装

### 方式零：一键脚本（推荐）

仓库自带一键安装脚本，自动完成「定位 dsh → 建 profile → 装依赖 → 校验」全流程。

**Linux / macOS / WSL / Git-Bash**

```bash
curl -fsSL https://raw.githubusercontent.com/Hotsteel2901/dsh-client-ui-mobile-adapt/main/install.sh | bash
```

或在 clone 下来的仓库里直接跑：

```bash
./install.sh                      # 装进默认 profile webmobile
./install.sh --profile my-ui      # 自定义 profile 名
./install.sh --check              # 只体检、不改动
./install.sh --version 0.2.1-rc.2 # 手动钉版本
```

**Windows（PowerShell 5.1+ / 7+）**

```powershell
.\install.ps1
.\install.ps1 -Profile my-ui
.\install.ps1 -Check
```

脚本会把插件装进 `$DSH_HOME/profiles/<profile>/`，并注册到
`package.json` 的 `dsh.profile.bundles`，最后逐项校验关键包是否到位。

> **关于 `curl … | bash` 一键跑**：本包**尚未发布到 npm**，所以脚本在检测不到本地
> checkout 时会自动 `git clone --depth 1` 到临时目录再安装 —— 因此该用法**需要 git**。
> 想省掉克隆，就先 clone 仓库再从仓库里跑 `./install.sh`（推荐，零依赖）。
> `--from-npm` / `-FromNpm` 目前仅在包已发布后才可用。

**需要 pnpm**：`dsh plugin` 本身就是 pnpm 的一层封装。dsh 的 SEA 发行版内置 pnpm，
但**通过 npm 安装的 dsh 会去 PATH 上找 `pnpm`**，找不到就报
`pnpm not found on PATH`。脚本会先检测，缺失时自动用 corepack 或 `npm i -g pnpm`
装一个；实在装不上才会报错让你手动装。

#### 给管道传参的正确写法

`curl … | bash` 后面直接接 `--version` 会被 **bash 自己**吃掉（变成查 bash 版本）。
要传给脚本，必须用 `-s --`：

```bash
# ✗ 错误：打印的是 bash 的版本
curl -fsSL .../install.sh | bash --version 0.2.1-rc.2

# ✓ 正确
curl -fsSL .../install.sh | bash -s -- --version 0.2.1-rc.2
curl -fsSL .../install.sh | bash -s -- --profile my-ui
```

其实一般不用传 `--version`：脚本会依次用「profile 里已钉的版本」→
`dsh --version` → registry 的 `next` tag 来推断，全失败才回退 `0.2.1-rc.2`。

#### 脚本替你踩掉的三个坑

自己手动装很容易在这里翻车，脚本已固化处理：

| 坑 | 后果 | 脚本的处理 |
|---|---|---|
| dsh 生成的 `pnpm-workspace.yaml` 里 `autoInstallPeers: false` | 所有 `@deepseek-ai/dsh-*` 都把兄弟包声明为 **peer dependency**，关掉 peer 自动安装后 pnpm 会**静默漏装** `dsh-session-title-llm`，启动直接 `Cannot find package` | 强制写入 `autoInstallPeers: true` |
| `dsh plugin` 只会带 `dsh-base`，不带 `dsh-web-app` | profile 起不来 Web UI | 显式安装两个 bundle |
| registry 的 `latest` tag 指向**陈旧且有残缺**的 `0.0.1-rc.1`（其依赖 `@deepseek-ai/dsh-fs-policy` 从未发布） | `404 Not Found` 装不上 | 以 `dsh --version` 报告的版本为准，回退 `next` tag，**绝不信任 `latest`** |

装完直接启动：

```bash
dsh --profile webmobile
```

### 方式一：手动 —— 专用 profile（`dsh --profile webmobile`）

本包同时是 **profile bundle**，最省事的使用方式是建一个包含它的 profile。

```bash
# 1. 创建 webmobile profile（在 $DSH_HOME/profiles/webmobile/）
#    package.json:
#    {
#      "name": "dsh-profile-webmobile",
#      "private": true,
#      "dependencies": {
#        "@deepseek-ai/dsh-base": "0.2.1-rc.2",
#        "@deepseek-ai/dsh-web-app": "0.2.1-rc.2",
#        "dsh-client-ui-mobile-adapt": "https://github.com/Hotsteel2901/dsh-client-ui-mobile-adapt/archive/refs/heads/main.tar.gz"
#      },
#      "dsh": { "profile": { "bundles": [
#        "@deepseek-ai/dsh-base",
#        "@deepseek-ai/dsh-web-app",
#        "dsh-client-ui-mobile-adapt"
#      ] } }
#    }

# 2. 安装依赖
cd ~/.dsh/profiles/webmobile
npm install

# 3. 启动（= web 全部功能 + 手机适配）
dsh --profile webmobile
```

> 走 npm 路线时 peer 会被自动安装，所以不容易遇到上面那个
> `dsh-session-title-llm` 缺失问题；但走 `dsh plugin`（pnpm）路线时**必须**先把
> `pnpm-workspace.yaml` 里的 `autoInstallPeers` 改成 `true`。

### 方式二：装进已有 profile

```bash
# 任意 profile 目录下
dsh plugin --profile web <profile 名> add https://github.com/Hotsteel2901/dsh-client-ui-mobile-adapt/archive/refs/heads/main.tar.gz
```

或手动在 profile 的 `cordis.patch.yml` 里插入一行：

```yaml
- insert:
    - id: ui-mobile-adapt
      name: 'dsh-client-ui-mobile-adapt'
```

重启即生效。

> ⚠️ **走 `dsh plugin`（pnpm）路线前，先确认
> `profiles/<name>/pnpm-workspace.yaml` 里是 `autoInstallPeers: true`**，
> 否则 `dsh-session-title-llm` 等 peer 依赖会被静默漏装，启动报
> `Cannot find package '@deepseek-ai/dsh-session-title-llm'`。

> ⚠️ **npm 12 安全策略**：npm 默认禁止 `git://`、`github:用户名/仓库` 和远程 tarball 依赖
> （`EALLOWGIT` / `EALLOWREMOTE`）。**普通 `https://.../archive/refs/heads/main.tar.gz` URL 可以正常安装**，
> 所以请使用 tarball URL 形式，不要用 `github:` 简写。
>
> 更新到最新版本（改代码重新 push 后）：
> ```bash
> npm cache clean --force && rm -rf node_modules/dsh-client-ui-mobile-adapt && npm install
> ```

> **版本约束**：本插件已从 DSH `0.1.0-rc.6` 经 `0.1.5-rc.2`、`0.1.7-rc.2` 同步到 **`0.2.1-rc.2`**（当前 `next` tag）。
> `peerDependencies` 声明为范围 `>=0.1.5-rc.2 <0.3.0`，因此 `0.1.5-rc.2` / `0.1.7-rc.2` / `0.2.0-rc.2` / `0.2.1-rc.2` 都能用；
> `dsh.compatibility` 另行给出逐版本声明（见下节）。
>
> 选择器策略为**分级锚定**，越靠前越抗漂移：
> 1. **官方语义锚**（首选）——`[data-sidebar-collapsed]`、`[data-rightbar-col]`、
>    `[data-rightbar-collapsed]`、`[data-chat-flow]`、`[data-composer-seat]` 等。
>    这些是 dsh 自己声明的扩展点，不会随构建哈希变化。
> 2. **本插件自有类名**——`.dsh-mobile-hamburger`、`.dsh-stats-panel` 等，完全自控。
> 3. **上游哈希类名**（兜底）——仅在无语义锚时使用。已对 `0.1.5-rc.2`、`0.1.7-rc.2`、`0.2.0-rc.2`、`0.2.1-rc.2` 全量核对，
>    改名的一律**双代同时匹配**（见 `lib/client.js` 的 `DRIFT REGISTER`）。
>
> 历史代际的哈希类名**一并保留**（如 `Sh0Q9G_*`、`iWlSmW_*`、`lats3W_*`、`uV2eYG_*` 仍在选择器列表里），
> 所以插件在任一受支持版本上都不会退化。
>
> 若 DSH 再次升级，优先检查 `DRIFT REGISTER`（见 `lib/client.js` 文件头注释）中登记的漂移，
> 再跑 `tools/regress.py` 与 `tools/sync_check.py` 复验选择器是否仍然命中。

> **测试工具注意（0.2.0-rc.2 起，0.2.1 相同）**：`0.2.0-rc.2` 起的客户端会保持一条长连接，
> 导致 Playwright 的 `wait_until="networkidle"` **永不触发**（表现为 `Page.goto` 45s 超时）。
> `tools/` 下的脚本已统一改为 `wait_until="domcontentloaded"` + 固定等待。
> 自己写脚本时请照此办理；对 `0.1.x` 两代两种等待都可以，但统一用 `domcontentloaded` 最稳。

## DSH 兼容性声明

`package.json` 的 `dsh.compatibility` 按 DSH STORE 契约逐版本声明，`engines.node` 声明 Node 范围：

```json
"compatibility": {
  "dsh": ">=0.1.5-rc.2 <0.3.0",
  "dshReleases": {
    "0.1.5-rc.2": "compatible",
    "0.1.5-rc.3": "compatible",
    "0.1.6-alpha.1": "compatible",
    "0.1.6-alpha.2": "compatible",
    "0.1.7-rc.1": "compatible",
    "0.1.7-rc.2": "compatible",
    "0.2.0-rc.1": "unknown",
    "0.2.0-rc.2": "compatible",
    "0.2.1-alpha.1": "unknown",
    "0.2.1-alpha.2": "unknown",
    "0.2.1-alpha.3": "unknown",
    "0.2.1-alpha.4": "unknown",
    "0.2.1-alpha.5": "unknown",
    "0.2.1-rc.1": "unknown",
    "0.2.1-rc.2": "compatible",
    "0.1.3-alpha.1": "incompatible",
    "0.1.3-alpha.2": "incompatible",
    "0.1.5-alpha.1": "incompatible",
    "0.1.5-alpha.2": "incompatible",
    "0.1.5-rc.1": "incompatible",
    "0.1.7-alpha.1": "unknown",
    "0.1.7-alpha.2": "unknown"
  }
}
```

判定依据是**对上游发行包 dist 的静态核对**（语义锚 + 插件引用到的全部哈希类名 + 槽位/投影 API）；
`0.2.1-rc.2` 另做过真实 Profile 的运行验收（插件包正常投递、汉堡/抽屉/统计/设置/轨迹/右栏在手机端接管、
桌面端零改动、零 hOverflow、插件自身零页面错误）。

- `compatible`：该版本 dist 中本插件引用的锚点/类名/API 全部命中。
- `incompatible`：早于本插件声明的支持下限（`0.1.5-rc.2`）。
- `unknown`：`0.1.7-alpha.1` / `0.1.7-alpha.2` 的 `agent-preset` 改版删除了
  `rtSEdW_iconButton`（删除按钮 44px 触摸目标规则失配），未做完整核对；
  `0.2.0-rc.1`、`0.2.1-rc.1` 为过渡版本，未单独核对。


## 依赖

- `react`、`@deepseek-ai/cordis`
- 运行时客户端服务（由 host 侧其他 client 包提供）：`slots`、`layout`、`locale`
- peer 依赖中的 `@deepseek-ai/dsh-client-*` 包

## 测试

```bash
# 纯逻辑单测（格式化函数的进位/边界），无需浏览器
npm test                          # = node tools/unit.test.mjs

# 选择器同步校验（0.2.1-rc.2）：确认每个哈希类名仍命中，且仍只在手机端生效
python3 tools/sync_check.py "http://127.0.0.1:18081/?token=<token>"

# 端到端回归（需一个运行中的 dsh web 实例）
python3 tools/regress.py "http://127.0.0.1:18081/?token=<token>"
```

> `tools/*.py` 会自动从 `~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome`
> 选择 Chromium；装在别处时用 `CHROME=/path/to/chrome python3 ...` 覆盖。

`sync_check.py` 覆盖那些**只在活会话里才挂载**的组件（composer 模式触发器、模型/智能体选择器）。
它不依赖可用的 LLM 凭据——而是插入带真实上游类名的探针元素，然后测量插件注入的样式表：
断言在 **390px（手机）** 上样式生效、在 **1440px（桌面）** 上原样未动。
两侧同时成立才说明「选择器仍命中上游 **且** 仍被正确限定在移动端断点内」。

`regress.py` 断言两组：
- **A. 触摸目标**：设置面板四个 tab 内所有可交互控件 ≥ 44×44
- **B. 布局**：6 视口（iPhone SE/14、Pixel 7、iPad Mini、Laptop、Desktop）无横向溢出、
  无越界元素；手机端单栏 + 汉堡显示 + 抽屉 fixed，桌面端保持原生三栏 + 汉堡隐藏

并回归 issue #2：字号 stepper 两箭头不重叠，且点击真实生效（14 → 15 → 14）。

## 开发 / 发布

```bash
npm pack              # 本地打包验证
npm publish           # 发布到 npm（需 npm 账号与 2FA；本包也可以只留在 GitHub）
```

包结构：

```
lib/index.js              # host 空入口
lib/client.js             # 浏览器客户端插件（window.__ModuleLoader__.load 官方格式）
cordis.patch.yml          # bundle patch（insert ui-mobile-adapt 行）
tools/unit.test.mjs       # 格式化函数单测
tools/regress.py          # 端到端回归（触摸目标 + 6 视口布局）
tools/probe.py            # 单次探测：CSS 注入 / 网格列 / 溢出
tools/test_mobile.py      # 多视口布局指标采集
tools/test_interactions.py# 交互路径探测（抽屉/设置/统计）
```

## 涉及的产品内部类名（已核对 DSH `0.1.5-rc.2`、`0.1.7-rc.2`、`0.2.0-rc.2`、`0.2.1-rc.2`）

按所属包归类（扫描各代发行包 dist 得到；跨代变化标注在括号内）：

| 包 | 哈希前缀 |
| --- | --- |
| `dsh-client-ui-layout` | `pI_x6G_`（0.2.1 新增 `bottomRow` / `overlayLayer`） |
| `dsh-client-ui-conversation` | `wSkVaW_` `uV2eYG_` `JObwrW_` `pXSMma_` `T1PP_q_`（`Sh0Q9G_` 于 0.1.7 起并入 `uV2eYG_select`；0.2.1 新增 `headerLeading` / `titleCluster`） |
| `dsh-client-ui-settings-general` | `VOzbGW_` `UQsH_q_`（0.2.1 新增 `VOzbGW_mask`；`me01iq_` 已删除，本插件未依赖） |
| `dsh-client-ui-settings-models` | `zGbnIq_` |
| `dsh-client-ui-settings-plugins` | `pbvGtq_` |
| `dsh-client-ui-agent-preset` | `rtSEdW_` |
| `dsh-client-ui-theme` | `bVCLcG_`（0.2.1 新增 `bVCLcG_expander`） |
| `dsh-client-ui-permission-presets` | `oY77xG_`（`iWlSmW_*` 于 0.2.0 起由 conversation 迁入） |
| `dsh-client-locale` | `hVGvvW_` |
| `dsh-client-ui-chat` | `_2XZxNq_` `bOPqQW_`（`lats3W_selector` 于 0.1.7 起更名 `_2XZxNq_selector`；0.2.1 把 `bOPqQW_root` 拆成 `bOPqQW_anchor`） |
| `dsh-client-ui-cordis` | `Nqubda_` |
| `dsh-client-ui-trajectory` | `Y0dWHa_` `qBU-ya_` `fV0t5q_` |
| `dsh-client-ui-sidebar` | `hHd-Xa_` |
| `dsh-client-ui-sidebar-right` | `P3OORG_`（右栏全屏浮层） |
| `dsh-client-ui-model-selection` | `_7KE1Ra_` |
| `dsh-client-ui-commands` | `mufS8W_` |

### 已知漂移

rc.6 → 0.1.5-rc.2：

- `pI_x6G_detailsCol` → 更名 `pI_x6G_rightbarCol`（两代同时匹配，并已换成 `[data-rightbar-col]` 语义锚）
- `Md3f7G_*`（ChatView.module.css）整包删除；其 `min-width:0` 职责改由 `[data-chat-flow] > *` 承担
- `wSkVaW_headerActions` 拆分出 `wSkVaW_headerCorner` / `wSkVaW_widthHandle`（`widthHandle` 窄屏隐藏；0.2.1 起 `headerCorner` 保留给右侧栏入口）

0.1.5-rc.2 → 0.1.7-rc.2：

- conversation `Sh0Q9G_trigger` / `Sh0Q9G_triggerLabel` 删除，职责并入 `uV2eYG_select`（两代同时匹配）
- chat `lats3W_selector` → 更名 `_2XZxNq_selector`（两代同时匹配）
- chat `bOPqQW_root`（上游统计行）两代稳定，手机端隐藏以让位给本插件胶囊

0.1.7-rc.2 → 0.2.0-rc.2：

- conversation `Sh0Q9G_trigger` / `Sh0Q9G_triggerLabel`（composer 模式触发器）→ `iWlSmW_*`。
  **组件还换了包**：从 `dsh-client-ui-conversation` 搬到了 `dsh-client-ui-permission-presets`。
  旧代际仍保留在选择器里，故 `0.1.5-rc.2` / `0.1.7-rc.2` 不退化。
- 其余各代已核对的前缀在 `0.2.0-rc.2` dist 中**全部复核仍然存在**，原样匹配。

0.2.0-rc.2 → 0.2.1-rc.2：

- chat StatsPills 拆分：`.bOPqQW_root` 删除，改为两个 `.bOPqQW_anchor`（activity / usage）。
  两代同时匹配，并改为仅在 `.dsh-stats` 存在时隐藏。
- layout 新增 `pI_x6G_bottomRow`（`shell.bottom` 第二行）和 `pI_x6G_overlayLayer`；
  frame 只覆盖列轨道，两者保持上游行为。
- conversation 新增 `headerLeading` / `titleCluster` / `composerHero` / `heroOptions`；
  `headerCorner` 在手机端保留（右侧栏入口），只隐藏 `widthHandle`。
- theme 新增 `.bVCLcG_expander`，且箭头列默认 `opacity:0`；触屏规则强制可见。
- settings-general 新增 `.VOzbGW_mask`；全屏手机模式直接隐藏遮罩。
- **运行时**：`conversation.composer.dock` 提供 `useChat`，session snapshot 不再有 `.chat` 包装。
  统计组件改为 `useChat` 优先 + 旧路径兜底。


## License

MIT

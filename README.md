# dsh-client-ui-mobile-adapt

> **Your DeepSeek Harness web UI, rebuilt for the phone in your hand.**
>
> Built for developers who code in **Termux on Android**: the three-column
> desktop shell collapses into a clean single-column mobile layout — sidebar
> becomes a swipe drawer, composer tools stay on one line, settings and
> trajectory details open as full-screen panels that actually scroll, and a
> tap on the stats pill reveals the whole session report. Desktop stays
> exactly as it is; your phone finally works.

> **为在手机上用 Termux 敲代码的你，把 DeepSeek Harness 的 Web 界面真正搬上手机屏。**
>
> 专为 Android 上的 Termux 开发者打造：三栏桌面布局收敛为清爽的单栏移动布局——
> 侧边栏变成滑出抽屉、输入工具保持一行、设置与轨迹详情以可滚动的全屏面板呈现、
> 点一下统计胶囊就能看到完整会话报告。桌面端分毫不动，手机端终于能用了。

DeepSeek Harness Web GUI 的手机端适配**客户端插件**。

纯客户端插件：仅在 `max-width: 767px` 视口下生效，其余宽度完全不受影响。
（767 而非 768：上游 `dsh-client-ui-layout` 的 `SIDEBAR_AUTO_COLLAPSE = 1024`，
768–1023px 归上游的 56px 图标窄栏管，768px 起保留侧栏导航更合理。）
采用官方客户端插件格式（`dsh.client` 声明 + `window.__ModuleLoader__.load` 模块），
同时可作为 profile bundle（`dsh.bundle.patch`）一键挂载。

## 功能

| 区域 | 效果 |
| --- | --- |
| 整体布局 | 三栏 Grid 覆盖为 `0 minmax(0,1fr) 0`，中栏占满全宽 |
| 侧边栏 | 左侧抽屉（`left` 位移动画），内容组件填满抽屉宽度 |
| 汉堡按钮 | `shell.overlay` 槽位浮动按钮（左上角，安全区适配，44×44 触摸目标），点遮罩关闭 |
| 会话头部 | 给汉堡留位、标题/操作可换行、「对话/轨迹」标签以屏幕中线为对称轴居中 |
| 输入工具行 | 强制单行（权限选择/计划/附加/模型选择/上下文/发送），触发器限宽 112px |
| 弹层 | 模型选择、上下文详情、命令菜单限宽 `calc(100vw - 16px)` 不出屏 |
| 设置面板 | 全屏显示，顶部导航单行可横滑，内容区可滚动，自带 × 关闭 |
| 插件面板 | fixed 悬浮、底部 130px（不遮触发按钮），可开可关 |
| 轨迹页面 | 表格全宽；详情面板改固定高度悬浮窗（`min(52vh,460px)`），内部可滚动 |
| 底部统计 | 胶囊摘要（轮/步/缓存/Token），点击展开完整统计面板（可滚动，× 关闭） |
| 触摸目标 | 全部可交互控件 ≥ 44×44（WCAG 2.5.5 / Material 48dp），含字号 stepper、表单、图标按钮 |
| iOS | `100dvh` 动态视口、刘海/底部安全区适配 |

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
| `bVCLcG_arrow`（字号加减） | 17×12，互相重叠 | 44×44，并排 |
| `VOzbGW_close`（关闭设置） | 28×28 | 44×44 |
| `zGbnIq_iconButton`（删模型等） | 28×28 | 44×44 |
| `rtSEdW_iconButton`（preset 操作） | 28×28 | 44×44 |
| `zGbnIq_addModelButton` | 97×28 | 44px 高 |
| `VOzbGW_navCell`（设置导航） | 40px 高 | 44px 高 |
| 各类下拉/输入 | 32–36px | 44px |
| `dsh-mobile-hamburger` | 40×40 | 44×44 |
| `dsh-stats-pill` / `dsh-stats-close` | 28px | 44px |

## 修复的 JS 逻辑缺陷

除 CSS 之外，一并修掉了 `lib/client.js` 中的若干运行时缺陷：

| 缺陷 | 症状 | 修复 |
| --- | --- | --- |
| `fmtN` 进位溢出 | `999999` 读作 `"1000K"`（应为 `"1M"`） | 按「渲染后数值」校正单位，超 1000 则升档 |
| `fmtD` 进位溢出 | `59999ms` 读作 `"60s"`（应为 `"1m"`） | 舍入到 0.1s 后仍 <60 才用秒级 |
| `settledNodes` 无类型保护 | 会话未初始化时 `for...of` 抛 `TypeError`，整个 dock 白屏 | `Array.isArray` 归一化后再遍历 |
| 累计值被 `NaN` 污染 | `callTime` 为 `undefined` 时 `toolMs` 变 `NaN`，对应行静默消失 | 累加前统一校验两端均为有限数 |
| `usage` 只判 `undefined` | `usage` 为 `null` 时读属性抛错 | 归一化为 `null` 再判，数值走 `num()` |
| 统计面板滚动锁失效 | `touchmove` 没有 `deltaY`，方向恒判为 false，手机上面板边界穿透 | 改用前后触点 Y 差值判断方向 |

## 安装

### 方式一：推荐 —— 专用 profile（`dsh --profile webmobile`）

本包同时是 **profile bundle**，最省事的使用方式是建一个包含它的 profile。

```bash
# 1. 创建 webmobile profile（在 $DSH_HOME/profiles/webmobile/）
#    package.json:
#    {
#      "name": "dsh-profile-webmobile",
#      "private": true,
#      "dependencies": {
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

> ⚠️ **npm 12 安全策略**：npm 默认禁止 `git://`、`github:用户名/仓库` 和远程 tarball 依赖
> （`EALLOWGIT` / `EALLOWREMOTE`）。**普通 `https://.../archive/refs/heads/main.tar.gz` URL 可以正常安装**，
> 所以请使用 tarball URL 形式，不要用 `github:` 简写。
>
> 更新到最新版本（改代码重新 push 后）：
> ```bash
> npm cache clean --force && rm -rf node_modules/dsh-client-ui-mobile-adapt && npm install
> ```

> **版本约束**：本插件已从 DSH `0.1.0-rc.6` 同步到 **`0.1.5-rc.2`**（Android 16 / LineageOS 23.2 时代）。
> `peerDependencies` 声明为范围 `>=0.1.5-rc.2 <0.2.0`，允许补丁级升级。
>
> 选择器策略为**分级锚定**，越靠前越抗漂移：
> 1. **官方语义锚**（首选）——`[data-sidebar-collapsed]`、`[data-rightbar-col]`、
>    `[data-rightbar-collapsed]`、`[data-chat-flow]`、`[data-composer-seat]` 等。
>    这些是 dsh 自己声明的扩展点，不会随构建哈希变化。
> 2. **本插件自有类名**——`.dsh-mobile-hamburger`、`.dsh-stats-panel` 等，完全自控。
> 3. **上游哈希类名**（兜底）——仅在无语义锚时使用。已对 `0.1.5-rc.2` 全量核对。
>
> 若 DSH 再次升级，优先检查 `DRIFT REGISTER`（见 `lib/client.js` 文件头注释）中登记的两处历史漂移，
> 再跑 `tools/regress.py` 复验。

## 依赖

- `react`、`@deepseek-ai/cordis`
- 运行时客户端服务（由 host 侧其他 client 包提供）：`slots`、`layout`、`locale`
- peer 依赖中的 `@deepseek-ai/dsh-client-*` 包

## 测试

```bash
# 纯逻辑单测（格式化函数的进位/边界），无需浏览器
npm test                          # = node tools/unit.test.mjs

# 端到端回归（需一个运行中的 dsh web 实例）
python3 tools/regress.py "http://127.0.0.1:18081/?token=<token>"
```

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

## 涉及的产品内部类名（已核对 DSH `0.1.5-rc.2`）

按所属包归类（扫描已安装的 `node_modules` 得到）：

| 包 | 哈希前缀 |
| --- | --- |
| `dsh-client-ui-layout` | `pI_x6G_` |
| `dsh-client-ui-conversation` | `wSkVaW_` `uV2eYG_` `Sh0Q9G_` `JObwrW_` `pXSMma_` `T1PP_q_` |
| `dsh-client-ui-settings-general` | `VOzbGW_` `UQsH_q_` `me01iq_` |
| `dsh-client-ui-settings-models` | `zGbnIq_` |
| `dsh-client-ui-settings-plugins` | `pbvGtq_` |
| `dsh-client-ui-agent-preset` | `rtSEdW_` |
| `dsh-client-ui-theme` | `bVCLcG_` |
| `dsh-client-ui-permission-presets` | `oY77xG_` |
| `dsh-client-locale` | `hVGvvW_` |
| `dsh-client-ui-chat` | `lats3W_` |
| `dsh-client-ui-cordis` | `Nqubda_` |
| `dsh-client-ui-trajectory` | `Y0dWHa_` `qBU-ya_` `fV0t5q_` |
| `dsh-client-ui-sidebar` | `hHd-Xa_` |
| `dsh-client-ui-model-selection` | `_7KE1Ra_` |
| `dsh-client-ui-commands` | `mufS8W_` |

### 已知漂移（rc.6 → 0.1.5-rc.2）

- `pI_x6G_detailsCol` → 更名 `pI_x6G_rightbarCol`（两代同时匹配，并已换成 `[data-rightbar-col]` 语义锚）
- `Md3f7G_*`（ChatView.module.css）整包删除；其 `min-width:0` 职责改由 `[data-chat-flow] > *` 承担
- `wSkVaW_headerActions` 拆分出 `wSkVaW_headerCorner` / `wSkVaW_widthHandle`（窄屏隐藏，避免与汉堡争位）

## License

MIT

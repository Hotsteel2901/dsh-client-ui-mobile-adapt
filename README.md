# dsh-client-ui-mobile-adapt

DeepSeek Harness Web GUI 的手机端适配**客户端插件**（npm 包，官方格式）。

纯客户端插件：仅在 `max-width: 768px` 视口下生效，桌面端完全不受影响。

## 功能

| 区域 | 效果 |
| --- | --- |
| 整体布局 | 三栏 Grid 覆盖为 `0 minmax(0,1fr) 0`，中栏占满全宽 |
| 侧边栏 | 左侧抽屉（`left` 位移动画），内容组件填满抽屉宽度 |
| 汉堡按钮 | `shell.overlay` 槽位浮动按钮（左上角，安全区适配），点遮罩关闭 |
| 会话头部 | 给汉堡留位、标题/操作可换行、「对话/轨迹」标签以屏幕中线为对称轴居中 |
| 输入工具行 | 强制单行（权限选择/计划/附加/模型选择/上下文/发送），触发器限宽 112px |
| 弹层 | 模型选择、上下文详情、命令菜单限宽 `calc(100vw - 16px)` 不出屏 |
| 设置面板 | 全屏显示，顶部导航单行可横滑，内容区可滚动，自带 × 关闭 |
| 插件面板 | fixed 悬浮、底部 130px（不遮触发按钮），可开可关 |
| 轨迹页面 | 表格全宽；详情面板改固定高度悬浮窗（`min(52vh,460px)`），内部可滚动 |
| 底部统计 | 胶囊摘要（轮/步/缓存/Token），点击展开完整统计面板（可滚动，× 关闭） |
| iOS | `100dvh` 动态视口、刘海/底部安全区适配 |

## 安装（发布到 npm 之后）

```bash
# 在你的 dsh profile 目录里
npm install dsh-client-ui-mobile-adapt
```

然后在 profile 的 `cordis.patch.yml`（或 bundle patch）里插入一行：

```yaml
- insert:
    - id: ui-mobile-adapt
      name: 'dsh-client-ui-mobile-adapt'
```

重启 `dsh web` 即生效。

> 版本约束：CSS 类名对应 DSH `0.1.0-rc.6` 的前端构建产物（CSS Modules 哈希类名）。若 DSH 升级、前端构建变化，需要按新构建产物重新核对类名。

## 依赖

- `react`、`@deepseek-ai/cordis`
- 运行时客户端服务（由 host 侧其他 client 包提供）：`slots`、`layout`、`locale`
- peer 依赖中的 `@deepseek-ai/dsh-client-*` 包

## 开发 / 发布

```bash
npm pack              # 本地打包验证
npm publish           # 发布（需配置 npm 账号与仓库）
```

包结构：

```
lib/index.js      # host 空入口
lib/client.js     # 浏览器客户端插件（window.__ModuleLoader__.load 官方格式）
```

## 涉及的产品内部类名（对应 0.1.0-rc.6 前端构建）

- 布局：`.pI_x6G_*`（`dsh-client-ui-layout`）
- 会话/输入：`.wSkVaW_*`、`.uV2eYG_*`、`.Md3f7G_*`（`dsh-client-ui-conversation`）
- 设置：`.VOzbGW_*`（`dsh-client-ui-settings-general`）
- 插件面板：`.Nqubda_*`（`dsh-client-ui-cordis`）
- 轨迹：`.qBU-ya_*`、`.Y0dWHa_*`、`.fV0t5q_*`（`dsh-client-ui-trajectory`）

## License

MIT

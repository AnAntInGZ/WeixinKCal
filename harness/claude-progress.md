# 进度日志

## 当前已验证状态

- 仓库根目录：`/Users/bytedance/bytedance/WeixinKCal`
- 标准启动路径：`./harness/init.sh`；需要预览界面时，用微信开发者工具打开仓库根目录。`npm run dev` 会打印这条启动提示。
- 标准验证路径：`./harness/init.sh`
- 当前最高优先级未完成功能：`wx-002` 记录每日每餐饮食
- 当前 blocker：无。已知未验证项：活力橙 UI 已按 HTML 转为小程序页面并通过 smoke test；微信开发者工具已确认首页和上传页不白屏，但尚未做真机或像素级截图比对。

## 会话记录

### Session 001

- 日期：2026-06-12
- 本轮目标：新增 `harness/CONTEXT.md`，借用 grill-with-docs 的 context 概念对齐沟通术语；同时保证标准启动路径可重新运行。
- 已完成：
  - 新增 `harness/CONTEXT.md` 中文术语表。
  - 将 `harness/init.sh` 从固定 npm 模板调整为：有 `package.json` 时走 npm 路径；无应用项目时执行 harness 自检。
  - 在 `harness/feature_list.json` 中记录 `harness-001` 的完成状态和证据。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`：当前分支尚无提交。
  - `./harness/init.sh`：初次失败，原因是无 `package.json` 时 `npm install` 试图写 `/Users/bytedance/package-lock.json`。
  - `bash -n harness/init.sh`
  - `./harness/init.sh`：通过；无 `package.json` 时执行 harness 自检。
- 已记录证据：`harness/feature_list.json` 中 `harness-001`；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Add harness context and self-check baseline`。
- 更新过的文件或工件：`harness/init.sh`、`harness/CONTEXT.md`、`harness/feature_list.json`、`harness/claude-progress.md`
- 已知风险或未解决问题：仓库目前只有 harness 文档，还没有实际应用代码；`chat-001` 仍未开始。
- 下一步最佳动作：运行 `./harness/init.sh` 作为基线，然后开始 `chat-001`。

### Session 002

- 日期：2026-06-12
- 本轮目标：将全新项目方向落成微信小程序初始版本，并按 harness 原则推进最高优先级功能 `wx-001`。
- 已完成：
  - 阅读微信小程序官方开发文档中与开发指南、代码构成、宿主环境、全局配置、Page/setData、本地 storage 相关的页面。
  - 将 `harness/feature_list.json` 从模板 chat 功能改为饮食热量管理小程序路线。
  - 新增原生微信小程序骨架：`app.json`、`app.js`、`app.wxss`、`project.config.json`、`sitemap.json`。
  - 实现首次打开本地账户创建、身体信息建档、BMI/BMR/每日建议热量计算、建档后首页展示。
  - 新增 `tests/smoke.js`，覆盖页面结构、JSON/JS 语法、本地账户创建、档案持久化和热量计算。
  - 更新 `harness/CONTEXT.md` 产品术语和 `harness/quality-document.md` 质量快照。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `git status --short`
  - `./harness/init.sh`：开工基线通过。
  - `curl -L https://developers.weixin.qq.com/miniprogram/dev/framework/`：初次受网络沙箱影响失败，授权后成功读取官方文档。
  - `npm test`：通过，输出 `smoke ok: mini program shape, account registration, profile plan`。
  - `./harness/init.sh`：通过，内部执行 `npm install` 和 `npm test`。
  - `npm run dev`：通过，提示用微信开发者工具打开项目。
- 已记录证据：`harness/feature_list.json` 中 `wx-001` evidence；本日志当前条目；`harness/quality-document.md`。
- 提交记录：本轮收尾提交使用 `Build WeChat calorie onboarding baseline`。
- 更新过的文件或工件：`app.*`、`pages/onboarding/*`、`pages/dashboard/*`、`utils/*`、`tests/smoke.js`、`package.json`、`package-lock.json`、`project.config.json`、`sitemap.json`、`harness/feature_list.json`、`harness/CONTEXT.md`、`harness/quality-document.md`、`harness/claude-progress.md`
- 已知风险或未解决问题：
  - 未用微信开发者工具或真机做界面人工预览。
  - 当前账户是本地 storage 账户，不是微信登录或云端账户。
  - 每日建议热量是初版估算：Mifflin-St Jeor BMR、活动系数、目标系数；后续可按用户偏好调整。
- 下一步最佳动作：开始 `wx-002`，实现按日期/餐次记录饮食，并把记录持久化到本地 storage。

### Session 003

- 日期：2026-06-12
- 本轮目标：严格按照 `/Users/bytedance/Downloads/style4-vibrant-orange.html` 复刻第一版 UI，不加入额外设计。
- 已完成：
  - 读取用户提供的 HTML 模板，确认其包含注册、首页、上传三张手机稿。
  - 将 `app.wxss` 改为模板的活力橙视觉系统，包括颜色、渐变、圆角、阴影、字号和组件类名。
  - 将 `pages/onboarding/index` 改为注册手机稿：卡卡橙子 mascot、性别 pill、身高体重卡片、目标 pill、开启计划按钮。
  - 将 `pages/dashboard/index` 改为首页手机稿：早安区、剩余热量 hero、营养 chips、今日餐食、底部 tabbar。
  - 新增 `pages/upload/index` 对应上传手机稿：拍照区、三条食物项、数量按钮、餐食总热量、保存按钮。
  - 更新 `tests/smoke.js`，覆盖三页存在、模板关键文案和样式令牌。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `git status --short`
  - `./harness/init.sh`：开工基线通过。
  - `npm test`：通过，输出 `smoke ok: vibrant orange UI, account registration, profile plan`。
  - `./harness/init.sh`：通过，内部执行 `npm install` 和 `npm test`。
- 已记录证据：`harness/feature_list.json` 中 `ui-001` evidence；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Replicate vibrant orange UI template`。
- 更新过的文件或工件：`app.json`、`app.wxss`、`pages/onboarding/*`、`pages/dashboard/*`、`pages/upload/*`、`tests/smoke.js`、`harness/feature_list.json`、`harness/claude-progress.md`
- 已知风险或未解决问题：
  - 内置浏览器当前不可用，未完成自动截图对比。
  - 未用微信开发者工具或真机做人工视觉比对。
  - `project.config.json` 与 `project.private.config.json` 在本轮开始前已有微信开发者工具生成/修改痕迹，本轮保留不动。
- 下一步最佳动作：用微信开发者工具打开项目做三页视觉核对；确认无误后继续 `wx-002`，实现真实每日餐食记录数据流。

### Session 004

- 日期：2026-06-12
- 本轮目标：定位并修复微信开发者工具预览白屏问题。
- 已完成：
  - 用微信开发者工具复现首页仅显示背景、内容不渲染的问题。
  - 通过最小 WXML 替换和分段恢复，确认页面路径与项目配置正常，问题集中在 `pages/dashboard/index.wxml`。
  - 定位根因：dashboard 头像节点把 `linear-gradient(...)` 写在 WXML 内联 style 中，微信开发者工具渲染异常。
  - 将头像样式迁移到 `app.wxss` 的 `.avatar-bubble`，WXML 只保留 class，保持视觉不变。
  - 更新 smoke test，防止 dashboard WXML 再次引入内联 `linear-gradient`。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `git status --short`
  - `npm test`：通过，输出 `smoke ok: vibrant orange UI, account registration, profile plan`。
  - 微信开发者工具：编译后 `pages/dashboard/index` 首页完整渲染，不再白屏。
  - 微信开发者工具：点击底部加号后进入 `pages/upload/index`，上传页内容出现在 Webview 树中。
  - `./harness/init.sh`：通过，内部执行 `npm install` 和 `npm test`。
- 已记录证据：`harness/feature_list.json` 中 `ui-001` evidence；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Fix WeChat preview blank screen`。
- 更新过的文件或工件：`app.wxss`、`pages/dashboard/index.wxml`、`tests/smoke.js`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/quality-document.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 尚未做真机预览或像素级截图比对。
  - `project.config.json` 与 `project.private.config.json` 仍有微信开发者工具生成/修改痕迹，本轮不纳入提交。
- 下一步最佳动作：继续 `wx-002`，实现真实每日餐食记录数据流。

# 进度日志

## 当前已验证状态

- 仓库根目录：`/Users/bytedance/bytedance/WeixinKCal`
- 标准启动路径：`./harness/init.sh`；需要预览界面时，用微信开发者工具打开仓库根目录。`npm run dev` 会打印这条启动提示。
- 标准验证路径：`./harness/init.sh`
- 当前最高优先级未完成功能：`wx-002` 记录每日每餐饮食
- 当前 blocker：无。已知未验证项：尚未用微信开发者工具或真机人工预览。

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

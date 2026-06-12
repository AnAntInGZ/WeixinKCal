# 进度日志

## 当前已验证状态

- 仓库根目录：`/Users/bytedance/bytedance/WeixinKCal`
- 标准启动路径：`./harness/init.sh`；需要预览界面时，用微信开发者工具打开仓库根目录。`npm run dev` 会打印这条启动提示。
- 标准验证路径：`./harness/init.sh`
- 当前最高优先级未完成功能：`wx-005` 升级账户为跨设备可恢复账户；清缓存测试暴露本地 id 不能作为恢复身份，代码已补 `wx.login -> jscode2session -> openid -> sessionToken` 身份链路，并支持把旧 `local:*` 云端数据迁到 `openid:*`，仍需部署后端并配置小程序 AppSecret 后复测。
- 当前 blocker：`wx-005` 尚未完成“清缓存后从云端恢复档案和餐食”的端到端验证；云端需要部署包含 `loginCode` 的后端版本，并配置 `WECHAT_APP_SECRET` 或 `WECHAT_SECRET`；`wx-006` 云端上传发布需要用户确认版本号、上传描述和最终上传动作。
- 移动端 UI 当前状态：微信开发者工具 iPhone 12/13 85% 下，首页和记录页不需要整页拖动；记录页主操作都在首屏；食物数字输入不截断；保存后可回到首页。
- 云端数据当前状态：新增 `server/` Go 服务，按微信云托管模板监听 HTTP，使用 MySQL 环境变量建库建表；MySQL DSN 已使用 `mysql.NewConfig()` 保留 driver 默认认证兼容配置，允许 `mysql_native_password`；小程序端优先用 `wx.request` 调用 `https://golang-24re-269724-9-1309913757.sh.run.tcloudbase.com`，首次无 sessionToken 时会附带 `wx.login` 的 `loginCode`，服务端配置小程序密钥后用 `jscode2session` 换 openid、签发短期 `sessionToken`，并在同一 local id 首次绑定 openid 时迁移旧档案和餐食；`callContainer` 仅在无 `wx.request` 能力时兜底；公网 `/healthz` 正常、空餐食列表返回 `records:[]`；未把数据库密码或小程序密钥写入仓库。

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

### Session 005

- 日期：2026-06-12
- 本轮目标：完善前端输入框和后端餐食功能，让用户能在微信开发者工具里完成建档、添加餐食、保存、首页汇总的完整点击流，并为后续云端发布做准备。
- 已完成：
  - 新增 `utils/meal.js`，提供餐食新增、查询、更新、删除、按日期汇总、内置食物热量估算和默认草稿餐食。
  - 将建档页从固定值改为真实输入：性别、年龄、身高、体重、活动量、目标。
  - 将上传页从静态展示改为真实表单：日期、餐次、食物名、克重、每 100g 热量、备注、添加/删除食物、保存。
  - 将首页改为读取当天餐食记录，动态展示已摄入、目标、剩余、进度、三大营养素和餐食列表。
  - 在 `app.json` 加入 `lazyCodeLoading: requiredComponents`，作为上传前更友好的小程序配置。
  - 更新 smoke test，覆盖餐食记录后端的新增、查询、汇总、更新和删除。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `git status --short`
  - `./harness/init.sh`：开工基线通过。
  - `npm test`：通过，输出 `smoke ok: vibrant orange UI, account registration, meal logging`。
  - `./harness/init.sh`：通过，内部执行 `npm install` 和 `npm test`。
  - 微信开发者工具：建档页渲染出三个输入框、活动 picker、目标按钮和“开启计划”按钮。
  - 微信开发者工具点击流：建档 -> 首页 -> 底部加号 -> 上传页 -> 保存 -> 首页显示午餐 `鸡胸肉 · 糙米饭 · 西兰花`，已摄入 506 kcal，剩余 1494 kcal。
  - 微信开发者工具：重新编译后首页仍显示已保存餐食和汇总。
- 已记录证据：`harness/feature_list.json` 中 `wx-002`、`wx-003`、`wx-004` evidence；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Add end-to-end meal logging flow`。
- 更新过的文件或工件：`app.json`、`app.wxss`、`pages/onboarding/*`、`pages/dashboard/*`、`pages/upload/*`、`utils/meal.js`、`utils/options.js`、`tests/smoke.js`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/quality-document.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 真正跨设备云端账户/云数据库同步仍未实现，下一步对应 `wx-005`。
  - 最终“上传”到微信后台未执行；这是外部提交动作，需要用户确认版本号、上传描述和最终上传。
  - 微信开发者工具仍有 `project.config.json` 与 `project.private.config.json` 的本地配置痕迹，本轮不纳入提交。
  - 未做真机预览或像素级截图比对。
- 下一步最佳动作：确认云端方案，优先实现 `wx-005`：用微信云开发数据库或自建后台让账户、档案和餐食记录跨设备恢复；随后由用户确认后执行 `wx-006` 上传。

### Session 006

- 日期：2026-06-12
- 本轮目标：确认并优化手机端 UI，避免异常换行、输入截断、整页过长拖动，以及微信开发者工具里的页面叠层/白屏卡住。
- 已完成：
  - 将全局页面根容器固定为 `100vh`，避免小程序页面被内容撑成长页面。
  - 将记录页改为固定高度 flex 布局：顶部表单和拍照区压缩，餐食列表进入 `scroll-view.food-list` 内部滚动，底部总热量和保存按钮固定可见。
  - 将首页餐食区域改为 `scroll-view.meal-list`，餐食详情单行省略，避免长餐食名异常换行。
  - 调整记录页食物行宽度，确保三位数 `kcal/100g` 和克重输入完整显示。
  - 修复微信开发者工具中首页点击加号后 upload 页面只露出右侧一条的问题：`goUpload` 从 `wx.navigateTo` 改为 `wx.redirectTo`。
  - 修复保存后回首页偶发白屏/渲染滞后风险：保存成功后使用 `wx.reLaunch` 回到首页。
  - 更新 smoke test，加入固定视口、内部滚动、nowrap、输入宽度和跳转方式的防回归检查。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `./harness/init.sh`：开工基线通过。
  - `npm test`：多次通过，输出 `smoke ok: vibrant orange UI, account registration, meal logging`。
  - 微信开发者工具 iPhone 12/13 85%：首页显示正常，餐食列表不撑开页面，餐食详情单行展示。
  - 微信开发者工具点击流：首页 -> 底部加号 -> 记录页；记录页完整铺满屏幕，日期、餐次、拍照区、三条食物、添加食物、备注、总热量、保存按钮都在首屏。
  - 微信开发者工具：记录页 `165/112/34` kcal 输入显示完整，无异常换行；点击保存后回到首页。
  - `./harness/init.sh`：收尾验证通过，内部执行 `npm install` 和 `npm test`。
- 已记录证据：`harness/feature_list.json` 中 `ui-002` evidence；本日志当前条目；`harness/quality-document.md`。
- 提交记录：本轮收尾提交使用 `Stabilize mobile UI layout`。
- 更新过的文件或工件：`app.wxss`、`pages/dashboard/index.wxml`、`pages/dashboard/index.js`、`pages/upload/index.wxml`、`pages/upload/index.js`、`tests/smoke.js`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/quality-document.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 尚未做真机预览或像素级截图比对。
  - 当前模拟器里曾出现 DevTools 渲染滞后，需要编译后等待页面落稳；代码侧已改为更稳定的替换/重启跳转。
  - 微信开发者工具仍有 `project.config.json` 与 `project.private.config.json` 的本地配置痕迹，本轮不纳入提交。
- 下一步最佳动作：继续 `wx-005`，确认云端方案并把账户、档案和餐食记录升级为跨设备可恢复。

### Session 007

- 日期：2026-06-12
- 本轮目标：基于用户已创建的微信云托管 Golang 服务和绑定 MySQL，开发云端数据持久化后端，并让小程序端接入云托管调用。
- 已完成：
  - 参考微信云托管 Go 模板形态新增 `server/` 服务：`Dockerfile`、`go.mod`、配置加载、HTTP 路由、MySQL store、模型和单测。
  - 后端实现账户同步、身体档案保存/读取、餐食保存、按日期餐食列表和日汇总；启动时会按环境变量连接 MySQL 并创建 `weixinkcal` 数据库与三张业务表。
  - 小程序端新增 `utils/cloud.js`，集中封装 `wx.cloud.Cloud({ resourceEnv }).callContainer`，请求头使用 `X-WX-SERVICE=golang-24re-001`。
  - `app.js` 启动时同步云端账户；建档页支持从云端恢复 profile、保存 profile 到云端；首页支持从云端拉取当天餐食和汇总；上传页保存餐食后尝试同步云端。
  - 保留本地 storage 兜底：云端未部署、无网络或开发者工具不支持云托管时，建档和记录餐食仍能继续完成本地流程。
  - `harness/init.sh` 增加 Go 云托管服务验证：检测到 `server/go.mod` 后运行 `go test ./...`。
  - `tests/smoke.js` 增加云托管配置、前端调用入口和 Go 服务骨架防回归检查。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `./harness/init.sh`：开工基线通过。
  - `npm test`：通过，输出 `smoke ok: vibrant orange UI, account registration, meal logging, cloud backend wiring`。
  - `env GOPROXY=https://goproxy.cn,direct go mod tidy`：生成 Go 依赖校验文件。
  - `go test ./...`（在 `server/` 下）：通过，输出 `ok weixinkcal-cloudrun`。
  - `./harness/init.sh`：收尾验证通过，内部执行 `npm install`、`npm test`、`server/go test ./...`。
- 已记录证据：`harness/feature_list.json` 中 `wx-005` evidence；本日志当前条目；`harness/quality-document.md`；`harness/session-handoff.md`。
- 提交记录：本轮收尾提交使用 `Add WeChat Cloud Run backend`。
- 更新过的文件或工件：`server/*`、`utils/cloud.js`、`app.js`、`pages/onboarding/index.js`、`pages/dashboard/index.js`、`pages/upload/index.js`、`utils/account.js`、`utils/profile.js`、`utils/meal.js`、`tests/smoke.js`、`harness/init.sh`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/quality-document.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 尚未把 `server/` 部署到微信云托管，也未在云托管控制台配置 MySQL 环境变量后做真实请求验证。
  - `wx-005` 仍不能标记 passing，因为还没完成“清空本地缓存后按同一微信身份从云端恢复档案和餐食”的端到端证据。
  - 本地没有直接连接云托管内网 MySQL；数据库连通性只能在云托管运行环境内验证。
  - 微信开发者工具本地文件 `project.config.json` / `project.private.config.json` 仍有未提交改动，本轮不纳入提交。
- 下一步最佳动作：把 `server/` 作为 Go 服务部署到微信云托管，配置 MySQL 环境变量后，用微信开发者工具跑建档 -> 记录餐食 -> 清缓存 -> 重新进入恢复数据的验证。

### Session 008

- 日期：2026-06-12
- 本轮目标：阅读微信云托管快速入门文档，用微信开发者工具做前后端联调，并尝试把 Go 后端发布到云托管。
- 已完成：
  - 阅读官方云托管 quickstart、Go 自定义部署、小程序访问云托管服务文档；确认当前后端应按“手动上传代码包/文件夹”上传 `server/` 目录。
  - 将小程序云端调用补齐为先 `wx.cloud.init({})`，再优先使用 `wx.cloud.Cloud({ resourceEnv })`，失败时兜底为 `wx.cloud.callContainer({ config: { env }, header: { X-WX-SERVICE } })`。
  - 用微信开发者工具确认正式 AppID 下页面渲染正常，基础库为 3.16.1，页面不白屏；云端调用返回 `Invalid host`，符合后端服务未部署或入口未就绪的状态。
  - 新增 `.gitignore`，避免 `project.private.config.json` 被误提交。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `./harness/init.sh`：开工基线通过，内部执行 npm smoke 和 Go 单测。
  - 微信开发者工具：`pages/dashboard/index` 正常渲染；控制台显示 `cloud.callContainer:fail ... Invalid host`。
- 已记录证据：`harness/feature_list.json` 中 `wx-005` 新增官方文档对齐和 DevTools 联调证据；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Align WeChat Cloud Run calls`。
- 更新过的文件或工件：`app.js`、`utils/cloud.js`、`tests/smoke.js`、`.gitignore`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 还没有实际部署 `server/` 到微信云托管；Computer Use 在 `cloud.weixin.qq.com/cloudrun/console` URL 上被安全策略阻止，不能代操作控制台。
  - 当前 Git 仓库没有配置 `origin`，且本机没有 `gh`，无法直接推送到 GitHub；需要用户提供 GitHub 仓库 URL，或确认安装 `gh` 并创建/绑定仓库。
  - `project.config.json` 是微信开发者工具本地 AppID/编译配置改动，本轮仍不纳入提交；`project.private.config.json` 已加入忽略规则。
- 下一步最佳动作：拿到 GitHub 远端 URL 后配置 `origin` 并 push；随后用户在云托管控制台上传 `server/` 目录，配置 MySQL 环境变量并发布。

### Session 009

- 日期：2026-06-12
- 本轮目标：修复微信云托管 Go 后端启动时报出的 MySQL `mysql_native_password` 认证失败。
- 已完成：
  - 根据云端日志定位到 Go MySQL driver 握手阶段失败：`this user requires mysql native password authentication`。
  - 确认 `server/store.go` 手写 `mysql.Config{...}` 绕过了 `go-sql-driver/mysql` 的 `NewConfig()` 默认值，使 `AllowNativePasswords` 保持 false。
  - 将 `mysqlDSN` 改为 `mysql.NewConfig()` 后填充业务字段，保留 driver 默认认证兼容配置。
  - 新增 `TestMySQLDSNAllowsNativePasswords`，解析生成的 DSN 并断言 `AllowNativePasswords` 为 true。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `./harness/init.sh`：开工基线通过。
  - `go test ./...`（在 `server/` 下）：通过。
  - `./harness/init.sh`：修复后通过，内部执行 npm smoke 和 Go 单测。
- 已记录证据：`harness/feature_list.json` 中 `wx-005` 新增 MySQL native password 修复证据；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Fix MySQL native password auth`。
- 更新过的文件或工件：`server/store.go`、`server/main_test.go`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 还需要用户在微信云托管重新部署最新 GitHub 代码后验证服务启动。
  - 仍未完成清空本地缓存后的云端恢复端到端验证。
  - `project.config.json` 仍有微信开发者工具本地改动，本轮不纳入提交。
- 下一步最佳动作：推送修复提交到 GitHub，用户重新部署 Go 服务；若启动成功，再用微信开发者工具验证建档、保存餐食和云端恢复。

### Session 010

- 日期：2026-06-12
- 本轮目标：用户完成云端部署后，本地调试微信开发者工具里的小程序前后端联调，并接入云托管公网服务域名。
- 已完成：
  - 确认此前小程序端只配置了 `resourceEnv + X-WX-SERVICE` 的 `callContainer` 入口，缺少用户提供的公网服务域名。
  - 将小程序端 `utils/cloud.js` 改为优先通过 `wx.request` 调用 `https://golang-24re-269724-9-1309913757.sh.run.tcloudbase.com`，并设置 5 秒超时；`callContainer` 只保留为无 `wx.request` 能力时的备用入口。
  - 通过公网 `GET /healthz` 验证云端服务在线，返回 `{"code":0,"data":{"status":"ok"}}`。
  - 通过公网 `POST /api/account` 验证云端 MySQL 写入链路可用，返回 `local:debug_local_20260612` 账户。
  - 发现云端当前版本对空餐食列表返回 `records:null`，导致前端旧逻辑 `daily.records.map` 报错；前端已对 `daily.records` 和 `record.items` 做数组容错。
  - 后端本地代码已新增 `normalizeMealRecords`，确保最新版本部署后空餐食列表序列化为 `[]`；新增 Go 单测防回归。
  - 修复 harness 在沙箱里访问系统 Go build cache 失败的问题，将 Go cache 指向仓库内 `.cache/go-build`，并忽略 `.cache/`。
- 运行过的验证：
  - `curl -L https://golang-24re-269724-9-1309913757.sh.run.tcloudbase.com/healthz`：通过，云端返回健康状态。
  - `curl -L -X POST ... /api/account`：通过，云端返回账户数据。
  - `curl -L -X POST ... /api/meals/list`：当前云端仍返回 `records:null`，证明云端还未部署本地最新空数组修复。
  - `npm test`：通过，输出 `smoke ok: vibrant orange UI, account registration, meal logging, cloud backend wiring`。
  - `./harness/init.sh`：通过，内部执行 npm smoke 和 Go 单测。
  - 微信开发者工具：刷新后 Dashboard 可访问树渲染出首页内容；控制台不再出现 `Invalid host`，也不再出现 `records.map` 报错；仍可见开发者工具/基础库自身的 `Error: timeout` 噪声。
- 已记录证据：`harness/feature_list.json` 中 `wx-005` 新增公网域名、API 联调和空数组修复证据；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Use Cloud Run public service domain`。
- 更新过的文件或工件：`.gitignore`、`harness/init.sh`、`utils/cloud.js`、`pages/dashboard/index.js`、`server/README.md`、`server/handlers.go`、`server/models.go`、`server/main_test.go`、`tests/smoke.js`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 云端当前运行版本仍返回 `records:null`；需要重新部署最新后端代码后再验证 `/api/meals/list` 返回 `records:[]`。
  - 小程序发布前需要在微信公众平台/小程序后台把 `golang-24re-269724-9-1309913757.sh.run.tcloudbase.com` 加入 request 合法域名。
  - 仍未完成清空本地缓存后的云端恢复端到端验证。
  - `project.config.json` 仍有微信开发者工具本地改动，本轮不纳入提交。
- 下一步最佳动作：提交并推送本轮域名接入和空数组修复；用户重新部署云托管后，用 `/api/meals/list` 确认 `records:[]`，再在微信开发者工具里跑建档 -> 记录餐食 -> 清缓存 -> 恢复数据。

### Session 011

- 日期：2026-06-12
- 本轮目标：后端重新部署后，继续本地调试微信开发者工具里的小程序前后端联调。
- 已完成：
  - 通过公网 `GET /healthz` 确认云托管 Go 服务在线。
  - 通过公网 `POST /api/meals/list` 确认最新后端已部署，空餐食列表现在返回 `records:[]`。
  - 移除 `app.js` 启动时的 `wx.cloud.init()` 调用；当前主路径已经是公网 HTTPS `wx.request`，启动时初始化云开发只会在开发者工具里产生基础库 `Error: timeout` 噪声。
  - 更新 smoke test，防止后续重新在启动路径引入 `initWxCloud`。
  - 用微信开发者工具 iPhone 12/13 85% 验证首页渲染、底部加号进入记录页、点击“存好啦”保存默认午餐并回到首页；首页显示已摄入 506 kcal、剩余 1494 kcal。
  - 清空开发者工具 Console 后重新保存，控制台没有新的 error；Network 面板看到 `/api/meals/list` XHR 200。
- 运行过的验证：
  - `pwd`
  - `curl -L https://golang-24re-269724-9-1309913757.sh.run.tcloudbase.com/healthz`：通过，返回 `status:"ok"`。
  - `curl -L -X POST ... /api/meals/list`：通过，空餐食列表返回 `records:[]`。
  - `./harness/init.sh`：改动后通过，内部执行 npm smoke 和 Go 单测。
  - 微信开发者工具：`pages/dashboard/index` -> `pages/upload/index` -> 保存 -> `pages/dashboard/index` 点击流通过；Console 只剩自动热重载 warning。
- 已记录证据：`harness/feature_list.json` 中 `wx-005` 新增最新后端部署、DevTools 保存点击流和启动 timeout 去噪证据；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Remove unused cloud init on launch`。
- 更新过的文件或工件：`app.js`、`tests/smoke.js`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/quality-document.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 仍未完成清空本地缓存后的云端恢复端到端验证；清缓存是本地数据删除动作，执行前需要用户确认。
  - 小程序发布前需要在微信公众平台/小程序后台把 `golang-24re-269724-9-1309913757.sh.run.tcloudbase.com` 加入 request 合法域名。
  - `project.config.json` 仍有微信开发者工具本地改动，本轮不纳入提交。
- 下一步最佳动作：获得用户确认后清空开发者工具本地缓存，重新进入小程序，验证同一身份是否能从云端恢复档案和餐食。

### Session 012

- 日期：2026-06-12
- 本轮目标：用户确认后继续清缓存恢复测试，并修复跨设备身份链路。
- 已完成：
  - 在微信开发者工具中执行“清除数据缓存”，再重新启动页面；结果证明只依赖本地 account id 时，清缓存后无法稳定恢复云端餐食。
  - 尝试让前端优先走 `callContainer` 以获取云托管注入的微信身份；开发者工具基础库 3.16.1 下 `callContainer` 仍出现 `Error: timeout`，不能作为本地稳定调试主路径。
  - 将前端云端请求改为：优先公网 HTTPS `wx.request`，无 `sessionToken` 时附带 `wx.login` 生成的 `loginCode`；`callContainer` 只在没有 `wx.request` 能力时兜底，避免开发者工具里反复撞容器 timeout。
  - 将 Go 后端改为：配置 `WECHAT_APP_SECRET` 或 `WECHAT_SECRET` 后，使用 `jscode2session` 将 `loginCode` 换成 openid，再以 openid 作为账户主键，并签发短期 `sessionToken` 给后续请求复用；未配置密钥时仍回退本地 id，保证当前开发流程不直接坏掉。
  - 新增 `Store.MigrateLocalAccount`，当同一 local id 第一次绑定 openid 时，把旧 `local:*` 账号下的 profile 和 meal records 迁到 `openid:*`，避免身份升级后看不到此前已保存的云端数据。
  - 移除 `app.js` 启动时的云端账户同步，云端请求改为页面按需触发，减少开发者工具启动阶段的无意义请求。
  - 更新 README 和 smoke test，明确小程序密钥只通过环境变量配置，不能写入仓库。
- 运行过的验证：
  - `pwd`
  - `git log --oneline -5`
  - `./harness/init.sh`：开工基线通过。
  - 微信开发者工具：清除数据缓存后能复现恢复不完整；`callContainer` 路径出现 `Error: timeout`。
  - 微信开发者工具：本轮改动后首页稳定渲染、不白屏；启动云同步已移除，但基础库仍会出现一条 `Error: timeout`，当前判断落在 `wx.login`/开发者工具身份环境，需要部署新后端并配置 AppSecret 后复测。
  - `./harness/init.sh`：修复后通过，内部执行 npm smoke 和 Go 单测；Go 单测包含不占端口的 `jscode2session` fake transport、sessionToken 签名校验；smoke 覆盖 `MigrateLocalAccount`、sessionToken 和餐食归并 SQL。
- 已记录证据：`harness/feature_list.json` 中 `wx-005` 新增清缓存失败原因、`wx.login`/sessionToken 身份链路修复、local 到 openid 迁移和部署前置条件；本日志当前条目。
- 提交记录：本轮收尾提交使用 `Add wx login identity recovery`
- 更新过的文件或工件：`utils/cloud.js`、`server/config.go`、`server/handlers.go`、`server/main.go`、`server/models.go`、`server/store.go`、`server/main_test.go`、`server/README.md`、`tests/smoke.js`、`harness/feature_list.json`、`harness/claude-progress.md`、`harness/quality-document.md`、`harness/session-handoff.md`
- 已知风险或未解决问题：
  - 云端当前部署版本尚未包含 `loginCode` / `jscode2session` 修复。
  - 云托管服务需要配置小程序 AppSecret：`WECHAT_APP_SECRET` 或 `WECHAT_SECRET`；否则后端只能继续回退本地 id，清缓存恢复仍不能通过。
  - 微信开发者工具基础库 3.16.1 仍会在 `wx.login`/身份请求附近打出 `Error: timeout`；代码已做本地兜底，但真实恢复必须以部署后端 + AppSecret 后的复测为准。
  - 小程序发布前仍需要在微信公众平台/小程序后台把公网域名加入 request 合法域名。
  - `project.config.json` 仍有微信开发者工具本地改动，本轮不纳入提交。
- 下一步最佳动作：推送代码后，在云托管配置 `WECHAT_APP_SECRET` 并重新部署；随后重新做建档 -> 保存餐食 -> 清除数据缓存 -> 冷启动恢复验证。

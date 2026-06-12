# 会话交接

## 当前已验证

- 现在明确可用的部分：原生微信小程序骨架、首次本地账户创建、身体信息建档、BMI/BMR/每日建议热量计算、活力橙 UI、餐食记录和首页汇总；微信云托管 Go 后端已部署；小程序端已接入公网服务域名 `https://golang-24re-269724-9-1309913757.sh.run.tcloudbase.com` 并优先通过 `wx.request` 调用；前端已支持 `wx.login` `loginCode` + 后端签发 `sessionToken`，后端代码已支持配置 AppSecret 后换 openid，并会把同一 local id 下的旧云端数据迁到 openid 账号。
- 这轮实际跑过的验证：`npm test` 通过；`server/go test ./...` 通过；`./harness/init.sh` 通过；微信开发者工具清除数据缓存后复现了本地 id 无法稳定恢复的问题；`callContainer` 在开发者工具中仍会 `Error: timeout`，因此已改为公网 HTTPS + `wx.login` code + `sessionToken` 的身份链路；本轮最新 DevTools 复测首页稳定渲染，但基础库 3.16.1 仍会在 `wx.login`/身份请求附近出现一条 `Error: timeout`。
- 标准验证命令：`./harness/init.sh`

## 本轮改动

- 新增了哪些代码或行为：`utils/cloud.js` 会在没有 `sessionToken` 时对含 account 的请求调用 `wx.login` 并附带 `loginCode`；`server/handlers.go` 新增 `jscode2session`、sessionToken 签发和校验，配置 `WECHAT_APP_SECRET` 或 `WECHAT_SECRET` 后用 openid 作为账户主键；`server/store.go` 新增 `MigrateLocalAccount`，绑定 openid 时迁移旧 `local:*` profile 和 meal records；`server/config.go`/README/smoke 已同步新环境变量。
- 小程序端变化：公网 HTTPS 是主路径；`callContainer` 只在无 `wx.request` 能力时兜底；`app.js` 不再启动时同步云端账户，页面按需同步云端数据，减少启动阶段无意义请求。
- 基础设施或 harness 变化：`tests/smoke.js` 增加 `wx.login`、`loginCode`、`sessionToken`、`WECHAT_APP_SECRET`、`jscode2session`、local 到 openid 迁移防回归检查；`server/main_test.go` 用 fake transport 覆盖 code2session 解析，并覆盖 sessionToken 签名和篡改拒绝，不占用本地端口。

## 仍损坏或未验证

- 已知缺陷：当前云端部署版本尚未包含 `loginCode` / `sessionToken` 身份修复；没有配置小程序 AppSecret 时仍会回退本地 id，清缓存恢复不能标 passing；微信开发者工具基础库 3.16.1 当前仍会在 `wx.login`/身份请求附近出现 `Error: timeout`；发布前需要把公网域名加入 request 合法域名。
- 未验证路径：还没有在云托管重新部署本轮后端并配置 `WECHAT_APP_SECRET` 后执行“建档 -> 记录餐食 -> 清空本地缓存 -> 冷启动 -> 云端恢复档案和餐食”。
- 下一轮会话需要注意的风险：不要把数据库密码或小程序 AppSecret 写入仓库；`project.config.json` 是微信开发者工具本地改动，本轮未纳入提交；`project.private.config.json` 已加入 `.gitignore`；小程序发布前需要把 `golang-24re-269724-9-1309913757.sh.run.tcloudbase.com` 加入 request 合法域名；云托管绑定的 MySQL 内网地址只能在云托管运行环境内直接访问；GitHub `origin` 已配置为 `git@github.com:AnAntInGZ/WeixinKCal.git`。

## 下一步最佳动作

- 最高优先级未完成功能：`wx-005` 升级账户为跨设备可恢复账户。
- 为什么它是下一步：代码已经具备云端持久化路径，但用户可见的“换设备可恢复”必须通过真实云托管部署和同一微信身份验证才能成立。
- 什么结果才算 passing：云托管部署本轮代码并配置 `WECHAT_APP_SECRET` 或 `WECHAT_SECRET`；用微信开发者工具完成建档 -> 记录餐食 -> 清空本地缓存 -> 冷启动 -> 云端恢复档案和餐食。
- 当前发布到 GitHub 的状态：`main` 已跟踪 `origin/main`；不要把 `project.config.json` 的本地改动和 `project.private.config.json` 纳入提交。
- 这一步中哪些东西不要动：不要改弱 `tests/smoke.js` 或 `harness/init.sh` 的验证；不要提交微信开发者工具本地私有配置；不要在文档或代码中记录数据库密码明文。

## 命令

- 启动命令：`npm run dev`；实际预览需用微信开发者工具打开仓库根目录。
- 验证命令：`./harness/init.sh`
- 定向前端 smoke：`npm test`
- 定向后端测试：`cd server && go test ./...`

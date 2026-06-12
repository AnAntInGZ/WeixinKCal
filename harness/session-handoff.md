# 会话交接

## 当前已验证

- 现在明确可用的部分：原生微信小程序骨架、首次本地账户创建、身体信息建档、BMI/BMR/每日建议热量计算、活力橙 UI、餐食记录和首页汇总；新增微信云托管 Go 后端代码；小程序端已接入公网服务域名 `https://golang-24re-269724-9-1309913757.sh.run.tcloudbase.com` 并优先通过 `wx.request` 调用；后端 MySQL DSN 已保留 driver 默认认证配置，允许 `mysql_native_password`。
- 这轮实际跑过的验证：`npm test` 通过；`server/go test ./...` 通过；`./harness/init.sh` 通过，内部执行 `npm install`、`npm test` 和 Go 单测；公网 `/healthz` 返回 ok；公网 `/api/account` 可写入账户。
- 标准验证命令：`./harness/init.sh`

## 本轮改动

- 新增了哪些代码或行为：小程序端新增 `CLOUD_BASE_URL` 公网域名配置；后端新增 `normalizeMealRecords`，最新版本部署后空餐食列表会返回 `records:[]`；Dashboard 对云端旧版本 `records:null` 和异常 `items` 做容错。
- 小程序端变化：`utils/cloud.js` 优先使用 `wx.request` 调用公网域名，设置 5 秒超时；`callContainer` 只作为没有 `wx.request` 能力时的备用入口；启动同步账户、建档保存/恢复、首页拉取云端当天汇总、上传页保存餐食后同步云端的业务入口保持不变。
- 基础设施或 harness 变化：`harness/init.sh` 的 Go 测试使用仓库内 `.cache/go-build`，避免沙箱访问系统 Go build cache 失败；`.cache/` 已加入 `.gitignore`；`tests/smoke.js` 增加公网域名、超时和 dashboard 容错防回归检查；`server/main_test.go` 增加空 records 序列化为数组的测试。

## 仍损坏或未验证

- 已知缺陷：公网当前云端版本仍对空餐食列表返回 `records:null`，本地代码已修复但需要重新部署后才会在公网生效。
- 未验证路径：还没有重新部署本轮最新后端到微信云托管；还没有完成清空本地缓存后的云端恢复验证。微信开发者工具中仍偶见 DevTools/基础库自身 `Error: timeout` 噪声，但不再出现 `Invalid host` 或 `records.map` 报错。
- 下一轮会话需要注意的风险：不要把数据库密码写入仓库；`project.config.json` 是微信开发者工具本地改动，本轮未纳入提交；`project.private.config.json` 已加入 `.gitignore`；小程序发布前需要把 `golang-24re-269724-9-1309913757.sh.run.tcloudbase.com` 加入 request 合法域名；云托管绑定的 MySQL 内网地址只能在云托管运行环境内直接访问；GitHub `origin` 已配置为 `git@github.com:AnAntInGZ/WeixinKCal.git`。

## 下一步最佳动作

- 最高优先级未完成功能：`wx-005` 升级账户为跨设备可恢复账户。
- 为什么它是下一步：代码已经具备云端持久化路径，但用户可见的“换设备可恢复”必须通过真实云托管部署和同一微信身份验证才能成立。
- 什么结果才算 passing：重新部署最新 Go 服务；确认公网 `/api/meals/list` 空列表返回 `records:[]`；用微信开发者工具完成建档 -> 记录餐食 -> 清空本地缓存 -> 重新进入 -> 云端恢复档案和餐食。
- 当前发布到 GitHub 的状态：`main` 已跟踪 `origin/main`；不要把 `project.config.json` 的本地改动和 `project.private.config.json` 纳入提交。
- 这一步中哪些东西不要动：不要改弱 `tests/smoke.js` 或 `harness/init.sh` 的验证；不要提交微信开发者工具本地私有配置；不要在文档或代码中记录数据库密码明文。

## 命令

- 启动命令：`npm run dev`；实际预览需用微信开发者工具打开仓库根目录。
- 验证命令：`./harness/init.sh`
- 定向前端 smoke：`npm test`
- 定向后端测试：`cd server && go test ./...`

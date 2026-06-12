# 会话交接

## 当前已验证

- 现在明确可用的部分：原生微信小程序骨架、首次本地账户创建、身体信息建档、BMI/BMR/每日建议热量计算、活力橙 UI、餐食记录和首页汇总；新增微信云托管 Go 后端代码与小程序端 `callContainer` 接入。
- 这轮实际跑过的验证：`npm test` 通过；`server/go test ./...` 通过；`./harness/init.sh` 通过，内部执行 `npm install`、`npm test` 和 Go 单测。
- 标准验证命令：`./harness/init.sh`

## 本轮改动

- 新增了哪些代码或行为：`server/` 下新增 Go 云托管服务，包含 Dockerfile、配置加载、MySQL 建库建表、账户/档案/餐食 API 和单测。
- 小程序端变化：新增 `utils/cloud.js`，使用 `resourceEnv=prod-d8ghbq8xea378972b` 与 `X-WX-SERVICE=golang-24re-001` 调用云托管；启动同步账户，建档保存/恢复，首页拉取云端当天汇总，上传页保存餐食后同步云端。
- 基础设施或 harness 变化：`harness/init.sh` 检测到 `server/go.mod` 后会运行 `go test ./...`；`tests/smoke.js` 增加云端配置和服务骨架防回归检查。

## 仍损坏或未验证

- 已知缺陷：暂无已复现代码缺陷。
- 未验证路径：还没有把 `server/` 部署到微信云托管；还没有在云托管控制台配置 MySQL 环境变量后跑真实请求；还没有完成清空本地缓存后的云端恢复验证。
- 下一轮会话需要注意的风险：不要把数据库密码写入仓库；`project.config.json` 和 `project.private.config.json` 是微信开发者工具本地改动，本轮未纳入提交；云托管绑定的 MySQL 内网地址只能在云托管运行环境内直接访问。

## 下一步最佳动作

- 最高优先级未完成功能：`wx-005` 升级账户为跨设备可恢复账户。
- 为什么它是下一步：代码已经具备云端持久化路径，但用户可见的“换设备可恢复”必须通过真实云托管部署和同一微信身份验证才能成立。
- 什么结果才算 passing：部署 Go 服务；配置 `MYSQL_ADDRESS`、`MYSQL_USERNAME`、`MYSQL_PASSWORD`、可选 `MYSQL_DATABASE`；用微信开发者工具完成建档 -> 记录餐食 -> 清空本地缓存 -> 重新进入 -> 云端恢复档案和餐食。
- 这一步中哪些东西不要动：不要改弱 `tests/smoke.js` 或 `harness/init.sh` 的验证；不要提交微信开发者工具本地私有配置；不要在文档或代码中记录数据库密码明文。

## 命令

- 启动命令：`npm run dev`；实际预览需用微信开发者工具打开仓库根目录。
- 验证命令：`./harness/init.sh`
- 定向前端 smoke：`npm test`
- 定向后端测试：`cd server && go test ./...`

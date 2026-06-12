# 会话交接

## 当前已验证

- 现在明确可用的部分：原生微信小程序骨架、首次本地账户创建、身体信息建档、BMI/BMR/每日建议热量计算、建档后首页读取展示。
- 这轮实际跑过的验证：`npm test` 通过；`./harness/init.sh` 通过；`npm run dev` 通过并打印微信开发者工具打开提示。

## 本轮改动

- 新增了哪些代码或行为：新增 `pages/onboarding` 建档页、`pages/dashboard` 首页、`utils/account.js`、`utils/profile.js`、`utils/health.js`、`utils/options.js`。
- 基础设施或 harness 发生了哪些变化：新增 `package.json`/`package-lock.json` 和 `tests/smoke.js`；`feature_list.json` 改为饮食热量管理小程序路线；`CONTEXT.md` 增加产品术语；`quality-document.md` 更新质量快照。

## 仍损坏或未验证

- 已知缺陷：暂无已复现缺陷。
- 未验证路径：未用微信开发者工具或真机人工预览 UI。
- 下一轮会话需要注意的风险：当前账号和档案仅在本地 storage；每日建议热量公式是初版估算，不等同医疗建议。

## 下一步最佳动作

- 最高优先级未完成功能：`wx-002` 记录每日每餐饮食。
- 为什么它是下一步：热量目标已经能生成，下一步需要有用户每日摄入数据。
- 什么结果才算 passing：用户能新增餐食记录，记录按日期/餐次持久化，首页或记录页能读取显示，并有 smoke test 证据。
- 这一步中哪些东西不要动：不要改弱 `tests/smoke.js`；不要把 `wx-001` 改回 in_progress；不要引入云端账户，除非先确认方案。

## 命令

- 启动命令：`npm run dev`；实际预览需用微信开发者工具打开仓库根目录。
- 验证命令：`./harness/init.sh`
- 定向调试命令：`npm test`

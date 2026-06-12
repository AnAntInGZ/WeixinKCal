# 会话交接

## 当前已验证

- 现在明确可用的部分：原生微信小程序骨架、首次本地账户创建、身体信息建档、BMI/BMR/每日建议热量计算；注册、首页、上传三页已按 `style4-vibrant-orange.html` 复刻；微信开发者工具里首页不再白屏，底部加号可进入上传页。
- 这轮实际跑过的验证：`npm test` 通过；微信开发者工具确认 `pages/dashboard/index` 渲染、`pages/upload/index` 可进入；`./harness/init.sh` 通过。

## 本轮改动

- 新增了哪些代码或行为：修复 dashboard 白屏；头像渐变从 WXML 内联 style 迁移到 `app.wxss` 的 `.avatar-bubble`，视觉保持活力橙模板效果。
- 基础设施或 harness 发生了哪些变化：`tests/smoke.js` 增加 dashboard WXML 防回归检查；`feature_list.json`、`claude-progress.md`、`quality-document.md` 记录白屏根因和验证证据。

## 仍损坏或未验证

- 已知缺陷：暂无已复现缺陷。
- 未验证路径：未做真机或像素级截图比对；注册页本轮未在开发者工具中重新手动复核。
- 下一轮会话需要注意的风险：当前 UI 优先静态复刻模板；真实餐食记录数据流仍属于 `wx-002`；复杂渐变样式放在 WXSS 中，不要再写回 WXML 内联 style。

## 下一步最佳动作

- 最高优先级未完成功能：`wx-002` 记录每日每餐饮食。
- 为什么它是下一步：活力橙 UI 已复刻，下一步需要把上传页接入真实餐食记录数据。
- 什么结果才算 passing：用户能新增餐食记录，记录按日期/餐次持久化，首页或记录页能读取显示，并有 smoke test 证据。
- 这一步中哪些东西不要动：不要偏离 `style4-vibrant-orange.html` 的视觉；不要改弱 `tests/smoke.js`；不要引入云端账户，除非先确认方案。

## 命令

- 启动命令：`npm run dev`；实际预览需用微信开发者工具打开仓库根目录。
- 验证命令：`./harness/init.sh`
- 定向调试命令：`npm test`

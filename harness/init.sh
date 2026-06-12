#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> 当前目录: $PWD"

if [ -f package.json ]; then
  INSTALL_CMD=(npm install)
  VERIFY_CMD=(npm test)
  START_CMD=(npm run dev)

  echo "==> 同步依赖"
  "${INSTALL_CMD[@]}"

  echo "==> 运行基础验证"
  "${VERIFY_CMD[@]}"

  if [ -f server/go.mod ]; then
    echo "==> 运行 Go 云托管验证"
    (cd server && go test ./...)
  fi
else
  START_CMD=(echo "No app start command yet; harness self-check passed.")

  echo "==> 未检测到 package.json，执行 harness 自检"
  REQUIRED_FILES=(
    AGENTS.md
    harness/claude-progress.md
    harness/feature_list.json
    harness/init.sh
    harness/session-handoff.md
  )

  for file in "${REQUIRED_FILES[@]}"; do
    test -f "$file"
  done

  bash -n harness/init.sh
  node -e '
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("harness/feature_list.json", "utf8"));
if (!Array.isArray(data.features)) {
  throw new Error("feature_list.json must contain a features array");
}
const allowed = new Set(["not_started", "in_progress", "blocked", "passing"]);
const ids = new Set();
let activeCount = 0;
for (const feature of data.features) {
  if (!feature.id || ids.has(feature.id)) {
    throw new Error("feature ids must be present and unique");
  }
  ids.add(feature.id);
  if (!allowed.has(feature.status)) {
    throw new Error(`invalid status for ${feature.id}: ${feature.status}`);
  }
  if (feature.status === "in_progress") {
    activeCount += 1;
  }
  if (!Array.isArray(feature.verification) || !Array.isArray(feature.evidence)) {
    throw new Error(`${feature.id} must contain verification and evidence arrays`);
  }
}
if (data.rules?.single_active_feature && activeCount > 1) {
  throw new Error("only one feature may be in_progress");
}
'
fi

echo "==> 启动命令"
printf '    %q' "${START_CMD[@]}"
printf '\n'

if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  echo "==> 启动应用"
  exec "${START_CMD[@]}"
fi

echo "如果希望 init.sh 直接启动应用，请设置 RUN_START_COMMAND=1。"

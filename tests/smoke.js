const assert = require('assert')
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
}

function walk(dir, matcher, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(absolute, matcher, results)
      continue
    }
    if (matcher(absolute)) {
      results.push(absolute)
    }
  }
  return results
}

function createFakeStorage() {
  const values = new Map()

  return {
    getStorageSync(key) {
      return values.get(key)
    },
    setStorageSync(key, value) {
      values.set(key, value)
    }
  }
}

function verifyMiniProgramShape() {
  const appConfig = readJson('app.json')
  assert.deepStrictEqual(appConfig.pages, [
    'pages/onboarding/index',
    'pages/dashboard/index',
    'pages/upload/index'
  ])

  for (const page of appConfig.pages) {
    for (const extension of ['json', 'js', 'wxml', 'wxss']) {
      const filePath = path.join(root, `${page}.${extension}`)
      assert.ok(fs.existsSync(filePath), `${page}.${extension} should exist`)
    }
  }

  for (const jsonFile of walk(root, (file) => file.endsWith('.json'))) {
    JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
  }

  for (const jsFile of walk(root, (file) => file.endsWith('.js'))) {
    execFileSync(process.execPath, ['--check', jsFile], { stdio: 'pipe' })
  }
}

function assertFileContains(relativePath, snippets) {
  const content = fs.readFileSync(path.join(root, relativePath), 'utf8')
  for (const snippet of snippets) {
    assert.ok(
      content.includes(snippet),
      `${relativePath} should contain ${snippet}`
    )
  }
}

function verifyVibrantOrangeReplica() {
  assertFileContains('app.wxss', [
    '#ff8a3d',
    '#ff5c7c',
    '#ffb347',
    '#6a5cff',
    '#fff6ee',
    'border-radius: 32px',
    'box-shadow: 0 12px 24px rgba(255, 92, 124, .4)'
  ])

  const dashboardWxml = fs.readFileSync(
    path.join(root, 'pages/dashboard/index.wxml'),
    'utf8'
  )
  assert.ok(
    !dashboardWxml.includes('linear-gradient'),
    'dashboard WXML should not use inline linear-gradient; keep gradients in WXSS'
  )
  assert.ok(
    dashboardWxml.includes('avatar-bubble'),
    'dashboard WXML should use avatar-bubble for the header gradient avatar'
  )

  assertFileContains('pages/onboarding/index.wxml', [
    '嗨，我是卡卡！',
    '告诉我你的小目标，',
    '我帮你算好每天能吃多少~',
    '男生',
    '女生',
    '178',
    '74',
    '开启计划 🚀'
  ])

  assertFileContains('pages/dashboard/index.wxml', [
    '早上好呀 ☀️',
    '今天吃得不错！',
    '还可以吃 🍽️',
    '612',
    '已摄入 1238 / 目标 1850 kcal',
    '今日餐食 🍱',
    '面包 · 鸡蛋 · 牛奶',
    '鸡胸沙拉 · 糙米饭',
    '苹果 · 无糖酸奶'
  ])

  assertFileContains('pages/upload/index.wxml', [
    '记录午餐 🍽️',
    '拍张照，卡卡帮你算热量~',
    '点我拍食物',
    '鸡胸肉',
    '糙米饭',
    '西兰花',
    '这一餐总共 🔥',
    '存好啦 ✓'
  ])
}

function verifyFirstRunAccountAndProfile() {
  const { ACCOUNT_KEY, ensureAccount } = require('../utils/account')
  const { PROFILE_KEY, createProfile, getProfile } = require('../utils/profile')

  const storage = createFakeStorage()
  const createdAt = new Date('2026-06-12T00:00:00.000Z')
  const account = ensureAccount(storage, {
    now: createdAt,
    random: () => 0.123456
  })

  assert.strictEqual(account.id, 'local_1781222400000_123456')
  assert.strictEqual(account.profileCompleted, false)
  assert.deepStrictEqual(storage.getStorageSync(ACCOUNT_KEY), account)
  assert.strictEqual(ensureAccount(storage).id, account.id)

  const result = createProfile(storage, account, {
    gender: 'female',
    age: '30',
    heightCm: '165',
    weightKg: '60',
    activityLevel: 'light',
    goal: 'fat_loss'
  })

  assert.strictEqual(result.account.profileCompleted, true)
  assert.strictEqual(result.profile.plan.bmi, 22)
  assert.strictEqual(result.profile.plan.bmiLabel, '正常')
  assert.strictEqual(result.profile.plan.bmr, 1320)
  assert.strictEqual(result.profile.plan.maintenanceCalories, 1820)
  assert.strictEqual(result.profile.plan.dailyCalories, 1550)
  assert.deepStrictEqual(storage.getStorageSync(PROFILE_KEY), result.profile)
  assert.deepStrictEqual(getProfile(storage), result.profile)
}

verifyMiniProgramShape()
verifyVibrantOrangeReplica()
verifyFirstRunAccountAndProfile()

console.log('smoke ok: vibrant orange UI, account registration, profile plan')

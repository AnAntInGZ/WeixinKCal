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
  const appWxss = fs.readFileSync(path.join(root, 'app.wxss'), 'utf8')
  assert.ok(
    !appWxss.includes('letter-spacing: -'),
    'WXSS should not use negative letter spacing because it can cause cramped mobile text'
  )
  assertFileContains('app.wxss', [
    '.upload-layout',
    'height: calc(100vh - 44px)',
    '.food-list',
    'flex: 1',
    '.upload-footer',
    '.compact-save',
    '.meal-list',
    'white-space: nowrap',
    'flex-wrap: nowrap',
    'width: 64px',
    'flex: 0 0 104px'
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
    'wx:for="{{genderOptions}}"',
    '年龄 · 身高 · 体重',
    'bindinput="handleInput"',
    'bindchange="handleActivityChange"',
    '开启计划 🚀'
  ])

  assertFileContains('pages/dashboard/index.wxml', [
    '早上好呀 ☀️',
    '今天吃得不错！',
    '还可以吃 🍽️',
    '{{summary.remainingCalories}}',
    '已摄入 {{summary.totalCalories}} / 目标 {{summary.targetCalories}} kcal',
    '今日餐食 🍱',
    'scroll-view class="meal-list"',
    'wx:for="{{meals}}"',
    '点下面的 + 记录第一餐'
  ])
  assertFileContains('pages/dashboard/index.js', [
    "wx.redirectTo({ url: '/pages/upload/index' })"
  ])

  assertFileContains('pages/upload/index.wxml', [
    '记录{{mealTypeLabels[mealTypeIndex]}} 🍽️',
    '拍张照，卡卡帮你算热量~',
    'mode="date"',
    'mode="selector"',
    '点我拍食物',
    'scroll-view class="food-list"',
    'class="fi food-card"',
    'placeholder="食物名称"',
    '{{item.calories}} kcal',
    'class="upload-footer"',
    '+ 添加食物',
    '备注，例如少油、去皮、饭后水果',
    '这一餐总共 🔥',
    '存好啦 ✓'
  ])
  assertFileContains('pages/upload/index.js', [
    "wx.reLaunch({ url: '/pages/dashboard/index' })"
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

function verifyMealRecordBackend() {
  const { ensureAccount } = require('../utils/account')
  const {
    MEAL_RECORDS_KEY,
    addMealRecord,
    deleteMealRecord,
    formatDateKey,
    listMealsByDate,
    summarizeMeals,
    updateMealRecord
  } = require('../utils/meal')

  const storage = createFakeStorage()
  const account = ensureAccount(storage, {
    now: new Date('2026-06-12T00:00:00.000Z'),
    random: () => 0.654321
  })
  const dateKey = formatDateKey(new Date('2026-06-12T08:00:00.000Z'))
  const record = addMealRecord(
    storage,
    account,
    {
      dateKey,
      mealType: 'lunch',
      note: '少油',
      items: [
        { name: '鸡胸肉', amountGram: 150 },
        { name: '糙米饭', amountGram: 200 },
        { name: '西兰花', amountGram: 100 }
      ]
    },
    {
      now: new Date('2026-06-12T04:00:00.000Z'),
      random: () => 0.111111
    }
  )

  assert.strictEqual(record.id, 'meal_1781236800000_111111')
  assert.strictEqual(record.totalCalories, 506)
  assert.strictEqual(record.totalProteinG, 54.5)
  assert.strictEqual(storage.getStorageSync(MEAL_RECORDS_KEY).length, 1)
  assert.strictEqual(listMealsByDate(storage, dateKey, account.id).length, 1)

  const summary = summarizeMeals([record], 1550)
  assert.strictEqual(summary.totalCalories, 506)
  assert.strictEqual(summary.remainingCalories, 1044)
  assert.strictEqual(summary.progressPercent, 33)

  const updated = updateMealRecord(
    storage,
    record.id,
    {
      mealType: 'dinner',
      items: [{ name: '鸡胸肉', amountGram: 200, kcalPer100g: 165 }]
    },
    {
      now: new Date('2026-06-12T05:00:00.000Z')
    }
  )

  assert.strictEqual(updated.mealType, 'dinner')
  assert.strictEqual(updated.totalCalories, 330)
  assert.strictEqual(deleteMealRecord(storage, record.id), true)
  assert.strictEqual(listMealsByDate(storage, dateKey, account.id).length, 0)
}

verifyMiniProgramShape()
verifyVibrantOrangeReplica()
verifyFirstRunAccountAndProfile()
verifyMealRecordBackend()

console.log('smoke ok: vibrant orange UI, account registration, meal logging')

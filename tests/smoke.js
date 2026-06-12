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
    'pages/dashboard/index'
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
verifyFirstRunAccountAndProfile()

console.log('smoke ok: mini program shape, account registration, profile plan')

const { markProfileCompleted } = require('./account')
const { buildNutritionPlan } = require('./health')

const PROFILE_KEY = 'weixinkcal.profile.v1'

function normalizeNumber(value) {
  return Number(String(value || '').trim())
}

function validateProfileInput(input) {
  const age = normalizeNumber(input.age)
  const heightCm = normalizeNumber(input.heightCm)
  const weightKg = normalizeNumber(input.weightKg)

  if (!input.gender) {
    throw new Error('请选择性别')
  }
  if (!age || age < 12 || age > 100) {
    throw new Error('请输入 12-100 岁之间的年龄')
  }
  if (!heightCm || heightCm < 100 || heightCm > 230) {
    throw new Error('请输入 100-230 cm 之间的身高')
  }
  if (!weightKg || weightKg < 30 || weightKg > 250) {
    throw new Error('请输入 30-250 kg 之间的体重')
  }
  if (!input.goal) {
    throw new Error('请选择当前目标')
  }

  return {
    gender: input.gender,
    age,
    heightCm,
    weightKg,
    activityLevel: input.activityLevel || 'light',
    goal: input.goal
  }
}

function createProfile(storage, account, input) {
  const normalizedInput = validateProfileInput(input)
  const plan = buildNutritionPlan(normalizedInput)
  const profile = {
    ...normalizedInput,
    plan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  storage.setStorageSync(PROFILE_KEY, profile)
  const nextAccount = markProfileCompleted(storage, account)

  return {
    account: nextAccount,
    profile
  }
}

function getProfile(storage) {
  return storage.getStorageSync(PROFILE_KEY) || null
}

function saveProfile(storage, profile) {
  storage.setStorageSync(PROFILE_KEY, profile)
  return profile
}

function storeProfile(storage, account, profile) {
  const savedProfile = saveProfile(storage, profile)
  const nextAccount = markProfileCompleted(storage, account)

  return {
    account: nextAccount,
    profile: savedProfile
  }
}

module.exports = {
  PROFILE_KEY,
  createProfile,
  getProfile,
  saveProfile,
  storeProfile,
  validateProfileInput
}

const MEAL_RECORDS_KEY = 'weixinkcal.mealRecords.v1'

const MEAL_TYPE_OPTIONS = [
  { label: '早餐', value: 'breakfast', emoji: '🍳', color: '#fff0d6' },
  { label: '午餐', value: 'lunch', emoji: '🥗', color: '#e6f7ea' },
  { label: '晚餐', value: 'dinner', emoji: '🍲', color: '#e9e5ff' },
  { label: '加餐', value: 'snack', emoji: '🍎', color: '#ffe6ec' }
]

const FOOD_LIBRARY = [
  { name: '鸡胸肉', emoji: '🍗', kcalPer100g: 165, carbsPer100g: 0, proteinPer100g: 31, fatPer100g: 3.6 },
  { name: '糙米饭', emoji: '🍚', kcalPer100g: 112, carbsPer100g: 23, proteinPer100g: 2.6, fatPer100g: 0.9 },
  { name: '西兰花', emoji: '🥦', kcalPer100g: 34, carbsPer100g: 7, proteinPer100g: 2.8, fatPer100g: 0.4 },
  { name: '面包', emoji: '🍞', kcalPer100g: 265, carbsPer100g: 49, proteinPer100g: 9, fatPer100g: 3.2 },
  { name: '鸡蛋', emoji: '🥚', kcalPer100g: 143, carbsPer100g: 1.1, proteinPer100g: 13, fatPer100g: 9.5 },
  { name: '牛奶', emoji: '🥛', kcalPer100g: 54, carbsPer100g: 5, proteinPer100g: 3.4, fatPer100g: 3.3 },
  { name: '苹果', emoji: '🍎', kcalPer100g: 52, carbsPer100g: 14, proteinPer100g: 0.3, fatPer100g: 0.2 },
  { name: '无糖酸奶', emoji: '🥣', kcalPer100g: 63, carbsPer100g: 4.7, proteinPer100g: 5.3, fatPer100g: 3.2 },
  { name: '香蕉', emoji: '🍌', kcalPer100g: 89, carbsPer100g: 23, proteinPer100g: 1.1, fatPer100g: 0.3 },
  { name: '牛肉', emoji: '🥩', kcalPer100g: 250, carbsPer100g: 0, proteinPer100g: 26, fatPer100g: 15 }
]

function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatDateKey(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
}

function createId(prefix, options = {}) {
  const now = options.now || new Date()
  const random = options.random || Math.random
  const suffix = Math.floor(random() * 1000000).toString().padStart(6, '0')
  return `${prefix}_${now.getTime()}_${suffix}`
}

function trimText(value) {
  return String(value || '').trim()
}

function parseNumber(value) {
  return Number(String(value || '').trim())
}

function roundTo(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function findFoodPreset(name) {
  const query = trimText(name)
  if (!query) {
    return null
  }

  return FOOD_LIBRARY.find((food) => query.includes(food.name) || food.name.includes(query)) || null
}

function getMealTypeOption(value) {
  return MEAL_TYPE_OPTIONS.find((option) => option.value === value) || MEAL_TYPE_OPTIONS[1]
}

function estimateFoodItem(input = {}) {
  const preset = findFoodPreset(input.name)
  const amountGram = Math.max(0, parseNumber(input.amountGram))
  const kcalPer100g = parseNumber(input.kcalPer100g) || (preset && preset.kcalPer100g) || 100
  const carbsPer100g = parseNumber(input.carbsPer100g) || (preset && preset.carbsPer100g) || 0
  const proteinPer100g = parseNumber(input.proteinPer100g) || (preset && preset.proteinPer100g) || 0
  const fatPer100g = parseNumber(input.fatPer100g) || (preset && preset.fatPer100g) || 0

  return {
    name: trimText(input.name),
    emoji: input.emoji || (preset && preset.emoji) || '🍽️',
    amountGram,
    kcalPer100g,
    calories: Math.round((amountGram * kcalPer100g) / 100),
    carbsG: roundTo((amountGram * carbsPer100g) / 100),
    proteinG: roundTo((amountGram * proteinPer100g) / 100),
    fatG: roundTo((amountGram * fatPer100g) / 100)
  }
}

function normalizeFoodItem(input) {
  const item = estimateFoodItem(input)

  if (!item.name) {
    throw new Error('请输入食物名称')
  }
  if (!item.amountGram || item.amountGram < 1 || item.amountGram > 5000) {
    throw new Error('请输入 1-5000g 之间的分量')
  }
  if (!item.kcalPer100g || item.kcalPer100g < 1 || item.kcalPer100g > 1200) {
    throw new Error('请输入 1-1200 之间的每 100g 热量')
  }

  return item
}

function readMealRecords(storage) {
  const records = storage.getStorageSync(MEAL_RECORDS_KEY)
  return Array.isArray(records) ? records : []
}

function writeMealRecords(storage, records) {
  storage.setStorageSync(MEAL_RECORDS_KEY, records)
}

function replaceMealsForDate(storage, accountId, dateKey, records) {
  const normalizedRecords = Array.isArray(records) ? records : []
  const nextRecords = readMealRecords(storage).filter((record) => (
    record.accountId !== accountId || record.dateKey !== dateKey
  ))

  writeMealRecords(storage, normalizedRecords.concat(nextRecords))
  return normalizedRecords
}

function normalizeMealInput(input = {}) {
  const items = Array.isArray(input.items) ? input.items.map(normalizeFoodItem) : []
  const dateKey = trimText(input.dateKey) || formatDateKey()
  const mealType = getMealTypeOption(input.mealType).value

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error('请选择正确的日期')
  }
  if (!items.length) {
    throw new Error('至少添加一种食物')
  }

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0)
  const totalCarbsG = roundTo(items.reduce((sum, item) => sum + item.carbsG, 0))
  const totalProteinG = roundTo(items.reduce((sum, item) => sum + item.proteinG, 0))
  const totalFatG = roundTo(items.reduce((sum, item) => sum + item.fatG, 0))

  return {
    dateKey,
    mealType,
    note: trimText(input.note),
    items,
    totalCalories,
    totalCarbsG,
    totalProteinG,
    totalFatG
  }
}

function createMealRecord(account, input, options = {}) {
  if (!account || !account.id) {
    throw new Error('缺少账户信息')
  }

  const normalized = normalizeMealInput(input)
  const now = options.now || new Date()

  return {
    id: createId('meal', options),
    accountId: account.id,
    ...normalized,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
}

function addMealRecord(storage, account, input, options = {}) {
  const record = createMealRecord(account, input, options)
  const records = readMealRecords(storage)
  writeMealRecords(storage, [record, ...records])
  return record
}

function updateMealRecord(storage, recordId, input, options = {}) {
  const records = readMealRecords(storage)
  const index = records.findIndex((record) => record.id === recordId)

  if (index === -1) {
    throw new Error('没有找到这条餐食记录')
  }

  const current = records[index]
  const normalized = normalizeMealInput({
    dateKey: input.dateKey || current.dateKey,
    mealType: input.mealType || current.mealType,
    note: input.note !== undefined ? input.note : current.note,
    items: input.items || current.items
  })

  const updated = {
    ...current,
    ...normalized,
    updatedAt: (options.now || new Date()).toISOString()
  }

  const nextRecords = records.slice()
  nextRecords[index] = updated
  writeMealRecords(storage, nextRecords)
  return updated
}

function deleteMealRecord(storage, recordId) {
  const records = readMealRecords(storage)
  const nextRecords = records.filter((record) => record.id !== recordId)
  writeMealRecords(storage, nextRecords)
  return records.length !== nextRecords.length
}

function listMealRecords(storage, filters = {}) {
  return readMealRecords(storage)
    .filter((record) => !filters.accountId || record.accountId === filters.accountId)
    .filter((record) => !filters.dateKey || record.dateKey === filters.dateKey)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

function listMealsByDate(storage, dateKey, accountId) {
  return listMealRecords(storage, { dateKey, accountId })
}

function summarizeMeals(records, targetCalories = 0) {
  const totalCalories = records.reduce((sum, record) => sum + record.totalCalories, 0)
  const totalCarbsG = roundTo(records.reduce((sum, record) => sum + record.totalCarbsG, 0))
  const totalProteinG = roundTo(records.reduce((sum, record) => sum + record.totalProteinG, 0))
  const totalFatG = roundTo(records.reduce((sum, record) => sum + record.totalFatG, 0))
  const remainingCalories = Math.max(0, Number(targetCalories || 0) - totalCalories)
  const progressPercent = targetCalories ? Math.min(100, Math.round((totalCalories / targetCalories) * 100)) : 0

  return {
    totalCalories,
    targetCalories: Number(targetCalories || 0),
    remainingCalories,
    progressPercent,
    totalCarbsG,
    totalProteinG,
    totalFatG,
    reached: targetCalories ? totalCalories >= targetCalories : false
  }
}

function getDailySummary(storage, dateKey, profile, account) {
  const records = listMealsByDate(storage, dateKey, account && account.id)
  const targetCalories = profile && profile.plan ? profile.plan.dailyCalories : 0

  return {
    dateKey,
    records,
    summary: summarizeMeals(records, targetCalories)
  }
}

function createDefaultDraftItems() {
  return [
    estimateFoodItem({ name: '鸡胸肉', amountGram: 150 }),
    estimateFoodItem({ name: '糙米饭', amountGram: 200 }),
    estimateFoodItem({ name: '西兰花', amountGram: 100 })
  ]
}

module.exports = {
  MEAL_RECORDS_KEY,
  MEAL_TYPE_OPTIONS,
  FOOD_LIBRARY,
  addMealRecord,
  createDefaultDraftItems,
  createMealRecord,
  deleteMealRecord,
  estimateFoodItem,
  findFoodPreset,
  formatDateKey,
  getDailySummary,
  getMealTypeOption,
  listMealRecords,
  listMealsByDate,
  normalizeMealInput,
  readMealRecords,
  replaceMealsForDate,
  summarizeMeals,
  updateMealRecord
}

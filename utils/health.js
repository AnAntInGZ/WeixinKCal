const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
}

const GOAL_FACTORS = {
  fat_loss: 0.85,
  weight_loss: 0.8,
  maintain: 1,
  muscle_gain: 1.1
}

function roundTo(value, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function roundCalories(value) {
  return Math.round(value / 10) * 10
}

function calculateBmi(heightCm, weightKg) {
  const heightM = Number(heightCm) / 100
  const weight = Number(weightKg)

  if (!heightM || !weight) {
    throw new Error('height and weight are required')
  }

  return roundTo(weight / (heightM * heightM), 1)
}

function classifyBmi(bmi) {
  if (bmi < 18.5) {
    return '偏轻'
  }
  if (bmi < 24) {
    return '正常'
  }
  if (bmi < 28) {
    return '偏重'
  }
  return '肥胖'
}

function calculateBmr({ gender, heightCm, weightKg, age }) {
  const base = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age)

  if (gender === 'female') {
    return roundCalories(base - 161)
  }
  if (gender === 'male') {
    return roundCalories(base + 5)
  }
  return roundCalories(base - 78)
}

function calculateDailyCalories(profileInput) {
  const activityFactor = ACTIVITY_FACTORS[profileInput.activityLevel] || ACTIVITY_FACTORS.light
  const goalFactor = GOAL_FACTORS[profileInput.goal] || GOAL_FACTORS.maintain
  const bmr = calculateBmr(profileInput)
  const maintenanceCalories = roundCalories(bmr * activityFactor)
  const dailyCalories = roundCalories(maintenanceCalories * goalFactor)

  return {
    bmr,
    maintenanceCalories,
    dailyCalories
  }
}

function buildNutritionPlan(profileInput) {
  const bmi = calculateBmi(profileInput.heightCm, profileInput.weightKg)
  const calories = calculateDailyCalories(profileInput)

  return {
    bmi,
    bmiLabel: classifyBmi(bmi),
    ...calories
  }
}

module.exports = {
  ACTIVITY_FACTORS,
  GOAL_FACTORS,
  calculateBmi,
  classifyBmi,
  calculateBmr,
  calculateDailyCalories,
  buildNutritionPlan
}

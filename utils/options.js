const GENDER_OPTIONS = [
  { label: '男生', value: 'male' },
  { label: '女生', value: 'female' },
  { label: '其他', value: 'other' }
]

const GOAL_OPTIONS = [
  { label: '减脂', value: 'fat_loss' },
  { label: '减重', value: 'weight_loss' },
  { label: '维持', value: 'maintain' },
  { label: '增肌', value: 'muscle_gain' }
]

const ACTIVITY_OPTIONS = [
  { label: '久坐少动', value: 'sedentary' },
  { label: '轻度活动', value: 'light' },
  { label: '中等活动', value: 'moderate' },
  { label: '高活动量', value: 'active' }
]

function labels(options) {
  return options.map((option) => option.label)
}

function optionByValue(options, value) {
  return options.find((option) => option.value === value) || options[0]
}

module.exports = {
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  ACTIVITY_OPTIONS,
  labels,
  optionByValue
}

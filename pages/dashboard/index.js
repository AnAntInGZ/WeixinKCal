const { ensureAccount } = require('../../utils/account')
const { getProfile } = require('../../utils/profile')
const {
  formatDateKey,
  getDailySummary,
  getMealTypeOption
} = require('../../utils/meal')

function mealDetail(record) {
  return record.items.map((item) => item.name).join(' · ')
}

function mealViewModel(record) {
  const option = getMealTypeOption(record.mealType)

  return {
    id: record.id,
    title: option.label,
    detail: mealDetail(record),
    calories: record.totalCalories,
    icon: option.emoji,
    color: option.color
  }
}

Page({
  data: {
    dateKey: '',
    summary: {
      totalCalories: 0,
      targetCalories: 0,
      remainingCalories: 0,
      progressPercent: 0,
      totalCarbsG: 0,
      totalProteinG: 0,
      totalFatG: 0
    },
    meals: []
  },

  onShow() {
    const app = getApp()
    const account = app.globalData.account || ensureAccount(wx)
    const profile = getProfile(wx)

    app.globalData.account = account

    if (!profile) {
      wx.redirectTo({ url: '/pages/onboarding/index' })
      return
    }

    const dateKey = formatDateKey()
    const daily = getDailySummary(wx, dateKey, profile, account)

    this.setData({
      dateKey,
      summary: daily.summary,
      meals: daily.records.map(mealViewModel)
    })
  },

  goUpload() {
    wx.redirectTo({ url: '/pages/upload/index' })
  }
})

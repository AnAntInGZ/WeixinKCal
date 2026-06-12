const { ensureAccount, mergeCloudAccount } = require('../../utils/account')
const { getProfile, storeProfile } = require('../../utils/profile')
const { fetchCloudDaily, fetchCloudProfile } = require('../../utils/cloud')
const {
  formatDateKey,
  getDailySummary,
  getMealTypeOption,
  replaceMealsForDate
} = require('../../utils/meal')

function mealDetail(record) {
  const items = Array.isArray(record.items) ? record.items : []
  return items.map((item) => item.name).join(' · ')
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
    this.loadDashboard()
  },

  renderDaily(dateKey, daily) {
    const records = Array.isArray(daily.records) ? daily.records : []
    this.setData({
      dateKey,
      summary: daily.summary,
      meals: records.map(mealViewModel)
    })
  },

  async loadDashboard() {
    const app = getApp()
    let account = app.globalData.account || ensureAccount(wx)
    let profile = getProfile(wx)

    app.globalData.account = account

    if (!profile) {
      try {
        const data = await fetchCloudProfile(account)
        if (data.account) {
          account = mergeCloudAccount(wx, account, data.account)
          app.globalData.account = account
        }
        if (data.profile) {
          const result = storeProfile(wx, account, data.profile)
          account = result.account
          profile = result.profile
          app.globalData.account = account
        }
      } catch (error) {
        console.warn('fetch cloud profile failed', error)
      }

      if (!profile) {
        wx.redirectTo({ url: '/pages/onboarding/index' })
        return
      }
    }

    const dateKey = formatDateKey()
    const daily = getDailySummary(wx, dateKey, profile, account)
    this.renderDaily(dateKey, daily)

    try {
      const data = await fetchCloudDaily(account, dateKey, profile.plan.dailyCalories)
      if (data.account) {
        account = mergeCloudAccount(wx, account, data.account)
        app.globalData.account = account
      }
      if (data.daily) {
        replaceMealsForDate(wx, account.id, dateKey, data.daily.records)
        this.renderDaily(dateKey, data.daily)
      }
    } catch (error) {
      console.warn('fetch cloud daily failed', error)
    }
  },

  goUpload() {
    wx.redirectTo({ url: '/pages/upload/index' })
  }
})

const { ensureAccount } = require('../../utils/account')
const { getProfile, createProfile } = require('../../utils/profile')
const {
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  ACTIVITY_OPTIONS,
  labels
} = require('../../utils/options')

Page({
  data: {
    account: null,
    error: '',
    genderLabels: labels(GENDER_OPTIONS),
    goalLabels: labels(GOAL_OPTIONS),
    activityLabels: labels(ACTIVITY_OPTIONS),
    genderIndex: 0,
    goalIndex: 0,
    activityIndex: 1
  },

  onLoad() {
    const app = getApp()
    const account = app.globalData.account || ensureAccount(wx)
    app.globalData.account = account

    if (getProfile(wx)) {
      wx.redirectTo({ url: '/pages/dashboard/index' })
      return
    }

    this.setData({ account })
  },

  handleGenderChange(event) {
    this.setData({ genderIndex: Number(event.detail.value) })
  },

  handleGoalChange(event) {
    this.setData({ goalIndex: Number(event.detail.value) })
  },

  handleActivityChange(event) {
    this.setData({ activityIndex: Number(event.detail.value) })
  },

  handleSubmit(event) {
    const values = event.detail.value
    const input = {
      gender: GENDER_OPTIONS[this.data.genderIndex].value,
      age: values.age,
      heightCm: values.heightCm,
      weightKg: values.weightKg,
      activityLevel: ACTIVITY_OPTIONS[this.data.activityIndex].value,
      goal: GOAL_OPTIONS[this.data.goalIndex].value
    }

    try {
      const result = createProfile(wx, this.data.account, input)
      getApp().globalData.account = result.account
      wx.redirectTo({ url: '/pages/dashboard/index' })
    } catch (error) {
      const message = error.message || '请检查输入信息'
      this.setData({ error: message })
      wx.showToast({
        title: message,
        icon: 'none'
      })
    }
  }
})

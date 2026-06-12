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
    genderOptions: GENDER_OPTIONS,
    goalOptions: GOAL_OPTIONS,
    activityLabels: labels(ACTIVITY_OPTIONS),
    activityIndex: 1,
    form: {
      gender: 'male',
      age: '30',
      heightCm: '178',
      weightKg: '74',
      activityLevel: 'light',
      goal: 'fat_loss'
    }
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

  updateForm(field, value) {
    this.setData({
      [`form.${field}`]: value
    })
  },

  selectGender(event) {
    this.updateForm('gender', event.currentTarget.dataset.value)
  },

  selectGoal(event) {
    this.updateForm('goal', event.currentTarget.dataset.value)
  },

  handleInput(event) {
    this.updateForm(event.currentTarget.dataset.field, event.detail.value)
  },

  handleActivityChange(event) {
    const activityIndex = Number(event.detail.value)
    const option = ACTIVITY_OPTIONS[activityIndex] || ACTIVITY_OPTIONS[1]

    this.setData({
      activityIndex,
      'form.activityLevel': option.value
    })
  },

  startPlan() {
    try {
      const result = createProfile(wx, this.data.account, this.data.form)
      getApp().globalData.account = result.account
      wx.redirectTo({ url: '/pages/dashboard/index' })
    } catch (error) {
      wx.showToast({
        title: error.message || '请检查输入信息',
        icon: 'none'
      })
    }
  }
})

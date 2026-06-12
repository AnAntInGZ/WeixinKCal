const { ensureAccount } = require('../../utils/account')
const { getProfile, createProfile } = require('../../utils/profile')

Page({
  data: {
    account: null
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

  startPlan() {
    const input = {
      gender: 'male',
      age: 30,
      heightCm: 178,
      weightKg: 74,
      activityLevel: 'light',
      goal: 'fat_loss'
    }

    try {
      const result = createProfile(wx, this.data.account, input)
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

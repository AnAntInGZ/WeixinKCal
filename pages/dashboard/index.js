const { ensureAccount } = require('../../utils/account')
const { getProfile } = require('../../utils/profile')
const {
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  ACTIVITY_OPTIONS,
  optionByValue
} = require('../../utils/options')

function presentProfile(profile) {
  return {
    ...profile,
    genderLabel: optionByValue(GENDER_OPTIONS, profile.gender).label,
    goalLabel: optionByValue(GOAL_OPTIONS, profile.goal).label,
    activityLabel: optionByValue(ACTIVITY_OPTIONS, profile.activityLevel).label
  }
}

Page({
  data: {
    account: null,
    profile: null
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

    this.setData({
      account,
      profile: presentProfile(profile)
    })
  }
})

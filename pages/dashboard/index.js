const { getProfile } = require('../../utils/profile')

Page({
  onShow() {
    if (!getProfile(wx)) {
      wx.redirectTo({ url: '/pages/onboarding/index' })
    }
  },

  goUpload() {
    wx.navigateTo({ url: '/pages/upload/index' })
  }
})

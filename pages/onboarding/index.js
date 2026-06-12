const { ensureAccount, mergeCloudAccount } = require('../../utils/account')
const { getProfile, createProfile, storeProfile } = require('../../utils/profile')
const { fetchCloudProfile, saveCloudProfile } = require('../../utils/cloud')
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
    },
    saving: false
  },

  async onLoad() {
    const app = getApp()
    let account = app.globalData.account || ensureAccount(wx)
    app.globalData.account = account

    if (getProfile(wx)) {
      wx.redirectTo({ url: '/pages/dashboard/index' })
      return
    }

    this.setData({ account })

    try {
      const data = await fetchCloudProfile(account)
      if (data.account) {
        account = mergeCloudAccount(wx, account, data.account)
        app.globalData.account = account
        this.setData({ account })
      }
      if (data.profile) {
        const result = storeProfile(wx, account, data.profile)
        app.globalData.account = result.account
        wx.redirectTo({ url: '/pages/dashboard/index' })
      }
    } catch (error) {
      console.warn('fetch cloud profile failed', error)
    }
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

  async startPlan() {
    if (this.data.saving) {
      return
    }

    this.setData({ saving: true })

    try {
      const result = createProfile(wx, this.data.account, this.data.form)
      try {
        const data = await saveCloudProfile(result.account, result.profile)
        if (data.account) {
          result.account = mergeCloudAccount(wx, result.account, data.account)
        }
        if (data.profile) {
          const stored = storeProfile(wx, result.account, data.profile)
          result.account = stored.account
        }
      } catch (cloudError) {
        console.warn('save cloud profile failed', cloudError)
        wx.showToast({
          title: '本地已保存，云端稍后同步',
          icon: 'none'
        })
      }
      getApp().globalData.account = result.account
      wx.redirectTo({ url: '/pages/dashboard/index' })
    } catch (error) {
      wx.showToast({
        title: error.message || '请检查输入或网络',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  }
})

const { ensureAccount } = require('./utils/account')

App({
  globalData: {
    account: null
  },

  onLaunch() {
    this.globalData.account = ensureAccount(wx)
  }
})

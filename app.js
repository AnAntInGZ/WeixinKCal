const { ensureAccount } = require('./utils/account')

App({
  globalData: {
    account: null
  },

  onLaunch() {
    const account = ensureAccount(wx)
    this.globalData.account = account
  }
})

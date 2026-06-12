const { ensureAccount, mergeCloudAccount } = require('./utils/account')
const { initWxCloud, syncCloudAccount } = require('./utils/cloud')

App({
  globalData: {
    account: null
  },

  onLaunch() {
    const account = ensureAccount(wx)
    this.globalData.account = account

    initWxCloud().catch((error) => {
      console.warn('init wx cloud failed', error)
    })

    syncCloudAccount(account)
      .then((data) => {
        if (data.account) {
          this.globalData.account = mergeCloudAccount(wx, this.globalData.account, data.account)
        }
      })
      .catch((error) => {
        console.warn('sync cloud account failed', error)
      })
  }
})

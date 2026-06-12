const ACCOUNT_KEY = 'weixinkcal.account.v1'

function createAccount(options = {}) {
  const now = options.now || new Date()
  const random = options.random || Math.random
  const suffix = Math.floor(random() * 1000000).toString().padStart(6, '0')

  return {
    id: `local_${now.getTime()}_${suffix}`,
    createdAt: now.toISOString(),
    profileCompleted: false
  }
}

function ensureAccount(storage, options = {}) {
  const existing = storage.getStorageSync(ACCOUNT_KEY)
  if (existing && existing.id) {
    return existing
  }

  const account = createAccount(options)
  storage.setStorageSync(ACCOUNT_KEY, account)
  return account
}

function markProfileCompleted(storage, account) {
  const nextAccount = {
    ...account,
    profileCompleted: true,
    updatedAt: new Date().toISOString()
  }

  storage.setStorageSync(ACCOUNT_KEY, nextAccount)
  return nextAccount
}

module.exports = {
  ACCOUNT_KEY,
  createAccount,
  ensureAccount,
  markProfileCompleted
}

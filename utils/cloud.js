const CLOUD_RESOURCE_ENV = 'prod-d8ghbq8xea378972b'
const CLOUD_SERVICE_NAME = 'golang-24re-001'

let cloudInstance = null
let initPromise = null

function canUseCloud() {
  return typeof wx !== 'undefined' && wx.cloud && wx.cloud.Cloud
}

function getCloudInstance() {
  if (!canUseCloud()) {
    return Promise.reject(new Error('当前环境不支持云托管'))
  }

  if (!cloudInstance) {
    cloudInstance = new wx.cloud.Cloud({
      resourceEnv: CLOUD_RESOURCE_ENV
    })
  }

  if (!initPromise) {
    const initResult = cloudInstance.init()
    initPromise = initResult && initResult.then ? initResult : Promise.resolve()
  }

  return initPromise.then(() => cloudInstance)
}

function normalizeAccount(account = {}) {
  return {
    id: account.id || '',
    createdAt: account.createdAt || '',
    updatedAt: account.updatedAt || '',
    profileCompleted: Boolean(account.profileCompleted)
  }
}

function parseResponseData(data) {
  if (typeof data === 'string') {
    return JSON.parse(data)
  }
  return data || {}
}

async function callCloud(path, data = {}, method = 'POST') {
  const cloud = await getCloudInstance()
  const response = await cloud.callContainer({
    path,
    method,
    data,
    header: {
      'X-WX-SERVICE': CLOUD_SERVICE_NAME,
      'content-type': 'application/json'
    }
  })
  const body = parseResponseData(response.data)

  if (response.statusCode && response.statusCode >= 400) {
    throw new Error(body.message || `云端请求失败：${response.statusCode}`)
  }
  if (body.code !== 0) {
    throw new Error(body.message || '云端请求失败')
  }

  return body.data || {}
}

function syncCloudAccount(account) {
  return callCloud('/api/account', {
    account: normalizeAccount(account)
  })
}

function fetchCloudProfile(account) {
  return callCloud('/api/profile/get', {
    account: normalizeAccount(account)
  })
}

function saveCloudProfile(account, profile) {
  return callCloud('/api/profile', {
    account: normalizeAccount(account),
    profile
  })
}

function saveCloudMeal(account, meal) {
  return callCloud('/api/meals', {
    account: normalizeAccount(account),
    meal
  })
}

function fetchCloudDaily(account, dateKey, targetCalories) {
  return callCloud('/api/meals/list', {
    account: normalizeAccount(account),
    dateKey,
    targetCalories
  })
}

module.exports = {
  CLOUD_RESOURCE_ENV,
  CLOUD_SERVICE_NAME,
  canUseCloud,
  callCloud,
  fetchCloudDaily,
  fetchCloudProfile,
  normalizeAccount,
  saveCloudMeal,
  saveCloudProfile,
  syncCloudAccount
}

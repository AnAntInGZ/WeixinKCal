const CLOUD_RESOURCE_ENV = 'prod-d8ghbq8xea378972b'
const CLOUD_RESOURCE_APPID = 'wx2ba486d512c00ac6'
const CLOUD_SERVICE_NAME = 'golang-24re-001'
const CLOUD_BASE_URL = 'https://golang-24re-269724-9-1309913757.sh.run.tcloudbase.com'
const CLOUD_REQUEST_TIMEOUT_MS = 5000
const CLOUD_CONTAINER_TIMEOUT_MS = 5000
const CLOUD_LOGIN_TIMEOUT_MS = 3000

let cloudInstance = null
let initPromise = null
let wxCloudInitPromise = null

function canUseCloud() {
  return typeof wx !== 'undefined' && wx.cloud
}

function canUseRequest() {
  return typeof wx !== 'undefined' && wx.request
}

function canUseLogin() {
  return typeof wx !== 'undefined' && wx.login
}

function getLoginCode() {
  if (!canUseLogin()) {
    return Promise.resolve('')
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = (code) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      resolve(code || '')
    }
    const timer = setTimeout(() => finish(''), CLOUD_LOGIN_TIMEOUT_MS)

    wx.login({
      success(result) {
        finish(result.code)
      },
      fail() {
        finish('')
      }
    })
  })
}

function initWxCloud() {
  if (!canUseCloud()) {
    return Promise.reject(new Error('当前环境不支持云托管'))
  }

  if (!wxCloudInitPromise) {
    const initResult = wx.cloud.init ? wx.cloud.init({}) : null
    wxCloudInitPromise = initResult && initResult.then ? initResult : Promise.resolve()
  }

  return wxCloudInitPromise
}

function getCloudInstance() {
  if (!canUseCloud() || !wx.cloud.Cloud) {
    return Promise.reject(new Error('当前环境不支持 Cloud 实例'))
  }

  if (!cloudInstance) {
    cloudInstance = new wx.cloud.Cloud({
      resourceAppid: CLOUD_RESOURCE_APPID,
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
    sessionToken: account.sessionToken || '',
    profileCompleted: Boolean(account.profileCompleted)
  }
}

async function attachLoginCode(data) {
  if (!data || !data.account) {
    return data
  }
  if (data.account.sessionToken) {
    return data
  }

  const loginCode = await getLoginCode()
  if (!loginCode) {
    return data
  }

  return {
    ...data,
    account: {
      ...data.account,
      loginCode
    }
  }
}

function parseResponseData(data) {
  if (typeof data === 'string') {
    return JSON.parse(data)
  }
  return data || {}
}

function buildCloudURL(path) {
  return `${CLOUD_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function requestCloudHTTP(path, data, method) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: buildCloudURL(path),
      method,
      data,
      timeout: CLOUD_REQUEST_TIMEOUT_MS,
      header: {
        'content-type': 'application/json'
      },
      success: resolve,
      fail: reject
    })
  })
}

function cloudContainerRequest(path, data, method) {
  return {
    path,
    method,
    data,
    header: {
      'X-WX-SERVICE': CLOUD_SERVICE_NAME,
      'content-type': 'application/json'
    }
  }
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs)

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer))
  })
}

async function requestCloudContainer(path, data, method) {
  const request = cloudContainerRequest(path, data, method)

  if (canUseCloudInstance()) {
    const cloud = await getCloudInstance()
    return cloud.callContainer(request)
  }

  await initWxCloud()
  return wx.cloud.callContainer({
    ...request,
    config: {
      env: CLOUD_RESOURCE_ENV
    }
  })
}

async function callCloud(path, data = {}, method = 'POST') {
  const requestData = await attachLoginCode(data)

  if (canUseRequest()) {
    const response = await requestCloudHTTP(path, requestData, method)
    return parseCloudResponse(response)
  }

  if (canUseCloud()) {
    const response = await withTimeout(
      requestCloudContainer(path, requestData, method),
      CLOUD_CONTAINER_TIMEOUT_MS,
      '云托管容器请求超时'
    )
    return parseCloudResponse(response)
  }

  throw new Error('当前环境不支持云托管请求')
}

function canUseCloudInstance() {
  return canUseCloud() && wx.cloud.Cloud
}

function parseCloudResponse(response) {
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
  CLOUD_BASE_URL,
  CLOUD_CONTAINER_TIMEOUT_MS,
  CLOUD_LOGIN_TIMEOUT_MS,
  CLOUD_REQUEST_TIMEOUT_MS,
  CLOUD_RESOURCE_APPID,
  CLOUD_RESOURCE_ENV,
  CLOUD_SERVICE_NAME,
  canUseLogin,
  canUseCloud,
  callCloud,
  fetchCloudDaily,
  fetchCloudProfile,
  initWxCloud,
  normalizeAccount,
  saveCloudMeal,
  saveCloudProfile,
  syncCloudAccount
}

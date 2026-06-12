const { ensureAccount } = require('../../utils/account')
const {
  MEAL_TYPE_OPTIONS,
  addMealRecord,
  createDefaultDraftItems,
  estimateFoodItem,
  formatDateKey
} = require('../../utils/meal')

function mealTypeLabels() {
  return MEAL_TYPE_OPTIONS.map((option) => option.label)
}

function estimateDraftItems(items) {
  return items.map((item) => estimateFoodItem(item))
}

function sumCalories(items) {
  return items.reduce((sum, item) => sum + item.calories, 0)
}

Page({
  data: {
    mealTypeLabels: mealTypeLabels(),
    mealTypeIndex: 1,
    form: {
      dateKey: '',
      mealType: 'lunch',
      note: '',
      items: []
    },
    totalCalories: 0
  },

  onLoad() {
    const items = createDefaultDraftItems()

    this.setData({
      'form.dateKey': formatDateKey(),
      'form.items': items,
      totalCalories: sumCalories(items)
    })
  },

  refreshItems(items) {
    const nextItems = estimateDraftItems(items)
    this.setData({
      'form.items': nextItems,
      totalCalories: sumCalories(nextItems)
    })
  },

  handleDateChange(event) {
    this.setData({
      'form.dateKey': event.detail.value
    })
  },

  handleMealTypeChange(event) {
    const mealTypeIndex = Number(event.detail.value)
    const option = MEAL_TYPE_OPTIONS[mealTypeIndex] || MEAL_TYPE_OPTIONS[1]

    this.setData({
      mealTypeIndex,
      'form.mealType': option.value
    })
  },

  handleNoteInput(event) {
    this.setData({
      'form.note': event.detail.value
    })
  },

  handleItemInput(event) {
    const index = Number(event.currentTarget.dataset.index)
    const field = event.currentTarget.dataset.field
    const items = this.data.form.items.slice()

    items[index] = {
      ...items[index],
      [field]: event.detail.value
    }

    this.refreshItems(items)
  },

  changeAmount(event) {
    const index = Number(event.currentTarget.dataset.index)
    const delta = Number(event.currentTarget.dataset.delta)
    const items = this.data.form.items.slice()
    const item = items[index]
    const nextAmount = Math.max(1, Number(item.amountGram || 0) + delta)

    items[index] = {
      ...item,
      amountGram: nextAmount
    }

    this.refreshItems(items)
  },

  addFood() {
    const items = this.data.form.items.concat([
      estimateFoodItem({ name: '', amountGram: 100, kcalPer100g: 100 })
    ])
    this.setData({
      'form.items': items,
      totalCalories: sumCalories(items)
    })
  },

  removeFood(event) {
    const index = Number(event.currentTarget.dataset.index)
    const items = this.data.form.items.filter((_, itemIndex) => itemIndex !== index)

    this.refreshItems(items.length ? items : [estimateFoodItem({ name: '', amountGram: 100, kcalPer100g: 100 })])
  },

  saveMeal() {
    const app = getApp()
    const account = app.globalData.account || ensureAccount(wx)
    app.globalData.account = account

    try {
      addMealRecord(wx, account, this.data.form)
      wx.showToast({
        title: '存好啦',
        icon: 'success'
      })
      wx.reLaunch({ url: '/pages/dashboard/index' })
    } catch (error) {
      wx.showToast({
        title: error.message || '请检查餐食记录',
        icon: 'none'
      })
    }
  }
})

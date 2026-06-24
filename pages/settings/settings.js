// pages/settings/settings.js
const util = require('../../utils/util.js')

Page({
  data: {
    // 当前学期设置
    semesterName: '',
    startDate: '',
    totalWeeks: 18,
    morning: 4,
    afternoon: 4,
    evening: 3,
    showWeekend: true,

    // 历史学期
    semesters: [],
    currentSemesterId: '',

    // 新建学期弹窗
    showNewSemester: false,
    newName: '',
    newStartDate: '',
    newTotalWeeks: 18,

    // 历史学期弹窗
    showHistory: false,

    // 自定义日期选择弹窗
    showDatePicker: false,
    datePickerMode: 'current', // 'current' 或 'new'
    pickerYear: 2024,
    pickerMonth: 1,
    pickerDay: 1,
    years: [],
    months: Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
    days: []
  },

  onLoad() {
    const years = []
    const currentYear = new Date().getFullYear()
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      years.push(String(y))
    }
    this.setData({ years })
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const settings = util.getSettings()
    const semesters = util.getSemesters()
    const currentSemesterId = util.getCurrentSemesterId()

    this.setData({
      semesterName: settings.semesterName || '',
      startDate: settings.startDate || '',
      totalWeeks: settings.totalWeeks || 18,
      morning: settings.lessonsPerDay.morning,
      afternoon: settings.lessonsPerDay.afternoon,
      evening: settings.lessonsPerDay.evening,
      showWeekend: settings.showWeekend !== false,
      semesters,
      currentSemesterId
    })
  },

  // ====== 输入绑定 ======
  onNameInput(e) {
    this.setData({ semesterName: e.detail.value })
  },

  onWeeksInput(e) {
    this.setData({ totalWeeks: e.detail.value })
  },

  onMorningInput(e) {
    this.setData({ morning: e.detail.value })
  },

  onAfternoonInput(e) {
    this.setData({ afternoon: e.detail.value })
  },

  onEveningInput(e) {
    this.setData({ evening: e.detail.value })
  },

  onWeekendChange(e) {
    this.setData({ showWeekend: e.detail.value })
  },

  // ====== 自定义日期选择器 ======
  openDatePicker(e) {
    const mode = e.currentTarget.dataset.mode || 'current'
    const dateStr = mode === 'current' ? this.data.startDate : this.data.newStartDate
    const date = dateStr ? new Date(dateStr.replace(/-/g, '/')) : new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    this.setData({
      showDatePicker: true,
      datePickerMode: mode,
      pickerYear: year,
      pickerMonth: String(month).padStart(2, '0'),
      pickerDay: String(day).padStart(2, '0')
    }, () => {
      this.updateDays(year, month)
    })
  },

  hideDatePicker() {
    this.setData({ showDatePicker: false })
  },

  updateDays(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = []
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(String(d).padStart(2, '0'))
    }
    this.setData({ days })
  },

  onYearSelect(e) {
    const year = parseInt(e.currentTarget.dataset.value)
    this.setData({ pickerYear: year })
    this.updateDays(year, parseInt(this.data.pickerMonth))
  },

  onMonthSelect(e) {
    const month = e.currentTarget.dataset.value
    this.setData({ pickerMonth: month })
    this.updateDays(this.data.pickerYear, parseInt(month))
  },

  onDaySelect(e) {
    this.setData({ pickerDay: e.currentTarget.dataset.value })
  },

  confirmDatePicker() {
    const { pickerYear, pickerMonth, pickerDay, datePickerMode } = this.data
    const date = `${pickerYear}-${pickerMonth}-${pickerDay}`
    if (datePickerMode === 'current') {
      this.setData({ startDate: date, showDatePicker: false })
    } else {
      this.setData({ newStartDate: date, showDatePicker: false })
    }
  },

  // ====== 保存当前学期设置 ======
  saveSettings() {
    const {
      semesterName, startDate, totalWeeks,
      morning, afternoon, evening, showWeekend
    } = this.data

    const weeks = parseInt(totalWeeks)
    if (!Number.isInteger(weeks) || weeks <= 0 || weeks > 52) {
      wx.showToast({ title: '总周数须为 1-52 的整数', icon: 'none' })
      return
    }

    const morn = parseInt(morning)
    const aft = parseInt(afternoon)
    const eve = parseInt(evening)
    if (!Number.isInteger(morn) || morn < 0 ||
        !Number.isInteger(aft) || aft < 0 ||
        !Number.isInteger(eve) || eve < 0) {
      wx.showToast({ title: '节数须为非负整数', icon: 'none' })
      return
    }

    if (morn + aft + eve === 0) {
      wx.showToast({ title: '每天至少要有1节课', icon: 'none' })
      return
    }

    const settings = util.getSettings()
    const newSettings = {
      ...settings,
      semesterName,
      startDate,
      totalWeeks: weeks,
      showWeekend,
      lessonsPerDay: { morning: morn, afternoon: aft, evening: eve }
    }

    util.saveSettings(newSettings)

    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  // ====== 新建学期 ======
  showNewSemesterDialog() {
    const today = this.formatDate(new Date())
    this.setData({
      showNewSemester: true,
      newName: '',
      newStartDate: today,
      newTotalWeeks: 18
    })
  },

  hideNewSemesterDialog() {
    this.setData({ showNewSemester: false })
  },

  onNewNameInput(e) {
    this.setData({ newName: e.detail.value })
  },

  onNewWeeksInput(e) {
    this.setData({ newTotalWeeks: e.detail.value })
  },

  confirmNewSemester() {
    const { newName, newStartDate, newTotalWeeks } = this.data
    const weeks = parseInt(newTotalWeeks)
    if (!Number.isInteger(weeks) || weeks <= 0 || weeks > 52) {
      wx.showToast({ title: '总周数须为 1-52 的整数', icon: 'none' })
      return
    }

    util.createSemester(newName, newStartDate, weeks)
    this.setData({ showNewSemester: false })
    this.loadData()
    wx.showToast({ title: '创建成功', icon: 'success' })
  },

  // ====== 历史学期 ======
  showHistoryDialog() {
    this.setData({ showHistory: true })
  },

  hideHistoryDialog() {
    this.setData({ showHistory: false })
  },

  onSwitchSemester(e) {
    const id = e.currentTarget.dataset.id
    util.switchSemester(id)
    this.setData({ showHistory: false })
    this.loadData()
    wx.showToast({ title: '切换成功', icon: 'success' })
  },

  onDeleteSemester(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.currentSemesterId) {
      wx.showToast({ title: '不能删除当前学期', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: '删除后该学期的课程和设置将无法恢复，是否继续？',
      success: (res) => {
        if (res.confirm) {
          util.deleteSemester(id)
          this.loadData()
          wx.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
})

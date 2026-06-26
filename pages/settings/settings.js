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
    datePickerMode: 'current', // 'current' / 'new' / 'holiday' / 'workday'
    pickerYear: 2024,
    pickerMonth: 1,
    pickerDay: 1,
    years: [],
    months: Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
    days: [],

    // 节假日 / 调休配置
    holidayConfig: { holidays: [], workdays: [] },
    displayHolidays: [],
    displayWorkdays: [],
    builtinHolidayYears: [],
    showHolidayImport: false,
    showAllHolidays: false,
    showAllWorkdays: false,

    // 补课周几选择弹窗
    showMakeupDayPicker: false,
    makeupDayPickerDate: '',
    makeupDayOptions: [
      { label: '周一', value: 1 },
      { label: '周二', value: 2 },
      { label: '周三', value: 3 },
      { label: '周四', value: 4 },
      { label: '周五', value: 5 },
      { label: '周六', value: 6 },
      { label: '周日', value: 7 },
      { label: '暂不选定', value: 0 }
    ]
  },

  onLoad() {
    const years = []
    const currentYear = new Date().getFullYear()
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      years.push(String(y))
    }
    this.setData({ years, builtinHolidayYears: util.getBuiltinHolidayYears() })
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const settings = util.getSettings()
    const semesters = util.getSemesters()
    const currentSemesterId = util.getCurrentSemesterId()

    const holidayConfig = settings.holidayConfig || { holidays: [], workdays: [] }
    const dayNames = ['一', '二', '三', '四', '五', '六', '日']
    const displayHolidays = (holidayConfig.holidays || []).map(date => ({ date }))
    const displayWorkdays = (holidayConfig.workdays || []).map(date => ({
      date,
      makeupText: holidayConfig.workdayMakeupMap && holidayConfig.workdayMakeupMap[date]
        ? `补周${dayNames[holidayConfig.workdayMakeupMap[date] - 1]}`
        : '未指定'
    }))

    this.setData({
      semesterName: settings.semesterName || '',
      startDate: settings.startDate || '',
      totalWeeks: settings.totalWeeks || 18,
      morning: settings.lessonsPerDay.morning,
      afternoon: settings.lessonsPerDay.afternoon,
      evening: settings.lessonsPerDay.evening,
      showWeekend: settings.showWeekend !== false,
      holidayConfig,
      displayHolidays,
      displayWorkdays,
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
    let dateStr = this.data.startDate
    if (mode === 'new') dateStr = this.data.newStartDate
    if (mode === 'holiday' || mode === 'workday') dateStr = this.formatDate(new Date())
    const date = dateStr ? new Date(dateStr.replace(/-/g, '/')) : new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    this.setData({
      showDatePicker: true,
      datePickerMode: mode,
      pickerYear: String(year),
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
    this.setData({ pickerYear: String(year) })
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
    } else if (datePickerMode === 'new') {
      this.setData({ newStartDate: date, showDatePicker: false })
    } else if (datePickerMode === 'holiday') {
      util.addHoliday(date)
      this.setData({ showDatePicker: false })
      this.loadData()
      wx.showToast({ title: '已添加节假日', icon: 'success' })
    } else if (datePickerMode === 'workday') {
      this.setData({ showDatePicker: false, showMakeupDayPicker: true, makeupDayPickerDate: date })
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

  // ====== 节假日 / 调休 ======
  showHolidayImportDialog() {
    this.setData({ showHolidayImport: true })
  },

  hideHolidayImportDialog() {
    this.setData({ showHolidayImport: false })
  },

  toggleHolidays() {
    this.setData({ showAllHolidays: !this.data.showAllHolidays })
  },

  toggleWorkdays() {
    this.setData({ showAllWorkdays: !this.data.showAllWorkdays })
  },

  // 选择调休上班日补周几
  selectMakeupDay(e) {
    const makeupDay = parseInt(e.currentTarget.dataset.value)
    const date = this.data.makeupDayPickerDate
    util.addWorkday(date, makeupDay)
    this.setData({ showMakeupDayPicker: false, makeupDayPickerDate: '' })
    this.loadData()
    const dayNames = ['一', '二', '三', '四', '五', '六', '日']
    const msg = makeupDay === 0 ? '已添加调休日' : `已添加，补周${dayNames[makeupDay - 1]}`
    wx.showToast({ title: msg, icon: 'success' })
  },

  hideMakeupDayPicker() {
    this.setData({ showMakeupDayPicker: false, makeupDayPickerDate: '' })
  },

  // 修改某个调休上班日的补课周几
  setWorkdayMakeup(e) {
    const date = e.currentTarget.dataset.date
    this.setData({ showMakeupDayPicker: true, makeupDayPickerDate: date })
  },

  importBuiltinHolidays(e) {
    const year = parseInt(e.currentTarget.dataset.year)
    const settings = util.getSettings()
    const newConfig = util.mergeBuiltinHolidays(settings, year)
    const newSettings = { ...settings, holidayConfig: newConfig }
    util.saveSettings(newSettings)
    this.setData({ holidayConfig: newConfig, showHolidayImport: false })
    wx.showToast({ title: `已导入 ${year} 年节假日`, icon: 'success' })
  },

  deleteHoliday(e) {
    const date = e.currentTarget.dataset.date
    util.removeHolidayOrWorkday(date)
    this.loadData()
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  deleteWorkday(e) {
    const date = e.currentTarget.dataset.date
    util.removeHolidayOrWorkday(date)
    this.loadData()
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  clearHolidayConfig() {
    wx.showModal({
      title: '确认清空',
      content: '清空后将恢复默认课程显示，是否继续？',
      success: (res) => {
        if (res.confirm) {
          const settings = util.getSettings()
          const newSettings = { ...settings, holidayConfig: { holidays: [], workdays: [] } }
          util.saveSettings(newSettings)
          this.loadData()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  // ====== 数据备份与恢复 ======
  exportBackup() {
    const res = util.exportBackupToFile()
    if (!res.success) {
      wx.showToast({ title: res.error || '导出失败', icon: 'none' })
      return
    }
    wx.shareFileMessage({
      filePath: res.filePath,
      fileName: res.fileName,
      success: () => wx.showToast({ title: '导出成功', icon: 'success' }),
      fail: err => wx.showToast({ title: err.errMsg || '分享失败', icon: 'none' })
    })
  },

  importBackup() {
    wx.showModal({
      title: '确认导入',
      content: '导入备份将覆盖当前所有数据，是否继续？',
      success: (res) => {
        if (!res.confirm) return
        util.importBackupFromFile().then(result => {
          if (result.success) {
            this.loadData()
            wx.showToast({ title: '导入成功', icon: 'success' })
          } else {
            wx.showToast({ title: result.error || '导入失败', icon: 'none' })
          }
        }).catch(err => {
          wx.showToast({ title: err.error || '导入失败', icon: 'none' })
        })
      }
    })
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
